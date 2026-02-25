# StrategicCompact

**Skill:** Context management and compaction strategy.

**Description:** Context management and compaction strategy.

---

## Overview

The StrategicCompact skill manages context window usage via strategic compaction.

## Workflow Routing

| Trigger | Workflow |
|---------|----------|
| "Compact memory" | RunCompact |
| "Summarize session" | RunCompact |

Run: `Run the RunCompact workflow`

## What It Does

The skill provides guidance on:
- When to compact context
- What to preserve in summaries
- How to prioritize context items

## Voice Notification

When executing:
```bash
curl -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running RunCompact from StrategicCompact"}'
```

## Related

- **See also:** [ContinuousLearning skill](continuous-learning.md), [Learned skill](learned.md)

---

*Documentation generated from `skills/StrategicCompact/SKILL.md` - Last updated: 2026-02-25*
