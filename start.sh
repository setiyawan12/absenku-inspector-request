#!/bin/bash
# wan-net Inspector request — Public HTTPS tunnel via Cloudflare
# Usage: ./start.sh <localPort>
# Contoh: ./start.sh 8000

LOCAL_PORT="${1:-8000}"
DIR="$(cd "$(dirname "$0")" && pwd)"
CF="$DIR/cloudflared"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ⚡ wan-net Inspector request  ×  Cloudflare Tunnel"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── Download cloudflared jika belum ada ───────────────────────────
if [ ! -f "$CF" ]; then
  echo "📥 Downloading cloudflared (sekali saja)…"
  OS="$(uname -s)"; ARCH="$(uname -m)"
  if   [ "$OS" = "Darwin" ] && [ "$ARCH" = "arm64" ]; then
    URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64.tgz"
    curl -sL "$URL" | tar xz -C "$DIR"
  elif [ "$OS" = "Darwin" ]; then
    URL="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.tgz"
    curl -sL "$URL" | tar xz -C "$DIR"
  elif [ "$OS" = "Linux" ] && ([ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]); then
    curl -sL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64" -o "$CF"
    chmod +x "$CF"
  else
    curl -sL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64" -o "$CF"
    chmod +x "$CF"
  fi
  echo "✓ cloudflared siap"
  echo ""
fi

# ── Cleanup saat Ctrl+C ───────────────────────────────────────────
cleanup() {
  echo ""; echo "Stopping…"
  [ -n "$SERVER_PID" ] && kill $SERVER_PID 2>/dev/null
  [ -n "$CLIENT_PID" ] && kill $CLIENT_PID 2>/dev/null
  [ -n "$CF_PID"     ] && kill $CF_PID     2>/dev/null
  rm -f /tmp/.mngrok_server.log
  exit 0
}
trap cleanup INT TERM

# ── Start wan-net Inspector request server ───────────────────────────────────────
echo "▶  Starting server…"
node "$DIR/server.js" > /tmp/.mngrok_server.log 2>&1 &
SERVER_PID=$!

# Tunggu inspector port muncul di log (max 5 detik)
INSP_PORT=""
for i in $(seq 1 20); do
  sleep 0.25
  INSP_PORT=$(grep -o 'Inspector: http://localhost:[0-9]*' /tmp/.mngrok_server.log 2>/dev/null | grep -o '[0-9]*$' | head -1)
  [ -n "$INSP_PORT" ] && break
done
INSP_PORT="${INSP_PORT:-8080}"
echo "   Inspector : http://localhost:${INSP_PORT}"

# ── Start tunnel client ───────────────────────────────────────────
echo "▶  Starting client → localhost:${LOCAL_PORT}…"
node "$DIR/client.js" "$LOCAL_PORT" >> /tmp/.mngrok_server.log 2>&1 &
CLIENT_PID=$!
sleep 1

# ── Start Cloudflare Tunnel ───────────────────────────────────────
echo "▶  Starting Cloudflare tunnel…"
echo "   (tunggu URL publik, ~5-10 detik)"
echo ""

"$CF" tunnel --url "http://localhost:3000" --no-autoupdate 2>&1 \
| while IFS= read -r line; do
    CF_URL=$(echo "$line" | grep -o 'https://[a-zA-Z0-9._-]*\.trycloudflare\.com' | head -1)
    if [ -n "$CF_URL" ]; then
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo "  ✅ TUNNEL AKTIF!"
      echo ""
      echo "  🌐 Public URL  : $CF_URL"
      echo "  🔍 Inspector   : http://localhost:${INSP_PORT}"
      echo "  🎯 Local app   : http://localhost:${LOCAL_PORT}"
      echo ""
      echo "  Bagikan URL di atas — sudah HTTPS, bisa diakses siapa saja!"
      echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
      echo ""
    fi
  done &
CF_PID=$!

wait
