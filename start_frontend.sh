#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# start_frontend.sh — Start the Vite React dev server
# ─────────────────────────────────────────────────────────────────────────────

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/frontend"

echo "🚀 Starting Vite frontend on http://localhost:5173"
echo "   Press Ctrl+C to stop"
echo ""
npm run dev
