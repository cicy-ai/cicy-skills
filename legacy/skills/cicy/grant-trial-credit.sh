#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: grant-trial-credit <claim-code> [credits] [note]"
  exit 1
fi

CODE="$(echo "$1" | tr -cd '0-9')"
CREDITS="${2:-100}"
NOTE="${3:-}"
API_BASE="${CICY_API_BASE:-https://api.cicy-ai.com}"
ADMIN_KEY="${TRIAL_CLAIM_ADMIN_KEY:-}"
GRANTED_BY="${GRANTED_BY:-openclaw}"
GLOBAL_JSON="${GLOBAL_JSON:-$HOME/global.json}"

if [[ -z "$CODE" || ${#CODE} -ne 6 ]]; then
  echo "claim code must be a 6-digit number"
  exit 1
fi

if [[ -z "$ADMIN_KEY" ]]; then
  if [[ -f "$GLOBAL_JSON" ]]; then
    ADMIN_KEY="$(
      python3 - <<PY
import json
try:
    with open(${GLOBAL_JSON@Q}, 'r', encoding='utf-8') as f:
        data = json.load(f)
    print(data.get('api_token', ''))
except Exception:
    print('')
PY
    )"
  fi
fi

if [[ -z "$ADMIN_KEY" ]]; then
  echo "TRIAL_CLAIM_ADMIN_KEY is required, or put api_token in ~/global.json"
  exit 1
fi

if [[ -z "$NOTE" ]]; then
  NOTE="首次登录试用金 ${CREDITS} Credits"
fi

JSON_PAYLOAD="$(python3 - <<PY
import json
payload = {
  "code": ${CODE@Q},
  "credits": float(${CREDITS@Q}),
  "note": ${NOTE@Q},
  "granted_by": ${GRANTED_BY@Q},
}
print(json.dumps(payload, ensure_ascii=False))
PY
)"

do_request() {
  local body_file
  body_file="$(mktemp)"
  local status

  status="$(
    env -u http_proxy -u https_proxy -u HTTP_PROXY -u HTTPS_PROXY -u ALL_PROXY -u all_proxy \
      curl --silent --show-error \
      -o "$body_file" \
      -w '%{http_code}' \
      -X POST "${API_BASE%/}/api/trial-claim/grant" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer ${ADMIN_KEY}" \
      -d "$JSON_PAYLOAD"
  )"

  REQ_STATUS="$status"
  REQ_BODY="$(cat "$body_file")"
  rm -f "$body_file"
}

REQ_STATUS=""
REQ_BODY=""
do_request

if [[ "$REQ_STATUS" != 2* ]]; then
  if [[ -n "$REQ_BODY" ]]; then
    echo "$REQ_BODY" >&2
  else
    echo "request failed with status ${REQ_STATUS}" >&2
  fi
  exit 1
fi

RESP="$REQ_BODY"

echo "$RESP"

if command -v jq >/dev/null 2>&1; then
  STATUS="$(echo "$RESP" | jq -r '.status // empty')"
  USER_ID="$(echo "$RESP" | jq -r '.user_id // empty')"
  AMOUNT="$(echo "$RESP" | jq -r '.amount_credits // empty')"
  if [[ "$STATUS" == "granted" ]]; then
    echo "[grant-trial-credit] ok user_id=${USER_ID} credits=${AMOUNT} status=${STATUS} auth=bearer"
  fi
fi
