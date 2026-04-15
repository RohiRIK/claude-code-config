# Hooks Index

Lifecycle hooks in `~/.claude/hooks/`. Each fires automatically at a specific Claude Code event.

| Hook | Trigger | Purpose |
|------|---------|---------|
| [SessionStart](session-start.md) | Session begins | Restores project context from LTM, injects codebase summary and recent memories |
| [PreCompact](pre-compact.md) | Before context compaction | Writes `context-summary.md` from SQLite so context survives compaction |
| [EvaluateSession](evaluate-session.md) | Session ends | Scores session quality, logs to LTM |
| [Cleanup](cleanup.md) | Session ends | Final cleanup tasks after session completes |
| [UpdateContext](update-context.md) | Session end (Stop hook) | Saves progress, decisions, and gotchas back to SQLite LTM |
| [SuggestCompact](suggest-compact.md) | After every ~50 tool uses | Warns when context is getting large and suggests compaction |
| [PrePlan](pre-plan.md) | UserPromptSubmit | Injects git state, recent commits, and relevant LTM memories before planning |
| [SessionAutoName](session-auto-name.md) | First prompt of session | Auto-names the session based on the first prompt |
| [SkillGuard](skill-guard.md) | Skill invocation | Validates skill invocation and guards against misuse |
| [overview](overview.md) | — | Full hook inventory and lifecycle overview |
