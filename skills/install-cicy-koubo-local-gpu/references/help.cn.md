# 命令

```text
install [--dir=D:\路径]  安装镜像并把状态目录放到指定盘；省略时选择剩余空间最大盘
start                    验证 NVIDIA Runtime 并启动 127.0.0.1:8771
stop                     停止 GPU API，保留数据
status                   输出安装目录、镜像、端点和运行状态
```

可用 `CICY_KOUBO_GPU_IMAGE` 覆盖默认镜像，使用 `CICY_WSL_DISTRO` 覆盖默认 WSL 发行版。
