import { mkIssue, REPO_ROOT, type Issue } from "./Types.ts"
import { join, dirname, resolve } from "node:path"
import { readdir, stat, lstat } from "node:fs/promises"

async function loadGitignore(): Promise<Set<string>> {
  const text = await Bun.file(join(REPO_ROOT, ".gitignore")).text().catch(() => "")
  return new Set(text.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#")))
}

export async function check(): Promise<Issue[]> {
  const issues: Issue[] = []
  const skillsDir = join(REPO_ROOT, "skills")
  const gitignored = await loadGitignore()

  let entries: string[]
  try {
    entries = await readdir(skillsDir)
  } catch {
    return issues
  }

  await Promise.all(
    entries.map(async (entry) => {
      const skillPath = join(skillsDir, entry)
      const s = await lstat(skillPath)

      if (s.isSymbolicLink()) {
        if (!gitignored.has(`skills/${entry}`)) {
          issues.push(mkIssue("ERROR", `skills/${entry}`, "Symlink in skills/ — add to .gitignore", { autofix: "gitignore" }))
        }
        return
      }

      if (!s.isDirectory()) return

      await Promise.all([
        checkSkillMd(issues, entry, skillPath),
        checkBrokenLinks(issues, entry, skillPath),
        checkOrphaned(issues, entry),
      ])
    }),
  )

  return issues
}

async function checkSkillMd(issues: Issue[], entry: string, skillPath: string) {
  const skillMd = join(skillPath, "SKILL.md")
  try {
    await stat(skillMd)
  } catch {
    issues.push(mkIssue("ERROR", `skills/${entry}`, "Missing SKILL.md"))
    return
  }

  const text = await Bun.file(skillMd).text()

  if (!text.startsWith("---")) {
    issues.push(mkIssue("WARN", `skills/${entry}/SKILL.md`, "Missing YAML frontmatter"))
    return
  }

  const frontmatterEnd = text.indexOf("\n---", 3)
  if (frontmatterEnd === -1) return
  const frontmatter = text.slice(0, frontmatterEnd)

  if (!/^name:/m.test(frontmatter))
    issues.push(mkIssue("WARN", `skills/${entry}/SKILL.md`, "Frontmatter missing 'name' field"))

  if (!/^description:/m.test(frontmatter))
    issues.push(mkIssue("WARN", `skills/${entry}/SKILL.md`, "Frontmatter missing 'description' field"))

  const descMatch = frontmatter.match(/^description:\s*["']?(.+?)["']?\s*$/m)
  if (descMatch) {
    const wordCount = descMatch[1].trim().split(/\s+/).length
    if (wordCount > 15)
      issues.push(mkIssue("WARN", `skills/${entry}/SKILL.md`, `Description too long (${wordCount} words, max 15)`))
  }

  if (/\bnpx\b/.test(text) && !/\bbunx\b/.test(text))
    issues.push(mkIssue("WARN", `skills/${entry}/SKILL.md`, "Uses npx without bunx equivalent in allowed-tools"))
}

async function checkBrokenLinks(issues: Issue[], entry: string, skillPath: string) {
  const mdFiles = await collectMdFiles(skillPath)

  for (const mdFile of mdFiles) {
    const text = await Bun.file(mdFile).text()
    const relFile = `skills/${entry}/${mdFile.slice(skillPath.length + 1)}`
    const fileDir = dirname(mdFile)

    for (const match of text.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)) {
      const href = match[2]
      if (href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto")) continue

      const target = resolve(fileDir, href.split("#")[0])
      try {
        await stat(target)
      } catch {
        issues.push(mkIssue("ERROR", relFile, `Broken internal link: ${href}`))
      }
    }
  }
}

async function checkOrphaned(issues: Issue[], entry: string) {
  const skillName = entry.toLowerCase()
  const searchDirs = ["commands", "rules", "CLAUDE.md"]

  for (const src of searchDirs) {
    const fullSrc = join(REPO_ROOT, src)
    try {
      const s = await stat(fullSrc)
      let text = ""
      if (s.isDirectory()) {
        const files = await readdir(fullSrc)
        for (const f of files) {
          text += await Bun.file(join(fullSrc, f)).text().catch(() => "")
        }
      } else {
        text = await Bun.file(fullSrc).text().catch(() => "")
      }
      if (text.toLowerCase().includes(skillName)) return
    } catch {
      continue
    }
  }

  issues.push(mkIssue("INFO", `skills/${entry}`, "Possibly orphaned — not referenced in commands/, rules/, or CLAUDE.md"))
}

async function collectMdFiles(dir: string): Promise<string[]> {
  const results: string[] = []
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
  for (const e of entries) {
    const full = join(dir, e.name)
    if (e.isDirectory()) results.push(...(await collectMdFiles(full)))
    else if (e.name.endsWith(".md")) results.push(full)
  }
  return results
}
