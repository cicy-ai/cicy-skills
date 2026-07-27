# aliyun-cli — 帮助

## 命令

```
aliyun-cli install [--force]      将官方阿里云二进制文件安装到 ~/.local/bin
aliyun-cli config                 在 $EDITOR 中打开 ~/.aliyun/config.json（创建占位符）
aliyun-cli status [--json]        显示安装及配置状态（访问密钥ID已隐藏）
aliyun-cli --help / -h / help     显示本帮助信息
```

对于任何真实的阿里云API调用，请直接使用原生 `aliyun` 二进制文件：

```
aliyun ecs DescribeRegions
aliyun oss ls oss://my-bucket/
aliyun ram ListUsers
```

## 环境变量

- `CICY_ALIYUN_CONFIG` — 覆盖配置文件路径（默认为 `~/.aliyun/config.json`）
- `CICY_ALIYUN_DOWNLOAD_URL` — 覆盖二进制文件下载地址
- `EDITOR`/`VISUAL` — 用于 `aliyun-cli config` 的编辑器
