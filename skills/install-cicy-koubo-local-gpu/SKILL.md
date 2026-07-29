---
name: install-cicy-koubo-local-gpu
description: 在 Windows WSL2 中安装、启动和诊断 CiCy Koubo 本地 NVIDIA GPU Docker；自动选择剩余空间最大的固定磁盘，使用 8771 API 且本地素材不经过 OSS。
---

# 安装 CiCy Koubo 本地 GPU

使用随 Skill 提供的确定性安装器，不要手写 `docker run`。

## 工作流

1. 执行 `install-cicy-koubo-local-gpu status` 检查现状。
2. 未安装时执行 `install-cicy-koubo-local-gpu install`。默认选择剩余空间最大的 Windows 固定磁盘；用户明确指定目录时使用 `--dir=D:\path`。
3. 执行 `install-cicy-koubo-local-gpu start`。安装器必须先验证 WSL 内 Docker 能真实挂载 NVIDIA GPU，验证失败时停止并显示原因。
4. 再执行 `status`，确认 `running: true` 和 endpoint `http://127.0.0.1:8771`。
5. 停止服务时执行 `stop`，不要删除用户的持久化数据。

## 约束

- 只支持 Windows、CiCy 专用 WSL 发行版 `cicy-code-wsl` 和 NVIDIA GPU。
- 口播 UI 使用 8770；GPU API 使用 8771。
- 本地任务用 multipart 直接传给本地 API，禁止申请 OSS 签名或上传 OSS。
- 不自动删除镜像、状态目录或其他 Docker 容器。
- 不输出或记录 `config.json` 中的访问 Token。

## 资源

- 需要构建镜像时读取 [Dockerfile](./assets/Dockerfile)。
- 命令参数见 [help.cn.md](./references/help.cn.md)。
