# CiCy Agent Role

Create and validate standard role templates used by the CiCy Create Agent dialog.

```sh
cicy-agent-role create sales-assistant --spec /tmp/sales-assistant.json
cicy-agent-role validate sales-assistant
```

Public Role Market:

```sh
cicy-agent-role search sales
cicy-agent-role install sales-assistant
cicy-agent-role diff sales-assistant
cicy-agent-role update sales-assistant
```

Updates preserve local changes and emit `*.upstream` files for real conflicts.
