import { mkIssue, REPO_ROOT, type Issue } from "./Types.ts"
import { join } from "node:path"
import { readdir, stat } from "node:fs/promises"

export async function check(): Promise<Issue[]> {
  const issues: Issue[] = []

  await Promise.all([
    checkRulesDrift(issues),
    checkCommandAgentRefs(issues),
    checkClaudeMdCommandTable(issues),
  ])

  return issues
}

async function checkRulesDrift(issues: Issue[]) {
  const claudeMd = join(REPO_ROOT, "CLAUDE.md")
  const rulesDir = join(REPO_ROOT, "rules")

  const [claudeText, rulesFiles] = await Promise.all([
    Bun.file(claudeMd).text().catch(() => ""),
    readdir(rulesDir).catch(() => [] as string[]),
  ])

  const rulesSet = new Set(rulesFiles.filter((f) => f.endsWith(".md")).map((f) => f.replace(".md", "")))

  // Find rules referenced in CLAUDE.md
  const referencedRules = new Set<string>()
  for (const match of claudeText.matchAll(/`?rules\/([a-z0-9-]+)\.md`?/gi)) {
    referencedRules.add(match[1])
  }
  // Also check the inline list in CLAUDE.md (e.g. "coding-style · git-workflow · …")
  const inlineMatch = claudeText.match(/## Rules\s*\n([^\n#]+)/)
  if (inlineMatch) {
    for (const rule of inlineMatch[1].split(/[\s·•,]+/).map((s) => s.trim()).filter(Boolean)) {
      referencedRules.add(rule)
    }
  }

  for (const rule of referencedRules) {
    if (!rulesSet.has(rule))
      issues.push(mkIssue("WARN", "CLAUDE.md", `References rules/${rule}.md which doesn't exist`))
  }

  for (const rule of rulesSet) {
    if (!referencedRules.has(rule))
      issues.push(mkIssue("INFO", `rules/${rule}.md`, "Rule file not referenced in CLAUDE.md"))
  }
}

async function checkCommandAgentRefs(issues: Issue[]) {
  const commandsDir = join(REPO_ROOT, "commands")
  const agentsDir = join(REPO_ROOT, "agents")

  const [commandFiles, agentFiles] = await Promise.all([
    readdir(commandsDir).catch(() => [] as string[]),
    readdir(agentsDir).catch(() => [] as string[]),
  ])

  const agentSet = new Set(agentFiles.filter((f) => f.endsWith(".md")).map((f) => f.replace(".md", "")))

  for (const cmdFile of commandFiles.filter((f) => f.endsWith(".md"))) {
    const text = await Bun.file(join(commandsDir, cmdFile)).text().catch(() => "")
    for (const match of text.matchAll(/\*\*([a-z-]+)\*\*\s+agent/gi)) {
      const agentName = match[1].toLowerCase()
      if (!agentSet.has(agentName))
        issues.push(mkIssue("ERROR", `commands/${cmdFile}`, `References missing agent: ${agentName}.md`))
    }
  }
}

async function checkClaudeMdCommandTable(issues: Issue[]) {
  const claudeMd = join(REPO_ROOT, "CLAUDE.md")
  const commandsDir = join(REPO_ROOT, "commands")

  const [claudeText, commandFiles] = await Promise.all([
    Bun.file(claudeMd).text().catch(() => ""),
    readdir(commandsDir).catch(() => [] as string[]),
  ])

  const commandsInTable = new Set<string>()
  for (const match of claudeText.matchAll(/`\/([a-z][a-z0-9-]*)`/g)) {
    commandsInTable.add(match[1])
  }

  for (const f of commandFiles.filter((f) => f.endsWith(".md"))) {
    const cmdName = f.replace(".md", "")
    if (!commandsInTable.has(cmdName))
      issues.push(mkIssue("INFO", `commands/${f}`, `Command not listed in CLAUDE.md commands table`))
  }
}
