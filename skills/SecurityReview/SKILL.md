---
name: SecurityReview
description: "USE WHEN auditing code for vulnerabilities and security issues."
context: fork
agent: Explore
allowed-tools: Read, Grep, Glob, Bash
---

# SecurityReview

Security auditing and best practices enforcement.

## Workflow Routing

| Workflow | Description | Trigger |
| :--- |
| :--- | :--- |
| **AuditCode** | Perform security audit on code. | `Audit security`, `Check for vulnerabilities`, `Security review` |

Run a workflow by name:
`Run the AuditCode workflow`

*(See `Overview.md` for the full checklist)*