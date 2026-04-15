# Agents Index

Specialized sub-agents available in `~/.claude/agents/`. Invoked via the `Agent` tool or automatically when relevant.

| Agent | Purpose | When to invoke |
|-------|---------|----------------|
| [architect](architect.md) | System design and scalability specialist | Architectural decisions, new system design, large refactors |
| [build-error-resolver](build-error-resolver.md) | TypeScript and build error fixer | When `bun run build` or `tsc` fails |
| [code-reviewer](code-reviewer.md) | Code quality, security, and maintainability review | After writing or modifying any code |
| [code-simplifier](code-simplifier.md) | Post-implementation cleanup specialist | After completing a feature or fix — remove complexity |
| [database-reviewer](database-reviewer.md) | PostgreSQL query, schema, and migration specialist | Writing SQL, creating migrations, tuning queries |
| [doc-updater](doc-updater.md) | Documentation and codemap updater | After structural changes — update docs and codemaps |
| [e2e-runner](e2e-runner.md) | Playwright end-to-end test specialist | Generating, maintaining, or running E2E tests |
| [planner](planner.md) | Implementation planning for complex features | Before any non-trivial change — enter plan mode |
| [python-reviewer](python-reviewer.md) | Python code reviewer (PEP 8, type hints, security) | All Python code changes |
| [refactor-cleaner](refactor-cleaner.md) | Dead code and unused export removal | Codebase cleanup, removing stale code |
| [security-reviewer](security-reviewer.md) | Security vulnerability detection and remediation | After writing code handling user input, auth, or APIs |
| [tdd-guide](tdd-guide.md) | Test-Driven Development — write tests first | New features or bug fixes — enforces 80%+ coverage |
