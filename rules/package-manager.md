# Package Manager Preference

## JavaScript: Always Prefer Bun

ALWAYS use `bun` instead of `npm`, `npx`, `yarn`, or `pnpm`:

| Instead of | Use |
|------------|-----|
| `npm install` | `bun install` |
| `npm run <script>` | `bun run <script>` |
| `npx <package>` | `bunx <package>` |
| `npm install -g <pkg>` | `bun add -g <pkg>` |
| `npm add <pkg>` | `bun add <pkg>` |
| `npm add -D <pkg>` | `bun add -d <pkg>` |

## Why Bun?

- Faster installation and execution
- Built-in TypeScript support
- Compatible with npm packages
- Native test runner and bundler

## MCP Servers

When configuring MCP servers in `~/.claude.json`, prefer:

```json
{
  "command": "bunx",
  "args": ["package-name"]
}
```

Over:

```json
{
  "command": "npx",
  "args": ["-y", "package-name"]
}
```

Note: `bunx` doesn't need `-y` flag.

## Python: Always Prefer uv

ALWAYS use `uv` instead of `pip`, `pipx`, `pip3`, `python -m pip`, or `poetry`:

| Instead of | Use |
|------------|-----|
| `pip install <pkg>` | `uv pip install <pkg>` |
| `pip install -r requirements.txt` | `uv pip install -r requirements.txt` |
| `pipx install <pkg>` | `uv tool install <pkg>` |
| `pipx run <pkg>` | `uvx <pkg>` |
| `python -m venv .venv` | `uv venv` |
| `pip freeze` | `uv pip freeze` |
| `poetry install` | `uv sync` |
| `poetry add <pkg>` | `uv add <pkg>` |

## Why uv?

- 10-100x faster than pip
- Built-in venv management
- Lockfile support (`uv.lock`)
- Drop-in pip replacement
- Written in Rust

## Python MCP Servers

When configuring Python-based MCP servers, prefer:

```json
{
  "command": "uvx",
  "args": ["package-name"]
}
```

Over:

```json
{
  "command": "pipx",
  "args": ["run", "package-name"]
}
```
