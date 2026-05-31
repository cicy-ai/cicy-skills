#!/usr/bin/env python3
"""agent-summary - Extract slim conversation and summary from agent request snapshot.

Usage:
    agent-summary <agent-id>                    # Generate text summary (default)
    agent-summary <path-to-current.json>
    agent-summary <agent-id> --stats            # Show token stats only
    agent-summary <agent-id> --slim             # Output slim conversation JSON
    agent-summary <agent-id> --text             # Output structured text for AI
    agent-summary <agent-id> --ai               # Generate AI summary (default provider)
    agent-summary <agent-id> --ai --provider=deepseek   # Use specific provider
    agent-summary <agent-id> --ai --model=deepseek-chat # Use specific model
    agent-summary <agent-id> --ai --prompt="custom prompt"  # Custom prompt

Supports both Anthropic and OpenAI (Responses API) formats.
AI providers are configured in ~/cicy-ai/global.json
"""

import json
import sys
import os
import sqlite3
import urllib.request
import urllib.error
from pathlib import Path

WORKERS_DIR = Path.home() / "cicy-ai" / "workers"
GLOBAL_CONFIG = Path.home() / "cicy-ai" / "global.json"
DATA_DB = Path.home() / "cicy-ai" / "db" / "data.db"
CLAUDE_PROJECTS = Path.home() / ".claude" / "projects"
API_BASE = os.environ.get("CICY_API_BASE", "http://127.0.0.1:8008")
CODEX_DATA = Path.home() / ".codex"
CODEX_STATE_DB = CODEX_DATA / "state_5.sqlite"
CODEX_SESSIONS_DIR = CODEX_DATA / "sessions"
OPENCODE_DB = Path.home() / ".local" / "share" / "opencode" / "opencode.db"


# --- gateway detection + JSONL fallback ---------------------------------
#
# When the cicy-code custom gateway is OFF for a claude pane, there is no
# .cicy/history/current.json. Claude Code instead writes every turn to
# ~/.claude/projects/<encoded-cwd>/<session>.jsonl. The helpers below let us
# pick the right source per agent without a pre-conversion step.


def _short_pane_id(pid: str) -> str:
    return (pid or "").split(":", 1)[0]


def _lookup_gateway_api(agent_id: str):
    try:
        token = ""
        if GLOBAL_CONFIG.exists():
            with open(GLOBAL_CONFIG) as f:
                token = (json.load(f) or {}).get("api_token", "")
        req = urllib.request.Request(
            f"{API_BASE}/api/tmux/panes",
            headers={"Authorization": f"Bearer {token}"} if token else {},
        )
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        for p in (data.get("panes") or []):
            if _short_pane_id(p.get("pane_id", "")) == agent_id:
                return (1 if p.get("use_custom_gateway") else 0), (p.get("agent_type") or "")
    except Exception:
        return None, ""
    return None, ""


def _lookup_gateway_db(agent_id: str):
    if not DATA_DB.exists():
        return None, ""
    try:
        db = sqlite3.connect(f"file:{DATA_DB}?mode=ro", uri=True)
        cur = db.cursor()
        cur.execute(
            "SELECT use_custom_gateway, agent_type FROM agent_config "
            "WHERE pane_id = ? OR pane_id LIKE ? LIMIT 1",
            (agent_id, agent_id + ":%"),
        )
        row = cur.fetchone()
        db.close()
        if not row:
            return None, ""
        return int(row[0] or 0), (row[1] or "")
    except Exception:
        return None, ""


def lookup_gateway(agent_id: str):
    """Return (use_custom_gateway:int|None, agent_type:str). API first, SQLite fallback."""
    g, t = _lookup_gateway_api(agent_id)
    if g is not None:
        return g, t
    return _lookup_gateway_db(agent_id)


def encode_cwd_for_claude(cwd: str) -> str:
    # Claude Code maps cwd -> dirname by replacing every '/' with '-'.
    return (cwd or "").replace("/", "-")


def find_jsonl_for_agent(agent_id: str) -> Path:
    cwd = WORKERS_DIR / agent_id
    proj_dir = CLAUDE_PROJECTS / encode_cwd_for_claude(str(cwd))
    if not proj_dir.is_dir():
        raise FileNotFoundError(f"No Claude project dir: {proj_dir}")
    candidates = sorted(proj_dir.glob("*.jsonl"),
                        key=lambda x: x.stat().st_mtime, reverse=True)
    if not candidates:
        raise FileNotFoundError(f"No .jsonl in {proj_dir}")
    return candidates[0]


def load_jsonl_as_snapshot(jsonl_path: Path, agent_id: str = "") -> dict:
    """Parse Claude Code's JSONL log into the same envelope shape as current.json."""
    messages = []
    session_id = ""
    model = ""
    last_ts = ""
    cwd_seen = ""

    with open(jsonl_path, "r") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                ev = json.loads(line)
            except Exception:
                continue
            t = ev.get("type")
            if t not in ("user", "assistant"):
                continue
            msg = ev.get("message") or {}
            role = msg.get("role")
            content = msg.get("content")
            if role not in ("user", "assistant") or content is None:
                continue
            if isinstance(content, str):
                content = [{"type": "text", "text": content}]
            messages.append({
                "role": role,
                "id": ev.get("uuid", ""),
                "content": content,
            })
            if t == "assistant" and msg.get("model"):
                model = msg["model"]
            if ev.get("timestamp"):
                last_ts = ev["timestamp"]
            if not session_id:
                session_id = ev.get("sessionId", "")
            if not cwd_seen:
                cwd_seen = ev.get("cwd", "")

    if not agent_id and cwd_seen:
        agent_id = Path(cwd_seen).name

    return {
        "provider": "anthropic",
        "conversation_id": session_id or jsonl_path.stem,
        "agent_id": agent_id,
        "model": model,
        "timestamp": last_ts,
        "status": "active",
        "_source": "jsonl",
        "_jsonl_path": str(jsonl_path),
        "body": {
            "system": [],
            "messages": messages,
        },
    }

# --- Kiro CLI JSONL loader ----------------------------------------------------

KIRO_SESSIONS_DIR = Path.home() / ".kiro" / "sessions" / "cli"


def find_kiro_jsonl_for_agent(agent_id: str) -> Path:
    """Find the most recent kiro session jsonl whose cwd matches the agent workspace."""
    cwd = str(WORKERS_DIR / agent_id)
    candidates = []
    if not KIRO_SESSIONS_DIR.exists():
        raise FileNotFoundError(f"Kiro sessions dir not found: {KIRO_SESSIONS_DIR}")
    for meta_file in KIRO_SESSIONS_DIR.glob("*.json"):
        try:
            with open(meta_file) as f:
                meta = json.load(f)
            if meta.get("cwd", "").rstrip("/") == cwd.rstrip("/"):
                jsonl = meta_file.with_suffix(".jsonl")
                if jsonl.exists():
                    candidates.append((meta.get("updated_at", ""), jsonl))
        except Exception:
            continue
    if not candidates:
        raise FileNotFoundError(f"No kiro session found for cwd={cwd}")
    candidates.sort(key=lambda x: x[0], reverse=True)
    return candidates[0][1]


def load_kiro_as_snapshot(agent_id: str) -> dict:
    """Parse kiro-cli's JSONL log into the standard envelope shape."""
    jsonl_path = find_kiro_jsonl_for_agent(agent_id)
    messages = []
    last_ts = ""
    session_id = jsonl_path.stem

    with open(jsonl_path, "r") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                ev = json.loads(line)
            except Exception:
                continue
            kind = ev.get("kind")
            data = ev.get("data", {})
            content_raw = data.get("content", [])
            # Extract text blocks from kiro content format: [{kind: "text", data: "..."}, ...]
            content_blocks = []
            for block in (content_raw if isinstance(content_raw, list) else []):
                if isinstance(block, dict):
                    if block.get("kind") == "text" and block.get("data"):
                        content_blocks.append({"type": "text", "text": block["data"]})
                    elif block.get("kind") == "toolUse":
                        tool_data = block.get("data", {})
                        content_blocks.append({
                            "type": "tool_use",
                            "id": tool_data.get("toolUseId", ""),
                            "name": tool_data.get("name", ""),
                            "input": tool_data.get("input", {}),
                        })
            if not content_blocks:
                continue
            if kind == "Prompt":
                messages.append({"role": "user", "content": content_blocks})
            elif kind == "AssistantMessage":
                messages.append({"role": "assistant", "content": content_blocks})
            if ev.get("timestamp"):
                last_ts = ev["timestamp"]

    return {
        "provider": "anthropic",
        "conversation_id": session_id,
        "agent_id": agent_id,
        "model": "kiro-cli",
        "timestamp": last_ts,
        "status": "active",
        "_source": "kiro",
        "_jsonl_path": str(jsonl_path),
        "body": {
            "system": [],
            "messages": messages,
        },
    }


# --- Codex JSONL loader -------------------------------------------------------

def find_codex_jsonl_for_agent(agent_id: str) -> Path:
    cwd = str(WORKERS_DIR / agent_id)
    # Try SQLite index first (fast path)
    if CODEX_STATE_DB.exists():
        try:
            db = sqlite3.connect(f"file:{CODEX_STATE_DB}?mode=ro", uri=True)
            cur = db.cursor()
            cur.execute(
                "SELECT id FROM threads WHERE cwd = ? ORDER BY created_at DESC LIMIT 1",
                (cwd,)
            )
            row = cur.fetchone()
            db.close()
            if row:
                thread_id = row[0]
                candidates = sorted(
                    CODEX_SESSIONS_DIR.rglob(f"*{thread_id}*.jsonl"),
                    key=lambda x: x.stat().st_mtime, reverse=True,
                )
                if candidates:
                    return candidates[0]
        except Exception:
            pass
    # Fallback: scan recent JSONL files for matching CWD in session_meta
    candidates = sorted(CODEX_SESSIONS_DIR.rglob("*.jsonl"),
                        key=lambda x: x.stat().st_mtime, reverse=True)
    for p in candidates[:30]:
        try:
            with open(p) as f:
                first = json.loads(f.readline())
            if (first.get("type") == "session_meta"
                    and first.get("payload", {}).get("cwd") == cwd):
                return p
        except Exception:
            continue
    raise FileNotFoundError(f"No Codex session found for {agent_id} (cwd={cwd})")


def load_codex_as_snapshot(agent_id: str) -> dict:
    """Parse Codex rollout JSONL into the common anthropic-envelope shape."""
    jsonl_path = find_codex_jsonl_for_agent(agent_id)
    messages = []
    session_id = ""
    model = ""
    last_ts = ""
    system_text = ""

    with open(jsonl_path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                ev = json.loads(line)
            except Exception:
                continue
            t = ev.get("type")
            p = ev.get("payload", {})
            last_ts = ev.get("timestamp", last_ts)

            if t == "session_meta":
                session_id = p.get("id", "")
                system_text = (p.get("base_instructions") or {}).get("text", "")
                continue

            if t == "turn_context" and p.get("model"):
                model = p["model"]
                continue

            if t != "response_item":
                continue

            pt = p.get("type")

            if pt == "message":
                role = p.get("role", "")
                if role not in ("user", "assistant"):
                    continue  # skip 'developer' (system) messages
                content = []
                for block in (p.get("content") or []):
                    bt = block.get("type", "")
                    if bt in ("input_text", "output_text"):
                        content.append({"type": "text", "text": block.get("text", "")})
                    else:
                        content.append(block)
                if content:
                    messages.append({"role": role, "id": p.get("id", ""), "content": content})

            elif pt == "function_call":
                args_raw = p.get("arguments", "{}")
                try:
                    args = json.loads(args_raw) if isinstance(args_raw, str) else args_raw
                except Exception:
                    args = {"raw": str(args_raw)[:200]}
                messages.append({
                    "role": "assistant",
                    "id": p.get("call_id", ""),
                    "content": [{"type": "tool_use", "name": p.get("name", ""), "input": args}],
                })

            elif pt == "function_call_output":
                messages.append({
                    "role": "user",
                    "id": p.get("call_id", ""),
                    "content": [{"type": "tool_result", "output": str(p.get("output", ""))[:2000]}],
                })

            elif pt == "reasoning":
                # Content is encrypted — record presence but not content
                messages.append({
                    "role": "assistant",
                    "id": p.get("id", ""),
                    "content": [{"type": "thinking", "thinking": ""}],
                })

    return {
        "provider": "anthropic",
        "conversation_id": session_id or jsonl_path.stem,
        "agent_id": agent_id,
        "model": model,
        "timestamp": last_ts,
        "status": "active",
        "_source": "codex",
        "_jsonl_path": str(jsonl_path),
        "body": {
            "system": [{"type": "text", "text": system_text}] if system_text else [],
            "messages": messages,
        },
    }


# --- OpenCode SQLite loader ---------------------------------------------------

def find_opencode_session_id(agent_id: str) -> str:
    cwd = str(WORKERS_DIR / agent_id)
    if not OPENCODE_DB.exists():
        raise FileNotFoundError(f"OpenCode DB not found at {OPENCODE_DB}")
    db = sqlite3.connect(f"file:{OPENCODE_DB}?mode=ro", uri=True)
    cur = db.cursor()
    cur.execute(
        "SELECT id FROM session WHERE directory = ? ORDER BY time_updated DESC LIMIT 1",
        (cwd,)
    )
    row = cur.fetchone()
    db.close()
    if not row:
        raise FileNotFoundError(f"No OpenCode session for {agent_id} (cwd={cwd})")
    return row[0]


def load_opencode_as_snapshot(agent_id: str) -> dict:
    """Load the most-recent OpenCode session from SQLite into the common envelope."""
    import datetime as _dt
    session_id = find_opencode_session_id(agent_id)
    db = sqlite3.connect(f"file:{OPENCODE_DB}?mode=ro", uri=True)
    cur = db.cursor()

    cur.execute("SELECT model, time_updated FROM session WHERE id = ?", (session_id,))
    sess_row = cur.fetchone()
    model = ""
    last_ts = ""
    if sess_row:
        try:
            model = (json.loads(sess_row[0] or "{}")).get("id", "")
        except Exception:
            pass
        ts_ms = sess_row[1] or 0
        if ts_ms:
            last_ts = _dt.datetime.fromtimestamp(ts_ms / 1000).isoformat()

    cur.execute(
        "SELECT id, data FROM message WHERE session_id = ? ORDER BY time_created ASC",
        (session_id,)
    )
    msg_rows = cur.fetchall()

    messages = []
    for msg_id, msg_data_raw in msg_rows:
        try:
            msg_data = json.loads(msg_data_raw) if msg_data_raw else {}
        except Exception:
            continue
        role = msg_data.get("role", "")
        if role not in ("user", "assistant"):
            continue

        cur.execute(
            "SELECT data FROM part WHERE message_id = ? ORDER BY time_created ASC",
            (msg_id,)
        )
        part_rows = cur.fetchall()

        content = []
        for (part_raw,) in part_rows:
            try:
                part = json.loads(part_raw) if part_raw else {}
            except Exception:
                continue
            pt = part.get("type", "")
            if pt == "text":
                content.append({"type": "text", "text": part.get("text", "")})
            elif pt == "reasoning":
                content.append({"type": "thinking", "thinking": part.get("text", "")})
            elif pt == "tool":
                state = part.get("state") or {}
                content.append({
                    "type": "tool_use",
                    "name": part.get("tool", ""),
                    "input": state.get("input", {}),
                    "id": part.get("callID", ""),
                })
            # step-start / step-finish → skip

        if content:
            messages.append({"role": role, "id": msg_id, "content": content})

    db.close()

    return {
        "provider": "anthropic",
        "conversation_id": session_id,
        "agent_id": agent_id,
        "model": model,
        "timestamp": last_ts,
        "status": "active",
        "_source": "opencode",
        "_db_path": str(OPENCODE_DB),
        "body": {
            "system": [],
            "messages": messages,
        },
    }


DEFAULT_SUMMARY_PROMPT = """You are an AI Agent handoff specialist. Analyze the conversation log below and produce a complete handoff document so a brand-new AI Agent can pick up the work immediately.

**Important**: Distinguish between transient errors mid-session and the final state. Base your output on the last successful outcome — do not list already-fixed issues as pending tasks.

## Required Output Sections (include all)

### 0. Must-Read Files
Identify the following files in the project (if they exist):
- `CLAUDE.md` — Claude Code project config
- `AGENTS.md` — Agent collaboration spec
- Other important config files (e.g. `.claude/settings.json`)

List their full paths.

### 1. Immediate Action (most important)
**List exactly one most-urgent task**, including:
- What to do (one sentence)
- Exact file and line number (e.g. `path/to/file.go:123`)
- Command to verify the fix
- Expected result

If all tasks in the session are complete, write "No pending tasks — ready for new work."

Example format:
```
Task: Fix duplicate declaration of ensureLatestStreamingTurn causing build error
File: /path/to/CurrentHistoryView.tsx:456-478
Action: Delete the duplicate function definition at lines 456-478
Verify: npm run build — should succeed with no "Duplicate function" error
```

### 2. Project Overview (brief)
- Project name and one-line description
- Tech stack (language, framework)
- 3–5 most critical file paths

### 3. Current Task Context
- What did the user originally ask for? (one sentence)
- Scope and boundaries of the task

### 4. Completed Work (list)
Each item: file path + what changed (one sentence)

### 5. Pending Tasks (max 3, by priority)
For each task:
- Description (one sentence)
- Where it is stuck
- Relevant files and line numbers
- Verification command

If no pending tasks, write "None."

### 6. Key Constraints (must follow)
- What the user explicitly required (list)
- What the user explicitly forbade (list)

### 7. Pitfalls to Avoid
Each pitfall: tried → why it failed → what to do instead

### 8. Next Steps
After taking over:
1. **First**: read the appropriate config file for your agent type
   - **Codex/OpenAI Agent** → read `AGENTS.md`
   - **Claude Agent** → read `CLAUDE.md`
   - Read only the one relevant to you
2. Execute the "Immediate Action" task
3. Run the verification command to confirm success

---

**Important**:
- Be concise — each section ≤ 10 lines
- Must include specific file paths and line numbers
- Must include verification commands
- "Immediate Action" is the most critical section — a new agent must be able to act on it right away
- Base everything on the final state of the session, not transient mid-session errors

Conversation log:
"""


def find_snapshot(arg: str) -> Path:
    """Find current.json from agent-id or path.

    Kept for backward compatibility. New callers should use resolve_source(),
    which understands gateway-OFF claude panes (no current.json, JSONL only).
    """
    if os.path.isfile(arg):
        return Path(arg)
    path = WORKERS_DIR / arg / ".cicy" / "history" / "current.json"
    if path.exists():
        return path
    raise FileNotFoundError(f"Cannot find snapshot for: {arg}")


def find_reply_snapshot(snapshot_path: Path) -> Path:
    """Find reply.json from current.json path."""
    return snapshot_path.parent / "reply.json"


def load_snapshot(path: Path) -> dict:
    with open(path, 'r') as f:
        return json.load(f)


def load_reply_snapshot(snapshot_path: Path) -> dict:
    """Load reply.json if it exists."""
    reply_path = find_reply_snapshot(snapshot_path)
    if reply_path.exists():
        try:
            with open(reply_path, 'r') as f:
                return json.load(f)
        except:
            pass
    return {}


def resolve_source(arg: str):
    """Pick the right conversation source for `arg` (path or agent-id).

    Returns a tuple (data, source_kind, snapshot_path) where:
      - source_kind is "current" (gateway-written current.json) or "jsonl"
        (Claude Code native log).
      - snapshot_path points at the file we loaded (used for sibling lookups
        like reply.json and the --ai output dir). For JSONL it's the .jsonl
        path; for current.json it's the current.json path.
    """
    # Explicit file path — load as-is and treat as current.json schema.
    if os.path.isfile(arg):
        p = Path(arg)
        return load_snapshot(p), "current", p

    # ----------------------------------------------------------------- MARK
    # TODO(unify-on-current.json): the gateway/non-gateway split below is meant
    # to go away. Since the MITM audit work, NON-gateway codex/opencode/claude
    # turns are ALSO written to .cicy/history/current.json — the MITM adapter
    # drives the exact same audit session as the local gateway. End goal: always
    # load current.json for codex/opencode/claude (gateway or not) and drop the
    # per-agent-type fallbacks (load_codex_as_snapshot, load_opencode_as_snapshot,
    # default claude JSONL).
    #
    # Tested 2026-05-31 — the skill ALREADY parses all three current.json shapes
    # (detect_format → anthropic / openai Responses / openai_chat), so format is
    # NOT a blocker. The one real gap was upstream: MITM wrote provider="unknown"
    # for opencode (ProviderFromHost didn't know opencode.ai), so detect_format
    # fell back to anthropic and mangled the string content. Fixed in cicy-code
    # (mitm/provider.go: opencode.ai → "openai"); with provider="openai" the
    # opencode current.json parses cleanly (openai_chat). So claude/codex/opencode
    # can all unify on current.json now.
    #
    # Only remaining blocker: kiro-cli — it doesn't flow through gateway/MITM, has
    # no current.json, and keeps its own load_kiro_as_snapshot. Once kiro is
    # settled, collapse resolve_source to "current.json for codex/opencode/claude
    # + the kiro branch".
    # -----------------------------------------------------------------------

    # agent-id branch: gateway flag decides which source is authoritative.
    gw, atype = lookup_gateway(arg)
    atype_norm = (atype or "").lower()
    canonical = WORKERS_DIR / arg / ".cicy" / "history" / "current.json"

    # Gateway only applies to codex / opencode / claude (cicy-claude). Other
    # agent types (kiro-cli, hermes, etc.) don't go through the local gateway,
    # so skip the gateway-source check entirely for them.
    gateway_eligible = atype_norm in ("codex", "opencode", "claude", "cicy-claude")

    # Gateway on (or unknown agent but current.json present): use the
    # gateway snapshot — it's the only source kept fresh by the proxy.
    if gateway_eligible and (gw == 1 or (gw is None and canonical.exists())):
        if not canonical.exists():
            raise FileNotFoundError(
                f"Gateway is ON for {arg} but no snapshot yet at {canonical}"
            )
        return load_snapshot(canonical), "current", canonical

    # Gateway off (or non-gateway agent): pick loader by agent_type.
    atype = atype_norm
    if atype == "codex":
        data = load_codex_as_snapshot(arg)
        return data, "codex", Path(data["_jsonl_path"])
    if atype == "opencode":
        data = load_opencode_as_snapshot(arg)
        return data, "opencode", OPENCODE_DB
    if atype in ("kiro-cli", "kiro", "kiro_cli"):
        data = load_kiro_as_snapshot(arg)
        return data, "kiro", Path(data["_jsonl_path"])
    # Default (claude / unknown): fall back to Claude Code JSONL.
    try:
        jsonl_path = find_jsonl_for_agent(arg)
    except FileNotFoundError as e:
        raise FileNotFoundError(
            f"No source for {arg}: gateway is OFF and no JSONL found ({e})."
        )
    data = load_jsonl_as_snapshot(jsonl_path, agent_id=arg)
    return data, "jsonl", jsonl_path


def load_global_config() -> dict:
    if GLOBAL_CONFIG.exists():
        with open(GLOBAL_CONFIG, 'r') as f:
            return json.load(f)
    return {}


def get_ai_provider(config: dict, provider_name: str = None) -> dict:
    """Get AI provider config from global.json.

    Supports the current schema:
      providers.items[].{key, name, protocol, url, apiKey, defaultModel, claudeModel}
      providers.default.claude  -- key of the default claude provider
    """
    providers_root = config.get('providers', {})
    items = providers_root.get('items', [])

    # Build key→item index
    by_key = {item.get('key', ''): item for item in items if item.get('key')}

    if provider_name:
        if provider_name in by_key:
            return by_key[provider_name]
        # Also try matching by name (case-insensitive)
        for item in items:
            if item.get('name', '').lower() == provider_name.lower():
                return item
        available = list(by_key.keys())
        raise ValueError(f"Provider '{provider_name}' not found. Available: {available}")

    # Use the default claude provider key
    default_key = providers_root.get('default', {}).get('claude', '')
    if default_key and default_key in by_key:
        return by_key[default_key]

    # Fallback: first item with a working url
    for item in items:
        if item.get('url') and item.get('apiKey'):
            return item

    raise ValueError("No AI provider configured")


def detect_format(data: dict) -> str:
    """Detect API format: 'anthropic', 'openai' (Responses API), or 'openai_chat'."""
    provider = data.get('provider', '')
    if provider == 'anthropic':
        return 'anthropic'
    body = data.get('body', {})
    if 'input' in body:
        return 'openai'  # Responses API
    if 'messages' in body:
        # openai provider uses Chat Completions; unknown/other uses Anthropic messages format
        if provider == 'openai':
            return 'openai_chat'
        return 'anthropic'
    return 'unknown'


def normalize_messages(data: dict) -> list:
    """Normalize messages from different API formats to a common structure."""
    fmt = detect_format(data)
    body = data.get('body', {})

    if fmt == 'anthropic':
        return body.get('messages', [])
    elif fmt == 'openai':
        messages = []
        for item in body.get('input', []):
            item_type = item.get('type', '')
            role = item.get('role', '')
            item_id = item.get('id', '')

            if item_type == 'message' and role:
                msg = {
                    'role': role,
                    'id': item_id,
                    'content': []
                }
                content = item.get('content') or []
                for block in content:
                    if isinstance(block, dict):
                        btype = block.get('type', '')
                        if btype in ('input_text', 'output_text'):
                            msg['content'].append({
                                'type': 'text',
                                'text': block.get('text', '')
                            })
                        else:
                            msg['content'].append(block)
                    elif isinstance(block, str):
                        msg['content'].append({
                            'type': 'text',
                            'text': block
                        })
                messages.append(msg)

            elif item_type == 'function_call':
                msg = {
                    'role': 'assistant',
                    'id': item_id,
                    'content': [{
                        'type': 'tool_use',
                        'name': item.get('name', ''),
                        'input': item.get('arguments', {})
                    }]
                }
                messages.append(msg)

            elif item_type == 'function_call_output':
                msg = {
                    'role': 'user',
                    'id': item_id,
                    'content': [{
                        'type': 'tool_result',
                        'output': item.get('output', '')
                    }]
                }
                messages.append(msg)

            elif item_type == 'reasoning':
                msg = {
                    'role': 'assistant',
                    'id': item_id,
                    'content': [{
                        'type': 'thinking',
                        'thinking': item.get('encrypted_content', '') or ''
                    }]
                }
                messages.append(msg)

        return messages

    elif fmt == 'openai_chat':
        # OpenAI Chat Completions format (used by Codex/OpenCode via gateway).
        # Roles: system (skip), user (string content), assistant (string or tool_calls), tool (result).
        messages = []
        for msg in body.get('messages', []):
            role = msg.get('role', '')
            if role == 'system':
                continue
            content_raw = msg.get('content')
            tool_calls = msg.get('tool_calls')
            tool_call_id = msg.get('tool_call_id')

            content = []
            if isinstance(content_raw, str) and content_raw:
                content.append({'type': 'text', 'text': content_raw})
            elif isinstance(content_raw, list):
                for block in content_raw:
                    if isinstance(block, str):
                        content.append({'type': 'text', 'text': block})
                    elif isinstance(block, dict):
                        bt = block.get('type', '')
                        if bt in ('text', 'input_text', 'output_text'):
                            content.append({'type': 'text', 'text': block.get('text', '')})
                        else:
                            content.append(block)

            if role == 'assistant' and tool_calls:
                for tc in tool_calls:
                    fn = tc.get('function', {})
                    args_raw = fn.get('arguments', '{}')
                    try:
                        args = json.loads(args_raw) if isinstance(args_raw, str) else args_raw
                    except Exception:
                        args = {'raw': str(args_raw)[:200]}
                    content.append({
                        'type': 'tool_use',
                        'name': fn.get('name', ''),
                        'input': args,
                        'id': tc.get('id', ''),
                    })

            if role == 'tool' and tool_call_id:
                # Tool result: present as user/tool_result
                result_content = content_raw if isinstance(content_raw, str) else ''
                content = [{'type': 'tool_result', 'output': result_content[:2000]}]
                role = 'user'

            if content:
                messages.append({
                    'role': role,
                    'id': str(msg.get('id', '')),
                    'content': content,
                })
        return messages

    return []


def extract_slim_messages(messages: list) -> list:
    """Extract slim messages: only text and tool_use, skip tool_result and thinking."""
    slim = []
    for msg in messages:
        filtered_content = []
        for block in (msg.get('content') or []):
            if isinstance(block, dict):
                btype = block.get('type')
                if btype in ('tool_result', 'thinking'):
                    continue
                elif btype == 'tool_use':
                    slim_block = {
                        'type': 'tool_use',
                        'name': block.get('name'),
                    }
                    inp = block.get('input', {})
                    if isinstance(inp, str):
                        try:
                            inp = json.loads(inp)
                        except:
                            inp = {'raw': inp[:200]}
                    if isinstance(inp, dict):
                        slim_input = {}
                        for k, v in inp.items():
                            if isinstance(v, str) and len(v) > 300:
                                slim_input[k] = v[:300] + '...[truncated]'
                            else:
                                slim_input[k] = v
                        slim_block['input'] = slim_input
                    else:
                        slim_block['input'] = inp
                    filtered_content.append(slim_block)
                else:
                    filtered_content.append(block)
            else:
                filtered_content.append(block)

        if filtered_content:
            slim.append({
                'role': msg.get('role'),
                'id': msg.get('id'),
                'content': filtered_content
            })
    return slim


def count_chars(obj) -> int:
    return len(json.dumps(obj, ensure_ascii=False))


def compute_stats(data: dict) -> dict:
    """Compute token statistics."""
    fmt = detect_format(data)
    body = data.get('body', {})

    if fmt == 'anthropic':
        system = body.get('system', [])
        system_chars = count_chars(system) if system else 0
    elif fmt == 'openai_chat':
        # System messages are embedded in body.messages[0] for OpenAI Chat format
        sys_msgs = [m for m in body.get('messages', []) if m.get('role') == 'system']
        system_chars = sum(len((m.get('content') or '')) for m in sys_msgs)
    else:
        instructions = body.get('instructions', '')
        system_chars = count_chars(instructions) if instructions else 0

    tools = body.get('tools', [])
    messages = normalize_messages(data)

    full_chars = count_chars(body)
    tools_chars = count_chars(tools) if tools else 0

    result_count = 0
    result_chars = 0
    thinking_count = 0
    thinking_chars = 0
    text_count = 0
    tool_use_count = 0

    for msg in messages:
        for block in (msg.get('content') or []):
            if isinstance(block, dict):
                btype = block.get('type')
                if btype == 'tool_result':
                    result_count += 1
                    result_chars += count_chars(block)
                elif btype == 'thinking':
                    thinking_count += 1
                    thinking_chars += count_chars(block)
                elif btype == 'text':
                    text_count += 1
                elif btype == 'tool_use':
                    tool_use_count += 1

    slim_messages = extract_slim_messages(messages)
    slim_chars = count_chars(slim_messages)

    return {
        'format': fmt,
        'message_count': len(messages),
        'system_chars': system_chars,
        'tools_count': len(tools) if tools else 0,
        'full_chars': full_chars,
        'tools_chars': tools_chars,
        'result_count': result_count,
        'result_chars': result_chars,
        'thinking_count': thinking_count,
        'thinking_chars': thinking_chars,
        'text_count': text_count,
        'tool_use_count': tool_use_count,
        'slim_chars': slim_chars,
        'full_tokens': full_chars // 4,
        'slim_tokens': slim_chars // 4,
    }


def print_stats(stats: dict):
    print(f"=== Conversation Stats ({stats.get('format', 'unknown')} format) ===")
    print(f"Messages: {stats['message_count']}")
    print(f"  - text blocks: {stats['text_count']}")
    print(f"  - tool_use blocks: {stats['tool_use_count']}")
    print(f"  - tool_result blocks: {stats['result_count']}")
    print(f"  - thinking blocks: {stats['thinking_count']}")
    print()
    print(f"=== Size Breakdown ===")
    print(f"System/Instructions: {stats['system_chars']:>12,} chars")
    print(f"Tools:               {stats['tools_chars']:>12,} chars")
    print(f"tool_result:         {stats['result_chars']:>12,} chars")
    print(f"thinking:            {stats['thinking_chars']:>12,} chars")
    print(f"Total body:          {stats['full_chars']:>12,} chars")
    print()
    print(f"=== Token Estimates ===")
    print(f"Full:  {stats['full_tokens']:>10,} tokens")
    print(f"Slim:  {stats['slim_tokens']:>10,} tokens")
    saved = stats['full_tokens'] - stats['slim_tokens']
    pct = saved / stats['full_tokens'] * 100 if stats['full_tokens'] > 0 else 0
    print(f"Saved: {saved:>10,} tokens ({pct:.1f}%)")


def generate_structured_text(messages: list) -> str:
    """Generate structured text — chronological turns, deduplicated tools.

    Output format:
        ## Turn N
        USER: <message>
        AI:   <reply text>
              tool: read /path/to/file
              tool: run npm test (x3)
              ...

    Filters:
      - <system-reminder> blocks
      - "[OpenClaw heartbeat poll]" noise
      - exact-duplicate consecutive tool calls (collapsed with xN suffix)
      - empty text blocks
    """
    NOISE_PREFIXES = ('<system-reminder>', '<', '[OpenClaw heartbeat poll]')

    def _clean_text(s: str, limit: int = 600) -> str:
        s = s.strip()
        if not s:
            return ""
        if any(s.startswith(p) for p in NOISE_PREFIXES):
            return ""
        if len(s) > limit:
            s = s[:limit].rstrip() + " …"
        return s

    # Group messages into turns: each user msg starts a turn, followed by
    # assistant messages until the next user msg.
    turns = []
    current = None  # {"user": [str], "ai_text": [str], "tools": [str]}
    for msg in messages:
        role = msg.get('role', '')
        if role not in ('user', 'assistant'):
            continue

        if role == 'user':
            # Pull out user text(s)
            user_texts = []
            for block in (msg.get('content') or []):
                if not isinstance(block, dict):
                    continue
                if block.get('type') == 'text':
                    cleaned = _clean_text(block.get('text', ''))
                    if cleaned:
                        user_texts.append(cleaned)
                # tool_result is a "user role" message in anthropic format —
                # we drop it here, the assistant's tool call already shows intent
            if not user_texts:
                continue
            current = {"user": user_texts, "ai_text": [], "tools": []}
            turns.append(current)
            continue

        # role == 'assistant'
        if current is None:
            current = {"user": [], "ai_text": [], "tools": []}
            turns.append(current)
        for block in (msg.get('content') or []):
            if not isinstance(block, dict):
                continue
            btype = block.get('type')
            if btype == 'text':
                cleaned = _clean_text(block.get('text', ''))
                if cleaned:
                    current["ai_text"].append(cleaned)
            elif btype == 'tool_use':
                name = block.get('name', '')
                inp = block.get('input', {})
                if isinstance(inp, str):
                    try:
                        inp = json.loads(inp)
                    except Exception:
                        inp = {}
                action = format_tool_action(name, inp)
                if action:
                    current["tools"].append(action)

    # Dedupe consecutive identical tool calls within a turn
    def _collapse(items):
        out = []
        for item in items:
            if out and out[-1][0] == item:
                out[-1][1] += 1
            else:
                out.append([item, 1])
        return [(s if c == 1 else f"{s} (x{c})") for s, c in out]

    # Render
    lines = []
    turn_no = 0
    for t in turns:
        if not (t["user"] or t["ai_text"] or t["tools"]):
            continue
        turn_no += 1
        lines.append(f"## Turn {turn_no}")
        for u in t["user"]:
            lines.append(f"USER: {u}")
        for txt in t["ai_text"]:
            lines.append(f"AI:   {txt}")
        for tool in _collapse(t["tools"]):
            lines.append(f"      • {tool}")
        lines.append("")
    return '\n'.join(lines).rstrip() + '\n'


def format_tool_action(name: str, inp: dict) -> str:
    """Format tool action for display. Handles Claude/Codex/OpenCode tool names."""
    n = (name or "").lower()
    if n in ('bash', 'exec_command', 'shell'):
        cmd = (inp.get('command') or inp.get('cmd') or '')[:150]
        return f"run: {cmd}"
    elif n in ('read', 'glob', 'grep'):
        path = inp.get('file_path') or inp.get('path') or inp.get('pattern') or inp.get('query') or ''
        return f"read: {path}" if n == 'read' else f"search: {path}"
    elif n in ('write', 'fs_write'):
        return f"write: {inp.get('file_path') or inp.get('path') or ''}"
    elif n in ('edit', 'apply_patch', 'str_replace', 'fs_patch', 'code'):
        return f"edit: {inp.get('file_path') or inp.get('path') or ''}"
    elif n in ('websearch', 'web_search'):
        return f"search: {inp.get('query', '')}"
    elif n in ('webfetch', 'web_fetch'):
        return f"fetch: {inp.get('url', '')}"
    elif n == 'agent':
        return f"spawn agent: {inp.get('description', '')}"
    elif n == 'skill':
        return f"call skill: {inp.get('name', '')}"
    elif n == 'task':
        return f"task: {inp.get('description') or inp.get('title') or ''}"
    elif n in ('todo_list', 'todowrite', 'todoread'):
        return f"update todo list"
    elif n in ('knowledge', 'memory'):
        return f"knowledge: {inp.get('command', '') or inp.get('query', '')}"
    elif name:
        return f"tool: {name}"
    return ""


def generate_text_summary(messages: list) -> str:
    """Generate a simple text summary of the conversation."""
    lines = []

    for msg in messages:
        role = msg.get('role', '')
        msg_id = msg.get('id', '')

        texts = []
        tools = []

        for block in (msg.get('content') or []):
            if isinstance(block, dict):
                btype = block.get('type')
                if btype == 'text':
                    text = block.get('text', '').strip()
                    if text and not text.startswith('<system-reminder>') and not text.startswith('<'):
                        if len(text) > 300:
                            text = text[:300] + '...'
                        texts.append(text)
                elif btype == 'tool_use':
                    name = block.get('name', '')
                    inp = block.get('input', {})
                    if isinstance(inp, str):
                        try:
                            inp = json.loads(inp)
                        except:
                            inp = {'raw': inp[:100]}

                    action = format_tool_action(name, inp)
                    if action:
                        tools.append(action)

        if texts or tools:
            prefix = f"[{msg_id}] {role.upper()}"
            if texts:
                lines.append(f"{prefix}: {texts[0]}")
                for t in texts[1:]:
                    lines.append(f"    {t}")
            if tools:
                if not texts:
                    lines.append(f"{prefix}:")
                for t in tools:
                    lines.append(f"    -> {t}")

    return '\n'.join(lines)


def call_ai_api(provider_config: dict, model: str, prompt: str, content: str) -> str:
    """Call AI API to generate summary.

    Reads provider_config.protocol ('anthropic' | 'openai') and provider_config.url
    to determine which wire format and endpoint to use.
    """
    api_key = provider_config.get('apiKey', '')
    base_url = (provider_config.get('url') or '').rstrip('/')
    protocol = (provider_config.get('protocol') or 'openai').lower()

    if not base_url:
        raise ValueError("Provider has no url configured")

    if protocol == 'anthropic':
        # Anthropic Messages API
        # DeepSeek's anthropic compat lives at /anthropic/v1/messages;
        # standard Anthropic and other proxies at /v1/messages.
        if base_url.endswith('/anthropic'):
            api_url = base_url + '/v1/messages'
        elif '/v1' in base_url:
            api_url = base_url + '/messages'
        else:
            api_url = base_url + '/v1/messages'

        if not model:
            model = provider_config.get('claudeModel') or provider_config.get('defaultModel') or 'claude-sonnet-4-6'

        payload = {
            "model": model,
            "max_tokens": 8000,
            "messages": [{"role": "user", "content": prompt + "\n\n" + content}],
        }
        headers = {
            "Content-Type": "application/json",
            "x-api-key": api_key,
            "anthropic-version": "2023-06-01",
        }
        req = urllib.request.Request(
            api_url,
            data=json.dumps(payload).encode('utf-8'),
            headers=headers,
            method='POST',
        )
        try:
            with urllib.request.urlopen(req, timeout=300) as resp:
                result = json.loads(resp.read().decode('utf-8'))
                blocks = result.get('content', [])
                # Model may prepend a thinking block; find the first text block.
                for block in blocks:
                    if isinstance(block, dict) and block.get('type') == 'text':
                        return block.get('text', '')
                return ''
        except urllib.error.HTTPError as e:
            body = e.read().decode('utf-8') if e.fp else ''
            raise RuntimeError(f"API error {e.code}: {body}")

    else:
        # OpenAI chat-completions format
        if '/chat/completions' in base_url:
            api_url = base_url
        elif base_url.endswith('/v1'):
            api_url = base_url + '/chat/completions'
        else:
            api_url = base_url + '/chat/completions'

        if not model:
            model = provider_config.get('defaultModel') or provider_config.get('claudeModel') or 'deepseek-chat'

        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt + "\n\n" + content}],
            "temperature": 0.3,
            "max_tokens": 4000,
        }
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        }
        req = urllib.request.Request(
            api_url,
            data=json.dumps(payload).encode('utf-8'),
            headers=headers,
            method='POST',
        )
        try:
            with urllib.request.urlopen(req, timeout=300) as resp:
                result = json.loads(resp.read().decode('utf-8'))
                return result.get('choices', [{}])[0].get('message', {}).get('content', '')
        except urllib.error.HTTPError as e:
            body = e.read().decode('utf-8') if e.fp else ''
            raise RuntimeError(f"API error {e.code}: {body}")


def parse_args(argv: list) -> dict:
    """Parse command line arguments."""
    args = {
        'target': None,
        'mode': 'summary',
        'provider': None,
        'model': None,
        'prompt': None,
    }

    for arg in argv[1:]:
        if arg.startswith('--provider='):
            args['provider'] = arg.split('=', 1)[1]
        elif arg.startswith('--model='):
            args['model'] = arg.split('=', 1)[1]
        elif arg.startswith('--prompt='):
            args['prompt'] = arg.split('=', 1)[1]
        elif arg == '--stats':
            args['mode'] = 'stats'
        elif arg == '--slim':
            args['mode'] = 'slim'
        elif arg == '--text':
            args['mode'] = 'text'
        elif arg == '--ai':
            args['mode'] = 'ai'
        elif arg == '--summary':
            args['mode'] = 'summary'
        elif not arg.startswith('-'):
            args['target'] = arg

    return args


def get_summary_output_path(snapshot_path: Path, data: dict) -> Path:
    """Get output path for AI summary.

    - current.json source: <history_dir>/summary/<conversation_id>.md
    - JSONL source:        <workspace>/.cicy/summary/<conversation_id>.md
      (kept out of Claude Code's own ~/.claude/projects/ tree.)
    """
    conversation_id = data.get('conversation_id', '') or 'unknown'

    if data.get('_source') in ('jsonl', 'codex', 'opencode', 'kiro'):
        agent_id = data.get('agent_id', '') or Path(snapshot_path).parent.name
        summary_dir = WORKERS_DIR / agent_id / ".cicy" / "history" / "summary"
    else:
        summary_dir = snapshot_path.parent / 'summary'

    summary_dir.mkdir(parents=True, exist_ok=True)
    return summary_dir / f"{conversation_id}.md"


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    args = parse_args(sys.argv)

    if not args['target']:
        print("Error: No target specified", file=sys.stderr)
        print(__doc__)
        sys.exit(1)

    try:
        data, source_kind, path = resolve_source(args['target'])
    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    # reply.json is only meaningful when the gateway wrote the snapshot.
    if source_kind == "current":
        reply_data = load_reply_snapshot(path)
    else:
        reply_data = {}
        print(f"[source={source_kind}] {path}", file=sys.stderr)

    messages = normalize_messages(data)

    if args['mode'] == 'stats':
        stats = compute_stats(data)
        print_stats(stats)
        # Also print reply stats if available
        if reply_data:
            print()
            print("=== Reply Snapshot ===")
            print(f"Turn ID: {reply_data.get('turn_id', 'N/A')}")
            print(f"Status: {reply_data.get('status', 'N/A')}")
            print(f"Items: {len(reply_data.get('items', []))}")
            print(f"Input tokens: {reply_data.get('input_tokens', 0):,}")
            print(f"Output tokens: {reply_data.get('output_tokens', 0):,}")
            print(f"Cache creation: {reply_data.get('cache_creation_input_tokens', 0):,}")
            print(f"Cache read: {reply_data.get('cache_read_input_tokens', 0):,}")

    elif args['mode'] == 'slim':
        slim = extract_slim_messages(messages)
        print(json.dumps(slim, ensure_ascii=False, indent=2))

    elif args['mode'] == 'text':
        text = generate_structured_text(messages)
        print(text)

    elif args['mode'] == 'ai':
        # Load provider config
        config = load_global_config()
        try:
            provider_config = get_ai_provider(config, args['provider'])
        except ValueError as e:
            print(f"Error: {e}", file=sys.stderr)
            sys.exit(1)

        # Generate structured text from messages
        text = generate_structured_text(messages)

        # Append reply.json content if available
        if reply_data and reply_data.get('items'):
            text += "\n\n" + "=" * 60 + "\n"
            text += "current reply (reply.json)\n"
            text += "=" * 60 + "\n"
            text += f"Turn ID: {reply_data.get('turn_id', 'N/A')}\n"
            text += f"Status: {reply_data.get('status', 'N/A')}\n"
            text += f"Items: {len(reply_data.get('items', []))}\n\n"
            for item in reply_data.get('items', []):
                item_type = item.get('type', '')
                item_id = item.get('id', '')
                if item_type == 'text':
                    text_content = item.get('text', '')[:500]
                    if len(item.get('text', '')) > 500:
                        text_content += '...'
                    text += f"[{item_id}] text: {text_content}\n\n"
                elif item_type == 'thinking':
                    thinking_content = item.get('thinking', '')[:300]
                    if len(item.get('thinking', '')) > 300:
                        thinking_content += '...'
                    text += f"[{item_id}] thinking: {thinking_content}\n\n"
                elif item_type == 'tool_use':
                    tool_name = item.get('name', '')
                    tool_input = item.get('input', {})
                    action = format_tool_action(tool_name, tool_input if isinstance(tool_input, dict) else {})
                    text += f"[{item_id}] {action or f'tool_use: {tool_name}'}\n"

        # Get prompt
        prompt = args['prompt'] or DEFAULT_SUMMARY_PROMPT

        # Cap content to ~80 KB so we stay well within upstream context limits.
        # For long sessions, keep the TAIL (most recent activity) which matters
        # most for a handoff doc. Prepend a truncation notice so the AI knows.
        MAX_CONTENT_BYTES = 80_000
        if len(text.encode('utf-8')) > MAX_CONTENT_BYTES:
            tail = text.encode('utf-8')[-MAX_CONTENT_BYTES:].decode('utf-8', errors='ignore')
            # Re-align to a line boundary
            tail = tail[tail.find('\n') + 1:] if '\n' in tail else tail
            text = "[conversation too long, showing recent portion]\n\n" + tail
            print(f"content truncated to ~{MAX_CONTENT_BYTES//1000}KB (keeping tail)", file=sys.stderr)

        # Call AI API
        print(f"Calling AI ({args['provider'] or 'default'})...", file=sys.stderr)
        try:
            summary = call_ai_api(provider_config, args['model'], prompt, text)
        except Exception as e:
            print(f"Error calling AI: {e}", file=sys.stderr)
            sys.exit(1)

        # Save to summary directory
        output_path = get_summary_output_path(path, data)

        # Build file content with metadata
        conversation_id = data.get('conversation_id', 'unknown')
        agent_id = data.get('agent_id', 'unknown')
        model = data.get('model', 'unknown')
        timestamp = data.get('timestamp', '')
        status = data.get('status', '')
        generated = __import__('datetime').datetime.now().isoformat()

        # Compute stats
        stats = compute_stats(data)

        # Generate structured text (raw)
        raw_text = generate_structured_text(messages)

        # Get summary directory
        summary_dir = output_path.parent

        # Get the prompt used for summary generation
        summary_prompt = args['prompt'] or DEFAULT_SUMMARY_PROMPT

        # Extract original system prompt from snapshot
        body = data.get('body', {})
        original_system_prompt = ""
        if 'system' in body:
            # Anthropic format
            system_blocks = body.get('system', [])
            if isinstance(system_blocks, list):
                original_system_prompt = '\n\n'.join(
                    block.get('text', '') for block in system_blocks
                    if isinstance(block, dict) and block.get('text')
                )
            elif isinstance(system_blocks, str):
                original_system_prompt = system_blocks
        elif 'instructions' in body:
            # OpenAI format
            original_system_prompt = body.get('instructions', '')

        # 1. Save stats file
        stats_file = summary_dir / f"{conversation_id}.stats.md"
        stats_content = f"""# Conversation Stats

## Metadata

- **Conversation ID**: {conversation_id}
- **Agent ID**: {agent_id}
- **Model**: {model}
- **Status**: {status}
- **Timestamp**: {timestamp}
- **Generated**: {generated}

## Stats

| Metric | Value |
|--------|-------|
| Format | {stats['format']} |
| Messages | {stats['message_count']} |
| Text blocks | {stats['text_count']} |
| Tool use blocks | {stats['tool_use_count']} |
| Tool result blocks | {stats['result_count']} |
| Thinking blocks | {stats['thinking_count']} |
| Full tokens (est.) | {stats['full_tokens']:,} |
| Slim tokens (est.) | {stats['slim_tokens']:,} |
| Savings | {(stats['full_tokens'] - stats['slim_tokens']) * 100 // stats['full_tokens']}% |

## Summary Prompt

Prompt used to generate AI Summary:

<details>
<summary>Click to expand</summary>

```
{summary_prompt.strip()}
```

</details>
"""
        with open(stats_file, 'w') as f:
            f.write(stats_content)

        # 2. Save raw file
        raw_file = summary_dir / f"{conversation_id}.raw.md"
        raw_content = f"""# Raw Conversation

- **Conversation ID**: {conversation_id}
- **Generated**: {generated}

---

{raw_text}
"""
        with open(raw_file, 'w') as f:
            f.write(raw_content)

        # 3. Save summary file
        summary_file = summary_dir / f"{conversation_id}.summary.md"

        # Get the model used for summary generation
        summary_model = args['model']
        summary_provider = args['provider'] or 'default'
        if not summary_model:
            provider_config_for_model = get_ai_provider(config, args['provider'])
            summary_model = (provider_config_for_model.get('claudeModel')
                             or provider_config_for_model.get('defaultModel')
                             or 'deepseek-chat')

        summary_content = f"""# AI Summary

- **Conversation ID**: {conversation_id}
- **Agent ID**: {agent_id}
- **Original Model**: {model}
- **Summary Provider**: {summary_provider}
- **Summary Model**: {summary_model}
- **Generated**: {generated}

---

{summary}
"""
        with open(summary_file, 'w') as f:
            f.write(summary_content)

        for link_name, target_file in (
            ('current.stats.md', stats_file),
            ('current.raw.md', raw_file),
            ('current.summary.md', summary_file),
        ):
            link_path = summary_dir / link_name
            try:
                if link_path.exists() or link_path.is_symlink():
                    link_path.unlink()
                link_path.symlink_to(target_file.name)
            except OSError:
                pass

        print(f"Saved to {summary_dir}/", file=sys.stderr)
        print(f"  - {conversation_id}.stats.md", file=sys.stderr)
        print(f"  - {conversation_id}.raw.md", file=sys.stderr)
        print(f"  - {conversation_id}.summary.md", file=sys.stderr)
        print(summary)

    else:  # summary
        summary = generate_text_summary(messages)
        print(summary)


if __name__ == '__main__':
    main()
