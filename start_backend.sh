#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# start_backend.sh — Start the FastAPI RAG backend
#
# Prerequisites:
#   1. Fill in your API keys in .env:
#      ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE
#      OPENAI_API_KEY=sk-YOUR_KEY_HERE
#   2. Run this script from the Portfolio/ directory
# ─────────────────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

# Load environment variables from .env
if [ -f ".env" ]; then
  export $(grep -v '^#' .env | xargs)
  echo "✅ Loaded .env"
else
  echo "❌ .env not found. Copy .env.example to .env and fill in your keys."
  exit 1
fi

# Activate virtual environment
source .venv/bin/activate

echo "🚀 Starting FastAPI backend on http://localhost:8000"
echo "   Press Ctrl+C to stop"
echo ""
uvicorn main:app --reload --host 0.0.0.0 --port 8000
