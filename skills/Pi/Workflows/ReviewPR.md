# Workflow: ReviewPR

Use Pi to review a GitHub PR or a local diff and report findings. Review is
read-only — Pi should not edit code here. Pi has no `pr` subcommand, so check the
branch out first with `gh`, then run a read-only review prompt.

## Option A — GitHub PR by number (preferred)

```bash
# 1. Checkout the PR branch (run in the target repo)
gh pr checkout 1234

# 2. Review the diff vs the base branch, read-only
cd /path/to/repo && timeout 300 pi -p 'Review the changes on this branch vs \
origin/main. Report, by severity: correctness bugs, security risks, missing tests, \
and API/style inconsistencies. Do not modify any files.' -a
```

## Option B — Throwaway clone (review without touching local repo)

```bash
REVIEW=$(mktemp -d)
git clone <repo-url> "$REVIEW"
cd "$REVIEW" && gh pr checkout 1234
timeout 300 pi -p 'Review this PR vs main. Report bugs, security risks, test gaps, \
and style issues. Read-only — do not modify files.'
cd - && rm -rf "$REVIEW"     # clean up after
```

## Option C — Local diff already in tree

```bash
cd /path/to/repo && timeout 300 pi -p 'Review the staged and unstaged changes. \
Report correctness bugs, security risks, and missing tests by severity. \
Read-only — do not modify files.'
```

## Reporting

- The prompt enforces read-only; do not pass any write-encouraging instruction.
- Relay Pi's findings grouped by severity (critical / high / medium / low).
- Add your own read of anything Pi missed; do not auto-apply fixes — that is a
  separate `Delegate` task the user approves.
