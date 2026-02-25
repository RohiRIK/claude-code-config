# Auditor Overview

> External security audit system using dual AI models.

---

## Overview

The auditor treats your Claude Code system as an adversary would - assuming things are broken, insecure, or inconsistent until proven otherwise. It runs two independent AI models, then merges findings into a ranked report.

**Key principle:** The auditor never makes changes. It only observes and reports.

## How It Works

```
/audit [target]
       │
       ▼
  index.ts — collects files from ~/.claude
       │
       ├── reads all .ts .json .md .yaml
       │   (skips auditor/, .git, projects/)
       │
       ├── spawns 2 Gemini CLI instances IN PARALLEL
       │   ├── gemini-3-flash-preview  → fast checker
       │   └── gemini-3-pro-preview    → deep analyst
       │
       ├── mergeFindings() — deduplicates, boosts consensus
       │
       ▼
  auditor/reports/YYYY-MM-DD-HH-MM-<target>.md
```

## The Two Auditors

### Gemini 3 Flash Preview — Fast Checker
- **Speed:** ~30-60s
- **Focus:** Line-level issues
- **Checks:**
  - Syntax errors in JSON/YAML/TypeScript
  - Broken file references
  - Missing error handling
  - Hardcoded secrets
  - Naming inconsistencies

### Gemini 3 Pro Preview — Deep Analyst
- **Speed:** ~60-150s (extended thinking)
- **Focus:** System-level weaknesses
- **Checks:**
  - Security: prompt injection, hook bypass
  - Logic bugs: race conditions
  - Architecture: tight coupling
  - Edge cases: missing fallbacks

## Isolation Model

Each Gemini instance runs in a fresh throwaway config:

```bash
GEMINI_CONFIG_DIR=/tmp/audit-gemini-XXXX gemini --model ... --prompt ...
```

- No access to personal session history
- No access to conversation context
- OAuth credentials still work
- Config dir deleted after call

## Report Format

```markdown
# Audit Report — 2026-02-24 12:36
**Files audited**: 13
**Gemini 3 Flash Preview**: 97010ms · **Gemini 3 Pro Preview**: 97009ms

## HIGH (1)

### Missing Error Handler *(consensus)*
- **File:** `hooks/SessionStart/SessionStart.ts:85`
- **Description:** ...
- **Fix:** ...
- **Flagged by:** gemini-3-flash-preview, gemini-3-pro-preview

## MEDIUM (2)
...
```

## Severity Levels

| Level | Meaning |
|-------|---------|
| CRITICAL | Data loss, security breach, exploitable |
| HIGH | Fails under normal use |
| MEDIUM | Fails under edge cases |
| LOW | Minor risk or technical debt |

**Consensus:** Flagged by both models - highest priority.

## Usage

```bash
/audit              # audit entire ~/.claude
/audit hooks        # audit hooks directory
/audit settings.json # audit single file
/audit rules        # audit rules directory
```

## File Structure

```
~/.claude/auditor/
├── index.ts          # Main orchestrator
├── package.json      # No runtime deps (Bun only)
├── prompts/
│   ├── flash.md     # Fast checker persona
│   └── pro.md       # Deep analyst persona
└── reports/         # Audit output (gitignored)
```

## Workflow Integration

```
implement → /simplify → /verify → /audit → /commit-push-pr
```

After /audit:
1. Review findings by severity
2. Fix CRITICAL/HIGH before commit
3. Note MEDIUM in context-gotchas.md
4. Skip LOW unless accumulating

## Ingestion Rules

On session start, if recent reports exist (48h), Claude mentions them briefly.

## Permissions

| Action | Allowed |
|--------|---------|
| Read files in ~/.claude | YES |
| Write to auditor/reports/ | YES |
| Modify any other file | NO |
| Execute hooks or scripts | NO |
| Access personal Gemini config | NO |

---

*Documentation generated from `auditor/README.md` - Last updated: 2026-02-25*
