# google — tools

## What it does

Direct REST against Google APIs. No `googleapis` npm package — pure
`fetch` + manual access-token refresh. OAuth via the
`oauth-flow.cicy-ai.com` Worker which relays authorization codes (TTL 10
min) but **never sees** `client_secret` or any tokens.

## OAuth flow

```
1. cmdLogin generates a random sessionID and prints:
     https://oauth-flow.cicy-ai.com/start?session=<id>&client_id=<id>&scopes=<...>

2. User opens it → redirected to Google → consent → Google → relay /callback.
   Relay stores the code in KV under sessionID (TTL 10 min).

3. cmdLogin polls https://oauth-flow.cicy-ai.com/poll?session=<id>
   every 2 seconds for up to 10 minutes.

4. Once the code arrives, the wrapper POSTs to
     https://oauth2.googleapis.com/token
   with { client_id, client_secret, code, redirect_uri,
          grant_type: 'authorization_code' }
   to exchange the code for { refresh_token, access_token, expires_in }.

5. The wrapper writes those to ~/cicy-ai/db/google.json (0600) along with
   the authorized email (fetched from /v1/userinfo).
```

## Token refresh

`getAccessToken()` is called before every API request. If
`expires_at - 60s` is in the future, the cached `access_token` is used.
Otherwise, POST to `oauth2.googleapis.com/token` with
`{ client_id, client_secret, refresh_token, grant_type: 'refresh_token' }`,
update `expires_at`, persist.

## Endpoints used

| service  | endpoint                                                               |
|----------|------------------------------------------------------------------------|
| Gmail    | `gmail.googleapis.com/gmail/v1/users/me/{messages,messages/<id>,messages/send}` |
| Sheets   | `sheets.googleapis.com/v4/spreadsheets[/<id>/values/<range>:{update,append}]`  |
| Drive    | `www.googleapis.com/drive/v3/files`, `/upload/drive/v3/files`, `/about`        |
| Calendar | `www.googleapis.com/calendar/v3/{users/me/calendarList,calendars/<id>/events}` |

## Configuration files

| path                                       | mode | secret_fields                    |
|--------------------------------------------|------|----------------------------------|
| `~/cicy-ai/db/google_oauth_client.json`    | 0600 | `client_secret`                  |
| `~/cicy-ai/db/google.json`                 | 0600 | `refresh_token`, `access_token` |

The OAuth client file accepts either:
- flat shape: `{ "client_id": "...", "client_secret": "..." }`
- Google's downloaded shape: `{ "web": { "client_id": "...", ... } }` or `{ "installed": {...} }`

## Hard rules

- NEVER cat / read / print either config file
- NEVER ask the user to paste client_secret / refresh_token / auth-code into chat
- Walk the user through `google setup` step by step rather than skipping ahead
