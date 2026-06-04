# CreateSkill — Conventions

Structural rules for all skills. Apply when creating or canonicalizing.

**Official docs:** https://code.claude.com/docs/en/skills

---

## TitleCase Naming Convention

**All naming must use TitleCase (PascalCase).**

| Component | Format | Example |
|-----------|--------|---------|
| Skill directory | TitleCase | `Blogging`, `Daemon`, `CreateSkill` |
| Workflow files | TitleCase.md | `Create.md`, `UpdateDaemonInfo.md` |
| Reference docs | TitleCase.md | `ProsodyGuide.md`, `ApiReference.md` |
| Tool files | TitleCase.ts | `ManageServer.ts` |
| Help files | TitleCase.help.md | `ManageServer.help.md` |

**Never use:** `createskill`, `create-skill`, `CREATE_SKILL`, `create.md`, `update-info.md`

---

## Flat Folder Structure (MANDATORY)

**Maximum depth:** `skills/SkillName/Category/` (2 levels)

### Allowed subdirectories

**ONLY these are allowed:**
- `Workflows/` — execution workflows only
- `Tools/` — executable scripts/tools only

Context files (docs, guides, references) go in the **skill root**, not subdirectories.

### Allowed
```
skills/SkillName/SKILL.md
skills/SkillName/Conventions.md      # context file in root ✓
skills/SkillName/Workflows/Create.md # one level deep ✓
skills/SkillName/Tools/Manage.ts     # one level deep ✓
```

### Forbidden
```
skills/SkillName/Resources/Guide.md          # context files not in Resources/ ✗
skills/SkillName/Workflows/Category/File.md  # three levels ✗
skills/SkillName/Context/                    # NEVER create Context/ ✗
```

---

## Dynamic Loading Pattern

**For SKILL.md > 100 lines:** Slim SKILL.md to 30-50 lines and move detail to context files.

| Layer | What it contains | When loaded |
|-------|-----------------|-------------|
| SKILL.md | Frontmatter, routing table, SkillSearch pointers | On skill invocation |
| Context files (root .md) | SOPs, guides, references | On-demand via SkillSearch |
| Workflows/ | Execution procedures | On workflow trigger |

### Minimal SKILL.md template

```markdown
---
name: SkillName
description: "[What it does]. USE WHEN [trigger]."
---

# SkillName

Brief description.

## Workflow Routing

| Workflow | Trigger | File |
|---------|---------|------|
| **WorkflowName** | "trigger" | `Workflows/WorkflowName.md` |

## Quick Reference

- Detail 1: `SkillSearch('skillname detail1')` → loads Detail1.md
- Detail 2: `SkillSearch('skillname detail2')` → loads Detail2.md
```

### NO Context/ subdirectory

Additional `.md` files ARE the context files. They live directly in skill root.

```
skills/Art/
├── SKILL.md          # minimal routing
├── Aesthetic.md      # context file ✓
├── Examples.md       # context file ✓
└── Workflows/
    └── Essay.md
```

---

## Prompt Authoring

A skill's SKILL.md, workflows, and context files are prompts — author them with the `Prompting` skill (`~/.claude/skills/Prompting/`).

- Start at `Prompting/Core.md` for the universal principles.
- Pick a structural frame from `Prompting/Frameworks.md` (RISEN fits agentic/workflow skills; COSTAR fits content-style ones).
- Since these skills run on Claude, apply `Prompting/vendors/Claude.md` — especially **imperative calibration**: reserve `CRITICAL` / `MUST` / `NEVER` for genuine safety or irreversibility gates. Everywhere else use plain declarative phrasing so eager models don't overtrigger.
- Use XML steering tags where they make structure clearer (Claude parses them well).
