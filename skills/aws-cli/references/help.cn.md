# aws-cli

以 cicy-code 账户 → AWS 里保存的账号运行官方 AWS CLI。

```
aws-cli accounts [--json]                          列出账号（名称、Key ID、Region、备注）
aws-cli whoami --account <name>                    aws sts get-caller-identity
aws-cli exec --account <name> [--region r] -- …    以该账号执行任意 aws 命令
aws-cli use <name>                                 写入 ~/.aws/credentials 并设为 [default]
aws-cli test <name>                                通过 cicy-code 校验 Key（STS）
aws-cli status [--json]                            aws CLI 与账号状态
aws-cli install [--force]                          安装官方 aws CLI（Linux，用户目录）
```

Secret 不会输出。退出码：2 用法错误，3 无法连接 cicy-code/无 token，4 账号不存在，5 未安装 aws CLI。
