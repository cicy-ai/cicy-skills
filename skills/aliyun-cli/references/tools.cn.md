# aliyun-cli — 工具说明

## 功能概述

仅执行三项引导任务：
1. 下载官方 `aliyun` 二进制文件
2. 打开本地 `~/.aliyun/config.json` 进行编辑
3. 报告安装状态

其他所有操作，**请直接使用 `aliyun` 二进制文件**。

## 文件操作

| 操作  | 路径                       | 权限模式 | 触发场景         |
|-------|----------------------------|----------|------------------|
| 写入 | `~/.local/bin/aliyun`      | 0755     | `install`        |
| 写入 | `~/.aliyun/config.json`    | 0600     | `config`（占位符）|
| 读取 | `~/.aliyun/config.json`    | —        | `status`         |

`status` 读取文件时**仅输出掩码处理的 AccessKeyID**，绝不暴露密钥。代理程序切勿通过 cat/read 直接读取活动配置文件。

## 外部下载

来自 GitHub Releases 的 `aliyun/aliyun-cli`：
- macOS  amd64 / arm64 → `aliyun-cli-macosx-<v>-<arch>.tgz`
- Linux  amd64 / arm64 → `aliyun-cli-linux-<v>-<arch>.tgz`
- Windows amd64        → `aliyun-cli-windows-<v>-amd64.zip`

固定版本：`3.0.290`

## 环境变量

- `CICY_ALIYUN_CONFIG` — 覆盖配置文件路径
- `CICY_ALIYUN_DOWNLOAD_URL` — 覆盖二进制下载地址
- `EDITOR`/`VISUAL` — 用于 `aliyun-cli config` 命令

## JSON 输出格式

`status --json` 输出结构：
```json
{
  "ok": true,
  "data": {
    "binary_path": "/home/<user>/.local/bin/aliyun",
    "binary_installed": true,
    "binary_version": "3.0.290",
    "config_path": "/home/<user>/.aliyun/config.json",
    "config_exists": true,
    "config_permissions": "0600",
    "current_profile": "default",
    "access_key_id_masked": "LTAI***xyz"
  }
}
```
