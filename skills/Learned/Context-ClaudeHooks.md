# Claude Code Hooks Receive JSON via Stdin

**Extracted:** 2026-01-22
**Context:** Building custom hooks for Claude Code

## Problem

Hook scripts don't receive session data (transcript path, session ID) via environment variables. Scripts checking `$CLAUDE_TRANSCRIPT_PATH` or similar will find them empty.

## Solution

Claude Code passes hook data as JSON through stdin. Read it with:

```bash
#!/bin/bash
input=$(cat)
transcript_path=$(echo "$input" | jq -r '.transcript_path // empty')
session_id=$(echo "$input" | jq -r '.session_id // empty')
```

## Available Fields in JSON

| Field | Description |
|-------|-------------|
| `transcript_path` | Path to session JSONL file |
| `session_id` | Unique session identifier |
| `cwd` | Current working directory |
| `hook_event_name` | Which hook triggered (Stop, PreToolUse, etc.) |

## Hook Types That Receive This

- `SessionStart`
- `PreToolUse` / `PostToolUse`
- `Stop` / `SubagentStop`
- `SessionEnd`
- `PreCompact`

## Example: Full Hook Template

```bash
#!/bin/bash
# Read JSON input from stdin
input=$(cat)

# Extract fields
transcript_path=$(echo "$input" | jq -r '.transcript_path // empty')
session_id=$(echo "$input" | jq -r '.session_id // empty')
cwd=$(echo "$input" | jq -r '.cwd // empty')
event=$(echo "$input" | jq -r '.hook_event_name // empty')

# Your logic here
if [ -n "$transcript_path" ] && [ -f "$transcript_path" ]; then
  # Process transcript
  message_count=$(grep -c '"type"' "$transcript_path" 2>/dev/null || echo "0")
  echo "[Hook] Session has $message_count messages" >&2
fi

# Pass through input for hook chaining
echo "$input"
```

## When to Use

- Building any custom Claude Code hook
- Accessing session transcript for analysis
- Creating session persistence/learning systems
- Extracting patterns from conversations
