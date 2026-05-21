import { mkIssue, sh, REPO_ROOT, type Issue } from "./Types.ts"
import { join } from "node:path"

const EXEMPT_REFS = new Set([
  "rules/package-manager.md",
  "rules/pre-commit-sanitize.md",
  "skills/Hygiene/Reference/Rules.md",
])

export async function check(): Promise<Issue[]> {
  const issues: Issue[] = []
  const { stdout } = await sh`git ls-files`
  const files = stdout.trim().split("\n").filter(Boolean)

  await Promise.all(files.map((file) => checkFile(issues, file)))
  return issues
}

async function checkFile(issues: Issue[], file: string) {
  if (EXEMPT_REFS.has(file)) return

  const ext = file.split(".").pop() ?? ""
  const isTs = ext === "ts" || ext === "mjs"
  const isCode = ["ts", "mjs", "js", "sh"].includes(ext)
  const isMd = ext === "md"

  if (!isCode && !isMd) return

  const fullPath = join(REPO_ROOT, file)
  let text: string
  try {
    text = await Bun.file(fullPath).text()
  } catch {
    return
  }

  const lines = text.split("\n")

  // File size
  if (lines.length > 800)
    issues.push(mkIssue("ERROR", file, `File too long: ${lines.length} lines (max 800)`))
  else if (lines.length > 400)
    issues.push(mkIssue("WARN", file, `File getting long: ${lines.length} lines (soft limit 400)`))

  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i]
    const loc = { line: i + 1 }

    // console.log in TS/JS
    if (isTs && /\bconsole\.log\b/.test(ln))
      issues.push(mkIssue("WARN", file, "console.log found — remove before commit", loc))

    // : any in TypeScript
    if (isTs && /:\s*any\b/.test(ln) && !/\/\/.*:\s*any/.test(ln))
      issues.push(mkIssue("WARN", file, "Unsafe 'any' type annotation", loc))

    // npm / npx in code files (not in allowed-tools lines or package-manager docs)
    if (!isMd && /\bnpm\s+(install|run|add|ci)\b/.test(ln))
      issues.push(mkIssue("WARN", file, "Use 'bun' instead of 'npm'", loc))

    if (!isMd && /\bnpx\s+/.test(ln))
      issues.push(mkIssue("WARN", file, "Use 'bunx' instead of 'npx'", loc))

    // pip in code files
    if (!isMd && /\bpip3?\s+install\b/.test(ln))
      issues.push(mkIssue("WARN", file, "Use 'uv pip install' instead of pip", loc))

    // python3 -c json parsing in shell
    if (/python3?\s+-c\s+['"]import json/.test(ln))
      issues.push(mkIssue("WARN", file, "Use 'jq' instead of python3 for JSON parsing", loc))

    // Hardcoded absolute paths in hook TS/MJS files
    if (isTs && file.startsWith("hooks/") && /\/Users\/[a-zA-Z0-9_-]+\//.test(ln))
      issues.push(mkIssue("ERROR", file, "Hardcoded absolute path in hook file — use process.env.HOME", loc))
  }
}
