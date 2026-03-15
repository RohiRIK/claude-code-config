# /decay-report — Memory Decay Diagnostic

Run a decay analysis on the LTM database and report relevance score distribution.

## What to do

Execute the following script and display the output:

```ts
import { getDb, getSetting } from "$HOME/.claude/memory/shared-db.js";
import { computeDecayScore, decayMemories } from "$HOME/.claude/memory/db.js";

const db = getDb();
const all = db.query("SELECT * FROM memories WHERE status = 'active'").all();
const deprecated = db.query("SELECT COUNT(*) as n FROM memories WHERE status = 'deprecated'").get();

const scored = all.map(m => ({ ...m, score: computeDecayScore(m) }));
const buckets = {
  "0–0.25 (at-risk)":   scored.filter(m => m.score < 0.25),
  "0.25–1 (low)":       scored.filter(m => m.score >= 0.25 && m.score < 1),
  "1–2 (medium)":       scored.filter(m => m.score >= 1 && m.score < 2),
  "2–3 (high)":         scored.filter(m => m.score >= 2 && m.score < 3),
  "3–5 (critical)":     scored.filter(m => m.score >= 3),
};

const lastRun = getSetting("decay_last_run") ?? "never";

console.log("## Memory Decay Report");
console.log(`Active: ${all.length} | Deprecated: ${deprecated?.n ?? 0}`);
console.log(`Last decay run: ${lastRun}`);
console.log("");
console.log("### Score Distribution");
for (const [label, mems] of Object.entries(buckets)) {
  console.log(`  ${label}: ${mems.length}`);
}
console.log("");
console.log("### Top 5 At-Risk Memories (score 0.25–0.5)");
const atRisk = scored
  .filter(m => m.score >= 0.25 && m.score < 0.5)
  .sort((a, b) => a.score - b.score)
  .slice(0, 5);
for (const m of atRisk) {
  console.log(`  [${m.id}] score=${m.score.toFixed(3)} imp=${m.importance} conf=${m.confidence.toFixed(2)} confirmed=${m.confirm_count}x`);
  console.log(`       ${m.content.substring(0, 80)}`);
}
if (atRisk.length === 0) console.log("  (none)");
```

Run via:
```bash
bun --eval "
const { getDb, getSetting } = await import(process.env.HOME + '/.claude/memory/shared-db.js');
const { computeDecayScore } = await import(process.env.HOME + '/.claude/memory/db.js');
const db = getDb();
const all = db.query(\"SELECT * FROM memories WHERE status = 'active'\").all();
const dep = db.query(\"SELECT COUNT(*) as n FROM memories WHERE status = 'deprecated'\").get();
const scored = all.map(m => ({ ...m, score: computeDecayScore(m) }));
const b0 = scored.filter(m => m.score < 0.25).length;
const b1 = scored.filter(m => m.score >= 0.25 && m.score < 1).length;
const b2 = scored.filter(m => m.score >= 1 && m.score < 2).length;
const b3 = scored.filter(m => m.score >= 2 && m.score < 3).length;
const b4 = scored.filter(m => m.score >= 3).length;
const lastRun = getSetting('decay_last_run') ?? 'never';
console.log('Active: ' + all.length + ' | Deprecated: ' + (dep?.n ?? 0));
console.log('Last decay run: ' + lastRun);
console.log('Score buckets: 0-0.25=' + b0 + ' 0.25-1=' + b1 + ' 1-2=' + b2 + ' 2-3=' + b3 + ' 3-5=' + b4);
const atRisk = scored.filter(m => m.score >= 0.25 && m.score < 0.5).sort((a,b) => a.score - b.score).slice(0,5);
if (atRisk.length) { console.log('At-risk:'); atRisk.forEach(m => console.log(' [' + m.id + '] ' + m.score.toFixed(3) + ' ' + m.content.substring(0,70))); }
"
```

To trigger decay now:
```bash
bun --eval "const { decayMemories } = await import(process.env.HOME + '/.claude/memory/db.js'); const r = decayMemories(); console.log('deprecated=' + r.deprecated + ' scored=' + r.scored);"
```
