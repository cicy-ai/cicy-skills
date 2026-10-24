# cicy-keystore

Agent-side companion of the cicy-code **Keystore** tab. Secrets (`key`, `value`,
`note`) are entered only in the UI and stored in `~/cicy-ai/db/keystore.json`
(0600). This skill lists keys and notes, and runs commands with values injected
as environment variables, masking them in the output. It never prints a value.

```sh
cicy-keystore list
cicy-keystore exec --env OPENAI_API_KEY -- python app.py
```

Requires a cicy-code with the keystore API (`/api/keystore`).
