#!/usr/bin/env bash
set -euo pipefail

export HOME="${HOME:-/root}"
export PATH="$HOME/.local/bin:$HOME/Private/cicy-skills/bin:$PATH"

mkdir -p "$HOME/.local/bin" "$HOME/Private/cicy-skills/bin" "$HOME/Private"

cat > "$HOME/global.json" <<'JSON'
{
  "GMAIL_CLIENT_ID": "dummy-client-id",
  "GMAIL_CLIENT_SECRET": "dummy-client-secret",
  "GMAIL_REFRESH_TOKEN": "dummy-refresh-token"
}
JSON

if [[ ! -x ./dist/cicy-skills || ! -x ./dist/cicy-skillsd || ! -x ./dist/cicy-hosttools ]]; then
  echo "missing host-built binaries in ./dist; run make build-local-binaries first" >&2
  exit 1
fi

cp ./dist/cicy-skills /tmp/cicy-skills
cp ./dist/cicy-skillsd /tmp/cicy-skillsd
cp ./dist/cicy-hosttools /tmp/cicy-hosttools

/tmp/cicy-skills config-path >/tmp/cicy-skills-config-path.txt
/tmp/cicy-skills init-config >/tmp/cicy-skills-init.txt
/tmp/cicy-skills install all

test -L "$HOME/Private/cicy-skills/bin/gmail"
test -L "$HOME/Private/cicy-skills/bin/google"
test -L "$HOME/.local/bin/google"
test -L "$HOME/.local/bin/gpt"
test -d "$HOME/Private/cicy-skills/generated/skills"
test -f "$HOME/Private/cicy-skills/generated/agents/claude/CLAUDE.md"

gmail | grep -q 'Usage: gmail <list|read|read-all|send|watch>'
google | grep -q 'Available services:'
fast-api --tools | grep -q '/api/ping'

echo "google-node smoke test passed"
