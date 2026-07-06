---
name: cicy-mobile-install
description: Install the latest cicy-mobile build onto a USB-connected phone via the Mac build host — Android via adb install; iOS guided two ways: Sideloadly IPA re-sign or Xcode source build.
---

# Cicy Mobile Install

Install the latest **cicy-mobile** build onto a phone that's plugged into the
Mac build host. The phone connects to the Mac by USB; this skill runs on the
host and drives the Mac over ssh, pulling the build artifact from the region's
mirror (**global → GitHub Releases, CN → Aliyun OSS Shanghai**; no R2). Region is
auto-detected on the Mac, or forced via `CICY_INSTALL_REGION` / `cfg.region`.

- **Android** — pulls `cicy-latest.apk` (or a pinned version) and runs
  `adb install -r`. No account needed. (CN: the OSS asset is a `.zip` because
  OSS forbids bare `.apk`; the skill unzips it before installing.)
- **iOS** — the IPA is unsigned, so it must be re-signed with the user's own
  Apple ID. The skill **guides the user through one of two methods** (acting as a
  step-by-step copilot, doing the Mac-side automatable parts):
  - **sideloadly** — downloads the IPA + opens it in Sideloadly; the user does
    the Apple ID login / 2FA / Start (those are interactive Apple steps).
  - **xcode** — build from source on the Mac with automatic signing
    (`-allowProvisioningUpdates` auto-registers the device) + `ios-deploy`.
  Either way it finishes by walking the user through trusting the developer cert
  on the phone (Settings → General → VPN & Device Management).

## Scope

Use this skill when:

- you want to install/update cicy-mobile on a USB-connected Android or iPhone,
- the phone is plugged into the Mac build host (reachable as ssh `mac`),
- the cicy-mobile release CI has published the latest build (GitHub Release +
  OSS mirror; the skill resolves the right one by region).

Do **not** use it to build the app (that's the cicy-mobile release workflow) or
for over-the-air installs.

## Quick start

```sh
cicy-mobile-install status            # host reachable? tools? connected devices?
cicy-mobile-install                   # auto-detect the connected phone, install latest
cicy-mobile-install android           # Android: adb install latest APK
cicy-mobile-install android 1.0.4     # pin a version
cicy-mobile-install ios               # iOS: prints the two methods to choose from
cicy-mobile-install ios --method sideloadly   # download IPA + open Sideloadly, then guide login/2FA/trust
cicy-mobile-install ios --method xcode        # guide source build + automatic-signing install + trust
```

Optional config `~/cicy-ai/db/cicy-mobile-install.json`:

```json
{ "ssh_host": "mac",
  "region": "auto",
  "download_dir": "~/Downloads",
  "ios_source_dir": "~/Downloads/cicy-mobile" }
```

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
