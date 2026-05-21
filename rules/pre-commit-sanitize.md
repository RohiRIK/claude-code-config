# Pre-Commit Sanitization

## When This Applies

Before every `git add` or `git commit` in this repo (`~/.claude`), scan staged files for sensitive personal information that should not be pushed to a public GitHub repository.

## What to Catch

### Hardcoded Home Paths

Any absolute path containing a username or home directory:

| Pattern | Example | Fix |
|---------|---------|-----|
| `/Users/<username>/` | `/Users/jane/.claude/hooks/...` | `~/.claude/hooks/...` |
| `/home/<username>/` | `/home/deploy/.claude/...` | `~/.claude/...` |
| `C:\Users\<username>\` | `C:\Users\jane\...` | `~\.claude\...` |

Exception: `.gitignore` rules may use relative paths that are fine.

### Personal Identifiers

| Pattern | Example | Action |
|---------|---------|--------|
| Email addresses | `jane@gmail.com` | Remove or replace with `user@example.com` |
| Social media handles | `linkedin.com/in/rohi-rikman` | Remove unless intentionally public (README author section) |
| Machine hostnames | `Rohis-MacBook-Pro-2.local` | Remove |
| Usernames in paths | `rohirikman` embedded in file content | Replace with `~` or `$HOME` |

Exception: `README.md` author/contact section may intentionally include social links — confirm before removing.

### Symlinks

**Rule: No symlink inside `~/.claude/` may be committed to git.**

Symlinks are always machine-specific — they point to absolute paths on the local filesystem that don't exist on other machines. Committing them breaks clones and leaks personal paths.

| Action | When |
|--------|------|
| Add to `.gitignore` under `# Symlinks` section | When creating any new symlink inside `~/.claude/` |
| Run `git rm --cached <path>` | If a symlink was accidentally tracked |

The `hooks/git/pre-commit` hook **auto-detects and blocks** staged symlinks (git mode `120000`) and adds them to `.gitignore` automatically. This is a safety net — always add manually first.

**Pattern for `.gitignore`:**
```
# Symlinks (local-only, machine-specific — never commit symlinks to shared tools)
# Rule: ANY symlink inside ~/.claude/ must be listed here.
skills/MySkilLink
```

### Runtime State Files

Files that are managed by Claude Code at runtime and should not be version-controlled:

| File/Pattern | Why |
|-------------|-----|
| `plugins/installed_plugins.json` | Contains absolute install paths with username |
| `plugins/known_marketplaces.json` | Contains absolute install paths with username |
| `plugins/install-counts-cache.json` | Runtime cache |
| `security_warnings_state_*.json` | Session-specific state |
| `stats-cache.json` | Runtime cache |
| `settings.json.bak` | Backup file |
| `*.db`, `*.db-shm`, `*.db-wal` | Database files |
| `history.jsonl` | Session history |

If any of these appear in `git status` as tracked, run `git rm --cached <file>` and add to `.gitignore`.

## How to Check

Before staging, run this scan on all files being committed:

```bash
# Check for hardcoded home paths in staged files
git diff --cached --name-only | xargs grep -n '/Users/\|/home/\|C:\\Users\\' 2>/dev/null
```

If matches are found:
1. For `settings.json` hook commands — these **require** absolute paths (Claude Code limitation). Add `settings.json` to `.gitignore` if it contains paths, or accept this as a known trade-off and document it.
2. For all other files — replace with `~/.claude/` or `$HOME/.claude/`.
3. For comments/docs — use `~/.claude/` notation.

## Automated Enforcement

The `hooks/git/pre-commit` hook runs `bunx varlock scan --staged` for secret detection. For path sanitization, manually verify before committing or add a grep check to the pre-commit hook:

```bash
# Add to hooks/git/pre-commit after varlock scan
if git diff --cached --name-only | xargs grep -l '/Users/' 2>/dev/null | grep -v 'settings.json' | grep -qv '.gitignore'; then
  echo "[pre-commit] WARNING: Hardcoded /Users/ paths found in staged files" >&2
  git diff --cached --name-only | xargs grep -n '/Users/' 2>/dev/null | grep -v 'settings.json' | grep -v '.gitignore' >&2
  echo "[pre-commit] Replace with ~/.claude/ before committing" >&2
  exit 1
fi
```

## Known Trade-offs

`settings.json` hook commands require absolute paths — Claude Code does not expand `~` or `$HOME` in hook command strings. Options:
1. **Gitignore settings.json** — loses version control on hook config
2. **Accept the path leak** — username visible but not a security risk
3. **Use env var in a wrapper** — hook commands call a shell script that resolves `$HOME`

Current decision: keep `settings.json` tracked, accept that the username is visible. The file contains no secrets — only hook wiring with absolute paths.
