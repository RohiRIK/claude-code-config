/**
 * Registry.ts - Shared agent registry operations
 *
 * Provides common types, configuration, and functions for managing
 * the Goose agent registry. Used by SpawnAgent, AgentStatus,
 * CollectResults, and CheckAndSummarize.
 *
 * @author PAI System
 * @version 1.0.0
 */

import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";

// --- Configuration ---
export const TOOLS_DIR = dirname(dirname(import.meta.filename));
export const SKILL_DIR = resolve(TOOLS_DIR, "..");
export const RECIPES_DIR = resolve(SKILL_DIR, "Recipes");
export const LOG_DIR = resolve(SKILL_DIR, "gooshistory");
export const SUMMARIES_DIR = resolve(SKILL_DIR, "summaries");
export const REGISTRY_PATH = resolve(SKILL_DIR, "agent-registry.json");

// --- Types ---
export interface Agent {
  id: string;
  recipe: string;
  pid: number;
  status: "running" | "completed" | "failed";
  startTime: string;
  endTime?: string;
  logFile: string;
  exitCode?: number;
  params?: Record<string, string>;
  summarized?: boolean;
  error?: string;
}

export interface Registry {
  version: string;
  description: string;
  agents: Agent[];
  metadata: {
    autoCleanupHours: number;
    lastCleanup: string | null;
  };
}

export interface Summary {
  agentId: string;
  recipe: string;
  status: "SUCCESS" | "FAILURE" | "PARTIAL";
  duration: string;
  keyFindings: string[];
  actions: string[];
  recommendations: string[];
  errors: string[];
  summarizedAt: string;
  method: "haiku" | "regex";
}

// --- Registry Operations ---
export async function loadRegistry(): Promise<Registry> {
  try {
    const content = await readFile(REGISTRY_PATH, "utf-8");
    return JSON.parse(content);
  } catch {
    return {
      version: "1.0.0",
      description: "Registry of spawned Goose agents for parallel orchestration",
      agents: [],
      metadata: { autoCleanupHours: 24, lastCleanup: null },
    };
  }
}

export async function saveRegistry(registry: Registry): Promise<void> {
  await writeFile(REGISTRY_PATH, JSON.stringify(registry, null, 2));
}

export async function registerAgent(agent: Agent): Promise<void> {
  const registry = await loadRegistry();
  registry.agents.push(agent);
  await saveRegistry(registry);
}

export async function updateAgentStatus(
  agentId: string,
  status: "completed" | "failed",
  exitCode: number
): Promise<void> {
  const registry = await loadRegistry();
  const agent = registry.agents.find(a => a.id === agentId);
  if (agent) {
    agent.status = status;
    agent.exitCode = exitCode;
    agent.endTime = new Date().toISOString();
    await saveRegistry(registry);
  }
}

export async function findAgent(agentId: string): Promise<Agent | undefined> {
  const registry = await loadRegistry();
  return registry.agents.find(a => a.id === agentId || a.id.startsWith(agentId));
}

// --- Process Status Check ---
export async function isProcessRunning(pid: number): Promise<boolean> {
  try {
    process.kill(pid, 0); // Signal 0 just checks if process exists
    return true;
  } catch {
    return false;
  }
}

export async function updateRunningAgentStatuses(registry: Registry): Promise<boolean> {
  let changed = false;
  for (const agent of registry.agents) {
    if (agent.status === "running") {
      const running = await isProcessRunning(agent.pid);
      if (!running) {
        // Process ended but we didn't catch it - mark as completed
        agent.status = "completed";
        agent.endTime = new Date().toISOString();
        changed = true;
      }
    }
  }
  return changed;
}

// --- Helpers ---
export function formatDuration(start: Date, end: Date): string {
  const ms = end.getTime() - start.getTime();
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / 60000) % 60;
  const hours = Math.floor(ms / 3600000);

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "running":
    case "PENDING":
      return "\x1b[33m"; // Yellow
    case "completed":
    case "SUCCESS":
      return "\x1b[32m"; // Green
    case "failed":
    case "FAILURE":
      return "\x1b[31m"; // Red
    case "PARTIAL":
      return "\x1b[33m"; // Yellow
    default:
      return "\x1b[36m"; // Cyan
  }
}

export function getStatusIcon(status: string): string {
  switch (status) {
    case "running":
      return "\x1b[33m●\x1b[0m";
    case "completed":
      return "\x1b[32m✓\x1b[0m";
    case "failed":
      return "\x1b[31m✗\x1b[0m";
    default:
      return "\x1b[36m○\x1b[0m";
  }
}
