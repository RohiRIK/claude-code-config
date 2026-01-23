---
name: StrategicCompact
description: Context management and compaction strategy.
---

# StrategicCompact

Manage context window usage via strategic compaction.

## Customization

**Before executing, check for user customizations at:**
`~/.claude/skills/CORE/USER/SKILLCUSTOMIZATIONS/StrategicCompact/`

## Voice Notification

**When executing a workflow, do BOTH:**

1. **Send voice notification**:
   ```bash
   curl -s -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running the WORKFLOWNAME workflow from the StrategicCompact skill"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text notification**:
   ```
   Running the **WorkflowName** workflow from the **StrategicCompact** skill...
   ```

## Workflow Routing

| Workflow | Description | Trigger |
| :--- | :--- | :--- |
| **RunCompact** | Execute strategic context compaction. | `Compact memory`, `Summarize session` |

Run a workflow by name:
`Run the RunCompact workflow`