# Cicy Koubo UI Operations

Use this reference for every operation inside the 口播 workspace. The page is
`http://127.0.0.1:8770` and must be opened in `agent-electron` profile 1.

## Operating contract

1. Run `cicy-koubo status --json`; if unhealthy, run `cicy-koubo start`.
2. Run `cicy-koubo open`. Reuse and activate the existing profile-1 tab.
3. Inspect the current page with `agent-electron tabs 1 --json`. Interact with
   the returned `webContentsId` through `tab-eval`, screenshots, or normal UI
   input. Do not open Chrome or another Electron profile.
4. Prefer visible UI controls. Direct `/api/*` calls are for health checks and
   diagnostics, not a substitute for completing the user-visible workflow.
5. Wait for the relevant result control or preview to become enabled/visible.
   A click, queued job, toast, or HTTP 202 response is not a finished artifact.
6. Report the final media URL/path or the exact failed stage. Never expose API
   keys, cookies, OAuth tokens, or full logs containing secrets.

## Environment and compute decision

Run `cicy-koubo doctor --json` before installing an engine or choosing a
compute path. Read, do not guess:

- `environment.os`: `macos`, `linux`, `windows`, or `wsl`.
- `environment.arch`: typically `arm64` or `x64`.
- `environment.is_apple_silicon`: identifies Apple Silicon Macs.
- `environment.nvidia`: local NVIDIA model, total/free VRAM, and utilization.
- `environment.apple_gpu`: the Mac integrated GPU name when detected.
- `execution.configured_mode`: the application's configured compute mode.
- `execution.using_local_nvidia_gpu`: local NVIDIA execution is active.
- `execution.using_colab`: the configured/runtime path is Colab.
- `system.gpu_mode`, `system.gpu_name`, `system.cuda_version`, and
  `system.is_colab`: live application/runtime evidence.

Apply this decision matrix:

| Environment | Local compute | Colab decision |
|---|---|---|
| macOS Apple Silicon | CPU/Apple acceleration only where the selected engine explicitly supports it; do not call it CUDA | Use Colab for CUDA-only CosyVoice/MuseTalk paths unless a supported remote endpoint is configured |
| macOS Intel | Treat as CPU unless live engine status proves supported acceleration | Prefer Colab for GPU-heavy generation |
| Linux + NVIDIA/CUDA | Use local GPU only when `nvidia-smi`, CUDA, engine status, and configured mode all agree | Use Colab only when configured or requested |
| Linux without NVIDIA | Local CPU is valid only for supported/light operations | Use Colab for CUDA-required engines |
| WSL + NVIDIA passthrough | Use local GPU only when `nvidia-smi` works inside WSL and the engine is installed inside WSL | Otherwise use Colab; Windows-host GPU detection alone is insufficient |
| Windows native | Do not assume Unix provision scripts work | Prefer WSL or Colab according to the installed runtime |
| Running inside Colab | The Colab VM GPU is remote compute | Confirm `system.is_colab` and the assigned GPU before reporting GPU use |

“GPU available”, “Colab CLI installed”, “profile selected”, and “session
running” are different states. Report that Colab/GPU is being used only when
the live configured mode and runtime/engine status prove it. If the UI exposes
account tier, GPU consumption, allocation, or elapsed time, report the returned
values; otherwise say they are unavailable rather than inferring them.

## Workspace map

The top workflow contains four cards:

1. **文案** — Douyin extraction, manual script input, AI rewrite, title/topic/
   cover-copy generation.
2. **配音** — reference voice, speech rate, generation mode, cloned speech, or
   uploaded replacement audio.
3. **出片** — base avatar video, generation mode, lip-sync engine, final video.
4. **剪辑 · 封面** — SRT, style, font, BGM, edited video, and cover.

Below it is **素材库**, with tabs for 音色, 底板, BGM, 文案, and 成品.
The top-right **系统管理** opens tabs for 运行与 Colab and 生成引擎.
**日志** opens the combined process log.

## 1. 文案

### Extract from Douyin

- Input: `#dyUrl`. It accepts a Douyin URL or full share text containing one.
- Action: `#btn-extract` (`1. 提取视频文案`).
- Profile rule: first open the Douyin page with
  `cicy-koubo douyin <url>` so profile 1 supplies the authenticated session.
- Media discovery and download must follow **Douyin media discovery** below.
- Success: `#script1` contains non-empty extracted text.
- Failure handling: keep the Douyin page logged in, verify the URL, inspect the
  visible error/stage text and `cicy-koubo logs --lines 120`. Do not call it
  extracted merely because the page opened.

### Douyin media discovery

Never guess a media URL from a Douyin video ID and never select the first
network request blindly. Open the resolved video page in `agent-electron`
profile 1, then inspect its `<video>` elements:

```js
[...document.querySelectorAll("video")].map((video) => {
  const rect = video.getBoundingClientRect();
  return {
    url: video.currentSrc,
    duration: video.duration,
    readyState: video.readyState,
    visible: rect.width > 0 && rect.height > 0 &&
      rect.bottom > 0 && rect.top < innerHeight &&
      getComputedStyle(video).display !== "none" &&
      getComputedStyle(video).visibility !== "hidden"
  };
})
```

Select media only when all applicable checks pass:

1. `currentSrc` is an `http:` or `https:` URL, not an empty or `blob:` URL.
2. The player is visible and has non-zero dimensions.
3. `readyState` indicates that media metadata/data is available.
4. The page URL resolves to `/video/<video-id>`.
5. When the media query contains `__vid`, it equals the page video ID.

Observed CDN URLs commonly use a host resembling `v*-dy-*.zjcdn.com`, a
`/video/tos/...` path, `mime_type=video_mp4`, and `__vid=<video-id>`. These
features are filters only. The URL contains an expiring signature and must not
be synthesized, cached as a permanent URL, or reused after expiry.

Download through the same profile-1 Electron session, using the desktop
`session_download_url` capability for the tab's owning window/session. A
terminal `curl`, generic HTTP client, or another browser may omit session,
Referer, proxy, or anti-bot context and stall or fail. Treat the download as
complete only after Electron reports completion and the file passes media
probing; a growing file or readable duration alone does not prove the tail is
complete.

After the media download reports `completed` and the downloaded file passes
probing, close that exact Douyin tab with
`agent-electron tab-close <webContentsId>`. Keep the cicy-koubo workspace tab
open and active. Do not close the Douyin tab before completion, because its
profile session owns the authenticated download.

Before downloading, inspect `video.duration`:

- Up to 10 minutes: normal short-video path. Prefer the configured fast STT
  provider when available.
- Over 10 minutes: do not send to Groq. Do not automatically retain a full
  MP4. Ask for confirmation when appropriate, extract/compress audio, then use
  Colab Whisper when its GPU session is running or the local `whisper.cpp`
  fallback.
- A Colab profile existing or a T4 being requested is not availability.
  Confirm the session is running; on allocation failure use local Whisper or
  report the concrete blocker.

For long content, retain the compact audio/transcript as the working artifact.
Do not delete a previously downloaded full MP4 without user intent.

### Use manual text

- Input or replace `#script1` directly.
- This is valid when there is no Douyin URL or extraction is unavailable.
- Preserve the user's original wording unless they requested editing.

### Rewrite

- Optional style/industry input: `#style`.
- Prompt settings button beside the style field opens the rewrite system
  prompt. Save persists it; 恢复默认 resets it.
- Action: `#btn-rewrite` (`2. AI 仿写改写`).
- Success: `#script2` contains the rewritten script.
- The downstream voice step prefers `#script2`; if empty it uses `#script1`.
- Uses the configured OpenAI-compatible provider from `~/cicy-ai/global.json`.
  The cicy-koubo UI does not configure or store LLM providers.

### Generate title/topic/cover copy

- Action: `#btn-title`.
- Success: the title result area below the button contains generated title,
  topic tags, and cover copy.
- Requires a working OpenAI-compatible provider in `~/cicy-ai/global.json`.

## 2. 配音

### Select or upload a reference voice

- Selector: `#refSel`; preview with the adjacent play button.
- Upload: the `+ 上传` control triggers `#upVoice`.
- Uploaded voices appear in 素材库 → 音色 and can be previewed, selected,
  renamed, downloaded, or deleted.

### Configure and generate speech

- Speech rate control: `#spd`; visible value: `#spdV`.
- Generation method selector: `#ttsMode`. Use segmented generation for long
  scripts unless the user explicitly chooses another mode.
- Action: `#btn-tts` (`3. 生成配音`).
- Input text: rewritten script first, otherwise original script.
- Success:
  - `#ttsPlayer` is visible and playable;
  - `#btn-tts-dl` is enabled;
  - `#ttsInfo` contains result information.
- Download: `#btn-tts-dl`.
- Replacement path: upload an existing audio file through the control below
  the result. That audio becomes the source for later video/subtitle steps.
- Requires an installed and healthy CosyVoice engine or configured remote
  endpoint.

## 3. 出片

### Select or upload the base video

- Base selector is in the 出片 card; preview uses its adjacent play control.
- `+ 上传` triggers `#vidFile`.
- 素材库 → 底板 supports preview, select, rename, download, and delete.

### Configure and generate

- Choose generation mode in the generation-mode selector.
- Choose the lip-sync engine in the engine selector under `#lblEngine`.
- Action: `#btn-gen` (`4. 生成视频`).
- Required inputs: a base video and generated/uploaded audio.
- The operation is asynchronous. Polling/job progress in the page must reach a
  successful terminal state.
- Success:
  - `#resultPrev` is visible and playable;
  - `#btn-gen-dl` is enabled;
  - `#genInfo` shows the completed result.
- Download: `#btn-gen-dl`.
- A queued job ID is not completion. On failure inspect the job stage, engine
  status, and logs.

## 4. 剪辑、字幕、BGM、封面

### Subtitles

- Subtitle editor: `#subText`.
- `#btn-srt` generates SRT from the current speech audio.
- Editable SRT produces timed subtitles. Plain text produces a whole-screen
  subtitle. Empty input disables subtitles.
- Configure subtitle appearance with the visible font, size, color, position,
  outline, or related controls in the same card.
- Success of generation: `#subText` contains subtitle text.

### BGM and edited video

- BGM selector: `#bgmSel`; preview via the adjacent play button.
- BGM volume is controlled by the visible volume control.
- Action: `#btn-edit` (`5. 剪辑`).
- Required input: a completed generated video. Subtitles and BGM are optional.
- Success:
  - the edited preview is visible/playable;
  - `#btn-edit-dl` is enabled.
- Download: `#btn-edit-dl`.
- Requires ffmpeg. If absent use 系统管理 → 运行与 Colab → 安装 ffmpeg.

### Cover

- Enter the visible cover title and optional subtitle/copy fields.
- Action: `#btn-cover` (`生成封面`), which captures a frame from the selected
  base video and renders the copy.
- Success: the cover image preview is visible and `#btn-cover-dl` is enabled.
- Download: `#btn-cover-dl`.
- Requires Pillow and a usable Chinese font.

## 5. 素材库

Use the tab controls with `data-t`:

- `voice`: upload, preview, select, rename, download, delete reference voices.
- `base`: upload, preview, select, rename, download, delete avatar/base videos.
- `bgm`: upload, preview, select, rename, download, delete music.
- `script`: save original text as a new entry, update the selected entry, load,
  retitle, delete, or clear scripts.
- `media`: preview generated speech/video/image artifacts, send a voice result
  to 出片, add notes, download, delete, or clear generated media.

Deletion and clearing are destructive. Resolve the exact item and obtain user
intent before deleting material. Renaming and selection are reversible.

## 6. System settings

Open the top-right 系统管理 button.

### 运行与 Colab

- Review Python, ffmpeg, Colab CLI, tunnel, voice, and video runtime status.
- Install buttons call the application's managed installers; wait for terminal
  success and refresh status.
- Colab supports multiple account profiles:
  - add an account;
  - edit its label/account configuration and GPU type;
  - save, select as active, start, or stop its session.
- During status inspection the start button may remain clickable only when the
  current state safely allows starting. Do not infer success until session
  status reports running.
- Report current account tier, GPU/runtime allocation, consumption, and session
  elapsed time only when the UI/API actually returns those values.

### Global model configuration

- There is no model-provider settings panel in cicy-koubo.
- Chat and Groq STT credentials come only from `~/cicy-ai/global.json`.
- Never create or read `~/cicy-ai/db/koubo.json`.
- Do not duplicate, edit, or migrate provider secrets inside the workspace UI.
- Validate chat configuration with rewrite/title and STT configuration with an
  actual short transcription. Never print complete credentials.

### 生成引擎

- Review each engine's installed/running/remote status.
- Install or reinstall with its visible action button.
- Remote engines show their remote configuration/action instead.
- The realtime-log control streams installation and runtime output. Use copy or
  clear-display only as requested; clearing the display does not remove the
  underlying service log.
- Wait for installed/healthy state before running TTS or lip-sync.

## 7. Logs and diagnosis

- User-visible combined log: top-right 日志.
- CLI: `cicy-koubo logs --lines 120`; use `--follow` only for active monitoring.
- Dependency/runtime diagnosis: `cicy-koubo doctor --json`.
- Diagnose in this order:
  1. service health;
  2. required input and selected asset;
  3. provider/engine installed and reachable;
  4. Colab/tunnel session state when selected;
  5. job terminal state;
  6. recent scoped log lines.
- Report the concrete failed dependency, engine, request, or job stage. Do not
  dump unrelated logs or secrets.

## End-to-end completion checklist

For a complete spoken-video request:

1. Obtain/extract or enter the script.
2. Rewrite only if requested; confirm the final script.
3. Select reference voice and generate/upload speech.
4. Select base video and generate lip-sync video.
5. Generate/edit subtitles; optionally select BGM.
6. Produce the edited final video and optional cover.
7. Verify previews/download controls and return the final artifact locations.
