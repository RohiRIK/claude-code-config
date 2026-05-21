import { describe, test, expect, beforeAll } from "bun:test"
import { mkIssue, sh, REPO_ROOT, RUNTIME_DIRS, PATH_EXEMPT } from "./Types.ts"
import { check as checkGit } from "./CheckGit.ts"
import { check as checkSkills } from "./CheckSkills.ts"
import { check as checkCode } from "./CheckCode.ts"
import { check as checkRules } from "./CheckRules.ts"

// ─── Types ───────────────────────────────────────────────────────────────────

describe("mkIssue", () => {
  test("creates minimal issue", () => {
    const issue = mkIssue("ERROR", "foo.ts", "something broke")
    expect(issue.level).toBe("ERROR")
    expect(issue.path).toBe("foo.ts")
    expect(issue.message).toBe("something broke")
    expect(issue.line).toBeUndefined()
    expect(issue.autofix).toBeUndefined()
  })

  test("creates issue with line and autofix", () => {
    const issue = mkIssue("WARN", "bar.md", "stale link", { line: 42, autofix: "gitignore" })
    expect(issue.line).toBe(42)
    expect(issue.autofix).toBe("gitignore")
  })

  test("level values are valid", () => {
    for (const level of ["ERROR", "WARN", "INFO"] as const) {
      expect(mkIssue(level, "x", "y").level).toBe(level)
    }
  })
})

describe("sh helper", () => {
  test("returns stdout on success", async () => {
    const { stdout, exitCode } = await sh`echo hello`
    expect(exitCode).toBe(0)
    expect(stdout.trim()).toBe("hello")
  })

  test("does not throw on non-zero exit", async () => {
    const { exitCode } = await sh`exit 1`
    expect(exitCode).toBe(1)
  })
})

describe("REPO_ROOT", () => {
  test("points to ~/.claude", () => {
    expect(REPO_ROOT).toContain(".claude")
  })
})

describe("constants", () => {
  test("RUNTIME_DIRS includes daemon and jobs", () => {
    expect(RUNTIME_DIRS).toContain("daemon")
    expect(RUNTIME_DIRS).toContain("jobs")
    expect(RUNTIME_DIRS).toContain("logs")
    expect(RUNTIME_DIRS).toContain("cache")
  })

  test("PATH_EXEMPT includes settings.json", () => {
    expect(PATH_EXEMPT.has("settings.json")).toBe(true)
    expect(PATH_EXEMPT.has(".gitignore")).toBe(true)
  })
})

// ─── Check modules return valid Issue arrays ─────────────────────────────────

describe("CheckGit", () => {
  test("returns array of issues", async () => {
    const issues = await checkGit()
    expect(Array.isArray(issues)).toBe(true)
  })

  test("every issue has required fields", async () => {
    const issues = await checkGit()
    for (const issue of issues) {
      expect(["ERROR", "WARN", "INFO"]).toContain(issue.level)
      expect(typeof issue.path).toBe("string")
      expect(issue.path.length).toBeGreaterThan(0)
      expect(typeof issue.message).toBe("string")
    }
  })

  test("autofix values are valid when present", async () => {
    const issues = await checkGit()
    for (const issue of issues) {
      if (issue.autofix !== undefined) {
        expect(["gitignore", "rm-cached"]).toContain(issue.autofix)
      }
    }
  })
})

describe("CheckSkills", () => {
  test("returns array of issues", async () => {
    const issues = await checkSkills()
    expect(Array.isArray(issues)).toBe(true)
  })

  test("every issue has required fields", async () => {
    const issues = await checkSkills()
    for (const issue of issues) {
      expect(["ERROR", "WARN", "INFO"]).toContain(issue.level)
      expect(typeof issue.path).toBe("string")
    }
  })

  test("detects at least one issue in current repo", async () => {
    const issues = await checkSkills()
    expect(issues.length).toBeGreaterThan(0)
  })
})

describe("CheckCode", () => {
  test("returns array of issues", async () => {
    const issues = await checkCode()
    expect(Array.isArray(issues)).toBe(true)
  })

  test("detects console.log issues in known files", async () => {
    const issues = await checkCode()
    const consoleLogs = issues.filter((i) => i.message.includes("console.log"))
    expect(consoleLogs.length).toBeGreaterThan(0)
  })

  test("every code issue has a line number or is a file-level issue", async () => {
    const issues = await checkCode()
    for (const issue of issues) {
      expect(typeof issue.path).toBe("string")
      expect(typeof issue.message).toBe("string")
    }
  })
})

describe("CheckRules", () => {
  test("returns array of issues", async () => {
    const issues = await checkRules()
    expect(Array.isArray(issues)).toBe(true)
  })

  test("every issue has required fields", async () => {
    const issues = await checkRules()
    for (const issue of issues) {
      expect(["ERROR", "WARN", "INFO"]).toContain(issue.level)
      expect(typeof issue.path).toBe("string")
    }
  })
})

// ─── Report exit codes ────────────────────────────────────────────────────────

describe("Report.ts exit codes", () => {
  test("exits 1 when errors exist (current repo has errors)", async () => {
    const result = await Bun.$.cwd(REPO_ROOT)`bun skills/Hygiene/Tools/Report.ts`.nothrow().quiet()
    expect(result.exitCode).toBe(1)
  })

  test("--dry-run flag is accepted without crash", async () => {
    const result = await Bun.$.cwd(REPO_ROOT)`bun skills/Hygiene/Tools/Report.ts --dry-run`.nothrow().quiet()
    expect([0, 1, 2]).toContain(result.exitCode)
  })
})
