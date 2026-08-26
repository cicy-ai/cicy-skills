# codex-auth — help

## Commands

```
codex-auth export [--out <file>] [-o <file>]
codex-auth export --stdout
codex-auth import (--file <file> | -f <file> | --base64 <value> | -b <value> | -)
codex-auth status [--json]
codex-auth path
codex-auth help
```

## export

Reads `~/.codex/auth.json`, verifies it parses as a JSON object, base64-encodes it and writes
the result to a file created with mode 0600.

- `--out <file>` — destination. Default: `~/cicy-ai/assets/codex-auth-<timestamp>.b64`
- `--stdout` — print to stdout instead of writing a file. Use only when you
  intend the secret to appear in terminal output.

Exit 2 if the credential file is missing.

## import

Decodes base64 input and writes the bytes to `~/.codex/auth.json`.

- `--file <file>` — read base64 from a file
- `--base64 <value>` — inline value
- `-` — read base64 from stdin

Whitespace in the input is ignored. Before writing: the input must be valid
base64 (round-trip checked) and the decoded bytes must parse as a JSON object.
An existing credential is copied to `~/.codex/auth.json.bak-<timestamp>` and the original file
mode is preserved.

Already-running Codex processes keep the credential they started with.

## status

Prints path, byte count, octal mode, mtime and whether the file parses as JSON.
Never prints the contents. `--json` for machine-readable output. Exit 2 when the
file does not exist.

## path

Prints the resolved credential path and exits.

## Environment

`CODEX_AUTH_PATH` — absolute path overriding `~/.codex/auth.json`. Useful for tests and non-standard
layouts.
