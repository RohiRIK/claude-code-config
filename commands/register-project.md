# /register-project — Register a Project Name

Use this command to register or rename a project in the context registry.

## What it does

Maps the current working directory (or a given path) to a friendly name in
`~/.claude/projects/registry.json`

This name is used as the folder name for all context files:
- `~/.claude/projects/<name>/context-goals.md`
- `~/.claude/projects/<name>/context-decisions.md`
- `~/.claude/projects/<name>/context-progress.md`
- `~/.claude/projects/<name>/context-gotchas.md`

## Usage

```
/register-project
/register-project my-project-name
/register-project /abs/path/to/project my-project-name
```

## Instructions for Claude

When this command is invoked:

1. Determine the path to register:
   - If a path argument is given, use it
   - Otherwise use the current `cwd`

2. Determine the name to use:
   - If a name argument is given, use it (validate: lowercase, alphanumeric + hyphens only)
   - Otherwise ask the user: "What name should I use for this project?"

3. Read `~/.claude/projects/registry.json` (create `{}` if missing)

4. Add or update the entry: `{ "<path>": "<name>" }`

5. Write the updated JSON back to `registry.json`

6. Create the folder `~/.claude/projects/<name>/` if it doesn't exist

7. If an old context folder exists for this path (slug-based), offer to migrate:
   - Copy context files from old folder → new folder
   - Do NOT delete the old folder automatically

8. Confirm: "Registered `<path>` as **<name>**. Context will be saved to `~/.claude/projects/<name>/`"

## Validation rules for name

- Lowercase only
- Alphanumeric characters and hyphens (`-`) only
- No spaces, dots, underscores, or slashes
- 3–40 characters
- Examples: `device-inventory`, `ai-soc`, `claude-config`
