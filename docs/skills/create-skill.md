# CreateSkill

**Skill:** Skill creation framework and validation.

**Description:** Create and validate skills. USE WHEN create skill, new skill, skill structure, canonicalize.

---

## Overview

The CreateSkill skill provides a mandatory framework for creating new skills following PAI conventions.

## Authoritative Sources

**Before creating ANY skill, READ:**
- `~/.claude/skills/CORE/SkillSystem.md`

**Canonical example:**
- `~/.claude/skills/_BLOGGING/SKILL.md`

## Naming Convention

**TitleCase (PascalCase) is MANDATORY:**

| Component | Format | Example |
|-----------|--------|---------|
| Skill directory | TitleCase | `Blogging`, `Daemon` |
| Workflow files | TitleCase.md | `Create.md` |
| Reference docs | TitleCase.md | `ProsodyGuide.md` |
| Tool files | TitleCase.ts | `ManageServer.ts` |

**NEVER use:**
- `createskill`, `create-skill`, `CREATE_SKILL`
- `create.md`, `update-info.md`

## Flat Folder Structure

**Maximum depth:** 2 levels (`skills/SkillName/Category/`)

### ✅ ALLOWED

```
skills/SkillName/SKILL.md
skills/SkillName/Workflows/Create.md
skills/SkillName/Tools/Manage.ts
skills/SkillName/QuickStartGuide.md
```

### ❌ FORBIDDEN

```
skills/SkillName/Resources/Guide.md   # Context files in root
skills/SkillName/Workflows/Category/File.md  # 3 levels deep
```

**Allowed subdirectories:**
- `Workflows/` - Execution workflows only
- `Tools/` - Executable scripts only

## Dynamic Loading Pattern

For SKILL.md > 100 lines, use dynamic loading:

**SKILL.md** = Minimal (30-50 lines) - loads on invocation
- YAML frontmatter with triggers
- Brief description
- Workflow routing table

**Additional .md files** = Context files - loaded on-demand
- SOPs for specific aspects
- Can reference Workflows/, Tools/

**NEVER create:**
- `Context/` subdirectory
- `Docs/` subdirectory

## Workflow Routing

| Trigger | Workflow | File |
|---------|----------|------|
| "create a new skill" | CreateSkill | Workflows/CreateSkill.md |
| "validate skill" | ValidateSkill | Workflows/ValidateSkill.md |
| "update skill" | UpdateSkill | Workflows/UpdateSkill.md |
| "canonicalize" | CanonicalizeSkill | Workflows/CanonicalizeSkill.md |

## Examples

### Create New Skill
```
User: "Create a skill for managing my recipes"
→ Invokes CreateSkill workflow
→ Reads SkillSystem.md
→ Creates skill directory with TitleCase
→ Creates SKILL.md, Workflows/, Tools/
```

### Validate Existing Skill
```
User: "The research skill isn't triggering - validate it"
→ Invokes ValidateSkill workflow
→ Checks SKILL.md format
→ Verifies TitleCase naming
→ Reports compliance issues
```

## Related

- **See also:** All other skills (framework for creating new ones)

---

*Documentation generated from `skills/CreateSkill/SKILL.md` - Last updated: 2026-02-25*
