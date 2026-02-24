# /audit — Read-Only System Auditor

Runs two isolated Gemini CLI instances (Flash + Pro) and produces a ranked findings report.

**IMPORTANT**: Strictly read-only. Only writes to `~/.claude/auditor/reports/`.

## Modes

| Command | What it audits | Time |
|---------|---------------|------|
| `/audit` | **Core** — rules, hooks, agents, settings.json, CLAUDE.md | ~2 min |
| `/audit full` | **All subsystems in parallel** — core + skills | ~3 min |
| `/audit <path>` | **Targeted** — specific file or directory | ~2 min |

## Examples

```
/audit                    # core system (recommended daily driver)
/audit full               # all subsystems in parallel
/audit hooks              # just hooks
/audit skills/ContentWriter
/audit settings.json
```

## What It Does

1. Collects `.ts`, `.json`, `.md`, `.yaml` files from target (skips `auditor/`, `.git`, `node_modules`, `projects/`, `image-cache/`)
2. Runs **Gemini Flash** (syntax, consistency, schema) and **Gemini Pro** (architecture, security, cross-file issues) in parallel
3. Each instance runs in an isolated throwaway config dir
4. Merges findings, deduplicates, ranks by severity (CRITICAL → HIGH → MEDIUM → LOW)
5. If a model times out, report shows ⚠️ WARNING — results are incomplete
6. Writes report to `~/.claude/auditor/reports/YYYY-MM-DD-HH-MM-<mode>.md`

## After Running

Review findings and decide what to fix. Update context after fixing:
```
✓ Fixed audit finding: <title> in <file>
```

Execute:
```
bun run $HOME/.claude/auditor/index.ts $ARGUMENTS
```
