# MySQL .env Configuration Skill

## Overview

This skill explains how to use MySQL configuration from `.env` in the fast-api project.

## MySQL Environment Variables

The following variables must be configured in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `MYSQL_HOST` | MySQL server hostname | 127.0.0.1 |
| `MYSQL_PORT` | MySQL server port | 3306 |
| `MYSQL_USER` | MySQL username | root |
| `MYSQL_PASSWORD` | MySQL password | (none) |
| `MYSQL_DATABASE` | Database name | tts_bot |

## How to Use

1. **Copy the example config**:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env`** and set your MySQL credentials

3. **Load config in code**: Use `os.getenv()` to read values:
   ```python
   import os
   
   MYSQL_HOST = os.getenv("MYSQL_HOST", "127.0.0.1")
   MYSQL_PORT = int(os.getenv("MYSQL_PORT", 3306))
   MYSQL_USER = os.getenv("MYSQL_USER", "root")
   MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
   MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "tts_bot")
   ```

4. **Connect to MySQL**:
   ```python
   import pymysql
   
   conn = pymysql.connect(
       host=MYSQL_HOST,
       port=MYSQL_PORT,
       user=MYSQL_USER,
       password=MYSQL_PASSWORD,
       database=MYSQL_DATABASE
   )
   ```

## Example Connection Helper

```python
import os
import pymysql

def get_db_connection():
    return pymysql.connect(
        host=os.getenv("MYSQL_HOST", "127.0.0.1"),
        port=int(os.getenv("MYSQL_PORT", 3306)),
        user=os.getenv("MYSQL_USER", "root"),
        password=os.getenv("MYSQL_PASSWORD", ""),
        database=os.getenv("MYSQL_DATABASE", "tts_bot"),
        cursorclass=pymysql.cursors.DictCursor
    )
```

## Security Notes

- Never commit `.env` files - they contain secrets
- Always use `.env.example` as a template
- Add `.env` to `.gitignore` to prevent accidental commits
- Use parameterized queries to prevent SQL injection
