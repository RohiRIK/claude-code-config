# AutoFix Workflow

Apply safe auto-fixes and commit the result.

## Steps

1. Verify working tree is clean first:

```bash
git -C ~/.claude status --porcelain
```

If dirty (uncommitted changes), commit or stash before continuing — auto-fix refuses to run on a dirty tree.

2. Run with `--fix`:

```bash
bun ~/.claude/skills/Hygiene/Tools/Report.ts --fix
```

3. The script will:
   - Re-run all checks
   - Append missing paths to `.gitignore` (deduplicated)
   - Run `git rm --cached` for tracked symlinks and runtime dirs
   - Commit: `chore: hygiene auto-fix`

4. Verify the result:

```bash
bun ~/.claude/skills/Hygiene/Tools/Report.ts
```

Expected: error count drops to 0 for all auto-fixed items.

## What Is Auto-Fixed

| Tag | Action |
|-----|--------|
| `autofix: gitignore` | Append path to `.gitignore`, no git rm |
| `autofix: rm-cached` | Append to `.gitignore` + `git rm --cached -r` |

## What Is NOT Auto-Fixed

| Issue | Why | Fix |
|-------|-----|-----|
| Hardcoded absolute home paths | Requires human judgment on replacement | Replace with `~/.claude/` or `$HOME` manually |
| Broken internal skill links | Must know correct target path | Update link in the markdown file |
| Missing agent references | Deletion may be intentional | Verify, then update command or restore agent |
| `console.log` / `: any` | Code change needed | Edit the source file |

## Dry Run

Preview what would change without writing:

```bash
bun ~/.claude/skills/Hygiene/Tools/Report.ts --fix --dry-run
```
