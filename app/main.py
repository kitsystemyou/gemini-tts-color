"""Gemini TTS Web アプリケーションの FastAPI サーバー。"""

import os
from typing import Optional
from fastapi import FastAPI, HTTPException, Header, Response
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from google import genai

from app.voices import VOICE_LIST
from app.gemini_tts import TTSRequest, TTSResponse, generate_speech

load_dotenv()

app = FastAPI(
    title="Gemini TTS Colors",
    description="Gemini API を利用した高度な音声合成 Web アプリケーション",
    version="1.0.0",
)

# CORS の許可
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

AVAILABLE_MODELS = [
    {
        "id": "gemini-3.1-flash-tts-preview",
        "name": "Gemini 3.1 Flash TTS Preview (推奨)",
        "description": "最新の3.x系TTSモデル。低遅延・高表現力・オーディオタグ対応",
        "recommended": True,
    },
    {
        "id": "gemini-2.5-flash-preview-tts",
        "name": "Gemini 2.5 Flash Preview TTS",
        "description": "高速でコストパフォーマンスに優れたTTSモデル",
        "recommended": False,
    },
    {
        "id": "gemini-2.5-pro-preview-tts",
        "name": "Gemini 2.5 Pro Preview TTS",
        "description": "表現力重視の高品位TTSモデル",
        "recommended": False,
    },
    {
        "id": "gemini-3.8-flash-tts",
        "name": "Gemini 3.8 Flash TTS",
        "description": "最新の Gemini 3.8 フラッシュモデルによる音声生成テスト",
        "recommended": False,
    },
]

@app.get("/api/voices")
def get_voices():
    """利用可能な30種類の音声一覧を返します。"""
    return {"voices": VOICE_LIST}

@app.get("/api/models")
def get_models():
    """推奨・利用可能なモデル一覧を返します。"""
    return {"models": AVAILABLE_MODELS}

@app.get("/api/status")
def get_server_status():
    """環境変数における API キーの設定有無を確認します。"""
    has_env_key = bool(os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY"))
    return {
        "status": "online",
        "has_server_api_key": has_env_key,
    }

@app.post("/api/validate-key")
def validate_api_key(x_api_key: Optional[str] = Header(None, alias="X-API-Key")):
    """提供された API キーの有効性を簡易確認します。"""
    effective_key = x_api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if not effective_key:
        raise HTTPException(status_code=400, detail="API キーが指定されていません。")
    try:
        client = genai.Client(api_key=effective_key, vertexai=False)
        # モデル一覧取得で認証テスト
        models = client.models.list()
        # 少なくとも1件取れれば有効
        next(iter(models), None)
        return {"valid": True, "message": "API キーは有効です。"}
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"API キーの検証に失敗しました: {str(e)}")

@app.post("/api/tts", response_model=TTSResponse)
def handle_tts(
    req: TTSRequest,
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
):
    """Gemini TTS API を呼び出して音声を生成します。"""
    try:
        res = generate_speech(req, api_key=x_api_key)
        return res
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        error_detail = str(e)
        user_message = f"音声生成中にエラーが発生しました: {error_detail}"
        if "API_KEY_INVALID" in error_detail or "API key not valid" in error_detail:
            user_message = "API キーが無効です。Google AI Studio (https://aistudio.google.com/app/apikey) で取得された有効な API キーを入力してください。"
        elif "RESOURCE_EXHAUSTED" in error_detail or "429" in error_detail:
            user_message = "API の利用制限（レートリミットまたはクォータ）に達しました。時間をおいて再度お試しください。"
        elif "NOT_FOUND" in error_detail or "not found" in error_detail.lower():
            user_message = f"指定されたモデルが見つからないかアクセスできません。モデル名（{req.model}）をご確認の上、gemini-3.1-flash-tts-preview などの推奨モデルをお試しください。"
        raise HTTPException(status_code=500, detail=user_message)

# 静的ファイルの配信
os.makedirs("static", exist_ok=True)
app.mount("/", StaticFiles(directory="static", html=True), name="static")
