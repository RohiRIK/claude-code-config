# Hygiene Issue Taxonomy

All issues emitted by the Hygiene skill, their severity, autofix capability, and remediation.

## Git Issues (`CheckGit.ts`)

| Issue | Level | Autofix | Remediation |
|-------|-------|---------|-------------|
| Uncommitted change | WARN | — | `git add` + `git commit` |
| Unpushed commit | INFO | — | `git push origin main` |
| Tracked symlink | ERROR | `rm-cached` | Auto: adds to `.gitignore` + `git rm --cached` |
| Tracked runtime file | ERROR | `rm-cached` | Auto: adds to `.gitignore` + `git rm --cached -r` |
| Hardcoded absolute home path in tracked file | WARN | — | Replace with `~/.claude/` or `$HOME` |

## Skill Issues (`CheckSkills.ts`)

| Issue | Level | Autofix | Remediation |
|-------|-------|---------|-------------|
| Symlink in `skills/` | ERROR | `gitignore` | Auto: adds path to `.gitignore` |
| Missing `SKILL.md` | ERROR | — | Create `SKILL.md` per CreateSkill conventions |
| Missing frontmatter | WARN | — | Add `---` YAML block with `name` + `description` |
| Missing `name` field | WARN | — | Add `name: skill-name` to frontmatter |
| Missing `description` field | WARN | — | Add `description:` ≤15 words |
| Description > 15 words | WARN | — | Shorten to ≤15 words |
| `npx` without `bunx` | WARN | — | Replace `Bash(npx ...)` with `Bash(bunx ...)` in `allowed-tools` |
| Broken internal link | ERROR | — | Update `[text](path)` to correct relative path |
| Possibly orphaned skill | INFO | — | Verify if still used; delete or reference in `commands/` |

## Code Issues (`CheckCode.ts`)

| Issue | Level | Autofix | Remediation |
|-------|-------|---------|-------------|
| File > 800 lines | ERROR | — | Split into smaller modules |
| File > 400 lines | WARN | — | Consider splitting |
| `console.log` in TS/JS | WARN | — | Remove before commit |
| `: any` type annotation | WARN | — | Replace with proper type |
| `npm install/run/add` | WARN | — | Use `bun install/run/add` |
| `npx` | WARN | — | Use `bunx` |
| `pip install` / `pip3` | WARN | — | Use `uv pip install` |
| `python3 -c import json` | WARN | — | Use `jq` |
| Hardcoded path in hook file | ERROR | — | Use `process.env.HOME + "/..."` |

## Rules Issues (`CheckRules.ts`)

| Issue | Level | Autofix | Remediation |
|-------|-------|---------|-------------|
| CLAUDE.md refs non-existent rule | WARN | — | Create the rule file or remove the reference |
| Rule file not in CLAUDE.md | INFO | — | Add to `## Rules` section or delete if unused |
| Command refs missing agent | ERROR | — | Create agent file or remove the reference |
| Command not in CLAUDE.md table | INFO | — | Add to `## Commands` table or confirm intentional |
