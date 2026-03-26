#!/usr/bin/env bun
/**
 * PrePlan.ts
 * UserPromptSubmit hook — auto-run deep observation before /plan if none exists.
 */

import { readStdin, parseHookInput } from "../lib/hookUtils.js";
import { resolveProject } from "../lib/resolveProject.js";
import { logHook } from "../lib/hookLogger.js";
import {
  buildReport,
  persistObservation,
  markObservationDone,
  isObservationDone,
} from "../Observe/Observe.js";

async function main(): Promise<void> {
  const raw = await readStdin();
  const parsed = parseHookInput(raw);

  if (!parsed) return;

  const { input, cwd } = parsed;

  // Extract prompt text from hook input
  const prompt: string =
    input.prompt ??
    input.user_message ??
    input.message ??
    input.tool_input?.prompt ??
    "";

  // Only act on /plan prompts
  if (!/^\s*\/plan\b/i.test(prompt)) return;

  if (isObservationDone()) {
    logHook("PrePlan", "info", "Observation already done — skipping pre-plan observe");
    process.stderr.write("[PrePlan] Observation already done — proceeding to /plan\n");
    return;
  }

  try {
    process.stderr.write("[PrePlan] Running deep observation before /plan…\n");
    const report = await buildReport({ cwd, level: "deep" });
    const { name: project } = resolveProject(cwd);
    await persistObservation(project, report);
    markObservationDone();
    process.stdout.write(report + "\n");
    logHook("PrePlan", "info", `Pre-plan deep observation complete for ${project}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[PrePlan] Observation failed (non-fatal): ${msg}\n`);
    logHook("PrePlan", "error", `Pre-plan observation failed: ${msg}`);
    // Don't exit 1 — allow /plan to proceed even if observation fails
  }
}

main();
