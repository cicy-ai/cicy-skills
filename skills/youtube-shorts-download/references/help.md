# youtube-shorts-download — command reference

```sh
youtube-shorts-download <url> [options]
```

| Option | Meaning |
| --- | --- |
| `-d, --dir <path>` | Output directory; defaults to the current directory |
| `-o, --output <template>` | yt-dlp output filename template |
| `--audio` | Extract an MP3 instead of downloading MP4 video |
| `--cookies-from-browser <browser[:profile]>` | Use an explicitly authorized browser cookie profile |
| `--force-update` | Refresh the checksum-verified yt-dlp before downloading |
| `--json` | Write the final machine-readable result to stdout; progress remains on stderr |
| `-h, --help` | Show command help |

Examples:

```sh
youtube-shorts-download "https://www.youtube.com/shorts/VIDEO_ID" --dir ./downloads
youtube-shorts-download "https://youtu.be/VIDEO_ID" --audio --dir ./audio
```
