# LLM Proxy 使用指南

## 用途

mitmproxy 实现的 LLM 请求拦截代理，用于：
- 记录 LLM API 调用历史到 MySQL 数据库
- 调试和分析 LLM 请求/响应

## 支持的 LLM 提供商

- OpenAI (api.openai.com)
- Anthropic (api.anthropic.com)
- Google (generativelanguage.googleapis.com, api.google.com)
- Mistral (api.mistral.ai)
- Cohere (api.cohere.ai)

## 启动代理

```bash
cd ~/projects/ai-workers/llm-proxy
bash ./run_proxy.sh
```

首次运行会自动安装 MITMProxy CA 证书到系统。

## 配置代理

使用代理转发请求：

```bash
export HTTP_PROXY=http://localhost:18080
export HTTPS_PROXY=http://localhost:18080
```

## 查看请求历史

```bash
# 查看最近 10 条记录
bash ~/Private/skills/mysql-exec.sh "SELECT id, url, method, status_code, created_at FROM llm_qa_history ORDER BY created_at DESC LIMIT 10;"

# 查看具体请求/响应
bash ~/Private/skills/mysql-exec.sh "SELECT request_body, response_body FROM llm_qa_history WHERE id = <id>;"
```

## 故障排除

- **403 错误**: 地区封锁，需要挂载上游代理
- **证书警告**: 需要安装 CA 证书，运行 `bash ./run_proxy.sh --install-cert`
