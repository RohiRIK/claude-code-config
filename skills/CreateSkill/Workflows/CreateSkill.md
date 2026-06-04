# CreateSkill Workflow

Create a new skill following the canonical structure with proper TitleCase naming.

## Step 1: Load Reference Docs

```
SkillSearch('createskill conventions')   → loads Conventions.md (structure rules)
SkillSearch('createskill frontmatter')   → loads Frontmatter.md (tier system + fields)
```

The skill's content is a prompt — author it with the `Prompting` skill (`~/.claude/skills/Prompting/`): universal principles in `Core.md`, a structural frame from `Frameworks.md` (RISEN suits agentic/workflow skills), and Claude-specific calibration in `vendors/Claude.md`. Reserve forceful imperatives (`CRITICAL`/`MUST`/`NEVER`) for genuine safety gates; use plain declarative phrasing elsewhere so eager models don't overtrigger.

## Step 2: Understand the Request

Ask the user:
1. What does this skill do?
2. What should trigger it?
3. What workflows does it need?
4. Is it user-invoked only (Tier B), always-on reference (Tier A), auto-trigger (Tier C), or heavy/forked (Tier D)?

## Step 3: Determine TitleCase Names

All names must use TitleCase (PascalCase). See Conventions.md for full table.

| Component | Example |
|-----------|---------|
| Skill directory | `Blogging`, `Daemon`, `CreateSkill` |
| Workflow files | `Create.md`, `UpdateDaemonInfo.md` |
| Tool files | `ManageServer.ts` |

## Step 4: Create the Skill Directory

```bash
mkdir -p ~/.claude/skills/[SkillName]/Workflows
mkdir -p ~/.claude/skills/[SkillName]/Tools
```

## Step 5: Create SKILL.md

Use minimal template (30-50 lines). Set frontmatter based on tier (see Frontmatter.md):

```yaml
---
name: SkillName
description: "[What it does]. USE WHEN [trigger]."
# Add tier-specific fields: disable-model-invocation, user-invocable, context: fork, etc.
---

# SkillName

Brief description.

## Workflow Routing

| Workflow | Trigger | File |
|---------|---------|------|
| **WorkflowName** | "trigger phrase" | `Workflows/WorkflowName.md` |

## Examples

**Example 1: [Common use case]**
```
User: "[Typical user request]"
→ Invokes WorkflowName workflow
→ [What skill does]
```
```

## Step 6: Create Workflow Files

For each workflow in the routing table:

```bash
touch ~/.claude/skills/[SkillName]/Workflows/[WorkflowName].md
```

### Workflow-to-Tool Integration (if skill has CLI tools)

If a workflow calls a CLI tool, include an intent-to-flag mapping table:

```markdown
## Intent-to-Flag Mapping

| User Says | Flag | When to Use |
|-----------|------|-------------|
| "fast", "quick" | `--model haiku` | Speed priority |
| (default) | `--model sonnet` | Balanced |

## Execute Tool

\`\`\`bash
bun ToolName.ts [FLAGS_FROM_INTENT_MAPPING] --required-param "value"
\`\`\`
```

## Step 7: Final Checklist

### Naming (TitleCase)
- [ ] Skill directory uses TitleCase
- [ ] All workflow files use TitleCase
- [ ] Routing table workflow names match file names exactly

### YAML Frontmatter
- [ ] `name:` uses TitleCase
- [ ] `description:` states WHAT + WHEN, ≤30 words (auto-trigger: `[WHAT]. USE WHEN [trigger].`)
- [ ] Correct tier fields set (see Frontmatter.md)
- [ ] `argument-hint` present if skill takes arguments

### Markdown Body
- [ ] `## Workflow Routing` section with table format
- [ ] `## Examples` section with 2-3 concrete usage patterns

### Structure
- [ ] No `Context/` or `Docs/` subdirectory — context files go in skill root
- [ ] SKILL.md ≤ 50 lines (use dynamic loading if needed)

## Done

Skill created following canonical structure with proper TitleCase naming throughout.
