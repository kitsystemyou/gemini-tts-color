#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$DIR"

# 仮想環境の存在確認
if [ ! -d ".venv" ]; then
    echo "Python仮想環境 (.venv) を作成しています..."
    python3 -m venv .venv
    source .venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
else
    source .venv/bin/activate
fi

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-8000}"

# Google AI Studio API キーを優先して動作させるため Vertex AI モードを無効化
export GOOGLE_GENAI_USE_VERTEXAI="false"

echo "=========================================================="
echo "  Gemini TTS Colors を起動しています..."
echo "  URL: http://${HOST}:${PORT}"
echo "=========================================================="

uvicorn app.main:app --host "$HOST" --port "$PORT" --reload
