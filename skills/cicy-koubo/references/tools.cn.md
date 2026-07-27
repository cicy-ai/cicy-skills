# 运行时合约

## 路径

| 项目 | 默认值 |
|---|---|
| 应用程序包 | `npx cicy-koubo@latest` |
| 运行时状态 | `~/cicy-ai/db/cicy-koubo-runtime.json` |
| 合并的标准输出/标准错误 | `~/logs/cicy-koubo.log` |
| 应用程序数据 | `~/projects/digital-human` |
| 默认 URL | `http://127.0.0.1:8770` |
| 浏览器身份 | `agent-electron` 配置文件 1 |

## 健康状态

仅当状态 PID 存在且能接受信号 0 时，进程才被视为“受管理”。
只要 `/` 返回 HTTP 200，就视为“健康”，包括在此技能之外启动的、已在运行的开发实例。`start` 将采用该健康 URL 进行打开，而不是启动重复实例。一个受管理的实时 PID 若没有 HTTP 健康状态，则未就绪。

## 退出代码

- `0`：命令已完成，或所请求的幂等状态已存在。
- `1`：运行时/依赖项/npm/构建/HTTP 操作失败。
- `2`：无效的命令、标志、端口或抖音 URL。

## 依赖边界

该技能管理但不包含 npm 应用程序。`install` 会调用该包的仅依赖项模式。应用程序拥有 Python/Flask/Pillow、ffmpeg、引擎和 Colab 配置。`doctor --json` 会暴露操作系统/WSL、本地 GPU、配置的执行模式、实时的 `/api系统` 数据以及先决条件。
