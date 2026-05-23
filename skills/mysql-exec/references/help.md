# mysql-exec — help

## Usage

```
mysql-exec "<SQL>" [database]      Run one statement (default db: cicy_code)
mysql-exec --json "<SQL>" [db]     JSON output mode
mysql-exec --help / -h / help
```

## Environment

- `CICY_CODE_ENV`        — env file path (default `~/projects/cicy-code/.env`)
- `CICY_MYSQL_CONTAINER` — container name (default `cicy-mysql`)
- `CICY_MYSQL_DB`        — default database (default `cicy_code`)

## Requirements

- `docker` on PATH
- `cicy-mysql` container running
- `MYSQL_ROOT_PASSWORD` set in the env file
