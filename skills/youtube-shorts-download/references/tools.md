# youtube-shorts-download — runtime and failure behavior

- Platforms: macOS, Linux, and Windows.
- Runtime: macOS/Linux use the official Python zipapp; Windows uses the official executable.
- Integrity: a downloaded release is accepted only after validation against the official `SHA2-256SUMS`.
- Media processing: ffmpeg is required for stream merging and MP3 extraction.
- YouTube challenges: Node.js plus the official EJS remote component are enabled for yt-dlp.
- Recovery: challenge and HTTP 403 failures trigger one forced tool refresh and one retry.
- Output: normal progress is emitted on stderr; `--json` reserves stdout for the final result.

Exit status is nonzero for invalid input, missing dependencies, checksum failures, access
restrictions, download failures, or missing output files.
