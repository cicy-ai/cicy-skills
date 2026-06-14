# agent-creator — command reference

```
agent-creator list [--json]                 List custom agents
agent-creator tools [--json]                List selectable tool groups
agent-creator show <name> [--json]          Show one agent's persona/tools/model
agent-creator create <name> [opts]          Create / overwrite a custom agent
agent-creator delete <name> [--json]        Delete a custom agent
agent-creator --help                        Show help
```

Aliases: `ls`=list, `new`/`add`=create, `get`=show, `rm`/`del`=delete.

## create options

| flag | meaning |
|------|---------|
| `--tools a,b` | Comma-separated tool groups (run `agent-creator tools` to see the set) |
| `--model <id>` | Default model for new instances (e.g. `claude-opus-4-8`); empty = host default |
| `--prompt "..."` | Persona text inline |
| `--prompt-file <path>` | Persona text from a file |
| (stdin) | If no `--prompt`/`--prompt-file`, piped stdin is used as the persona |
| `--json` | Machine-readable output |

`<name>` may be any string (Chinese allowed); the server derives a filesystem
slug from it. Re-creating with the same name overwrites that agent.

## Examples

```sh
# discover tool groups
agent-creator tools

# create from inline persona
agent-creator create 销售助手 \
  --tools coordinate,shell \
  --model claude-opus-4-8 \
  --prompt "你是销售助手,主动热情,擅长挖掘需求。"

# create from a file or a pipe
agent-creator create 客服小美 --tools coordinate --prompt-file persona.md
cat persona.md | agent-creator create 客服小美 --tools coordinate

# inspect / list / delete
agent-creator list
agent-creator show 销售助手 --json
agent-creator delete 销售助手
```

## Using a custom agent

After `create`, open the cicy-code **新建员工 / new worker** picker. The agent
appears as `★ <name>` with agent type `custom:<slug>`. Selecting it creates an
instance with the persona, tools and default model applied (the server maps
`custom:<slug>` → a `cicy` agent with that role).
