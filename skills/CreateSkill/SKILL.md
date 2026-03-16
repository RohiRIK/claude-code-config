---
name: CreateSkill
description: "USE WHEN creating, validating, updating, or canonicalizing a skill."
---

# CreateSkill

Framework for creating and maintaining skills in the correct canonical structure.

## Workflow Routing

| Workflow | Trigger | File |
|----------|---------|------|
| **CreateSkill** | "create a new skill" | `Workflows/CreateSkill.md` |
| **ValidateSkill** | "validate skill", "check skill" | `Workflows/ValidateSkill.md` |
| **UpdateSkill** | "update skill", "add workflow" | `Workflows/UpdateSkill.md` |
| **CanonicalizeSkill** | "canonicalize", "fix skill structure" | `Workflows/CanonicalizeSkill.md` |

## Quick Reference

- Structural rules: `SkillSearch('createskill conventions')` → loads `Conventions.md`
- Frontmatter fields & tier system: `SkillSearch('createskill frontmatter')` → loads `Frontmatter.md`
- Official docs: https://code.claude.com/docs/en/skills

## Examples

**Example 1: Create a new skill from scratch**
```
User: "Create a skill for managing my recipes"
→ Invokes CreateSkill workflow
→ Loads Conventions.md for structure rules
→ Loads Frontmatter.md to classify tier and set fields
→ Creates skill directory with TitleCase naming
```

**Example 2: Fix a skill that's not routing properly**
```
User: "The research skill isn't triggering - validate it"
→ Invokes ValidateSkill workflow
→ Checks SKILL.md frontmatter, tier, description ≤15 words
→ Reports compliance issues with fixes
```

**Example 3: Canonicalize a skill with old naming**
```
User: "Canonicalize the daemon skill"
→ Invokes CanonicalizeSkill workflow
→ Renames files to TitleCase, updates routing table
→ Verifies all checklist items pass
```
