import { check as checkGit } from "./CheckGit.ts"
import { check as checkSkills } from "./CheckSkills.ts"
import { check as checkCode } from "./CheckCode.ts"
import { check as checkRules } from "./CheckRules.ts"
import { sh, REPO_ROOT, type Issue, type IssueLevel } from "./Types.ts"
import { join } from "node:path"

if (typeof Bun === "undefined") {
  console.error("hygiene requires Bun. Run: bun Tools/Report.ts")
  process.exit(1)
}

const FIX_MODE = process.argv.includes("--fix")
const DRY_RUN = process.argv.includes("--dry-run")

const COLOR: Record<IssueLevel, string> = {
  ERROR: "\x1b[31m",
  WARN:  "\x1b[33m",
  INFO:  "\x1b[36m",
}
const RESET = "\x1b[0m"
const BOLD  = "\x1b[1m"
const GREEN = "\x1b[32m"

function fmt(issue: Issue): string {
  const c = COLOR[issue.level]
  const loc = issue.line ? `:${issue.line}` : ""
  const fix = issue.autofix ? ` \x1b[2m[autofix: ${issue.autofix}]\x1b[0m` : ""
  return `${c}[${issue.level}]${RESET} ${issue.path}${loc} — ${issue.message}${fix}`
}

const [gitIssues, skillIssues, codeIssues, rulesIssues] = await Promise.all([
  checkGit(),
  checkSkills(),
  checkCode(),
  checkRules(),
])

const sections: [string, Issue[]][] = [
  ["Git", gitIssues],
  ["Skills", skillIssues],
  ["Code", codeIssues],
  ["Rules & Commands", rulesIssues],
]

let errors = 0, warns = 0, infos = 0, autofixable = 0

console.log(`\n${BOLD}~/.claude Hygiene Report${RESET}`)
console.log("─".repeat(50))

for (const [label, issues] of sections) {
  if (issues.length === 0) continue
  console.log(`\n${BOLD}${label}${RESET}`)
  for (const issue of issues) {
    console.log("  " + fmt(issue))
    if (issue.level === "ERROR") errors++
    else if (issue.level === "WARN") warns++
    else infos++
    if (issue.autofix) autofixable++
  }
}

console.log("\n" + "─".repeat(50))
const statusColor = errors > 0 ? COLOR.ERROR : warns > 0 ? COLOR.WARN : GREEN
console.log(`${statusColor}${BOLD}${errors} errors, ${warns} warnings, ${infos} info${RESET}`)

if (autofixable > 0) {
  console.log(`\n${autofixable} issue(s) are auto-fixable.`)

  if (FIX_MODE) {
    await applyFixes([...gitIssues, ...skillIssues, ...codeIssues, ...rulesIssues])
  } else {
    console.log(`Run with ${BOLD}--fix${RESET} to apply safe auto-fixes.`)
  }
}

process.exit(errors > 0 ? 1 : warns > 0 ? 2 : 0)

// ─── Auto-fix ────────────────────────────────────────────────────────────────

async function applyFixes(issues: Issue[]) {
  const fixable = issues.filter((i) => i.autofix)
  if (fixable.length === 0) return

  // Safety gate: refuse if working tree is dirty (uncommitted changes that aren't about fixes)
  const { stdout: dirty } = await sh`git status --porcelain`
  const dirtyFiles = dirty.trim().split("\n").filter(Boolean)
  const nonGitignore = dirtyFiles.filter((l) => !l.includes(".gitignore"))
  if (nonGitignore.length > 0 && !DRY_RUN) {
    console.error(`\n${COLOR.ERROR}[ERROR]${RESET} Working tree is dirty — commit or stash changes before auto-fix.`)
    process.exit(1)
  }

  const gitignorePath = join(REPO_ROOT, ".gitignore")
  const existing = await Bun.file(gitignorePath).text().catch(() => "")
  const gitignoreLines = new Set(existing.split("\n").map((l) => l.trim()))

  const toRmCached: string[] = []

  for (const issue of fixable) {
    if (issue.autofix === "gitignore" || issue.autofix === "rm-cached") {
      if (!gitignoreLines.has(issue.path)) {
        gitignoreLines.add(issue.path)
        console.log(`  ${GREEN}+gitignore${RESET} ${issue.path}`)
      }
    }
    if (issue.autofix === "rm-cached") {
      toRmCached.push(issue.path)
    }
  }

  if (DRY_RUN) {
    console.log("\n[dry-run] No changes written.")
    return
  }

  // Write updated .gitignore
  await Bun.write(gitignorePath, [...gitignoreLines].join("\n") + "\n")

  // Untrack files
  for (const path of toRmCached) {
    const result = await sh`git rm --cached -r ${path}`
    if (result.exitCode === 0)
      console.log(`  ${GREEN}rm-cached${RESET} ${path}`)
    else
      console.warn(`  ${COLOR.WARN}[WARN]${RESET} Could not rm-cached: ${path}`)
  }

  // Stage .gitignore and commit
  await sh`git add .gitignore`
  const { exitCode } = await sh`git commit -m ${"chore: hygiene auto-fix"}`
  if (exitCode === 0)
    console.log(`\n${GREEN}✓ Committed: chore: hygiene auto-fix${RESET}`)
  else
    console.log(`\n${COLOR.WARN}[WARN]${RESET} Nothing to commit (already clean).`)
}
