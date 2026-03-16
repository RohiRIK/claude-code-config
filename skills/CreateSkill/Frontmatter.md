# CreateSkill — Frontmatter Reference

All frontmatter fields and the tier system for classifying skills.

**Official docs (authoritative — check for new fields):** https://code.claude.com/docs/en/skills

---

## Tier System

| Tier | Use case | Required frontmatter |
|------|----------|---------------------|
| A — Auto-knowledge | Passive reference, never user-invoked | `user-invocable: false` |
| B — User-command | Explicit `/name` only, Claude never auto-fires | `disable-model-invocation: true` |
| C — Auto-trigger | Claude decides when to load (default) | *(no extra flags)* |
| D — Fork | Heavy tasks, run in isolated subagent | `context: fork` + `agent: <type>` |

---

## All Frontmatter Fields

### `name`
- Lowercase, hyphens, max 64 chars (e.g. `create-skill`, `tdd-workflow`)

### `description`
- ≤15 words, intent-focused (see format rules below)
- This is what Claude uses for routing — make it unambiguous

### `disable-model-invocation`
- `true` for Tier B — skill only fires when user types `/skill-name`
- Claude will never auto-invoke it

### `user-invocable`
- `false` for Tier A — skill never appears in user autocomplete
- Use for pure background reference material

### `argument-hint`
- Shows expected args in autocomplete UI
- Examples: `[memory-id]`, `[query]`, `[skill-name]`

### `allowed-tools`
- Restrict which tools the skill can use
- Example: `Read, Grep` for read-only audit skills
- Omit to allow all tools (default)

### `context`
- `fork` for Tier D — runs skill in isolated subagent
- Prevents heavy workflows from consuming parent context

### `agent`
- Which agent type to use when `context: fork`
- Values: `Explore`, `general-purpose`, `Plan`

### `hooks`
- Skill-scoped lifecycle hooks (e.g. run a script before/after)

---

## Description Format Rules

| Tier | Format | Example |
|------|--------|---------|
| A (auto-knowledge) | Plain noun phrase | `"Reference for Docker Compose patterns."` |
| B (user-command) | Imperative | `"Run E2E tests for the current project."` |
| C/D (auto-trigger) | `"USE WHEN [user intent]."` | `"USE WHEN creating or validating a skill."` |

**Never:**
- Keyword lists: `"skill, create, validate, structure"` ✗
- `SkillSearch()` calls in description ✗
- More than 15 words ✗

---

## $ARGUMENTS Substitution

Skills can reference `$ARGUMENTS` to capture dynamic content passed after the skill name.

```markdown
---
name: recall
argument-hint: [query]
---

Search LTM for: $ARGUMENTS
```

When user types `/recall docker patterns`, `$ARGUMENTS` becomes `docker patterns`.

---

## Example: Tier B Skill

```yaml
---
name: commit
description: "Stage, commit, and push changes with a conventional message."
disable-model-invocation: true
argument-hint: [optional message]
---
```

## Example: Tier D Skill

```yaml
---
name: security-audit
description: "USE WHEN auditing code for vulnerabilities."
context: fork
agent: general-purpose
allowed-tools: Read, Grep, Glob
---
```
