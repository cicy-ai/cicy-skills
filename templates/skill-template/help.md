# skill-template — help

## Commands

### `skill-template --help`

Print this help text.

### `skill-template do-something [options]`

(describe)

**Options:**

- `--json` — output JSON instead of human-readable

**Example:**

```bash
skill-template do-something --json
```

## Environment variables

- `CICY_DB_OVERRIDE` — override `~/cicy-ai/db/` directory (rare)

## Exit codes

| code | meaning            |
|------|--------------------|
| 0    | success            |
| 1    | generic failure    |
| 2    | invalid arguments  |
| 3    | missing config     |
| 4    | network/api error  |
| 5    | permission denied  |
