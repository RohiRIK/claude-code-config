/**
 * SkillsMountCheck — SessionStart guard.
 *
 * ~/.claude/skills/* are symlinks into a Google Drive checkout. If Drive is
 * unmounted, every skill silently vanishes from the session. This hook warns
 * loudly at session start instead of letting that happen unnoticed.
 * Non-blocking: always exits 0.
 */
import { readdirSync, lstatSync, existsSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const SKILLS_DIR = join(homedir(), ".claude", "skills");

try {
  const entries = readdirSync(SKILLS_DIR);
  const broken = entries.filter((name) => {
    const p = join(SKILLS_DIR, name);
    try {
      return lstatSync(p).isSymbolicLink() && !existsSync(p);
    } catch {
      return false;
    }
  });

  if (broken.length > 0) {
    process.stdout.write(
      `[SkillsMountCheck] WARNING: ${broken.length} skill symlink(s) unreachable — ` +
        `Google Drive is likely unmounted. Missing: ${broken.slice(0, 5).join(", ")}` +
        (broken.length > 5 ? ` (+${broken.length - 5} more)` : "") +
        `. Skills will not load this session.\n`,
    );
  }
} catch {
  // skills dir itself missing — same failure mode, same warning
  process.stdout.write(
    "[SkillsMountCheck] WARNING: ~/.claude/skills unreadable — skills will not load this session.\n",
  );
}
process.exit(0);
