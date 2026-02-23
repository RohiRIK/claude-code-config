# AGENTS GUIDE (Mixedbread mgrep)

> Orientation for coding agents working in this repo. Keep this handy; follow commands and conventions before editing.

## Project Snapshot
- Runtime: Node.js 18+ (CI uses 20/24)
- Language: TypeScript 5.x, ESM (`"type": "module"`, `module: "NodeNext"`)
- Package manager: pnpm (lockfile present)
- Lint/format: Biome (`biome.json`), import organize on save
- Tests: bats (Bash Automated Testing System)
- Dist: `tsc` outputs to `dist/`; CLI entry `dist/index.js`

## How to Build/Test Fast
- Install deps: `pnpm install`
- Build: `pnpm build`
- Dev run CLI: `pnpm dev` (compiles then runs `dist/index.js`)
- Type check only: `pnpm typecheck`
- Lint/format fix: `pnpm format`
- Lint/format check (CI): `pnpm format:check`
- Lint only: `pnpm lint`
- Run all tests (default short): `pnpm test`
- Run all including long-running: `pnpm test --filter-tags long-running`
- Run a single bats test by name: `bats test/test.bats --filter "pattern"`
- Run a single bats test by tag: `bats test/test.bats --filter-tags tagname`
- CI pipeline order: format:check → test (long-running) → typecheck → build

## Repo Conventions
- ESM everywhere: use `.js` extension in imports, even for TS files (`import { foo } from "./lib/foo.js"`).
- Paths: prefer `node:path` utilities; avoid string concat for paths.
- Logging: `src/lib/logger.ts` wires console to Winston; avoid new loggers unless necessary.
- Git helpers live in `src/lib/git.ts`; prefer them over custom git shells.
- Commands live under `src/commands/`; installers under `src/install/`; shared utils under `src/lib/`.
- CLI wired in `src/index.ts` via Commander; add commands there when introducing new functionality.

## TypeScript Style
- `strict` mode on; `noUnused*`, `noImplicitReturns`, `noFallthrough` enforced.
- Prefer explicit return types on exported functions.
- Avoid `any`; use `unknown` or generics. Narrow early.
- Use interfaces for public contracts; types acceptable for internal utility shapes.
- Keep enums minimal; favor literal unions when possible.
- Always await promises; handle rejections. Return typed results, not `Promise<void>` unless appropriate.
- Use `const` over `let` where possible; avoid `var` entirely.
- Keep functions small; extract helpers in `src/lib` when shared.

## Imports & Ordering
1) Node built-ins (`node:fs`, `node:path`, etc.)
2) Third-party packages
3) Internal absolute imports (rooted at `src/` with `./` prefixes for ESM)
4) Relative siblings
Use named imports over namespace unless the module exports a single primary object. Avoid default exports for new code.

## Formatting & Biome
- Biome handles both linting and formatting; run `pnpm format` to auto-fix.
- Config: 2-space indent, double quotes, import organize on.
- Do not fight Biome; align code to its output before committing.
- Keep comments scarce; explain *why*, not *what*.

## Naming
- Files: kebab-case (`sync-helpers.ts`).
- Classes/Types/Interfaces: PascalCase (`SearchOptions`).
- Functions/variables: camelCase (`resolveStore`).
- Constants: UPPER_SNAKE_CASE (`DEFAULT_STORE`).
- CLI flags: kebab-case; environment variables: UPPER_SNAKE_CASE (`MXBAI_API_KEY`).

## Error Handling
- Prefer typed errors or `Error` with clear messages; include action hints.
- Wrap CLI entrypoints with user-friendly messaging; avoid raw stack traces to users unless in debug.
- Use guard clauses; return early on invalid input.
- Validate external input with `zod` where practical.
- When interacting with filesystem/network, handle `ENOENT`, timeouts, and auth failures gracefully.
- Log operational errors via console (wired to Winston) so they reach rotating logs.

## CLI Behavior
- Commander is the source of truth; register options there.
- Default store pulled from `MXBAI_STORE` or `mgrep`; keep defaults minimal and quiet.
- Background watcher respects `.gitignore` and `.mgrepignore`; maintain that contract when changing watch logic.
- Preserve exit codes: non-zero on failure; zero on success.

## Testing Practices
- Tests are bats in `test/test.bats`; add new cases there.
- Write descriptive test names (`@test "search returns results for valid query"`).
- Mark slow tests with tags (`# bats test_tags=long-running`) so default `pnpm test` skips them.
- For bug fixes, add a regression test; for features, cover happy path + edge.
- Keep fixtures in `test/assets/`; reuse existing fixtures where possible.

## Releases & CI Notes
- Release workflow tags `v*.*.*`, verifies tag matches `package.json`, runs format:check, `pnpm test --filter-tags long-running`, `pnpm build`, then `npm publish --provenance`.
- Prepare script runs build on install; ensure build stays deterministic.
- Husky is declared but may need `npx husky init` locally if hooks are desired.

## Security & Secrets
- Never commit secrets: API keys, `.env`, tokens, private keys.
- Auth options: device login via `mgrep login` or `MXBAI_API_KEY` env for CI.
- Respect size limits in watcher (defaults in README); do not silently broaden.

## Local Tooling Guardrails
- Dev servers must run inside tmux; the dev command hook blocks non-tmux runs.
- Long commands in Bash prompt a tmux reminder; consider `tmux new -s dev`.
- Git pushes prompt for a quick review pause before continuing.
- MD/TXT creation is blocked unless the path is README/CLAUDE/AGENTS/CONTRIBUTING.

## Workflow for Agents
- Read before writing: inspect relevant files (commands, libs) first.
- Prefer existing helpers over new utilities; search `src/lib`.
- Keep changes minimal; avoid mixing refactors with features.
- After edits to TS/JS, expect hooks to run format/typecheck suggestions.
- Run `pnpm typecheck && pnpm format:check && pnpm test` before handing off.
- Avoid `console.log` spam; logging is intercepted. Remove debug logs before commit.

## File/Path Expectations
- Generated output belongs in `dist/`; do not edit generated files.
- Respect `.gitignore`, `.mgrepignore`, Biome include/exclude.
- Keep binary assets out of repo unless required.

## Documentation Touchpoints
- User-facing changes: update `README.md`.
- Contribution/process changes: update `CONTRIBUTING.md`.
- Architectural or agent-facing patterns: update this file.

## Single-Test Quickstart (copy-paste)
```bash
# Short path: run one bats test matching a name
bats test/test.bats --filter "watch indexes"  

# Run tagged slow test explicitly
bats test/test.bats --filter-tags long-running
```

## Troubleshooting Cheatsheet
- Formatting diffs? run `pnpm format`.
- Type errors on imports? ensure `.js` extension and NodeNext module resolution.
- Permissions on logs? `src/lib/logger.ts` writes under `~/.local/state/mgrep/logs`; ensure writable or expect silent logger.
- Device login loops? `mgrep logout` then `mgrep login`; CI prefers `MXBAI_API_KEY`.

## Pre-push sanity list
- `pnpm typecheck`
- `pnpm format:check`
- `pnpm test` (or targeted bats when iterating)
- No secrets or debug logs; imports ordered; ESM extensions correct.

## Contact
- Issues: https://github.com/mixedbread-ai/mgrep
- Community: Mixedbread Slack (see README)
- When unsure, mirror existing patterns in `src/commands/search.ts` and `src/lib/store.ts`.

## Cursor/Copilot Rules
- No Cursor rules detected (`.cursor/` or `.cursorrules` missing).
- No GitHub Copilot instructions found under `.github/copilot-instructions.md`.

# End of AGENTS.md
