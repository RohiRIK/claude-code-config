# /commit-push-pr — Commit, Push, and Open PR

Precomputes all git context inline so Claude doesn't have to discover it.

## Instructions

Run these bash commands to gather context, then act:

```bash
# Gather context
git status --short
git diff --stat HEAD
git log --oneline -5
git branch --show-current
```

Then:

1. **Stage files**: `git add` specific changed files (never `git add .` blindly)
2. **Commit**: Write a conventional commit message based on the diff:
   - Format: `<type>: <description>`
   - Types: feat, fix, refactor, docs, chore, perf
   - Keep under 72 chars
3. **Push**: `git push -u origin <branch>`
4. **PR**: `gh pr create --title "<title>" --body "$(cat <<'EOF' ... EOF)"`
   - Summary: bullet list of what changed
   - Test plan: how to verify it works

## Commit Message Rules

- NO "Co-Authored-By" footer (attribution disabled globally)
- Reference issue number if relevant: `fix: correct slug derivation (#42)`
- Body optional for simple changes

## Usage

```
/commit-push-pr
```

Run after `/verify` passes.

## Boris Workflow Position

```
Plan → Implement → /simplify → /verify → /commit-push-pr
```
