#!/usr/bin/env bun
/**
 * CollectResults.ts - Retrieve summarized results from Goose agents
 *
 * Usage:
 *   bun CollectResults.ts --id <agent-id>       Get results for specific agent
 *   bun CollectResults.ts --recipe <name>       Get results for recipe type
 *   bun CollectResults.ts --recent [n]          Get last n results (default 5)
 *   bun CollectResults.ts --all                 Get all results
 *
 * @author PAI System
 * @version 1.0.0
 */

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { existsSync } from "node:fs";

import {
  SUMMARIES_DIR,
  type Agent,
  type Summary,
  loadRegistry,
  getStatusColor,
} from "./lib/Registry.ts";

interface CollectedResult {
  agentId: string;
  recipe: string;
  status: "SUCCESS" | "FAILURE" | "PARTIAL" | "PENDING";
  duration: string;
  startTime: string;
  endTime?: string;
  summary?: Summary;
  logFile: string;
  hasSummary: boolean;
}

// --- Summary Loading ---
async function loadSummary(agentId: string): Promise<Summary | null> {
  const summaryPath = resolve(SUMMARIES_DIR, `${agentId}-summary.json`);

  if (!existsSync(summaryPath)) {
    return null;
  }

  try {
    const content = await readFile(summaryPath, "utf-8");
    return JSON.parse(content);
  } catch {
    return null;
  }
}

// --- Collection ---
async function collectResultById(agentId: string): Promise<CollectedResult | null> {
  const registry = await loadRegistry();
  const agent = registry.agents.find(a => a.id === agentId || a.id.startsWith(agentId));

  if (!agent) {
    return null;
  }

  const summary = await loadSummary(agent.id);

  // Calculate duration
  const startTime = new Date(agent.startTime);
  const endTime = agent.endTime ? new Date(agent.endTime) : new Date();
  const durationMs = endTime.getTime() - startTime.getTime();
  const durationSec = Math.floor(durationMs / 1000);
  const duration = durationSec >= 60
    ? `${Math.floor(durationSec / 60)}m ${durationSec % 60}s`
    : `${durationSec}s`;

  return {
    agentId: agent.id,
    recipe: agent.recipe,
    status: summary?.status || (agent.status === "running" ? "PENDING" : agent.status === "failed" ? "FAILURE" : "SUCCESS"),
    duration,
    startTime: agent.startTime,
    endTime: agent.endTime,
    summary: summary || undefined,
    logFile: agent.logFile,
    hasSummary: !!summary,
  };
}

async function collectResultsByRecipe(recipe: string): Promise<CollectedResult[]> {
  const registry = await loadRegistry();
  const agents = registry.agents.filter(a =>
    a.recipe === recipe || a.recipe.includes(recipe)
  );

  const results: CollectedResult[] = [];

  for (const agent of agents) {
    const result = await collectResultById(agent.id);
    if (result) {
      results.push(result);
    }
  }

  return results.sort((a, b) =>
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
}

async function collectRecentResults(count: number): Promise<CollectedResult[]> {
  const registry = await loadRegistry();

  // Sort by start time descending
  const sortedAgents = [...registry.agents].sort((a, b) =>
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );

  const results: CollectedResult[] = [];

  for (const agent of sortedAgents.slice(0, count)) {
    const result = await collectResultById(agent.id);
    if (result) {
      results.push(result);
    }
  }

  return results;
}

async function collectAllResults(): Promise<CollectedResult[]> {
  const registry = await loadRegistry();
  const results: CollectedResult[] = [];

  for (const agent of registry.agents) {
    const result = await collectResultById(agent.id);
    if (result) {
      results.push(result);
    }
  }

  return results.sort((a, b) =>
    new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
  );
}

// --- Output Formatting ---
function formatResult(result: CollectedResult, verbose: boolean = false): void {
  const statusColor = getStatusColor(result.status);

  console.log(`
\x1b[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\x1b[0m
\x1b[1mAgent:\x1b[0m ${result.agentId}
\x1b[1mRecipe:\x1b[0m ${result.recipe}
\x1b[1mStatus:\x1b[0m ${statusColor}${result.status}\x1b[0m
\x1b[1mDuration:\x1b[0m ${result.duration}
\x1b[1mLog:\x1b[0m ${result.logFile}
`);

  if (result.summary) {
    console.log(`\x1b[1mSummary:\x1b[0m (via ${result.summary.method})`);

    if (result.summary.keyFindings.length > 0) {
      console.log(`\n\x1b[33mKey Findings:\x1b[0m`);
      result.summary.keyFindings.forEach(f => console.log(`  - ${f}`));
    }

    if (result.summary.actions.length > 0) {
      console.log(`\n\x1b[36mActions:\x1b[0m`);
      result.summary.actions.forEach(a => console.log(`  - ${a}`));
    }

    if (result.summary.recommendations.length > 0) {
      console.log(`\n\x1b[32mRecommendations:\x1b[0m`);
      result.summary.recommendations.forEach(r => console.log(`  - ${r}`));
    }

    if (result.summary.errors.length > 0) {
      console.log(`\n\x1b[31mErrors:\x1b[0m`);
      result.summary.errors.forEach(e => console.log(`  - ${e}`));
    }
  } else {
    console.log(`\x1b[33m[No summary available - run CheckAndSummarize.ts]\x1b[0m`);
  }
}

function showHelp(): void {
  console.log(`
\x1b[36mCollectResults.ts\x1b[0m - Retrieve Goose agent results

\x1b[33mUsage:\x1b[0m
  bun CollectResults.ts --id <agent-id>       Get specific agent results
  bun CollectResults.ts --recipe <name>       Get results by recipe type
  bun CollectResults.ts --recent [n]          Get last n results (default 5)
  bun CollectResults.ts --all                 Get all results
  bun CollectResults.ts --json                Output as JSON
  bun CollectResults.ts --help                Show this help

\x1b[33mExamples:\x1b[0m
  bun CollectResults.ts --id agent-1706140800000
  bun CollectResults.ts --recipe code-reviewer
  bun CollectResults.ts --recent 10
  bun CollectResults.ts --recent --json

\x1b[33mNotes:\x1b[0m
  - Results require prior summarization via CheckAndSummarize.ts
  - Use --json for programmatic consumption
`);
}

// --- Main ---
async function main() {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes("--json") || args.includes("-j");

  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    process.exit(0);
  }

  // --id <agent-id>
  const idIndex = args.findIndex(a => a === "--id" || a === "-i");
  if (idIndex !== -1) {
    const agentId = args[idIndex + 1];
    if (!agentId) {
      console.error("\x1b[31m[Error]\x1b[0m --id requires agent ID");
      process.exit(1);
    }

    const result = await collectResultById(agentId);
    if (!result) {
      console.error(`\x1b[31m[Error]\x1b[0m Agent not found: ${agentId}`);
      process.exit(1);
    }

    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      formatResult(result, true);
    }
    return;
  }

  // --recipe <name>
  const recipeIndex = args.findIndex(a => a === "--recipe" || a === "-r");
  if (recipeIndex !== -1) {
    const recipe = args[recipeIndex + 1];
    if (!recipe) {
      console.error("\x1b[31m[Error]\x1b[0m --recipe requires recipe name");
      process.exit(1);
    }

    const results = await collectResultsByRecipe(recipe);
    if (results.length === 0) {
      console.log(`\x1b[33m[Goose]\x1b[0m No results found for recipe: ${recipe}`);
      return;
    }

    if (jsonOutput) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.log(`\x1b[36m[Results for: ${recipe}]\x1b[0m`);
      results.forEach(r => formatResult(r));
    }
    return;
  }

  // --all
  if (args.includes("--all") || args.includes("-a")) {
    const results = await collectAllResults();

    if (jsonOutput) {
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.log(`\x1b[36m[All Results: ${results.length} agents]\x1b[0m`);
      results.forEach(r => formatResult(r));
    }
    return;
  }

  // --recent [n] (default)
  const recentIndex = args.findIndex(a => a === "--recent" || a === "-n");
  const count = recentIndex !== -1 && args[recentIndex + 1] && !args[recentIndex + 1].startsWith("-")
    ? parseInt(args[recentIndex + 1], 10)
    : 5;

  const results = await collectRecentResults(count);

  if (results.length === 0) {
    console.log("\x1b[33m[Goose]\x1b[0m No agent results found");
    return;
  }

  if (jsonOutput) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log(`\x1b[36m[Recent Results: ${results.length} agents]\x1b[0m`);
    results.forEach(r => formatResult(r));
  }
}

main();
