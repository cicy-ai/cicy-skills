# claude-design

Drive [claude.ai/design](https://claude.ai/design) from the CLI through
`agent-chrome` CDP. Open a workspace, send prompts (UTF-8 safe), trigger
Share → Export downloads.

```sh
export CLAUDE_DESIGN_IDX=6
export CLAUDE_DESIGN_CLIENT=web-w-10001-mphqbqi5-aronzx   # omit for local

claude-design open
echo "Design a dark-mode landing page" | claude-design prompt - --wait
claude-design download --type editable --out /Users/you/Downloads
```

See `SKILL.md` for the full spec and `references/` for command reference,
internals, and the chunked-pull recipe for getting big exports back from a
remote Mac.

## Dependencies

- `agent-chrome` skill (must be on PATH)
- A Chrome profile already logged into claude.ai (the skill does NOT log in)

## License

MIT
