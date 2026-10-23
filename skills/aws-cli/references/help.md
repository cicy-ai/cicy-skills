# aws-cli

Run the official AWS CLI as an account from cicy-code 账户 → AWS.

```
aws-cli accounts [--json]                          list accounts (name, key id, region, note)
aws-cli whoami --account <name>                    aws sts get-caller-identity
aws-cli exec --account <name> [--region r] -- …    run any aws command as that account
aws-cli use <name>                                 write it to ~/.aws/credentials as [default]
aws-cli test <name>                                verify the key through cicy-code (STS)
aws-cli status [--json]                            aws CLI + accounts state
aws-cli install [--force]                          install the official aws CLI (Linux, user-local)
```

Secrets are never printed. Exit codes: 2 usage, 3 no cicy-code/token, 4 account not found, 5 aws CLI missing.
