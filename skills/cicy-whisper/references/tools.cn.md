# 远端模型运行约定

统一命令为 `doctor/install/status/run/logs`；机器可读命令最后一行是 JSON，`help/logs` 是纯文本例外。provider 自动识别 Colab/阿里云/普通 Linux，也可用 `CICY_MODEL_PROVIDER` 指定。`CICY_MODEL_ROOT` 控制模型根目录，Colab 默认 `/content/cicy-models`，其他 Linux 默认 `~/cicy-ai/models`；`CICY_MODEL_CACHE` 是共享下载缓存，`CICY_OUTPUT_DIR` 是任务产物目录。安装成功才原子写入 `READY.json`，安装和推理均有锁；输入必须先传到远端并使用绝对路径。测试 runner 还必须显式设置 `CICY_TEST_MODE=1`。不得在日志或结果中输出凭据。
