# luckgram — help

## Setup

```
luckgram config --local --token-stdin         Save the connection to Luckgram Desktop on this computer
luckgram config --cloud --token-stdin         Save the connection to the cloud (every computer on the cloud key)
luckgram config --cloud --backup --token-stdin   The cloud through its backup address (where luckgram.cc is blocked)
luckgram config --url <URL> --token-stdin [--profile <name>]   Any address, under a profile name
luckgram config --use <profile>               Make a saved profile the default
luckgram status [--json]                      Profiles (token masked), connection, tool count
```

The token is read from standard input, never from the command line:

```bash
luckgram config --local --token-stdin      # paste the access token, Enter, Ctrl-D
```

Where the token comes from: Luckgram Desktop → Settings → Luckgram → **Local MCP server** → *Copy access token*; for the cloud, *Connect through the cloud* → *Copy cloud key*.

## Accounts

```
luckgram devices                              Computers on the cloud key (cloud only)
luckgram accounts                             Logged-in accounts: #, id, name, username, phone, unread, active
luckgram active                               The account the window shows now
luckgram switch <id|@username|+phone|#index>  Make an account the active one
```

## Friends

```
luckgram friends list [--query <text>] [--limit N] [--offset N]     skill: friends
luckgram friends find <@username|+phone>                            skill: friends          30/hour, 100/day
luckgram friends add <id|@username|+phone> [--first <n>] [--last <n>]   skill: friends_manage   5/hour, 20/day
luckgram friends remove <id|@username>                              skill: friends_manage   20/hour, 50/day
```

## Chats

```
luckgram chats list [--unread] [--limit N] [--offset N]   skill: chats
luckgram chats read <chat>                                 skill: chats_manage   60/hour, 500/day
```

## Messages

```
luckgram messages get <chat> [--limit N] [--before <message id>]   skill: messages (does not mark as read)
luckgram messages send <chat> <text…> [--reply-to <message id>]    skill: messages_send   30/hour, 200/day
luckgram messages send <chat> --stdin                              long or multi-line text from standard input
```

## Groups, channels, profile

```
luckgram groups join <@username|chat id>      skill: groups    5/hour, 20/day
luckgram groups leave <@username|chat id>     skill: groups    10/hour, 30/day
luckgram profile set [--first <n>] [--last <n>] [--bio <text>]   skill: profile   5/hour, 10/day
```

An empty `--last ""` or `--bio ""` removes it.

## Raw

```
luckgram tools                                The server's tools with their descriptions
luckgram call <tool> ['<json arguments>']     Call any tool, print its JSON
luckgram calls                                Audit list of the cloud key (cloud only)
```

## Flags that work everywhere

| Flag | Meaning |
|---|---|
| `--account <id>` | Which logged-in account. Default: the active one. |
| `--device <name>` | Which computer, on the cloud. May be left out while one is online. |
| `--profile <name>` | Which saved connection. Default: the one marked default. |
| `--json` | Print the tool's JSON instead of text. |

## Examples

```bash
# what is unread, in every account that has the chats skill on
luckgram accounts --json | node -e 'for (const a of JSON.parse(require("fs").readFileSync(0)).accounts) console.log(a.id)' \
  | while read id; do luckgram chats list --account "$id" --unread; done

# read a chat, then reply
luckgram chats list --account 7943234085
luckgram messages get 562953914961921 --account 7943234085 --limit 20
luckgram messages send 562953914961921 "Got it, thanks" --account 7943234085 --reply-to 4812

# add a contact
luckgram friends find @someone --account 7943234085
luckgram friends add @someone --account 7943234085

# two computers on the cloud
luckgram devices
luckgram accounts --device "Office PC"
```

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Done |
| 1 | The tool refused: the skill is off for that account, a rate limit, not found, the app is locked |
| 2 | Wrong usage |
| 3 | No connection saved (`luckgram config`) |
| 4 | Cannot reach the server, or it refused the token |
