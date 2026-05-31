#!/usr/bin/env python3
"""agent-summary - Dump the raw basic conversation of an agent session.

Reads the request/reply snapshots and writes the basic conversation — text +
thinking, in order, with the system prompt, <system-reminder> boilerplate,
tool_use and tool_result dropped — to <history>/summary/<conversation_id>.md,
repoints a `current.md` symlink at it, and prints that path. Hand the file to a
fork ("分身") or replay it to restore the conversation.

Usage:
    agent-summary <agent-id>                    # write the file, print its path
    agent-summary <path-to-current.json>        # explicit snapshot file

Supports Anthropic, OpenAI Responses, and OpenAI Chat Completions snapshots.
"""

import json
import sys
import os
from pathlib import Path

WORKERS_DIR = Path.home() / "cicy-ai" / "workers"


def find_snapshot(arg: str) -> Path:
    """Resolve an agent-id or explicit path to its current.json snapshot.

    The only source is the gateway/MITM audit snapshot at the hardcoded path
    ~/cicy-ai/workers/<agent-id>/.cicy/history/current.json. Native agent logs
    (claude jsonl / codex / opencode db / kiro) are deliberately not read.
    """
    if os.path.isfile(arg):
        return Path(arg)
    path = WORKERS_DIR / arg / ".cicy" / "history" / "current.json"
    if path.exists():
        return path
    raise FileNotFoundError(
        f"No current.json for {arg!r} at {path}. "
        f"(Only the gateway/MITM snapshot is read — no native agent logs.)"
    )


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


def detect_format(data: dict) -> str:
    """Detect API format: 'anthropic', 'openai' (Responses API), or 'openai_chat'."""
    provider = data.get('provider', '')
    if provider == 'anthropic':
        return 'anthropic'
    body = data.get('body', {})
    if 'input' in body:
        return 'openai'  # Responses API
    if 'messages' in body:
        if provider == 'openai':
            return 'openai_chat'
        if provider == 'anthropic':
            return 'anthropic'
        # Provider label missing/unknown (e.g. MITM-audited turns to a host we
        # don't classify) — infer from the message shape instead of blindly
        # assuming Anthropic. Anthropic content is a list of blocks and the system
        # prompt sits at the top level; OpenAI chat-completions content is a plain
        # string. Sniffing keeps a mislabeled provider from mangling the parse.
        if 'system' in body:
            return 'anthropic'
        for msg in body['messages']:
            content = msg.get('content')
            if isinstance(content, list):
                return 'anthropic'
            if isinstance(content, str):
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


def generate_structured_text(messages: list) -> str:
    """Generate the raw basic conversation — chronological turns, text + thinking.

    Output format:
        ## Turn N
        USER: <message>
        AI (thinking): <reasoning>
        AI: <reply text>

    text + thinking only, untruncated. tool_use / tool_result, the system
    prompt, <system-reminder> boilerplate and OpenClaw noise are dropped.
    """
    NOISE_PREFIXES = ('<system-reminder>', '<', '[OpenClaw heartbeat poll]')

    def _clean_text(s: str) -> str:
        s = s.strip()
        if not s:
            return ""
        if any(s.startswith(p) for p in NOISE_PREFIXES):
            return ""
        return s

    # Group messages into turns: each user msg starts a turn, followed by
    # assistant messages until the next user msg.
    turns = []
    current = None  # {"user": [str], "ai": [(kind, text)]}
    for msg in messages:
        role = msg.get('role', '')
        if role not in ('user', 'assistant'):
            continue

        if role == 'user':
            # Pull out user text(s); tool_result (a "user" message in the
            # anthropic format) carries no 'text' block, so it falls away here.
            user_texts = []
            for block in (msg.get('content') or []):
                if not isinstance(block, dict):
                    continue
                if block.get('type') == 'text':
                    cleaned = _clean_text(block.get('text', ''))
                    if cleaned:
                        user_texts.append(cleaned)
            if not user_texts:
                continue
            current = {"user": user_texts, "ai": []}
            turns.append(current)
            continue

        # role == 'assistant'
        if current is None:
            current = {"user": [], "ai": []}
            turns.append(current)
        for block in (msg.get('content') or []):
            if not isinstance(block, dict):
                continue
            btype = block.get('type')
            if btype == 'text':
                cleaned = _clean_text(block.get('text', ''))
                if cleaned:
                    current["ai"].append(('text', cleaned))
            elif btype == 'thinking':
                t = block.get('thinking', '').strip()
                if t:
                    current["ai"].append(('thinking', t))
            # tool_use intentionally dropped — not basic conversation.

    # Render
    lines = []
    turn_no = 0
    for t in turns:
        if not (t["user"] or t["ai"]):
            continue
        turn_no += 1
        lines.append(f"## Turn {turn_no}")
        for u in t["user"]:
            lines.append(f"USER: {u}")
        for kind, txt in t["ai"]:
            lines.append(f"AI: {txt}" if kind == 'text' else f"AI (thinking): {txt}")
        lines.append("")
    return '\n'.join(lines).rstrip() + '\n'


def parse_args(argv: list) -> dict:
    """Parse command line arguments."""
    args = {'target': None}
    for arg in argv[1:]:
        if not arg.startswith('-'):
            args['target'] = arg
    return args


def get_summary_output_path(snapshot_path: Path, data: dict) -> Path:
    """Hardcoded output path: <history>/summary/<conversation_id>.md, a sibling
    `summary/` of the current.json snapshot."""
    conversation_id = data.get('conversation_id', '') or 'unknown'
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
        path = find_snapshot(args['target'])
    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    data = load_snapshot(path)
    messages = normalize_messages(data)

    # Fold the latest assistant turn (reply.json) in as a final assistant
    # message so it renders through the same path (text + thinking only).
    reply_data = load_reply_snapshot(path)
    reply_blocks = [
        item for item in (reply_data.get('items') or [])
        if isinstance(item, dict) and item.get('type') in ('text', 'thinking')
    ]
    if reply_blocks:
        messages = messages + [{'role': 'assistant', 'content': reply_blocks}]

    text = generate_structured_text(messages)

    # Write <conversation_id>.md, then repoint `current.md` at it — matching the
    # original ln convention (current.<x>.md -> <conversation_id>.<x>.md).
    output_path = get_summary_output_path(path, data)
    output_path.write_text(text)
    link = output_path.parent / "current.md"
    try:
        if link.exists() or link.is_symlink():
            link.unlink()
        link.symlink_to(output_path.name)  # relative target
    except OSError:
        pass

    # Output is the <conversation_id>.md path.
    print(output_path)


if __name__ == '__main__':
    main()
