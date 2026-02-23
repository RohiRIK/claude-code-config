#!/usr/bin/env bun
/**
 * CheckAndSummarize.ts - PostToolUse hook for Haiku summarization
 *
 * This hook is triggered after SpawnAgent.ts calls complete.
 * It checks for newly completed agents and summarizes their output.
 *
 * Usage (called by PostToolUse hook):
 *   bun CheckAndSummarize.ts
 *
 * Can also be called manually:
 *   bun CheckAndSummarize.ts --force <agent-id>
 *
 * Uses PAI Inference tool (Claude subscription) instead of direct API calls.
 *
 * @author PAI System
 * @version 1.1.0
 */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

import {
  LOG_DIR,
  SUMMARIES_DIR,
  type Agent,
  type Summary,
  loadRegistry,
  saveRegistry,
} from "./lib/Registry.ts";

// Import PAI Inference tool (uses Claude subscription, not API key)
// Made optional since CORE/Tools/Inference.ts may not exist
let inference: any = null;

const MAX_LOG_CHARS = 8000; // Truncate logs for inference

// --- Summarization ---
async function summarizeWithInference(logContent: string, recipe: string): Promise<Summary | null> {
  // Check if inference tool is available
  if (!inference) {
    try {
      const module = await import("../../CORE/Tools/Inference.ts");
      inference = module.inference;
    } catch (e) {
      // Inference not available, return null to trigger regex fallback
      return null;
    }
  }

  const truncatedLog = logContent.length > MAX_LOG_CHARS
    ? logContent.substring(0, MAX_LOG_CHARS) + "\n... [truncated]"
    : logContent;

  const systemPrompt = "You are a concise summarizer. Return ONLY valid JSON with no markdown or backticks.";

  const userPrompt = `Summarize this Goose agent output concisely.

Recipe: ${recipe}
Output:
${truncatedLog}

Return ONLY valid JSON:
{
  "status": "SUCCESS or FAILURE or PARTIAL",
  "keyFindings": ["max 5 items - main discoveries or results"],
  "actions": ["max 3 items - what the agent did"],
  "recommendations": ["max 3 items - suggested next steps"],
  "errors": ["any errors encountered, empty array if none"]
}`;

  try {
    const result = await inference({
      systemPrompt,
      userPrompt,
      level: 'fast', // Haiku equivalent
      expectJson: true,
      timeout: 20000,
    });

    if (!result.success || !result.parsed) {
      console.error(`[Summarize] Inference error: ${result.error}`);
      return null;
    }

    const parsed = result.parsed as {
      status: string;
      keyFindings: string[];
      actions: string[];
      recommendations: string[];
      errors: string[];
    };

    return {
      ...parsed,
      status: parsed.status as "SUCCESS" | "FAILURE" | "PARTIAL",
      agentId: "",
      recipe,
      duration: "",
      summarizedAt: new Date().toISOString(),
      method: "haiku",
    };
  } catch (error) {
    console.error("[Summarize] Inference error:", error);
    return null;
  }
}

function summarizeWithRegex(logContent: string, recipe: string): Summary {
  const lines = logContent.split("\n");
  const keyFindings: string[] = [];
  const actions: string[] = [];
  const recommendations: string[] = [];
  const errors: string[] = [];

  // Extract patterns
  for (const line of lines) {
    const lowerLine = line.toLowerCase();

    // Errors
    if (lowerLine.includes("error") || lowerLine.includes("failed") || lowerLine.includes("exception")) {
      if (errors.length < 5 && line.trim().length > 10 && line.trim().length < 200) {
        errors.push(line.trim().substring(0, 150));
      }
    }

    // Findings (common patterns in reviews)
    if (lowerLine.includes("found") || lowerLine.includes("detected") || lowerLine.includes("identified")) {
      if (keyFindings.length < 5 && line.trim().length > 10 && line.trim().length < 200) {
        keyFindings.push(line.trim().substring(0, 150));
      }
    }

    // Actions
    if (lowerLine.includes("running") || lowerLine.includes("checking") || lowerLine.includes("analyzing")) {
      if (actions.length < 3 && line.trim().length > 10 && line.trim().length < 200) {
        actions.push(line.trim().substring(0, 150));
      }
    }

    // Recommendations
    if (lowerLine.includes("recommend") || lowerLine.includes("suggest") || lowerLine.includes("should") || lowerLine.includes("consider")) {
      if (recommendations.length < 3 && line.trim().length > 10 && line.trim().length < 200) {
        recommendations.push(line.trim().substring(0, 150));
      }
    }
  }

  // Determine status
  let status: "SUCCESS" | "FAILURE" | "PARTIAL" = "SUCCESS";
  if (errors.length > 2) {
    status = "FAILURE";
  } else if (errors.length > 0) {
    status = "PARTIAL";
  }

  // Check for explicit success/failure markers
  if (logContent.includes("Mission Complete") || logContent.includes("completed successfully")) {
    status = errors.length > 0 ? "PARTIAL" : "SUCCESS";
  }
  if (logContent.includes("Process failed") || logContent.includes("Fatal Error")) {
    status = "FAILURE";
  }

  return {
    agentId: "",
    recipe,
    status,
    duration: "",
    keyFindings: keyFindings.length > 0 ? keyFindings : ["No specific findings extracted"],
    actions: actions.length > 0 ? actions : ["Agent executed recipe"],
    recommendations: recommendations.length > 0 ? recommendations : [],
    errors,
    summarizedAt: new Date().toISOString(),
    method: "regex",
  };
}

async function summarizeAgent(agent: Agent): Promise<Summary | null> {
  const logPath = resolve(LOG_DIR, agent.logFile);

  if (!existsSync(logPath)) {
    console.error(`[Summarize] Log file not found: ${logPath}`);
    return null;
  }

  const logContent = await readFile(logPath, "utf-8");

  // Calculate duration
  const startTime = new Date(agent.startTime);
  const endTime = agent.endTime ? new Date(agent.endTime) : new Date();
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationSec = Math.floor(durationMs / 1000);
  const duration = durationSec >= 60
    ? `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`
    : `${durationSec}s`;

  // Try PAI Inference (Haiku) first, fall back to regex
  let summary = await summarizeWithInference(logContent, agent.recipe);

  if (!summary) {
    console.log(`[Summarize] Using regex fallback for ${agent.id}`);
    summary = summarizeWithRegex(logContent, agent.recipe);
  }

  // Fill in agent-specific fields
  summary.agentId = agent.id;
  summary.duration = duration;

  // Override status based on exit code
  if (agent.exitCode !== undefined && agent.exitCode !== 0) {
    summary.status = "FAILURE";
  }

  return summary;
}

async function saveSummary(summary: Summary): Promise<void> {
  const summaryPath = resolve(SUMMARIES_DIR, `${summary.agentId}-summary.json`);
  await writeFile(summaryPath, JSON.stringify(summary, null, 2));
}

// --- Main Processing ---
export async function processCompletedAgents(): Promise<void> {
  const registry = await loadRegistry();

  // Find completed agents without summaries
  const needsSummary = registry.agents.filter(
    a => (a.status === "completed" || a.status === "failed") && !a.summarized
  );

  if (needsSummary.length === 0) {
    return; // Nothing to do
  }

  console.error(`[Summarize] Processing ${needsSummary.length} agent(s)...`);

  for (const agent of needsSummary) {
    try {
      const summary = await summarizeAgent(agent);

      if (summary) {
        await saveSummary(summary);
        agent.summarized = true;
        console.error(`[Summarize] Summarized ${agent.id} (${summary.method}): ${summary.status}`);
      }
    } catch (error) {
      console.error(`[Summarize] Error processing ${agent.id}:`, error);
    }
  }

  await saveRegistry(registry);
}

async function forceProcessAgent(agentId: string): Promise<void> {
  const registry = await loadRegistry();
  const agent = registry.agents.find(a => a.id === agentId || a.id.startsWith(agentId));

  if (!agent) {
    console.error(`[Summarize] Agent not found: ${agentId}`);
    process.exit(1);
  }

  console.log(`[Summarize] Force processing ${agent.id}...`);

  const summary = await summarizeAgent(agent);

  if (summary) {
    await saveSummary(summary);
    agent.summarized = true;
    await saveRegistry(registry);

    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.error("[Summarize] Failed to generate summary");
    process.exit(1);
  }
}

// --- Main ---
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
\x1b[36mCheckAndSummarize.ts\x1b[0m - Summarize Goose agent output

\x1b[33mUsage:\x1b[0m
  bun CheckAndSummarize.ts              Process all unsummarized agents
  bun CheckAndSummarize.ts --force <id> Force summarize specific agent
  bun CheckAndSummarize.ts --help       Show this help

\x1b[33mNotes:\x1b[0m
  - Uses PAI Inference tool (Claude subscription via 'fast' level)
  - Falls back to regex extraction if inference fails
  - Summaries stored in skills/Goose/summaries/
`);
    process.exit(0);
  }

  if (args.includes("--force") || args.includes("-f")) {
    const forceIndex = args.findIndex(a => a === "--force" || a === "-f");
    const agentId = args[forceIndex + 1];

    if (!agentId) {
      console.error("[Error] --force requires agent ID");
      process.exit(1);
    }

    await forceProcessAgent(agentId);
    return;
  }

  // Default: process all completed agents
  await processCompletedAgents();
}

main();
