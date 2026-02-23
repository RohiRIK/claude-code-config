# Workflow: CleanHistory

## Step 0: Load Context
**CRITICAL:** Before proceeding, read the context file to understand the Goose skill ecosystem.
- Read file: `skills/Goose/Context-Recipes.md`

## Step 1: Run Prune Tool
Execute the maintenance script to delete old log files.

### Option A: Standard Prune (Older than 7 days)
```bash
bun skills/Goose/Tools/prune-history.ts --days 7
```

### Option B: Aggressive Prune (Older than 1 day)
```bash
bun skills/Goose/Tools/prune-history.ts --days 1
```

### Option C: Dry Run (Check what would be deleted)
```bash
bun skills/Goose/Tools/prune-history.ts --days 7 --dry-run
```
