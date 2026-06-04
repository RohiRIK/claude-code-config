---
name: SecurityReview
description: Audits code for vulnerabilities and secrets. USE WHEN reviewing code for security issues.
context: fork
agent: security-reviewer
allowed-tools: Read, Grep, Glob, Bash
---

# SecurityReview

Full security audit skill. Forks a `security-reviewer` subagent — does not run inline.

## Workflow Routing

| Workflow | Trigger |
|----------|---------|
| **AuditCode** | "audit security", "check vulnerabilities", "security review", "scan for secrets", "OWASP check", "is this code secure?" |

Run a workflow:
`Run the AuditCode workflow`

## What Gets Checked

- Hardcoded secrets, API keys, tokens (see `Overview.md` for full checklist)
- OWASP Top 10: injection, XSS, CSRF, broken auth, insecure deserialization
- Input validation gaps
- Path traversal, SSRF, command injection
- Insecure dependencies

Full checklist: `Overview.md` (12KB — loaded on demand by AuditCode workflow)

## Integration

- After writing auth/API/input-handling code → auto-trigger
- Before `/commit-push-pr` on security-sensitive changes → manual trigger
- Pairs with `code-reviewer` for complete post-implementation review
