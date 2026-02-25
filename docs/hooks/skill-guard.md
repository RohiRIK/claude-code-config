# SkillGuard Hook

**File:** `hooks/SkillGuard/SkillGuard.ts`

**Trigger:** Skill invocation

**Purpose:** Prevent false-positive skill triggers

---

## Overview

The SkillGuard hook prevents unintended skill activations by analyzing if the user truly intends to invoke a skill.

## Logic Flow

```
1. Capture user input
2. Analyze for skill trigger keywords
3. Check context for false positives:
   - "keybindings-help" → not "keybindings"
   - "skill" in different context
4. Block false positives
5. Allow genuine invocations
```

## False Positive Examples

| Input | Guard Action |
|-------|--------------|
| "I need help with keybindings" | Block (meant help, not skill) |
| "that skill was great" | Block (commentary) |
| "use the art skill to generate" | Allow (genuine) |
| "run the tdd workflow" | Allow (genuine) |

## Purpose

Prevents skill overhead when user is:
- Asking for help about a skill
- Making casual references
- Discussing skills rather than invoking them

## Related

- **See also:** [All Skills](../skills/)

---

*Documentation generated from hooks implementation patterns - Last updated: 2026-02-25*
