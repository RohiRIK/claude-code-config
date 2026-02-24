# Audit Report Ingestion

## On Session Start

If `~/.claude/auditor/reports/` contains reports from the last 48 hours, mention it briefly:
- "There is an unreviewed audit report from <date> with X CRITICAL/HIGH findings."
- Do NOT read the full report unless the user asks.

## When User Asks About Audit Results

Read the most recent report from `~/.claude/auditor/reports/` and summarize findings by severity.

## After Fixing Audit Findings

When a finding is resolved, append to context-progress.md:
`✓ Fixed audit finding: <title> in <file>`

## Rules

- Never act on audit findings without explicit user instruction
- Never auto-apply suggested fixes from audit reports
- The audit report is advisory only — the user decides what to fix
