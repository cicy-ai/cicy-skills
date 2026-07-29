ARG BASE_IMAGE=cicy-koubo-gpu:2026.07.29-api
FROM ${BASE_IMAGE}

ENV KOUBO_API_PORT=8771 \
    KOUBO_API_STATE_DIR=/var/lib/cicy-koubo-api \
    PYTHONUNBUFFERED=1

RUN mkdir -p /var/lib/cicy-koubo-api

EXPOSE 8771
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=4 \
  CMD curl -fsS http://127.0.0.1:8771/live >/dev/null || exit 1
