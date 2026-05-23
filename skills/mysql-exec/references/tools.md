# mysql-exec — tools

## What it does

```
docker exec -i cicy-mysql mysql -u root -p<password> <db> -e "<SQL>"
```

Password is read from the `.env` file via a hand-rolled key/value parser
(no shell evaluation). Args are passed as an array — the password never
goes through a shell.

## Files read

| path                                          | purpose            |
|-----------------------------------------------|--------------------|
| `~/projects/cicy-code/.env`                   | `MYSQL_ROOT_PASSWORD` |

The wrapper reads only the value for the `MYSQL_ROOT_PASSWORD` line. It
does NOT log or echo this value.

## Stderr filtering

MySQL 8 prints `[Warning] Using a password on the command line interface
can be insecure.` for every invocation. The wrapper strips this single
line from stderr while preserving real error output.

## Limitations

- one statement per call (no `;`-separated scripts — pipe a `.sql` file directly via `docker exec -i ...` for that)
- only targets the `cicy-mysql` container; for remote MySQL use `ssh remote 'mysql ...'`
