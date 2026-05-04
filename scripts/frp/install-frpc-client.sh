#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<USAGE
Usage:
  curl -fsSL https://gh-proxy.com/https://raw.githubusercontent.com/cicy-ai/cicy-skills/main/scripts/frp/install-frpc-client.sh | bash

Options:
  --token <TOKEN>            FRP auth token. If omitted, prompt interactively.
  --server <HOST>            FRP server address, default: 47.114.96.114
  --server-port <PORT>       FRP server port, default: 9500
  --remote-port <PORT>       Remote TCP port on server, default: 9502
  --local-port <PORT>        Local port to expose, default: 22
  --local-ip <IP>            Local IP to expose, default: 127.0.0.1
  --name <NAME>              Proxy name, default: auto by OS
  --admin-port <PORT>        Local frpc admin port, default: 7400
  --frp-version <VERSION>    FRP version, default: 0.68.1
  --service <auto|system|launchd|none>
                              Service mode, default: auto
  --github-proxy <URL>       Preferred GitHub proxy prefix, default: https://gh-proxy.com/
  -h, --help                 Show this help

Examples:
  curl -fsSL https://gh-proxy.com/https://raw.githubusercontent.com/cicy-ai/cicy-skills/main/scripts/frp/install-frpc-client.sh | bash
  curl -fsSL https://gh-proxy.com/https://raw.githubusercontent.com/cicy-ai/cicy-skills/main/scripts/frp/install-frpc-client.sh | bash -s -- --remote-port 9503
  curl -fsSL https://gh-proxy.com/https://raw.githubusercontent.com/cicy-ai/cicy-skills/main/scripts/frp/install-frpc-client.sh | bash -s -- --local-port 3000 --remote-port 9504 --name mac-web-3000
USAGE
}

SERVER_ADDR="47.114.96.114"
SERVER_PORT="9500"
REMOTE_PORT="9502"
LOCAL_PORT="22"
LOCAL_IP="127.0.0.1"
PROXY_NAME=""
ADMIN_PORT="7400"
FRP_VERSION="0.68.1"
TOKEN=""
SERVICE_MODE="auto"
PREFERRED_PROXY="${GITHUB_PROXY:-https://gh-proxy.com/}"
ALT_PROXY_1="https://ghfast.top/"
ALT_PROXY_2="https://ghproxy.net/"

while [ $# -gt 0 ]; do
  case "$1" in
    --token) TOKEN="${2:-}"; shift 2 ;;
    --server) SERVER_ADDR="${2:-}"; shift 2 ;;
    --server-port) SERVER_PORT="${2:-}"; shift 2 ;;
    --remote-port) REMOTE_PORT="${2:-}"; shift 2 ;;
    --local-port) LOCAL_PORT="${2:-}"; shift 2 ;;
    --local-ip) LOCAL_IP="${2:-}"; shift 2 ;;
    --name) PROXY_NAME="${2:-}"; shift 2 ;;
    --admin-port) ADMIN_PORT="${2:-}"; shift 2 ;;
    --frp-version) FRP_VERSION="${2:-}"; shift 2 ;;
    --service) SERVICE_MODE="${2:-}"; shift 2 ;;
    --github-proxy) PREFERRED_PROXY="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "unknown arg: $1" >&2; usage >&2; exit 1 ;;
  esac
done

prompt_token() {
  if [ -n "$TOKEN" ]; then
    return 0
  fi
  printf 'Enter FRP token: ' >&2
  stty -echo
  read -r TOKEN
  stty echo
  printf '\n' >&2
  if [ -z "$TOKEN" ]; then
    echo "FRP token cannot be empty" >&2
    exit 1
  fi
}

proxy_candidates() {
  printf '%s\n' "$PREFERRED_PROXY" "$ALT_PROXY_1" "$ALT_PROXY_2" ""
}

download_with_proxy() {
  local source_url="$1"
  local dest="$2"
  local candidate
  rm -f "$dest"
  while IFS= read -r candidate; do
    local url="$source_url"
    if [ -n "$candidate" ]; then
      url="${candidate}${source_url}"
    fi
    echo "download: $url" >&2
    if curl -fL --connect-timeout 10 --retry 2 --retry-delay 1 -o "$dest" "$url"; then
      return 0
    fi
  done < <(proxy_candidates)
  return 1
}

OS="$(uname -s)"
ARCH="$(uname -m)"
case "$OS" in
  Darwin)
    case "$ARCH" in
      arm64) FRP_PLATFORM="darwin_arm64" ;;
      x86_64) FRP_PLATFORM="darwin_amd64" ;;
      *) echo "unsupported macOS arch: $ARCH" >&2; exit 1 ;;
    esac
    [ -n "$PROXY_NAME" ] || PROXY_NAME="mac-ssh"
    ;;
  Linux)
    case "$ARCH" in
      x86_64|amd64) FRP_PLATFORM="linux_amd64" ;;
      aarch64|arm64) FRP_PLATFORM="linux_arm64" ;;
      *) echo "unsupported Linux arch: $ARCH" >&2; exit 1 ;;
    esac
    [ -n "$PROXY_NAME" ] || PROXY_NAME="linux-ssh"
    ;;
  *)
    echo "unsupported OS: $OS" >&2
    exit 1
    ;;
esac

prompt_token

BIN_DIR="$HOME/.local/bin"
FRP_DIR="$HOME/.local/frp"
CFG_DIR="$HOME/.config/frp"
CFG_FILE="$CFG_DIR/frpc.toml"
TMP_DIR="$(mktemp -d)"
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

mkdir -p "$BIN_DIR" "$FRP_DIR" "$CFG_DIR"

ARCHIVE="frp_${FRP_VERSION}_${FRP_PLATFORM}.tar.gz"
SOURCE_URL="https://github.com/fatedier/frp/releases/download/v${FRP_VERSION}/${ARCHIVE}"

echo "[1/5] install frpc"
download_with_proxy "$SOURCE_URL" "$TMP_DIR/$ARCHIVE"
tar -xzf "$TMP_DIR/$ARCHIVE" -C "$TMP_DIR"
install -m 0755 "$TMP_DIR/frp_${FRP_VERSION}_${FRP_PLATFORM}/frpc" "$BIN_DIR/frpc"

echo "[2/5] write config: $CFG_FILE"
cat > "$CFG_FILE" <<CFG
serverAddr = "$SERVER_ADDR"
serverPort = $SERVER_PORT

auth.method = "token"
auth.token = "$TOKEN"

webServer.addr = "127.0.0.1"
webServer.port = $ADMIN_PORT

[[proxies]]
name = "$PROXY_NAME"
type = "tcp"
localIP = "$LOCAL_IP"
localPort = $LOCAL_PORT
remotePort = $REMOTE_PORT
CFG

echo "[3/5] config summary"
printf '  server : %s:%s\n' "$SERVER_ADDR" "$SERVER_PORT"
printf '  proxy  : %s %s:%s -> remote %s\n' "$PROXY_NAME" "$LOCAL_IP" "$LOCAL_PORT" "$REMOTE_PORT"
printf '  config : %s\n' "$CFG_FILE"
printf '  log    : %s/frpc.log\n' "$FRP_DIR"

install_launchd() {
  local plist="$HOME/Library/LaunchAgents/com.cicy.frpc.plist"
  mkdir -p "$HOME/Library/LaunchAgents"
  cat > "$plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>com.cicy.frpc</string>
    <key>ProgramArguments</key>
    <array>
      <string>$BIN_DIR/frpc</string>
      <string>-c</string>
      <string>$CFG_FILE</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$FRP_DIR/frpc.log</string>
    <key>StandardErrorPath</key>
    <string>$FRP_DIR/frpc.log</string>
  </dict>
</plist>
PLIST
  launchctl bootout "gui/$(id -u)" "$plist" 2>/dev/null || launchctl unload "$plist" 2>/dev/null || true
  launchctl bootstrap "gui/$(id -u)" "$plist" 2>/dev/null || launchctl load -w "$plist"
  launchctl kickstart -k "gui/$(id -u)/com.cicy.frpc" 2>/dev/null || true
}

install_systemd() {
  if ! command -v systemctl >/dev/null 2>&1; then
    echo "systemctl not found; Linux service install requires systemd" >&2
    exit 1
  fi
  if ! command -v sudo >/dev/null 2>&1; then
    echo "sudo not found; Linux system service install requires sudo" >&2
    exit 1
  fi
  local svc="frpc-cicy-${USER}.service"
  local svc_path="/etc/systemd/system/$svc"
  sudo tee "$svc_path" >/dev/null <<SERVICE
[Unit]
Description=FRP Client for CiCy (${USER})
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${USER}
Environment=HOME=${HOME}
WorkingDirectory=${HOME}
ExecStart=${BIN_DIR}/frpc -c ${CFG_FILE}
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
SERVICE
  sudo systemctl daemon-reload
  sudo systemctl enable --now "$svc"
}

echo "[4/5] install service"
case "$SERVICE_MODE" in
  auto)
    case "$OS" in
      Darwin) install_launchd ;;
      Linux) install_systemd ;;
    esac
    ;;
  launchd)
    install_launchd
    ;;
  system)
    install_systemd
    ;;
  none)
    echo "skip service install"
    ;;
  *)
    echo "unsupported service mode: $SERVICE_MODE" >&2
    exit 1
    ;;
esac

echo "[5/5] verify"
sleep 2
"$BIN_DIR/frpc" status -c "$CFG_FILE" || true

echo
echo "done"
echo "connect with: ssh -p $REMOTE_PORT <your-user>@$SERVER_ADDR"
echo "if SSH is not enabled on the client machine, enable it first"
