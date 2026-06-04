# UpdateSkill Workflow

**Purpose:** Add workflows or modify an existing skill while maintaining canonical structure and TitleCase naming.

---

## Step 1: Load Reference Docs

```
SkillSearch('createskill conventions')   → loads Conventions.md (structure rules)
SkillSearch('createskill frontmatter')   → loads Frontmatter.md (tier system + fields)
```

---

## Step 2: Read the Current Skill

```
~/.claude/skills/[SkillName]/SKILL.md
```

Understand the current:
- Description (single-line, WHAT + WHEN, ≤30 words)
- Tier classification (Tier A/B/C/D)
- Workflow routing table
- Existing TitleCase naming

---

## Step 3: Understand the Update

What needs to change?
- Adding a new workflow?
- Modifying the description/triggers?
- Changing the tier classification?
- Updating documentation?

---

## Step 4: Make Changes

### To Add a New Workflow:

1. **Determine TitleCase name:**
   - ✓ `Create.md`, `UpdateDaemonInfo.md`, `SyncRepo.md`
   - ✗ `create.md`, `update-daemon-info.md`, `SYNC_REPO.md`

2. **Create the workflow file:**
```bash
touch ~/.claude/skills/[SkillName]/Workflows/[WorkflowName].md
```

3. **Add entry to `## Workflow Routing` section in SKILL.md:**
```markdown
| **NewWorkflow** | "new trigger" | `Workflows/NewWorkflow.md` |
```

4. **Write the workflow content**

### To Update Description/Triggers:

Modify the single-line `description` in YAML frontmatter. State WHAT + WHEN, ≤30 words, correct format for tier (see Frontmatter.md):
```yaml
description: "[What it does]. USE WHEN [trigger]."
```

### To Change Tier Classification:

Add/remove the appropriate field (see Frontmatter.md tier table):
- Tier B: add `disable-model-invocation: true`
- Tier A: add `user-invocable: false`
- Tier D: add `context: fork` + `agent: <type>`

### To Add a Tool:

1. **Create TitleCase tool file:**
```bash
touch ~/.claude/skills/[SkillName]/Tools/ToolName.ts
touch ~/.claude/skills/[SkillName]/Tools/ToolName.help.md
```

---

## Step 5: Final Checklist

### Naming
- [ ] New workflow files use TitleCase
- [ ] New tool files use TitleCase
- [ ] Routing table names match file names exactly

### Structure
- [ ] YAML still has single-line description (WHAT + WHEN, ≤30 words)
- [ ] Correct tier fields set
- [ ] No separate `triggers:` or `workflows:` arrays in YAML
- [ ] All routes point to existing files

---

## Done

Skill updated while maintaining canonical structure and TitleCase naming.
