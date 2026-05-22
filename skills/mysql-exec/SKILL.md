---
name: mysql-exec
description: Run a one-shot SQL statement against the local cicy-mysql container via docker exec. Reads root password from ~/projects/cicy-code/.env.
---

# MySQL Exec

Local `mysql-exec` wrapper. Runs `mysql -u root -p<...> <db> -e "<SQL>"`
inside the `cicy-mysql` Docker container.

## Scope

Use this skill when the task involves:

- one-shot SELECT / SHOW / DESCRIBE on the local `cicy-mysql` MySQL
- ad-hoc INSERT / UPDATE / DDL during development

## Rules

1. The wrapper uses `docker exec -i cicy-mysql mysql ...` — Docker must be running.
2. Root password is read from `~/projects/cicy-code/.env` `MYSQL_ROOT_PASSWORD`. **Do not echo it back to the user.**
3. Default database is `cicy_code`; pass a second positional arg to switch.
4. Only `cicy-mysql` is targeted. For remote MySQL, use `mysql` directly via ssh.
5. Multi-line scripts: use single statement per call, or pipe a file directly via `docker exec -i cicy-mysql mysql -u root -p... < file.sql`.

## References

- [help.md](./references/help.md)
- [tools.md](./references/tools.md)
