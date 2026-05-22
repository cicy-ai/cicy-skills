# mysql-exec

> Source-only Node.js, 94 LOC. Read [`bin/mysql-exec`](./bin/mysql-exec).

One-shot SQL against the `cicy-mysql` Docker container. Reads root password
from `~/projects/cicy-code/.env` `MYSQL_ROOT_PASSWORD`.

## Install

```bash
cicy-code skill install mysql-exec
```

## Quick usage

```bash
mysql-exec "SHOW TABLES"
mysql-exec "SELECT id, title FROM todos LIMIT 5"
mysql-exec "DESCRIBE users" some_other_db
mysql-exec --json "SELECT 1"
```

## Requirements

- Docker installed and running
- `cicy-mysql` container running
- `~/projects/cicy-code/.env` with `MYSQL_ROOT_PASSWORD=...`

## License

MIT
