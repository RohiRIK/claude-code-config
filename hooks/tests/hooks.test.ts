/**
 * Smoke tests for ~/.claude hooks — pipe fixture stdin through each hook
 * and assert on exit codes, exactly as Claude Code invokes them.
 * Run: bun test hooks/tests
 */
import { test, expect, afterAll } from "bun:test";
import { unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const HOOKS = join(import.meta.dir, "..");

function runHook(script: string, input: Record<string, unknown>): { exitCode: number; stderr: string } {
  // Claude Code always includes cwd in hook input; parseHookInput rejects payloads without it.
  const payload = { cwd: join(HOOKS, ".."), ...input };
  const proc = Bun.spawnSync(["bun", join(HOOKS, script)], {
    stdin: Buffer.from(JSON.stringify(payload)),
    stdout: "pipe",
    stderr: "pipe",
  });
  return { exitCode: proc.exitCode, stderr: proc.stderr.toString() };
}

// --- WriteBlocker -----------------------------------------------------------
test("WriteBlocker blocks stray .md outside allowlist", () => {
  const r = runHook("WriteBlocker/WriteBlocker.ts", {
    tool_input: { file_path: "/some/project/random-notes.md" },
  });
  expect(r.exitCode).toBe(1);
});

test("WriteBlocker allows memory, tmp, plans, docs, SKILL.md", () => {
  const allowed = [
    "/u/x/.claude/projects/p/memory/fact.md",
    "/u/x/.claude/tmp/report.md",
    "/u/x/repo/plans/plan-1.md",
    "/u/x/repo/docs/guide.md",
    "/u/x/skills/Foo/SKILL.md",
    "/u/x/repo/MEMORY.md",
  ];
  for (const file_path of allowed) {
    const r = runHook("WriteBlocker/WriteBlocker.ts", { tool_input: { file_path } });
    expect(r.exitCode).toBe(0);
  }
});

test("WriteBlocker passes non-doc files through", () => {
  const r = runHook("WriteBlocker/WriteBlocker.ts", {
    tool_input: { file_path: "/some/project/index.ts" },
  });
  expect(r.exitCode).toBe(0);
});

// --- Cleanup ----------------------------------------------------------------
test("Cleanup exits cleanly when stop_hook_active", () => {
  const r = runHook("Cleanup/Cleanup.ts", { stop_hook_active: true });
  expect(r.exitCode).toBe(0);
});

// --- PostEditCheck ----------------------------------------------------------
test("PostEditCheck ignores non-code files", () => {
  const r = runHook("PostEditCheck/PostEditCheck.ts", {
    tool_input: { file_path: "/some/project/README.md" },
  });
  expect(r.exitCode).toBe(0);
});

// --- SecretScanOnWrite ------------------------------------------------------
const secretFixture = join(HOOKS, "tests", "fixture-secret.txt");
const cleanFixture = join(HOOKS, "tests", "fixture-clean.txt");
afterAll(() => {
  for (const f of [secretFixture, cleanFixture]) {
    try {
      unlinkSync(f);
    } catch {}
  }
});

test("SecretScanOnWrite warns (exit 2) on credential signature", () => {
  // AWS's documented example key, split so the scanner doesn't flag this test file.
  const exampleKey = ["AKIA", "IOSFODNN7EXAMPLE"].join("");
  writeFileSync(secretFixture, `aws_key = ${exampleKey}\n`);
  const r = runHook("SecretScanOnWrite/SecretScanOnWrite.ts", {
    tool_input: { file_path: secretFixture },
  });
  expect(r.exitCode).toBe(2);
  expect(r.stderr).toContain("possible secret");
});

test("SecretScanOnWrite passes clean files", () => {
  writeFileSync(cleanFixture, "nothing to see here\n");
  const r = runHook("SecretScanOnWrite/SecretScanOnWrite.ts", {
    tool_input: { file_path: cleanFixture },
  });
  expect(r.exitCode).toBe(0);
});
