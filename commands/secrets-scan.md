# /secrets-scan — Retroactive LTM Secrets Scanner

Scan all active memories in `ltm.db` for secrets and redact them in-place.

## Usage

```
/secrets-scan              → scan all active memories
/secrets-scan --project X  → scan only memories scoped to project X
/secrets-scan --dry-run    → show what would be redacted, no writes
```

## Implementation

Run the following via `bun -e`:

```ts
const HOME = process.env.HOME!;
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const projectIdx = args.indexOf("--project");
const project = projectIdx >= 0 ? args[projectIdx + 1] : null;

const { scrubSecrets } = await import(HOME + "/.claude/memory/secretsScrubber.js");
const { getDb } = await import(HOME + "/.claude/memory/shared-db.js");

const db = getDb();

const where = project
  ? `WHERE status='active' AND project_scope=?`
  : `WHERE status='active'`;
const params = project ? [project] : [];

const rows = db.query(`SELECT id, content FROM memories ${where}`).all(...params);

let scanned = 0;
let redacted = 0;
const typeCounts: Record<string, number> = {};

for (const row of rows as { id: number; content: string }[]) {
  scanned++;
  const { scrubbed, redactions } = scrubSecrets(row.content);
  if (redactions.length > 0) {
    redacted++;
    for (const r of redactions) typeCounts[r] = (typeCounts[r] ?? 0) + 1;
    if (!dryRun) {
      db.run(`UPDATE memories SET content=? WHERE id=?`, [scrubbed, row.id]);
    } else {
      console.log(`[dry-run] Memory ${row.id} would redact: ${redactions.join(", ")}`);
    }
  }
}

const typeStr = Object.entries(typeCounts).map(([k,v]) => `${k}(${v})`).join(", ");
const suffix = dryRun ? " (dry-run, no changes written)" : "";
console.log(`\n✓ Scanned ${scanned} memories, ${redacted} redacted${typeStr ? ` (${typeStr})` : ""}${suffix}`);
```

## Notes

- Only writes on actual matches — no no-op updates
- Logs pattern type only, never the secret value itself
- `--dry-run` is safe to run anytime for auditing
- After scanning, run `/decay-report` to verify memory health
