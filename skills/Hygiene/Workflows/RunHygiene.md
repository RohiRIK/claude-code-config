# RunHygiene Workflow

Run the full hygiene audit against `~/.claude`.

## Steps

1. Navigate to repo root: `cd ~/.claude`

2. Run the report:

```bash
bun ~/.claude/skills/Hygiene/Tools/Report.ts
```

3. Read the grouped output:
   - `[ERROR]` — must fix before next commit
   - `[WARN]` — should fix soon
   - `[INFO]` — informational, no action required

4. If auto-fixable issues are listed, decide whether to apply:
   - Run `bun ~/.claude/skills/Hygiene/Tools/Report.ts --fix` to apply and commit
   - Or fix manually and commit yourself

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Clean — no errors or warnings |
| 1 | One or more `[ERROR]` issues |
| 2 | Warnings only, no errors |

## What Gets Checked

| Domain | File | Key Detections |
|--------|------|----------------|
| Git | `CheckGit.ts` | Tracked symlinks, runtime dirs, hardcoded paths, uncommitted/unpushed |
| Skills | `CheckSkills.ts` | Broken links, missing SKILL.md, orphaned skills, bad frontmatter |
| Code | `CheckCode.ts` | `console.log`, `: any`, npm/pip usage, file size |
| Rules | `CheckRules.ts` | CLAUDE.md ↔ rules/ drift, missing agent refs, unlisted commands |

## Related

- Auto-fix details → `Workflows/AutoFix.md`
- Issue taxonomy → `Reference/Rules.md`
