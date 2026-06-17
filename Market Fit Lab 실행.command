#!/bin/zsh

set -e

cd "$(dirname "$0")"

BUNDLED_NODE="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"

if command -v pnpm >/dev/null 2>&1; then
  pnpm dev
elif command -v npm >/dev/null 2>&1; then
  npm run dev
elif [[ -x "$BUNDLED_NODE" ]]; then
  "$BUNDLED_NODE" node_modules/next/dist/bin/next dev
else
  echo "Node.js를 찾을 수 없습니다. Node.js 20 이상을 설치한 뒤 다시 실행하세요."
  read "?아무 키나 누르면 종료합니다."
  exit 1
fi
