# Gemini TTS Colors

Google Gemini 3.8 / 3.x 世代のネイティブ音声合成（TTS: Text-to-Speech）モデルを活用した、高機能かつ直感的な Web アプリケーションです。

テキスト入力から、30種類の多彩な声色、オーディオタグによる感情・間（ポーズ）・テンポ制御、自然言語によるディレクター指示、複数話者の掛け合い、詳細な生成パラメータ（Temperature, Top-P, Seed等）の指定が可能で、生成した高品質な音声を即座にブラウザ上で再生・WAVファイルとしてダウンロードできます。

---

## 主な特徴と機能

### 1. 30種類の公式ボイスライブラリ
- **全30種類の音声**: `Zephyr`, `Puck`, `Charon`, `Kore`, `Fenrir`, `Leda`, `Aoede`, `Enceladus`, `Sulafat` などを完全サポート。
- **トーン別カテゴリフィルタ**: 元気・明るい (Energetic)、明瞭・落ち着き (Professional)、穏やか・癒し (Gentle)、親しみ・日常 (Casual)、表情豊か (Expressive) からワンタップで絞り込み。
- **キーワード検索**: 声の特長や説明文から素早く目的の声を検索。

### 2. 単一話者 & 複数話者 (Multi-Speaker 対話) モード
- **単一話者モード**: 指定した1つのボイスでテキストを読み上げ。
- **複数話者モード**: 会話形式の台本（`Speaker 1: ...`, `Speaker 2: ...`）に対し、話者ごとに個別のボイスを割り当てて自然な掛け合いを生成。

### 3. Gemini TTS 専用のオーディオタグ挿入パレット
Gemini TTS がネイティブ認識する演出タグをワンクリックでカーソル位置に挿入可能：
- **感情・ニュアンス**: `[excitedly]`, `[bored]`, `[reluctantly]`, `[amazed]`, `[crying]`, `[curious]`, `[panicked]`, `[serious]`, `[sarcastic]`
- **動作・呼吸音**: `[whispers]`, `[shouting]`, `[sighs]`, `[gasp]`, `[giggles]`, `[laughs]`, `[cough]`
- **テンポ・間**: `[short pause]`, `[very fast]`, `[very slow]`

### 4. 🎭 ディレクター演出設定 (Prompt Direction)
- **Style & Emotion**: 声のトーンや表情（例: 満面の笑みで、緊迫した様子で）
- **Pacing**: 話速・リズム（例: テンポよく早口で、言葉をじっくり置いていくように）
- **Accent & Persona**: アクセント・キャラクター属性（例: 英国風、若々しいDJ調）
- **The Scene**: 背景・シチュエーション設定（例: 朝のラジオスタジオ、深夜の洋館）
- **Audio Profile**: 話者の人物像・性格設定

### 5. ⚙️ 網羅的な生成パラメータ (Generation Config)
- **Model**: `gemini-3.1-flash-tts-preview` (推奨), `gemini-2.5-flash-preview-tts`, `gemini-2.5-pro-preview-tts`, `gemini-3.8-flash` および自由入力
- **Language Code**: 自動検出、`ja-JP` (日本語), `en-US`, `en-GB`, `ko-KR`, `cmn-CN` など
- **Temperature**: 0.0 〜 2.0 (揺らぎ・多様性)
- **Top-P / Top-K**: トークンサンプリング制御
- **Seed**: 再現性を確保するための乱数シード
- **Presence Penalty / Frequency Penalty**: 語句の偏りを制御
- **Max Output Tokens**: 出力トークン上限
- **System Instruction**: モデル全体の基本振る舞い指示

### 6. 音声プレイヤー & 波形表示 & ダウンロード
- **波形ビジュアライザー**: Web Audio API により生成された音声の波形をグラデーション表示。
- **再生コントロール**: 再生/一時停止、シークバー、停止、再生速度変更 (0.5x 〜 2.0x)。
- **WAV ダウンロード**: 24kHz / 16-bit Mono の高品位 WAV 形式で即時保存。
- **生成履歴 (History)**: 過去の生成ログをローカルに保持し、ワンクリックで再試聴・再ダウンロード・設定復元が可能。

---

## セットアップと起動方法

### 前提条件
- Python 3.10 以上 (Python 3.12 動作確認済み)
- Google AI Studio の API キー (ブラウザ画面上部から入力可能、または環境変数)

### 起動手順

1. **リポジトリに移動**
   ```bash
   cd /home/minatosingull/ghq/github.com/kitsystemyou/gemini-tts-color
   ```

2. **起動スクリプトの実行**
   ```bash
   ./run.sh
   ```
   ※ 自動的に仮想環境 `.venv` が作成され、依存パッケージがインストールされます。

3. **ブラウザでアクセス**
   ブラウザで以下のURLを開きます：
   ```
   http://127.0.0.1:8000
   ```

4. **API キーの設定**
   - 画面右上の入力欄に Google AI Studio で取得した API キー（`AIzaSy...`）を入力して「保存」をクリックします。
   - または、起動前に環境変数 `GEMINI_API_KEY` を設定することも可能です：
     ```bash
     export GEMINI_API_KEY="your_api_key_here"
     ./run.sh
     ```

---

## プリセットによるクイックスタート
画面右上のプリセットボタンから、すぐに実用的な設定を試すことができます：
- **🎙️ ニュース速報**: `Charon`（Informative）による明瞭で信頼感のある報道調
- **☀️ 元気な案内役**: `Zephyr`（Bright）によるハイテンションなアナウンス
- **👥 2人の対談ポッドキャスト**: `Kore` と `Puck` の掛け合いによる対話
- **🌙 囁き・ホラー怪談**: `Enceladus`（Breathy）による息づかいを強調した囁き
- **🇬🇧 英語ナレーション**: `Puck`（Upbeat）によるスタイリッシュな英語アナウンス

---

## ディレクトリ構成

```
gemini-tts-color/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI サーバー、API エンドポイント定義
│   ├── gemini_tts.py    # Gemini API 呼び出し、プロンプト統合、PCM->WAV変換
│   └── voices.py        # 30種類のVoiceメタデータ定義
├── static/
│   ├── index.html       # メインWebUI
│   ├── css/
│   │   └── style.css    # レスポンシブ & ダークモードスタイル
│   └── js/
│       └── app.js       # UI操作、API通信、波形描画、ダウンロード、履歴管理
├── requirements.txt     # Python 依存関係
├── run.sh               # 起動スクリプト
└── README.md            # ドキュメント
```
