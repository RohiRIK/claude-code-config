# ~/.claude/auditor

> Read-only, external auditing system for the Claude Code global config.

## Philosophy

The auditor treats your `~/.claude` system as an adversary would — assuming things are broken, insecure, or inconsistent until proven otherwise. It runs two independent AI models with different lenses, then merges their findings into a ranked report.

**Key principle: the auditor never makes changes.** It only observes and reports. You decide what to fix.

## How It Works

```
/audit [target]
       │
       ▼
  index.ts — collects files from ~/.claude
       │
       ├── reads all .ts .json .md .yaml (skips auditor/, .git, projects/)
       │
       ├── spawns 2 Gemini CLI instances IN PARALLEL
       │   ├── gemini-3-flash-preview  → fast checker (syntax, consistency, schema)
       │   └── gemini-3-pro-preview    → deep analyst (security, architecture, edge cases)
       │
       │   Each instance runs in an ISOLATED throwaway GEMINI_CONFIG_DIR
       │   (no access to your personal ~/.gemini session history)
       │
       ├── mergeFindings() — deduplicates, boosts consensus findings
       │
       ▼
  auditor/reports/YYYY-MM-DD-HH-MM-<target>.md
```

## The Two Auditors

### Gemini 3 Flash Preview — Fast Checker
- **Speed**: ~30-60s
- **Focus**: Concrete, line-level issues
- Syntax errors in JSON/YAML/TypeScript
- Broken file references in config
- Missing error handling on async operations
- Hardcoded secrets or API keys
- Naming inconsistencies

### Gemini 3 Pro Preview — Deep Analyst
- **Speed**: ~60-150s (uses extended thinking)
- **Focus**: System-level weaknesses
- Security: prompt injection, hook bypass, secret exposure
- Logic bugs: race conditions, unhandled failure modes
- Architecture: tight coupling, missing fallbacks, dead code
- Edge cases: what happens when files don't exist, git isn't initialized, HOME is unset
- Gaps in rules that would cause Claude to behave incorrectly

## Isolation Model

Each Gemini CLI instance gets a fresh throwaway `GEMINI_CONFIG_DIR`:

```
GEMINI_CONFIG_DIR=/tmp/audit-gemini-XXXX gemini --model ... --prompt ...
```

- No access to your personal Gemini session history
- No access to your Gemini conversation context
- OAuth credentials still work (HOME is preserved)
- Config dir is deleted immediately after the call

## Report Format

Reports are saved to `~/.claude/auditor/reports/` (gitignored).

```markdown
# Audit Report — 2026-02-24 12:36
**Files audited**: 13
**Gemini 3 Flash Preview**: 97010ms · **Gemini 3 Pro Preview**: 97009ms

## HIGH (1)

### Missing Error Handler *(consensus)*
- **File**: `hooks/SessionStart/SessionStart.ts:85`
- **Description**: ...
- **Fix**: ...
- **Flagged by**: gemini-3-flash-preview, gemini-3-pro-preview

## MEDIUM (2)
...
```

Severity levels:
- **CRITICAL** — data loss, security breach, or exploitable
- **HIGH** — fails under normal use
- **MEDIUM** — fails under edge cases
- **LOW** — minor risk or technical debt

Consensus findings (flagged by both models) are marked `*(consensus)*` — treat these as highest priority.

## Usage

```bash
/audit              # audit entire ~/.claude
/audit hooks        # audit specific directory
/audit settings.json  # audit single file
/audit rules        # audit rules directory
```

Or directly:
```bash
bun run ~/.claude/auditor/index.ts [target]
```

## File Structure

```
~/.claude/auditor/
├── index.ts          # Main orchestrator — collect, run, merge, write
├── package.json      # No runtime dependencies (uses Bun built-ins only)
├── prompts/
│   ├── flash.md      # System prompt for Gemini 3 Flash (fast checker persona)
│   └── pro.md        # System prompt for Gemini 3 Pro (adversarial analyst persona)
├── reports/          # Audit output (gitignored)
│   └── YYYY-MM-DD-HH-MM-<target>.md
└── README.md         # This file
```

## Workflow Integration

The auditor fits between implementation and commit:

```
implement → /simplify → /verify → /audit → /commit-push-pr
```

After running `/audit`:
1. Review findings by severity
2. Fix CRITICAL/HIGH before committing
3. Note MEDIUM in `context-gotchas.md`
4. Skip LOW unless they accumulate

## Ingestion Rules

On session start, if `~/.claude/auditor/reports/` contains reports from the last 48 hours, Claude will mention it briefly. See `~/.claude/rules/audit-ingestion.md` for the full protocol.

## Permissions

| Action | Allowed |
|--------|---------|
| Read files in `~/.claude` | YES |
| Write to `auditor/reports/` | YES |
| Modify any other file | **NO** |
| Execute hooks or scripts | **NO** |
| Access personal Gemini config | **NO** |
