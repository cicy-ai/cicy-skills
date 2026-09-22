# tg-set-avatar — command reference

## Commands

| Command | What it does |
|---|---|
| `tg-set-avatar targets [--client <id>] [--json]` | List Telegram Web K webContents (`wc:<id>` + window title) that can be operated on. |
| `tg-set-avatar show [--target wc:<id>] [--client <id>] [--json]` | Print which account the page is logged in as (name, phone, id, @username) and its current photo id. |
| `tg-set-avatar styles [--json]` | List the built-in avatar styles. |
| `tg-set-avatar preview [--style <s> \| --image <path\|url>] [--seed <s>] --out <file.jpg> [--target wc:<id>] [--client <id>] [--json]` | Render exactly what `set` would upload (640×640 JPEG, drawn in the page) and save it locally. Changes nothing. |
| `tg-set-avatar set [--style <s> \| --image <path\|url>] [--seed <s>] [--if-none] [--target wc:<id>] [--client <id>] [--yes] [--json]` | Upload it as the new profile photo. Without `--yes` it only prints what it would do. |

## Styles

| Style | Look | Network |
|---|---|---|
| `girl` (default) | smiling cartoon girl, long hair, pastel background (DiceBear `avataaars`) | api.dicebear.com |
| `girl-cartoon` | doodle-style girl head, long hair, blush (DiceBear `adventurer`) | api.dicebear.com |
| `emoji` | pastel gradient + a cute emoji (`🐰 🌸 🎀 🍓 🧸 …`) and sparkles | offline |

The pick is seeded by the account id, so each account gets its own avatar and re-running gives the same picture.

## Options

| Option | Meaning |
|---|---|
| `--target wc:<id>` | Telegram Web K webContents id (a bare number is accepted). Auto-picked only when exactly one Telegram Web K target exists. |
| `--client <id>` | cicy-desktop client id, passed through to `agent-electron --client`. |
| `--style <s>` | `girl` (default), `girl-cartoon` or `emoji`. |
| `--image <path\|url>` | Your own image: png / jpg / webp / gif / svg file, or an http(s) URL (max 10 MB). Center-cropped to a square, scaled to 640×640. |
| `--seed <s>` | Seed for the style. Default: the account id. |
| `--if-none` | `set`: skip the account when it already has a profile photo. |
| `--out <file>` | `preview`: where to write the JPEG. |
| `--yes` | Actually change the photo (`set`). |
| `--dry-run` | Explicitly keep it a dry run (default). |
| `--json` | Machine-readable output. |

## Output

`show --json`: `{ ok, target, self:{id,phone,username,first,last,photoId} }` (`photoId` is `""` when there is no photo)
`preview --json`: `{ ok, target, self, out, bytes, style|image, seed }`
`set --json`: `{ ok, target, self, photoId, previousPhotoId, bytes, style|image, seed }` · dry run: `{ ok, dryRun:true, … }` · `--if-none` skip: `{ ok, skipped:"has-photo" }` · refused: `{ ok:false, err, hint }`

## Exit codes

| Code | Meaning |
|---|---|
| 0 | success (dry run and skips are 0 too) |
| 1 | usage error or unusable image (unreadable, not an image, too large, page could not decode it) |
| 2 | agent-electron / page / network error (no target, page not logged in, CDP failed, download failed) |
| 3 | refused by Telegram (`FLOOD_WAIT_n`, `PHOTO_CROP_SIZE_SMALL`, `IMAGE_PROCESS_FAILED`, …) or the photo did not change |

## Environment

- `AGENT_ELECTRON_BIN` — path of the agent-electron executable (default: `agent-electron` on PATH).
