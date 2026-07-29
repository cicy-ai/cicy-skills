# Tools

- `list`: show matching chats and classifications.
- `plan`: produce a read-only organization plan.
- `sync`: rename active bindings to `Agent Title · w-xxxxx`.
- `cleanup`: delete only `orphan` rows.

Classifications: `bound` is preserved, `orphan` is a cleanup candidate,
`user_chat` is never deleted, and `direct` is never renamed or deleted.

Scopes: inventory needs `im:chat:readonly` or `im:chat`; sync needs
`im:chat:update` or `im:chat`; cleanup requires permission to dissolve groups.
