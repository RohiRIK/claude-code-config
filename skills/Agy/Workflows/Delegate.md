# Workflow: Delegate

Hand an implement / refactor / fix task to Agy and report the result.

## 1. Preflight

```bash
agy --version          # confirm installed
agy inspect            # confirm auth + which config/skills/plugins are loaded
```

Resolve the target directory from the task (default: current working dir). Confirm
it is a git repo with a clean-enough tree — Agy writes files, so uncommitted changes
will be intermixed with its edits. Add the dir to the workspace with `--add-dir`.

## 2. Write a precise prompt

Agy acts on the prompt verbatim. Make it self-contained:

- State the goal, the files/areas in scope, and the done condition.
- Tell it to run tests / typecheck after editing when the repo has them.
- Add every relevant dir with `--add-dir` (repeatable).

```bash
timeout 360 agy -p 'Add retry-with-backoff to all outbound HTTP calls in src/api/. \
Use the existing logger. Add unit tests and run `bun test` until green.' \
  --add-dir /path/to/project
```

Always wrap in an outer `timeout` (see `Reference.md` → Timeouts). Pin a model with
`-m <model>` if the task needs one; omit to use the configured default.

## 3. Run — pick foreground vs background

**Bounded task (a couple minutes):** run foreground with `Bash`, read the result.

**Long or multi-file task:** run with `run_in_background: true` inside a generous
outer `timeout` and a matching `--print-timeout`, then watch:

- `BashOutput` — poll incremental output, decide whether to keep waiting.
- `Monitor` — block until the process exits when you have nothing else to do.

If output is large, redirect and tail rather than streaming into context:

```bash
timeout 900 agy -p '<prompt>' --add-dir /path/to/project --print-timeout 14m \
  > /tmp/agy-run.log 2>&1
```

## 4. Parallel runs (optional)

For independent tasks, isolate each in its own git worktree so edits don't collide,
and background each:

```bash
git worktree add ../task-a -b task-a
timeout 900 agy -p '<task A>' --add-dir ../task-a    # run_in_background: true
git worktree add ../task-b -b task-b
timeout 900 agy -p '<task B>' --add-dir ../task-b    # run_in_background: true
```

Poll each with `BashOutput`. Clean up worktrees when done.

## 5. Report back

After Agy exits:

- Run `git status` / `git diff --stat` in the target dir to see what changed.
- Summarize: what it did, files touched, test/typecheck result, anything it left
  incomplete or flagged.
- Do **not** commit Agy's work automatically — surface the diff and let the user
  decide (follow this repo's normal commit workflow).
