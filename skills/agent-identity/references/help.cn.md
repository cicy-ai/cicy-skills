agent-identity — 报告 AI 命令行工具的本地客户端/设备ID及账户信息。

用法：
  agent-identity [all|claude|codex|opencode|kiro] [--json]

参数：
  all        （默认）报告全部四种 CLI
  claude     claude-code 设备的用户ID + OAuth账户
  codex      codex 认证模式（apikey/chatgpt）+ 账户ID
  opencode   已配置的提供商名称
  kiro       AWS IdC/SSO OAuth的clientId + 区域 + 认证方法

选项：
  --json     机器可读的 JSON 格式（{ ok, results: [...] }）
  --help     显示此帮助信息

敏感信息（令牌、API密钥、客户端密钥）将始终被隐藏/省略。
该技能仅读取 $HOME 目录下的文件；它不会写入或发送任何内容。
