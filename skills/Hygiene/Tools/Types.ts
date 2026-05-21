export type IssueLevel = "ERROR" | "WARN" | "INFO"
export type Autofix = "gitignore" | "rm-cached"

export interface Issue {
  level: IssueLevel
  path: string
  line?: number
  message: string
  autofix?: Autofix
}

export function mkIssue(
  level: IssueLevel,
  path: string,
  message: string,
  opts?: { line?: number; autofix?: Autofix },
): Issue {
  return { level, path, message, ...opts }
}

/** Run a shell command safely — never throws on non-zero exit. */
export async function sh(
  cmd: TemplateStringsArray,
  ...args: string[]
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const result = await Bun.$(cmd, ...args).nothrow().quiet()
  return {
    stdout: result.stdout.toString(),
    stderr: result.stderr.toString(),
    exitCode: result.exitCode,
  }
}

export const REPO_ROOT = new URL("../../../", import.meta.url).pathname.replace(/\/$/, "")

/** Paths exempt from hardcoded-path checks */
export const PATH_EXEMPT = new Set([
  "settings.json",
  ".gitignore",
  "hooks/git/pre-commit",
  "hooks/git/post-commit",
])

/** Runtime dirs that should never be tracked in git */
export const RUNTIME_DIRS = [
  "memory", "plans", "specs", "projects", "sessions", "contexts",
  "tasks", "telemetry", "statsig", "transcripts", "tmp",
  "shell-snapshots", "file-history", "plugins/data", "plugins/marketplaces",
  "cache", "logs", "jobs", "daemon",
]
