# Learned

**Skill:** Retrieval system for learned patterns and lessons.

**Description:** Retrieval system for learned patterns and lessons.

---

## Overview

The Learned skill provides access to the knowledge base of learned patterns from past sessions.

## Workflow Routing

| Trigger | Workflow |
|---------|----------|
| "Recall pattern" | Recall |
| "How did we do X?" | Recall |
| "Learned lessons" | Recall |

Run: `Run the Recall workflow`

## What It Does

The skill retrieves patterns from:
- `skills/Learned/patterns/` - Daily session patterns
- `skills/Learned/summary.md` - Aggregated summary

## Pattern Storage

Location: `~/.claude/skills/Learned/patterns/YYYY-MM-DD.md`

Contains:
- Errors encountered
- Tools used (with counts)
- Files modified

**Note:** Never injected into Claude's context - reference only.

## Related

- **Used by:** [ContinuousLearning skill](continuous-learning.md)
- **See also:** [StrategicCompact skill](strategic-compact.md)

---

*Documentation generated from `skills/Learned/SKILL.md` - Last updated: 2026-02-25*
