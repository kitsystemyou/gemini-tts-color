"""Gemini TTS 呼び出しおよび音声処理サービス。"""

import io
import wave
import base64
import os
from typing import Optional, List, Dict, Any
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

class SpeakerConfigModel(BaseModel):
    """マルチスピーカー用の話者設定"""
    speaker: str = Field(..., description="話者名（プロンプト内の発言者と一致）")
    voice_name: str = Field(..., description="声の種類（例: Kore, Puck）")

class TTSRequest(BaseModel):
    """TTS生成リクエストパラメータ"""
    # 必須・基本入力
    text: str = Field(..., min_length=1, description="読み上げ対象テキスト")
    model: str = Field("gemini-3.1-flash-tts-preview", description="使用モデル名")
    
    # 話者設定
    is_multi_speaker: bool = Field(False, description="マルチスピーカーモードフラグ")
    voice_name: str = Field("Kore", description="単一話者の声の種類")
    speakers: Optional[List[SpeakerConfigModel]] = Field(None, description="マルチスピーカー設定リスト")
    
    # 演出・ディレクター設定
    scene: Optional[str] = Field(None, description="シーン・シチュエーション設定")
    audio_profile: Optional[str] = Field(None, description="キャラクター・ペルソナ設定")
    director_style: Optional[str] = Field(None, description="演技スタイル（Tone, Vibe）")
    director_pacing: Optional[str] = Field(None, description="テンポ・間隔指定")
    director_accent: Optional[str] = Field(None, description="アクセント・方言")
    system_instruction: Optional[str] = Field(None, description="システム指示文")
    
    # 言語コード (BCP-47)
    language_code: Optional[str] = Field(None, description="言語コード（例: ja-JP, en-US）")
    
    # LLM 生成パラメータ
    temperature: Optional[float] = Field(1.0, ge=0.0, le=2.0, description="生成の多様性・揺らぎ")
    top_p: Optional[float] = Field(None, ge=0.0, le=1.0, description="Top-P サンプリング")
    top_k: Optional[int] = Field(None, ge=1, le=64, description="Top-K サンプリング")
    seed: Optional[int] = Field(None, description="乱数シード値（再現性用）")
    presence_penalty: Optional[float] = Field(None, ge=-2.0, le=2.0, description="存在ペナルティ")
    frequency_penalty: Optional[float] = Field(None, ge=-2.0, le=2.0, description="頻度ペナルティ")
    max_output_tokens: Optional[int] = Field(None, description="最大出力トークン数")

class TTSResponse(BaseModel):
    """TTS生成レスポンスデータ"""
    audio_base64: str = Field(..., description="Base64エンコードされたWAVオーディオデータ")
    audio_format: str = Field("audio/wav", description="MIMEタイプ")
    sample_rate: int = Field(24000, description="サンプリングレート (Hz)")
    channels: int = Field(1, description="チャンネル数")
    duration_seconds: float = Field(..., description="音声の長さ（秒）")
    file_size_bytes: int = Field(..., description="WAVファイルサイズ（バイト）")
    applied_model: str = Field(..., description="実際に適用されたモデル名")
    applied_voice: str = Field(..., description="適用された音声設定の説明")
    full_prompt_sent: str = Field(..., description="Geminiに送信された統合プロンプト")

def pcm_to_wav(pcm_data: bytes, channels: int = 1, rate: int = 24000, sample_width: int = 2) -> bytes:
    """Raw PCMバイト列 (16bit Mono 24kHz) を RIFF WAV 形式バイト列に変換します。"""
    wav_io = io.BytesIO()
    with wave.open(wav_io, "wb") as wf:
        wf.setnchannels(channels)
        wf.setsampwidth(sample_width)
        wf.setframerate(rate)
        wf.writeframes(pcm_data)
    return wav_io.getvalue()

def build_prompt_with_direction(req: TTSRequest) -> str:
    """ディレクター指示やシーン設定を自然言語プロンプトとして統合します。"""
    # ディレクション要素があるかチェック
    has_direction = any([
        req.scene,
        req.audio_profile,
        req.director_style,
        req.director_pacing,
        req.director_accent,
    ])
    
    if not has_direction:
        # ディレクション指定がない場合はテキストをそのまま返す
        return req.text

    parts = []
    if req.audio_profile:
        parts.append(f"# AUDIO PROFILE\n{req.audio_profile.strip()}")
    if req.scene:
        parts.append(f"## THE SCENE\n{req.scene.strip()}")
        
    director_notes = []
    if req.director_style:
        director_notes.append(f"- Style: {req.director_style.strip()}")
    if req.director_pacing:
        director_notes.append(f"- Pacing: {req.director_pacing.strip()}")
    if req.director_accent:
        director_notes.append(f"- Accent: {req.director_accent.strip()}")
        
    if director_notes:
        parts.append("### DIRECTOR'S NOTES\n" + "\n".join(director_notes))
        
    parts.append(f"#### TRANSCRIPT\n{req.text.strip()}")
    return "\n\n".join(parts)

def generate_speech(req: TTSRequest, api_key: Optional[str] = None) -> TTSResponse:
    """Gemini API を呼び出して音声を生成し、WAV形式で返却します。"""
    effective_api_key = api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not effective_api_key:
        raise ValueError("Google AI Studio の API キーが指定されていません。画面上部または環境変数 GEMINI_API_KEY に設定してください。")

    # GenAI クライアント初期化 (Google AI Studio の API キーを利用するため vertexai=False を明示)
    client = genai.Client(api_key=effective_api_key, vertexai=False)

    # 1. SpeechConfig の組み立て
    speech_config_kwargs: Dict[str, Any] = {}
    
    if req.language_code and req.language_code.strip():
        speech_config_kwargs["language_code"] = req.language_code.strip()

    applied_voice_info = ""
    if req.is_multi_speaker and req.speakers and len(req.speakers) > 0:
        # マルチスピーカー設定
        speaker_configs = []
        for sp in req.speakers:
            speaker_configs.append(
                types.SpeakerVoiceConfig(
                    speaker=sp.speaker,
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name=sp.voice_name
                        )
                    )
                )
            )
        speech_config_kwargs["multi_speaker_voice_config"] = types.MultiSpeakerVoiceConfig(
            speaker_voice_configs=speaker_configs
        )
        applied_voice_info = "Multi-speaker: " + ", ".join([f"{s.speaker} ({s.voice_name})" for s in req.speakers])
    else:
        # 単一話者設定
        speech_config_kwargs["voice_config"] = types.VoiceConfig(
            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                voice_name=req.voice_name
            )
        )
        applied_voice_info = f"Single: {req.voice_name}"

    speech_config = types.SpeechConfig(**speech_config_kwargs)

    # 2. GenerateContentConfig の組み立て
    config_kwargs: Dict[str, Any] = {
        "response_modalities": ["AUDIO"],
        "speech_config": speech_config,
    }

    if req.temperature is not None:
        config_kwargs["temperature"] = req.temperature
    if req.top_p is not None:
        config_kwargs["top_p"] = req.top_p
    if req.top_k is not None:
        config_kwargs["top_k"] = req.top_k
    if req.seed is not None:
        config_kwargs["seed"] = req.seed
    if req.presence_penalty is not None:
        config_kwargs["presence_penalty"] = req.presence_penalty
    if req.frequency_penalty is not None:
        config_kwargs["frequency_penalty"] = req.frequency_penalty
    if req.max_output_tokens is not None:
        config_kwargs["max_output_tokens"] = req.max_output_tokens
    if req.system_instruction and req.system_instruction.strip():
        config_kwargs["system_instruction"] = req.system_instruction.strip()

    gen_config = types.GenerateContentConfig(**config_kwargs)

    # 3. 統合プロンプトの作成
    prompt = build_prompt_with_direction(req)

    # 4. モデル呼び出し
    response = client.models.generate_content(
        model=req.model,
        contents=prompt,
        config=gen_config,
    )

    # 5. 音声PCMデータの抽出
    if not response.candidates or len(response.candidates) == 0:
        raise RuntimeError("Gemini API から応答候補 (candidates) が返却されませんでした。プロンプトまたはAPIキーを確認してください。")

    candidate = response.candidates[0]
    pcm_chunks = []
    
    if candidate.content and candidate.content.parts:
        for part in candidate.content.parts:
            inline = getattr(part, "inline_data", None)
            if inline and inline.data:
                chunk = inline.data
                if isinstance(chunk, str):
                    pcm_chunks.append(base64.b64decode(chunk))
                elif isinstance(chunk, bytes):
                    pcm_chunks.append(chunk)

    if not pcm_chunks:
        # もしテキストエラーなどの情報が含まれていないかチェック
        text_info = ""
        if candidate.content and candidate.content.parts:
            for part in candidate.content.parts:
                if getattr(part, "text", None):
                    text_info += part.text + " "
        error_msg = "音声データが取得できませんでした。"
        if text_info.strip():
            error_msg += f" (モデルからの返答: {text_info.strip()})"
        raise RuntimeError(error_msg)

    raw_pcm = b"".join(pcm_chunks)

    # 6. PCM -> WAV 変換
    channels = 1
    sample_rate = 24000
    sample_width = 2
    wav_bytes = pcm_to_wav(raw_pcm, channels=channels, rate=sample_rate, sample_width=sample_width)

    duration = len(raw_pcm) / (sample_rate * channels * sample_width)
    wav_b64 = base64.b64encode(wav_bytes).decode("ascii")

    return TTSResponse(
        audio_base64=wav_b64,
        audio_format="audio/wav",
        sample_rate=sample_rate,
        channels=channels,
        duration_seconds=round(duration, 2),
        file_size_bytes=len(wav_bytes),
        applied_model=req.model,
        applied_voice=applied_voice_info,
        full_prompt_sent=prompt,
    )
