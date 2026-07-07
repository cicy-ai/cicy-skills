#!/usr/bin/env bash
# colab-frp-ssh.sh — expose THIS Google Colab runtime's SSH through the cicy frp
# gateway so an agent can drive it:   ssh -p 6024 root@cicy-ai.com
#
# Upload to Colab, then in a cell run:   !bash colab-frp-ssh.sh
# (Colab runs as root, so no sudo needed; the script handles either.)
#
# ⚠ Colab is EPHEMERAL: nothing persists. Re-run this every new runtime. The
#   tunnel dies when the runtime recycles (~90min idle / ~12h max). Google's ToS
#   frowns on long-lived tunnels/servers on Colab — it may kill the runtime.
set -uo pipefail

# all overridable via env (the Colab cell / caller passes them in) —————————————
FRP_SERVER="${FRP_SERVER:-cicy-ai.com}"        # gateway domain
FRP_PORT="${FRP_PORT:-7000}"                    # frps port
FRP_REMOTE_PORT="${FRP_REMOTE_PORT:-6024}"      # public port on the gateway
FRP_NAME="${FRP_NAME:-colab-ssh}"               # frp proxy name (unique per runtime)
FRP_VER="${FRP_VER:-0.68.1}"
FRP_TOKEN="${FRP_TOKEN:-}"; [ -n "$FRP_TOKEN" ] || { echo "FRP_TOKEN 未设置(export FRP_TOKEN=… ,或用 Colab cell 从 Secrets 注入)"; exit 1; }
# team public keys (ed25519 first — modern sshd prefers it; add more lines)
SSH_PUBKEYS=(
  "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCPgC8sASyJ2dMtDvKeC5j6L5UnOB1qnWxpQrWQ6j4pElI90yM0pJ0ZdQEfQlzciQ9o5BQeYInUap1UeOU909vWirAaYSZ2jhGZrjloC1ozpxHLcNTIHkEyxboNutFPdHm8fwVOy8GFDtpLarD+ZzV3atcOLvnnbPtohKFgnaqaP1fEvXlJg4Vsu64YfUrfyEnP+8htpam44tZUHn24VaZW/Vu+B29ESa4SM2CMbQdlzPs2m/wtL7vwFGeTmzhj8vLjCXv+dBz/l0DOb2n6N6wAaeowKS0cZtMu3OyuMbdHBWrQt4dfvvCZq6IKllr13v/CuzJ68CMh6g0hFccKf+6qvbcxOGyXuzxUxWpznLd+0EWlX+mWus43Y7I093qLKKEurk5N+r5p5WoKCAnk+wFZHvW50lPqPHySG741XaMeSMti3jY0CxJxJMHqZv1TWkpUAWkyPD6V3Srdu+LKR/W1c6Mj2xSwzVUwHzJKrBzOSRJlJw/0XYRI+a8/eHII3a2xbG/ShUXOJF8xuGsBhANw7FYzmDGK6AEnLs/QMn9PSxQTWRTwwmkKISP/SOSBFW/p/rlP6RPp1tgagTWDl9HLTOe5we/4b4JzbhEmgVedUA8QYXAxeljoQCaNgg4oPH/BxWv423Cp+PvF7xnqbb5seWwjqgzBcPXerf94tUQfTw== cicy@0cadebc15708"
  "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIKWMycBp5+3owB6EFEl8vKGDe8CkRvGeBaHCldVWZSb5 linux-w10125"
  "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQDyMqv3jOo/FBGsvvCAli5yM15qNUMEcLkB+GripAUh4ng16WxE0SLXBl6EKE9YuVDjk1HSBvm41CV4nHpXukJQQmv1NJbwTr/ZgI2swG/SRQ+jDceiQcfGTRzW0fIvHzdYXiBKSHrH0ChC7u/aRwmubtxKv9XZ1AZn7PtphKn4r3oqlv8xNDwIlVqRR8ycza3x4ZYfpSe9JNrLCxY9rnk2V1z5C4SPgo70QXPnWNvPIMKLnlcoDXGy1049rZGsye3oi3WSwAVHoBhQbNxBt7iu1AZtB8nMd66SAfjeWURSzCZIAmJqX6XKsbGC11GOl+RRz2ZBvG1b3qiV1wDQ1x6p ton@jacks-MacBook-Pro.local"
)

log(){ printf '\n\033[1;36m▶ %s\033[0m\n' "$*"; }
ok(){  printf '  \033[32m✓\033[0m %s\n' "$*"; }
warn(){ printf '  \033[33m⚠\033[0m %s\n' "$*"; }
SUDO=""; [ "$(id -u)" != 0 ] && SUDO="sudo"

log "sshd (root pubkey login on :22)"
$SUDO apt-get -qq update >/dev/null 2>&1 || true
$SUDO apt-get -qq install -y openssh-server >/dev/null 2>&1 || warn "apt install openssh-server failed (maybe already present)"
$SUDO mkdir -p /run/sshd /root/.ssh && $SUDO chmod 700 /root/.ssh
for K in "${SSH_PUBKEYS[@]}"; do
  $SUDO grep -qF "$K" /root/.ssh/authorized_keys 2>/dev/null || echo "$K" | $SUDO tee -a /root/.ssh/authorized_keys >/dev/null
done
$SUDO chmod 600 /root/.ssh/authorized_keys
ok "authorized $($SUDO grep -c . /root/.ssh/authorized_keys 2>/dev/null || echo 0) key(s) in /root/.ssh"
# allow root key login (no password)
$SUDO sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config 2>/dev/null || true
$SUDO sed -i 's/^#\?PubkeyAuthentication.*/PubkeyAuthentication yes/'     /etc/ssh/sshd_config 2>/dev/null || true
# Colab fresh runtime: host keys aren't generated and /run/sshd is missing —
# sshd silently fails to start without both. Fix, then ensure it's actually up.
$SUDO ssh-keygen -A >/dev/null 2>&1 || true
$SUDO service ssh start >/dev/null 2>&1 || true
pgrep -x sshd >/dev/null 2>&1 || $SUDO /usr/sbin/sshd 2>/dev/null || true
sleep 1
# detect the port sshd ACTUALLY listens on — some Colab images set Port 2222,
# not 22, so frpc must point at the real one or the tunnel connects to nothing.
SSHD_PORT=$($SUDO /usr/sbin/sshd -T 2>/dev/null | awk '/^port /{print $2; exit}')
[ -z "$SSHD_PORT" ] && SSHD_PORT=22
if pgrep -x sshd >/dev/null 2>&1; then
  ok "sshd running, listening on :$SSHD_PORT"
else
  warn "sshd not running — login will be refused (check: /usr/sbin/sshd -T)"
fi

log "frpc -> $FRP_SERVER:$FRP_REMOTE_PORT"
FRPC=/usr/local/bin/frpc
if [ ! -x "$FRPC" ]; then
  echo "  downloading frpc v$FRP_VER ..."
  { curl -fsSL "https://gh-proxy.com/https://github.com/fatedier/frp/releases/download/v$FRP_VER/frp_${FRP_VER}_linux_amd64.tar.gz" | tar xz -C /tmp \
    && $SUDO install -m0755 "/tmp/frp_${FRP_VER}_linux_amd64/frpc" "$FRPC"; } || warn "frpc download/install failed"
fi
[ -x "$FRPC" ] && ok "frpc = $FRPC ($($FRPC -v 2>/dev/null))"
cat > /root/frpc-colab.toml <<EOF
serverAddr = "$FRP_SERVER"
serverPort = $FRP_PORT
auth.method = "token"
auth.token = "$FRP_TOKEN"

[[proxies]]
name = "$FRP_NAME"
type = "tcp"
localIP = "127.0.0.1"
localPort = $SSHD_PORT
remotePort = $FRP_REMOTE_PORT
EOF
pkill -f 'frpc-colab.toml' 2>/dev/null || true
setsid nohup "$FRPC" -c /root/frpc-colab.toml >/root/frpc-colab.log 2>&1 &
sleep 4
if grep -qi 'start proxy success' /root/frpc-colab.log 2>/dev/null; then
  ok "tunnel registered on gateway (pid $(pgrep -f frpc-colab.toml | head -1))"
else
  warn "tunnel not confirmed — tail /root/frpc-colab.log"
fi

echo
echo "============================================================"
echo "  SSH:  ssh -p $FRP_REMOTE_PORT root@$FRP_SERVER"
echo "  log:  tail -f /root/frpc-colab.log"
echo "  NOTE: Colab is ephemeral — re-run this after every new runtime."
echo "============================================================"
