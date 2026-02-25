# SecurityReview (Skill)

**Skill:** Security auditing and vulnerability scanning.

**Description:** Security auditing, checklist validation, and vulnerability scanning.

---

## Overview

The SecurityReview skill provides security audit checklists and vulnerability scanning procedures.

## Workflow Routing

| Trigger | Workflow |
|---------|----------|
| "Audit security" | AuditCode |
| "Check for vulnerabilities" | AuditCode |
| "Security review" | AuditCode |

Run: `Run the AuditCode workflow`

## What It Does

The skill performs security audits using checklists from `Context-Security.md`:

### Audit Categories
- Authentication/Authorization
- Input Validation
- Data Protection
- Session Management
- API Security
- Dependency Security

## Voice Notification

When executing:
```bash
curl -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running AuditCode from SecurityReview"}'
```

## Related

- **See also:** [security-reviewer agent](../agents/security-reviewer.md), [Goose skill](goose.md)

---

*Documentation generated from `skills/SecurityReview/SKILL.md` - Last updated: 2026-02-25*
