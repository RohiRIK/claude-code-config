---
name: hygiene
description: "Audit ~/.claude for git, skill, code, and rules hygiene issues."
disable-model-invocation: true
argument-hint: [--fix]
allowed-tools: Bash(bun:*), Bash(git:*), Read, Edit
---

# Hygiene

Audits `~/.claude` across 5 dimensions and auto-fixes safe problems.

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **RunHygiene** | `/hygiene` | `Workflows/RunHygiene.md` |
| **AutoFix** | `/hygiene --fix` | `Workflows/AutoFix.md` |

## What It Checks

| Domain | Tool | Key Detections |
|--------|------|----------------|
| Git | `Tools/CheckGit.ts` | Uncommitted files, tracked symlinks/runtime dirs, hardcoded paths |
| Skills | `Tools/CheckSkills.ts` | Broken links, missing SKILL.md, orphaned skills, bad frontmatter |
| Code | `Tools/CheckCode.ts` | `console.log`, `npm`/`pip`, `: any`, file size violations |
| Rules | `Tools/CheckRules.ts` | CLAUDE.md ↔ rules/ drift, orphaned rules, broken refs |

## Examples

**Example 1: Run the full audit**
```
User: "/hygiene"
→ Runs all 4 checks in parallel
→ Prints grouped [ERROR]/[WARN]/[INFO] report
→ Prompts to auto-fix if safe fixes available
```

**Example 2: Auto-fix safe issues**
```
User: "/hygiene --fix"
→ Runs report, applies gitignore + rm-cached fixes
→ Commits result as "chore: hygiene auto-fix"
```

## Reference

Issue taxonomy: `SkillSearch('hygiene rules')` → loads `Reference/Rules.md`
