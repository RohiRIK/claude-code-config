import { mkIssue, sh, REPO_ROOT, PATH_EXEMPT, RUNTIME_DIRS, type Issue } from "./Types.ts"
import { join, relative } from "node:path"

export async function check(): Promise<Issue[]> {
  const issues: Issue[] = []
  process.chdir(REPO_ROOT)

  await Promise.all([
    checkUncommitted(issues),
    checkUnpushed(issues),
    checkTrackedSymlinks(issues),
    checkTrackedRuntimeDirs(issues),
    checkHardcodedPaths(issues),
    checkReportsGitignored(issues),
  ])

  return issues
}

async function checkUncommitted(issues: Issue[]) {
  const { stdout } = await sh`git status --porcelain`
  for (const line of stdout.trim().split("\n").filter(Boolean)) {
    const file = line.slice(3).trim()
    issues.push(mkIssue("WARN", file, "Uncommitted change"))
  }
}

async function checkUnpushed(issues: Issue[]) {
  const { stdout, exitCode } = await sh`git log @{u}.. --oneline`
  if (exitCode !== 0) return
  for (const line of stdout.trim().split("\n").filter(Boolean)) {
    issues.push(mkIssue("INFO", "git", `Unpushed commit: ${line}`))
  }
}

async function checkTrackedSymlinks(issues: Issue[]) {
  const { stdout } = await sh`git ls-files --stage`
  for (const line of stdout.trim().split("\n").filter(Boolean)) {
    const [mode, , , ...pathParts] = line.split(/\s+/)
    if (mode === "120000") {
      const path = pathParts.join(" ")
      issues.push(mkIssue("ERROR", path, "Tracked symlink — should be gitignored", { autofix: "rm-cached" }))
    }
  }
}

async function checkTrackedRuntimeDirs(issues: Issue[]) {
  const { stdout } = await sh`git ls-files`
  for (const file of stdout.trim().split("\n").filter(Boolean)) {
    for (const dir of RUNTIME_DIRS) {
      if (file.startsWith(dir + "/") || file === dir) {
        issues.push(mkIssue("ERROR", file, `Tracked runtime file (${dir}/) — should be gitignored`, { autofix: "rm-cached" }))
        break
      }
    }
  }
}

async function checkReportsGitignored(issues: Issue[]) {
  const reportsDir = join(REPO_ROOT, "reports")
  const gitignorePath = join(REPO_ROOT, ".gitignore")

  const exists = await Bun.file(reportsDir).exists().catch(() => false)
  if (!exists) return

  const gitignore = await Bun.file(gitignorePath).text().catch(() => "")
  const lines = new Set(gitignore.split("\n").map((l) => l.trim()))
  if (!lines.has("reports/") && !lines.has("reports")) {
    issues.push(mkIssue("ERROR", "reports/", "reports/ exists but is not in .gitignore — generated output should never be committed", { autofix: "gitignore" }))
  }
}

async function checkHardcodedPaths(issues: Issue[]) {
  const { stdout } = await sh`git ls-files`
  const files = stdout.trim().split("\n").filter(Boolean)

  for (const file of files) {
    if (PATH_EXEMPT.has(file)) continue
    const ext = file.split(".").pop() ?? ""
    if (!["md", "ts", "mjs", "sh", "json"].includes(ext)) continue

    const fullPath = join(REPO_ROOT, file)
    let text: string
    try {
      text = await Bun.file(fullPath).text()
    } catch {
      continue
    }

    const lines = text.split("\n")
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/\/Users\/[a-zA-Z0-9_-]+\//)
      if (match) {
        issues.push(mkIssue("WARN", file, `Hardcoded home path: ${match[0]} — use ~/.claude/ instead`, { line: i + 1 }))
      }
    }
  }
}
