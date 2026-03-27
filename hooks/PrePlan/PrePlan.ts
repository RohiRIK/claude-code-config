#!/usr/bin/env bun
/**
 * PrePlan.ts
 * TRIGGER: UserPromptSubmit
 *
 * Detects /plan commands and injects a Sonnet-powered strategic briefing
 * into the session before planning begins.
 *
 * Responsibility (Option B split):
 *   SessionStart → broad git state awareness (quick, no LLM)
 *   PrePlan      → topic-scoped deep analysis (Sonnet, per /plan)
 *
 * No overlap: PrePlan does NOT repeat git status or LTM globals —
 * those are already in context from SessionStart.
 */

import { readStdin, parseHookInput } from "../lib/hookUtils.js";
import { resolveProject } from "../lib/resolveProject.js";
import { logHook } from "../lib/hookLogger.js";
import { buildDeepBriefing } from "../lib/observe-briefing.js";

function extractTopic(prompt: string): string {
  // Strip /plan prefix and trim — the rest is the topic
  return prompt.replace(/^\s*\/plan\s*/i, "").trim();
}

async function main(): Promise<void> {
  const raw = await readStdin();
  const parsed = parseHookInput(raw);
  if (!parsed) return;

  const { input, cwd } = parsed;

  const getPrompt = (i: Record<string, unknown>): string =>
    ((i.prompt ?? i.user_prompt ?? i.message ?? "") as string).trim();
  const prompt = getPrompt(input);

  // Only act on /plan commands
  if (!/^\/plan\b/i.test(prompt)) return;

  const topic = extractTopic(prompt);
  if (!topic) return;

  const { name: project } = resolveProject(cwd);

  try {
    process.stderr.write(`[PrePlan] Running deep briefing for: "${topic}"\n`);
    const briefing = await buildDeepBriefing(cwd, project, topic);

    if (briefing) {
      process.stdout.write(briefing + "\n");
      logHook("PrePlan", "info", `Deep briefing injected for "${topic}"`);
    } else {
      logHook("PrePlan", "info", `No flags for "${topic}" — skipping briefing`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`[PrePlan] Briefing failed (non-fatal): ${msg}\n`);
    logHook("PrePlan", "error", `Briefing failed: ${msg}`);
  }
}

main();
