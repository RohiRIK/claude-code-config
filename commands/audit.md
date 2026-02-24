# /audit — Read-Only System Auditor

Runs two isolated Gemini CLI instances (Flash + Pro) against the ~/.claude system and produces a ranked findings report.

**IMPORTANT**: This command is strictly read-only. It makes zero changes to any files. It only writes a report to `~/.claude/auditor/reports/`.

## Usage

```
/audit              # audits entire ~/.claude system
/audit <path>       # audits a specific file or subdirectory
```

## Examples

```
/audit
/audit hooks/SessionStart
/audit settings.json
/audit rules/
```

## What It Does

1. Collects all `.ts`, `.json`, `.md`, `.yaml` files from `~/.claude` (skips `audits/`, `.git`, `node_modules`, `projects/`)
2. Runs **Gemini Flash** (fast: syntax, consistency, schema errors) and **Gemini Pro** (deep: architecture, security, edge cases) in parallel
3. Each Gemini instance runs in an isolated throwaway config dir — no access to your personal Gemini settings
4. Merges findings, deduplicates, ranks by severity (CRITICAL → HIGH → MEDIUM → LOW)
5. Writes report to `~/.claude/auditor/reports/YYYY-MM-DD-HH-MM-<target>.md`
6. Prints summary

## What It Does NOT Do

- Does NOT modify any files
- Does NOT execute hooks or scripts
- Does NOT have access to your personal `~/.gemini` config

## After Running

Review findings and decide what to fix. After fixing, update context:
```
✓ Fixed audit finding: <title> in <file>
```

Execute:
```
bun run $HOME/.claude/auditor/index.ts $ARGUMENTS
```
