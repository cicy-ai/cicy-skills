---
name: youtube-shorts-download
description: Download permitted YouTube Shorts and videos as MP4 or MP3 with a verified current yt-dlp, JavaScript challenge support, ffmpeg merging, cookie profiles, and automatic 403 recovery.
---

# YouTube Shorts Download

Use the bundled command for YouTube Shorts, watch URLs, and youtu.be links.

```sh
youtube-shorts-download "<youtube-url>" --dir "<output-directory>"
```

- Use MP4 by default; use `--audio` only when the user asks for MP3.
- Use `--cookies-from-browser <browser[:profile]>` only when the user authorizes access to their logged-in browser profile.
- Preserve the reported output path and verify the resulting file with `ffprobe` when available.
- Do not bypass DRM, private-video access, paywalls, geographic controls, or account restrictions.
- Download only content the user owns or is permitted to save.
- If a challenge or HTTP 403 occurs, let the command refresh its checksum-verified yt-dlp and retry once. Report the remaining error without looping.

See [help.md](./references/help.md) for options and [tools.md](./references/tools.md) for runtime behavior.
