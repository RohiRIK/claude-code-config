# Init Project Context

Create the 4 session context files for the current project if they don't exist yet.

## Steps

1. Determine the project slug from the current working directory:
   - Replace all `/` with `-` (e.g. `/Users/roh/projects/myapp` → `-Users-roh-projects-myapp`)
   - Context dir: `~/.claude/projects/<slug>/`

2. Check which files are missing from:
   - `context-goals.md`
   - `context-decisions.md`
   - `context-progress.md`
   - `context-gotchas.md`

3. For each missing file, ask the user what to put in it:
   - **goals**: "What is the current goal for this project? (1-3 lines)"
   - **decisions**: "Any key architectural decisions made so far?"
   - **progress**: "What has been completed so far? (or leave blank)"
   - **gotchas**: "Any warnings or pitfalls to remember? (or leave blank)"

4. Create the files with the user's answers. Use bullet point format, one item per line.

5. Confirm: "Context files created at `~/.claude/projects/<slug>/`. They will be saved across sessions."

## Notes
- If all 4 files already exist, say so and ask if the user wants to update any of them
- Never overwrite existing files without asking
- Keep entries short — bullets only, max 100 chars per line
