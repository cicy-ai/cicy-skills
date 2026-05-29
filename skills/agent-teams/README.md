# agent-teams

Manage local cicy-code teams from the Team Helper opencode pane.

```
agent-teams list
agent-teams add --name X --base-url http://127.0.0.1:8008 --token cicy_xxx
agent-teams upgrade local-8008
agent-teams remove local-8008
```

A thin CLI around `agent-webpage exec-js` → `window.cicy.localTeams.*`.

See `SKILL.md` for design / `references/help.md` for flags /
`references/tools.md` for the wire protocol.

Requires `agent-webpage >= 1.1.2` on `$PATH`.

## Publishing

```bash
git tag agent-teams-v1.0.0
git push origin agent-teams-v1.0.0   # CI runs publish.yml
```
