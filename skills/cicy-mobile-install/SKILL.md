---
name: cicy-mobile-install
description: Install the latest cicy-mobile build onto a USB-connected phone via the Mac build host — Android via adb install, iOS via AltServer re-sign.
---

# Cicy Mobile Install

Install the latest **cicy-mobile** build onto a phone that's plugged into the
Mac build host. The phone connects to the Mac by USB; this skill runs on the
host and drives the Mac over ssh, pulling the build artifact from the public R2
CDN.

- **Android** — pulls `cicy-latest.apk` (or a pinned version) from R2 and runs
  `adb install -r`. No account needed.
- **iOS** — the IPA is unsigned, so it needs a free Apple ID re-sign via
  **AltServer** (certs expire after 7 days; AltStore auto-renews over WiFi).
  Requires AltServer installed on the Mac + an Apple ID in the config.

## Scope

Use this skill when:

- you want to install/update cicy-mobile on a USB-connected Android or iPhone,
- the phone is plugged into the Mac build host (reachable as ssh `mac`),
- you have the latest build on R2 (produced by the cicy-mobile release CI).

Do **not** use it to build the app (that's the cicy-mobile release workflow) or
for over-the-air installs.

## Quick start

```sh
cicy-mobile-install status            # host reachable? tools? connected devices?
cicy-mobile-install                   # auto-detect the connected phone, install latest
cicy-mobile-install android           # Android: adb install latest APK
cicy-mobile-install android 1.0.4     # pin a version
cicy-mobile-install ios               # iOS: AltServer re-sign (needs AltServer + Apple ID)
```

Optional config `~/cicy-ai/db/cicy-mobile-install.json`:

```json
{ "ssh_host": "mac",
  "r2_base": "https://r2.deepfetch.de5.net/cicy-mobile",
  "apple_id": "…", "apple_password": "…" }
```

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
