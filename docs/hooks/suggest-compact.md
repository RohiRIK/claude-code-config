# SuggestCompact Hook

**File:** `hooks/SuggestCompact/SuggestCompact.ts`

**Trigger:** After every ~50 tool uses

**Purpose:** Suggest context compaction when tool count is high

---

## Overview

The SuggestCompact hook tracks tool usage and suggests compaction when approaching context limits.

## Logic Flow

```
1. Read tool counter from tmp/
2. Increment counter
3. If counter > THRESHOLD (50):
   → Output suggestion message
   → Reset counter
```

## Input

```json
{
  "tool_name": "Read",
  "tool_count": 50
}
```

## Output

When threshold reached:
```
🔔 Context Reminder

You've used 50+ tools. Consider running /compact to free up context space.
This helps maintain performance as the session grows.
```

## Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| THRESHOLD | 50 | Tools before suggestion |

## Counter File

Location: `~/.claude/tmp/session-tool-count.txt`

## Related

- **See also:** [PreCompact](pre-compact.md), [StrategicCompact skill](../skills/strategic-compact.md)

---

*Documentation generated from hooks implementation patterns - Last updated: 2026-02-25*
