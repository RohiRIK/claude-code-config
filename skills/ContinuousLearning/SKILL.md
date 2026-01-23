---
name: ContinuousLearning
description: Manages memory persistence, session context, and automated learning from past interactions.
version: 1.0.0
---

# Continuous Learning

## Description
This skill acts as the "Hippocampus" of the system. It handles:
1.  **Memory Persistence**: Saving and loading session context.
2.  **Strategic Compaction**: Suggesting when to clear context to maintain performance.
3.  **Pattern Extraction**: Analyzing completed sessions to learn from mistakes and successes.

## Components
- **Tools**: TypeScript-based hooks that run at specific lifecycle events (Start, Stop, PreToolUse).
- **Context**: Definitions of memory strategies.

## Hooks Integration
This skill provides the executable logic for the following system hooks:
- `SessionStart` -> `hooks/SessionStart/SessionStart.ts`
- `SessionEnd` -> `hooks/SessionEnd/SessionEnd.ts` & `hooks/EvaluateSession/EvaluateSession.ts`
- `PreCompact` -> `hooks/PreCompact/PreCompact.ts`
- `PreToolUse` -> `hooks/SuggestCompact/SuggestCompact.ts`

## Tools & Manual Usage
While these tools are designed to run automatically via `hooks.json`, you can invoke them manually for specific tasks:

### 1. Force Session Evaluation
**Tool:** `hooks/EvaluateSession/EvaluateSession.ts`
**Usage:** Analyzes the current session logs to extract patterns.
```bash
./hooks/EvaluateSession/EvaluateSession.ts
```

### 2. Manual Compaction Suggestion
**Tool:** `hooks/SuggestCompact/SuggestCompact.ts`
**Usage:** Checks current tool usage count and returns status.
```bash
./hooks/SuggestCompact/SuggestCompact.ts
```

### 3. Check Session Status
**Tool:** `hooks/SessionStart/SessionStart.ts`
**Usage:** Displays the current session initialization status (logging only).
```bash
./hooks/SessionStart/SessionStart.ts
```

### 4. Archive Current Session
**Tool:** `hooks/SessionEnd/SessionEnd.ts`
**Usage:** Forces a write to the daily session log immediately.
```bash
./hooks/SessionEnd/SessionEnd.ts
```

## Workflow Routing

| Workflow | Description | Trigger |
| :--- | :--- | :--- |
| **CaptureLesson** | Log a new lesson or improvement. | `Learn this`, `Save lesson`, `Remember this` |

Run a workflow by name:
`Run the CaptureLesson workflow`