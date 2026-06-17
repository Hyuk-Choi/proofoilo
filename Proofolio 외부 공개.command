#!/bin/zsh

set -e

cd "$(dirname "$0")"

BUNDLED_NODE="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
CLOUDFLARED="/opt/homebrew/bin/cloudflared"

if command -v node >/dev/null 2>&1; then
  NODE_BIN="$(command -v node)"
elif [[ -x "$BUNDLED_NODE" ]]; then
  NODE_BIN="$BUNDLED_NODE"
else
  echo "Node.js를 찾을 수 없습니다. Node.js 20 이상을 설치한 뒤 다시 실행하세요."
  read "?Enter를 누르면 종료합니다."
  exit 1
fi

export PATH="$(dirname "$NODE_BIN"):$PATH"

if [[ ! -x "$CLOUDFLARED" ]]; then
  if command -v cloudflared >/dev/null 2>&1; then
    CLOUDFLARED="$(command -v cloudflared)"
  else
    echo "cloudflared를 찾을 수 없습니다."
    echo "Homebrew에서 'brew install cloudflared'를 실행한 뒤 다시 시도하세요."
    read "?Enter를 누르면 종료합니다."
    exit 1
  fi
fi

PORT=3100
while /usr/sbin/lsof -nP -iTCP:${PORT} -sTCP:LISTEN >/dev/null 2>&1; do
  ((PORT++))
done

SERVER_LOG="${TMPDIR:-/tmp}/proofolio-next.log"

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

if [[ -t 1 ]]; then
  clear || true
fi

echo "Proofolio 외부 공개를 준비합니다."
echo
echo "1/3 프로덕션 빌드 중..."
"$NODE_BIN" node_modules/next/dist/bin/next build

echo
echo "2/3 Proofolio 서버 시작 중..."
"$NODE_BIN" node_modules/next/dist/bin/next start \
  -H 127.0.0.1 \
  -p "$PORT" \
  >"$SERVER_LOG" 2>&1 &
SERVER_PID=$!

for _ in {1..40}; do
  if /usr/bin/curl --silent --fail "http://127.0.0.1:${PORT}/dashboard" >/dev/null; then
    break
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "앱 서버를 시작하지 못했습니다."
    cat "$SERVER_LOG"
    exit 1
  fi
  sleep 0.25
done

if ! /usr/bin/curl --silent --fail "http://127.0.0.1:${PORT}/dashboard" >/dev/null; then
  echo "앱 서버 응답을 확인하지 못했습니다."
  cat "$SERVER_LOG"
  exit 1
fi

echo
echo "3/3 외부 공개 주소 생성 중..."
echo "아래에 표시되는 https://...trycloudflare.com 주소를 외부 사용자에게 공유하세요."
echo "비로그인 사용자는 해당 브라우저에 저장되고, 로그인 사용자는 같은 계정 워크스페이스와 동기화됩니다."
echo "이 창을 닫거나 Control-C를 누르면 공개가 종료됩니다."
echo

"$CLOUDFLARED" tunnel \
  --protocol http2 \
  --url "http://127.0.0.1:${PORT}" \
  --no-autoupdate
