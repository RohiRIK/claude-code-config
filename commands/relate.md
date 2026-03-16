---
description: "Link two memories with a typed relationship."
disable-model-invocation: true
argument-hint: "[src-id] [tgt-id] [supports|contradicts|refines|depends_on|related_to|supersedes]"
---

# /relate - Link Two Memories

Create a typed graph relationship between two existing memories.

## Usage

```
/relate <source_id> <target_id> <relationship_type>
```

## Relationship Types

| Type | Meaning |
|------|---------|
| `supports` | Source provides evidence for target |
| `contradicts` | Source conflicts with target |
| `refines` | Source is a more specific version of target |
| `depends_on` | Source requires target to be true/applied |
| `related_to` | General association |
| `supersedes` | Source replaces target (target is outdated) |

## Examples

```
/relate 3 7 supports
/relate 12 4 supersedes
/relate 5 9 related_to
```

## Process

1. Validate both memory IDs exist using `/recall` if needed
2. Call `relate()`:
   ```typescript
   import { relate } from "~/.claude/memory/db.js";
   relate({ source_id: 3, target_id: 7, relationship_type: "supports" });
   ```
3. Report: `Linked [3] → [7] (supports)`

## Notes

- Duplicate relations are silently ignored (INSERT OR IGNORE)
- Relations are directional: source → target
- Deleting either memory CASCADE-removes the relation
- Use `/recall` to see existing relations for any memory
