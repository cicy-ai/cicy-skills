# lanshare

> Zero-dependency Node.js LAN file server (directory index) + shared notebook, with HTTP Basic
> auth and LAN IP discovery. Node >= 18.

Share a local directory — or a full-page shared notebook — with other devices on the LAN.

## Install

```bash
cicy-code skill install lanshare
```

## Usage

```bash
lanshare serve                 # current directory
lanshare serve ~/Downloads
# Sharing /home/me/Downloads
# Listening on 0.0.0.0:8080
# Auth: none
# LAN URLs:
#   http://192.168.1.23:8080/

lanshare serve ./dist -p 9000 -a admin:secret   # Basic auth
lanshare serve /data --daemon                   # background
lanshare note -a team:pass                      # shared notebook on :8081
lanshare status && lanshare stop
lanshare ip                                     # 192.168.1.23  eth0
```

## License

MIT
