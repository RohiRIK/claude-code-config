# ContinuousLearning

**Skill:** Memory persistence and session context management.

**Description:** Manages memory persistence, session context, and automated learning from past interactions.

---

## Overview

The ContinuousLearning skill acts as the "Hippocampus" of the system - handles memory persistence, strategic compaction, and pattern extraction.

## Components

- **Tools**: TypeScript hooks at lifecycle events
- **Context**: Memory strategies definitions

## Hooks Integration

This skill provides logic for system hooks:

| Hook | File | Purpose |
|------|------|---------|
| SessionStart | `hooks/SessionStart/SessionStart.ts` | Inject context |
| SessionEnd | `hooks/SessionEnd/SessionEnd.ts` | Save session |
| PreCompact | `hooks/PreCompact/PreCompact.ts` | Assemble summary |
| SuggestCompact | `hooks/SuggestCompact/SuggestCompact.ts` | Suggest compaction |

## Manual Usage

### Force Session Evaluation
```bash
./hooks/EvaluateSession/EvaluateSession.ts
```

### Manual Compaction Suggestion
```bash
./hooks/SuggestCompact/SuggestCompact.ts
```

### Check Session Status
```bash
./hooks/SessionStart/SessionStart.ts
```

### Archive Current Session
```bash
./hooks/SessionEnd/SessionEnd.ts
```

## Workflow Routing

| Trigger | Workflow |
|---------|----------|
| "Learn this" | CaptureLesson |
| "Save lesson" | CaptureLesson |
| "Remember this" | CaptureLesson |

Run: `Run the CaptureLesson workflow`

## Related

- **Used by:** [Learned skill](learned.md)
- **See also:** [StrategicCompact skill](strategic-compact.md)

---

*Documentation generated from `skills/ContinuousLearning/SKILL.md` - Last updated: 2026-02-25*
