---
description: "Delete a specific memory by ID from long-term memory."
disable-model-invocation: true
argument-hint: "[memory-id]"
---

# /forget - Delete a Long-Term Memory

Remove a memory by ID. CASCADE removes all its graph relations.

## Usage

```
/forget <memory_id> [reason]
```

## Examples

```
/forget 42
/forget 42 "This was specific to the old auth system, no longer relevant"
```

## Process

1. Look up the memory to confirm it exists:
   ```typescript
   import { recall } from "~/.claude/memory/db.js";
   const results = recall({ query: "", limit: 1 });
   // Or search by ID from the DB directly
   ```
2. Show the user what will be deleted: content, tags, relations
3. Call `forget()`:
   ```typescript
   import { forget } from "~/.claude/memory/db.js";
   forget({ id: 42, reason: "No longer relevant" });
   ```
4. Report: `Deleted memory [42]. ${N} relations removed. memory-long-term.md regenerated.`

## Notes

- Requires explicit memory ID — use `/recall` first to find it
- CASCADE: all `memory_relations` rows referencing this ID are auto-deleted
- `docs/memory-long-term.md` is regenerated automatically after deletion
- This is irreversible — confirm with user before calling `forget()`
