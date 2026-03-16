# /config-check — Validate ~/.claude/config.json

Validates the Claude Code config file against its schema.

## Instructions for Claude

Run: `bun ~/.claude/memory/config.ts --validate`

Display results:
- If valid: "✅ config.json is valid"
- If errors: list each error with field path and message
- Suggest fixes for common errors
