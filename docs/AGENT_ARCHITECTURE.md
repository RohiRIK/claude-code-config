# Agent Architecture

> Claude Code global configuration architecture. Last updated: 2026-02-25

## Overview

This document describes the architecture of the Claude Code agent system - how agents, skills, hooks, and the auditor work together to provide an intelligent, self-maintaining development environment.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER INTERFACE                                 │
│                   (Claude Code CLI / IDE Plugin)                        │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           SESSION LIFECYCLE                             │
│                                                                         │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐       │
│   │ Session  │───▶│  Claude   │───▶│ PreCompact│───▶│  Session  │       │
│   │  Start   │    │  Working  │    │   Hook    │    │   End     │       │
│   └──────────┘    └──────────┘    └──────────┘    └──────────┘       │
│        │                │                │                │             │
│        ▼                ▼                ▼                ▼             │
│   ┌─────────┐    ┌────────────┐  ┌────────────┐  ┌───────────┐      │
│   │Context  │    │   Agents   │  │  Context   │  │Evaluate   │      │
│   │Inject   │    │ (on-demand)│  │  Summary   │  │Session    │      │
│   └─────────┘    └────────────┘  └────────────┘  └───────────┘      │
└─────────────────────────────────────────────────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│     AGENTS      │   │     SKILLS     │   │     HOOKS      │
│  (Specialists)  │   │   (Tools)      │   │  (Lifecycle)   │
│                 │   │                 │   │                │
│ - planner       │   │ - Art          │   │ - SessionStart │
│ - architect     │   │ - Goose        │   │ - PreCompact   │
│ - code-reviewer │   │ - Prompting    │   │ - EvaluateSession
│ - security-     │   │ - agent-browser│   │ - Cleanup     │
│   reviewer       │   │ - TddWorkflow │   │ - SuggestCompact
│ - tdd-guide     │   │ - ...         │   │ - ...         │
└─────────────────┘   └─────────────────┘   └─────────────────┘
          │                       │                       │
          └───────────────────────┼───────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              AUDITOR                                     │
│                    (Dual-AI Security Audit)                             │
│                                                                         │
│   ┌─────────────┐     ┌─────────────┐                                  │
│   │  Gemini 3   │     │   Gemini 3  │                                  │
│   │   Flash    │     │     Pro     │                                  │
│   │(fast check)│────▶│ (deep audit)│────▶ Merge Findings              │
│   └─────────────┘     └─────────────┘                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Component Types

### Agents
Specialized AI specialists invoked for specific tasks. Each agent has a focused role:

| Agent | Purpose | Model |
|-------|---------|-------|
| `planner` | Create implementation plans | opus |
| `architect` | System design decisions | opus |
| `build-error-resolver` | Fix TypeScript/build errors | opus |
| `code-reviewer` | Code quality review | opus |
| `database-reviewer` | PostgreSQL/Supabase review | sonnet |
| `doc-updater` | Documentation generation | opus |
| `e2e-runner` | Playwright E2E tests | opus |
| `python-reviewer` | Python code review | sonnet |
| `refactor-cleaner` | Dead code removal | opus |
| `security-reviewer` | Security vulnerability detection | opus |
| `tdd-guide` | Test-driven development | opus |

**Invocation:** Agents are invoked by slash commands or automatically by Claude when relevant.

---

### Skills
Modular tool systems that provide capabilities. Skills contain workflows and tools:

| Skill | Purpose |
|-------|---------|
| `Art` | Visual content generation (diagrams, illustrations) |
| `Goose` | Parallel agent orchestration |
| `Prompting` | Prompt engineering templates |
| `agent-browser` | Browser automation |
| `TddWorkflow` | Test-driven development orchestration |
| `SecurityReview` | Security audit checklists |
| `ContinuousLearning` | Memory persistence |
| `StrategicCompact` | Context management |
| `FrontendDesign` | React/UI patterns |
| `BackendDesign` | API/database patterns |
| `CreateSkill` | Skill creation framework |
| `docker-patterns` | Docker best practices |
| `ContentWriter` | Blog/LinkedIn/X content |

**Invocation:** Skills are invoked via the Skill tool when user requests match skill triggers.

---

### Hooks
Lifecycle-triggered scripts that run at specific events:

| Hook | Trigger | Purpose |
|------|---------|---------|
| `SessionStart` | Session begins | Inject project context |
| `PreCompact` | Before compaction | Assemble context summary |
| `EvaluateSession` | Session ends | Extract learning patterns |
| `Cleanup` | Session ends | Trim context files |
| `SuggestCompact` | Every ~50 tools | Suggest compaction |
| `SessionAutoName` | First prompt | Set terminal tab title |
| `SkillGuard` | Skill invocation | Prevent false triggers |
| `UpdateContext` | Session end | Update progress |

**Invocation:** Hooks run automatically based on Claude Code events.

---

### Auditor
External security audit system using dual AI models:

- **Gemini 3 Flash Preview**: Fast line-level checks (~30-60s)
- **Gemini 3 Pro Preview**: Deep adversarial analysis (~60-150s)

**Invocation:** Run via `/audit` command or manually.

---

## Execution Flows

### Flow 1: User Invokes Agent

```
User: /plan add authentication
        │
        ▼
Claude Code recognizes /plan command
        │
        ▼
Invokes planner agent
        │
        ▼
Agent analyzes, creates plan, waits for confirmation
        │
        ▼
User confirms "yes"
        │
        ▼
Claude implements plan
```

### Flow 2: Skill Invoked

```
User: "create a diagram showing the flow"
        │
        ▼
Claude identifies "Art" skill trigger
        │
        ▼
Loads Art skill
        │
        ▼
Routes to "TechnicalDiagrams" workflow
        │
        ▼
Executes skill tools, generates image
```

### Flow 3: Hook Lifecycle

```
1. Session Start
   User opens project in Claude Code
        │
        ▼
   SessionStart hook fires
        │
        ▼
   Reads ~/.claude/projects/<name>/context-summary.md (registry lookup)
        │
        ▼
   Injects context into Claude's prompt

2. During Session
   Claude maintains context files
   (goals, decisions, progress, gotchas)

3. Pre-Compact
   Context window filling up
        │
        ▼
   PreCompact hook fires
        │
        ▼
   Assembles 4 context files → context-summary.md

4. Session End
   User stops session
        │
        ▼
   EvaluateSession hook → saves patterns
   Cleanup hook → trims old data
```

---

## Directory Structure

```
~/.claude/
├── agents/                    # 11 agent definitions
│   ├── planner.md
│   ├── architect.md
│   └── ...
├── skills/                    # 13 skills
│   ├── Art/
│   │   ├── SKILL.md
│   │   ├── Workflows/
│   │   └── Tools/
│   ├── Goose/
│   └── ...
├── hooks/                    # Lifecycle hooks
│   ├── SessionStart/
│   ├── PreCompact/
│   ├── EvaluateSession/
│   └── ...
├── projects/                 # Per-project context
│   └── -Users-roh-projects-myapp/
│       ├── context-summary.md
│       ├── context-goals.md
│       └── ...
├── rules/                    # Claude Code rules
├── settings.json             # Hooks configuration
└── docs/                    # This documentation
    ├── AGENT_ARCHITECTURE.md
    ├── agents/
    ├── skills/
    ├── hooks/
    └── auditor/
```

---

## Context System

The context system persists knowledge across sessions:

```
~/.claude/projects/<name>/   # friendly name from registry.json
├── context-summary.md    # Injected at session start (60 lines max)
├── context-goals.md      # Current goal (1-3 lines)
├── context-decisions.md  # Architectural decisions (permanent)
├── context-progress.md   # Completed tasks (trimmed to 20 items)
└── context-gotchas.md   # Warnings/blockers (permanent)
```

**Slug derivation:** `/Users/roh/projects/myapp` → `-Users-roh-projects-myapp`

---

## Related Documentation

- [Agents](agents/) - Detailed agent documentation
- [Skills](skills/) - Skill reference and workflows
- [Hooks](hooks/) - Lifecycle hook documentation
- [Auditor](auditor/) - Security audit system

---

## Contributing

This architecture evolves with the system. When adding new:
- **Agents**: Add to `agents/` and reference in docs/agents/
- **Skills**: Create in `skills/` with SKILL.md
- **Hooks**: Add to `hooks/` and document in docs/hooks/
- **Update this file**: Maintain the architecture overview
