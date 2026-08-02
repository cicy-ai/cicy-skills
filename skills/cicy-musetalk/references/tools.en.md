# Remote model runtime contract

Commands: `doctor`, `install`, `status`, `run`, and `logs --lines N`. Machine-readable commands print one JSON object on their last stdout line; `help` and `logs` intentionally return plain text. Exit code 0 means success, 1 means runtime/requirement failure, and 2 means invalid usage.

Environment:

- `CICY_MODEL_ROOT`: Colab default `/content/cicy-models`; other Linux default `~/cicy-ai/models`.
- `CICY_MODEL_CACHE`: shared download cache.
- `CICY_OUTPUT_DIR`: job output root.
- `CICY_MODEL_PROVIDER`: optional `colab`, `aliyun`, or `linux` override.

Each engine owns `READY.json`, `FAILED.json`, `install.log`, an install lock, and a run lock. Installation and inference are idempotent/serialized; never delete another job directory. Inputs must be absolute local paths already transferred to the remote worker. Do not print credentials or embed them in results.

For tests only, `CICY_TEST_MODE=1` plus the engine-specific `*_INSTALL_RUNNER` and `*_RUNNER` variables replace real model processes. Never use these overrides for production inference.
