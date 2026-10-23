---
name: aws-cli
description: Run the official AWS CLI as any AWS account stored in the cicy-code account matrix (keys + note), without exposing secrets: accounts / whoami / exec / use / test / status / install.
---

# AWS CLI (multi-account)

Run the **official `aws` CLI** as one of the AWS accounts the user saved in
cicy-code **账户 → AWS**. Each account has a name, Access Key ID, Secret Access
Key, default region and a free-text **note** (备注) that says what it is for —
read the note to pick the right account.

## Rules

- Never print, echo, `cat` or log a secret access key. Don't read
  `~/cicy-ai/db/aws.json` or `~/.aws/credentials` directly.
- Always pass `--account <name>`; pick it by its **note** (`aws-cli accounts`).
  If several fit, ask the user.
- Destructive calls (delete/terminate/put-bucket-policy…) need user confirmation first.

## Workflow

```sh
aws-cli accounts                                  # name  key-id  region  note
aws-cli whoami --account prod                     # sts get-caller-identity
aws-cli exec --account prod -- s3 ls              # any aws command
aws-cli exec --account prod --region eu-west-1 -- ec2 describe-instances
aws-cli use prod                                  # make it [default] for plain `aws`
```

`exec` passes the key to the child `aws` process through environment variables
only (`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/`AWS_REGION`) and clears
`AWS_PROFILE`, so the chosen account always wins.

Missing CLI → `aws-cli install` (Linux, user-local, no sudo). Exit codes:
2 usage, 3 cicy-code unreachable / no token, 4 account not found, 5 aws CLI missing.

## References

- [help.en.md](./references/help.en.md) / [help.cn.md](./references/help.cn.md)
- [tools.en.md](./references/tools.en.md) / [tools.cn.md](./references/tools.cn.md)
