# /migrate — LTM Schema Migration Control

Manage versioned schema migrations for `~/.claude/memory/ltm.db`.

## Usage

/migrate status    — Show applied and pending migrations
/migrate up        — Apply the next pending migration
/migrate down      — Rollback the last applied migration
/migrate reset     — Rollback ALL migrations (requires confirmation)

## Instructions for Claude

Parse the argument after `/migrate`:

- **status**: Run `bun ~/.claude/memory/migrations.ts --status` and display results as a table
- **up**: Run `bun ~/.claude/memory/migrations.ts --up` and report what was applied
- **down**: Run `bun ~/.claude/memory/migrations.ts --down` and report what was rolled back
- **reset**: Ask user to confirm with "yes" before running `bun ~/.claude/memory/migrations.ts --reset`
- No argument: default to **status**
