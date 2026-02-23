#!/usr/bin/env bun
/**
 * AgentStatus.ts - Check and manage Goose agent status
 *
 * Usage:
 *   bun AgentStatus.ts --list                    # Show all agents
 *   bun AgentStatus.ts --id <agent-id>           # Get specific agent status
 *   bun AgentStatus.ts --wait --id <agent-id>    # Block until agent completes
 *   bun AgentStatus.ts --kill --id <agent-id>    # Terminate running agent
 *   bun AgentStatus.ts --cleanup                 # Remove old agents (24h+)
 *
 * @author PAI System
 * @version 1.0.0
 */

import {
  type Agent,
  type Registry,
  loadRegistry,
  saveRegistry,
  isProcessRunning,
  updateRunningAgentStatuses,
  formatDuration,
  getStatusIcon,
} from "./lib/Registry.ts";

// --- Commands ---
async function listAgents(): Promise<void> {
  const registry = await loadRegistry();

  // Update status of running agents
  const changed = await updateRunningAgentStatuses(registry);
  if (changed) {
    await saveRegistry(registry);
  }

  if (registry.agents.length === 0) {
    console.log("\x1b[33m[Goose]\x1b[0m No agents in registry");
    return;
  }

  console.log("\x1b[36m[Goose Agents]\x1b[0m\n");

  // Group by status
  const running = registry.agents.filter(a => a.status === "running");
  const completed = registry.agents.filter(a => a.status === "completed");
  const failed = registry.agents.filter(a => a.status === "failed");

  const formatAgent = (a: Agent): string => {
    const duration = a.endTime
      ? formatDuration(new Date(a.startTime), new Date(a.endTime))
      : formatDuration(new Date(a.startTime), new Date());
    return `  ${getStatusIcon(a.status)} ${a.id.substring(0, 20)} | ${a.recipe.padEnd(20)} | ${duration}`;
  };

  if (running.length > 0) {
    console.log("\x1b[33mRunning:\x1b[0m");
    running.forEach(a => console.log(formatAgent(a)));
    console.log("");
  }

  if (completed.length > 0) {
    console.log("\x1b[32mCompleted:\x1b[0m");
    completed.slice(-5).forEach(a => console.log(formatAgent(a))); // Last 5
    if (completed.length > 5) {
      console.log(`  ... and ${completed.length - 5} more`);
    }
    console.log("");
  }

  if (failed.length > 0) {
    console.log("\x1b[31mFailed:\x1b[0m");
    failed.slice(-3).forEach(a => console.log(formatAgent(a))); // Last 3
    console.log("");
  }

  console.log(`Total: ${registry.agents.length} | Running: ${running.length} | Completed: ${completed.length} | Failed: ${failed.length}`);
}

async function getAgentStatus(agentId: string): Promise<void> {
  const registry = await loadRegistry();
  const agent = registry.agents.find(a => a.id === agentId || a.id.startsWith(agentId));

  if (!agent) {
    console.error(`\x1b[31m[Goose]\x1b[0m Agent not found: ${agentId}`);
    process.exit(1);
  }

  // Check if actually running
  if (agent.status === "running") {
    const running = await isProcessRunning(agent.pid);
    if (!running) {
      agent.status = "completed";
      agent.endTime = new Date().toISOString();
      await saveRegistry(registry);
    }
  }

  const duration = agent.endTime
    ? formatDuration(new Date(agent.startTime), new Date(agent.endTime))
    : formatDuration(new Date(agent.startTime), new Date());

  const statusColor = agent.status === "running" ? "\x1b[33m" :
    agent.status === "completed" ? "\x1b[32m" : "\x1b[31m";

  console.log(`
\x1b[36m[Agent Details]\x1b[0m

  ID:       ${agent.id}
  Recipe:   ${agent.recipe}
  Status:   ${statusColor}${agent.status}\x1b[0m
  PID:      ${agent.pid}
  Started:  ${agent.startTime}
  ${agent.endTime ? `Ended:    ${agent.endTime}` : ""}
  Duration: ${duration}
  Log:      ${agent.logFile}
  ${agent.exitCode !== undefined ? `Exit Code: ${agent.exitCode}` : ""}
  ${agent.params ? `Params:   ${JSON.stringify(agent.params)}` : ""}
`);

  // Output JSON for programmatic use
  console.log(JSON.stringify(agent, null, 2));
}

async function waitForAgent(agentId: string): Promise<void> {
  const registry = await loadRegistry();
  const agent = registry.agents.find(a => a.id === agentId || a.id.startsWith(agentId));

  if (!agent) {
    console.error(`\x1b[31m[Goose]\x1b[0m Agent not found: ${agentId}`);
    process.exit(1);
  }

  if (agent.status !== "running") {
    console.log(`\x1b[36m[Goose]\x1b[0m Agent already ${agent.status}`);
    await getAgentStatus(agent.id);
    return;
  }

  console.log(`\x1b[36m[Goose]\x1b[0m Waiting for agent ${agent.id}...`);

  // Poll until process completes
  while (true) {
    const running = await isProcessRunning(agent.pid);
    if (!running) {
      // Update registry
      const freshRegistry = await loadRegistry();
      const freshAgent = freshRegistry.agents.find(a => a.id === agent.id);
      if (freshAgent && freshAgent.status === "running") {
        freshAgent.status = "completed";
        freshAgent.endTime = new Date().toISOString();
        await saveRegistry(freshRegistry);
      }
      break;
    }
    await new Promise(r => setTimeout(r, 1000)); // Poll every second
    process.stdout.write(".");
  }

  console.log("\n");
  await getAgentStatus(agent.id);
}

async function killAgent(agentId: string): Promise<void> {
  const registry = await loadRegistry();
  const agent = registry.agents.find(a => a.id === agentId || a.id.startsWith(agentId));

  if (!agent) {
    console.error(`\x1b[31m[Goose]\x1b[0m Agent not found: ${agentId}`);
    process.exit(1);
  }

  if (agent.status !== "running") {
    console.log(`\x1b[33m[Goose]\x1b[0m Agent is not running (status: ${agent.status})`);
    return;
  }

  try {
    process.kill(agent.pid, "SIGTERM");
    agent.status = "failed";
    agent.endTime = new Date().toISOString();
    agent.exitCode = -15; // SIGTERM
    await saveRegistry(registry);
    console.log(`\x1b[32m[Goose]\x1b[0m Agent ${agent.id} terminated`);
  } catch (error) {
    console.error(`\x1b[31m[Goose]\x1b[0m Failed to kill agent:`, error);
    process.exit(1);
  }
}

async function cleanupOldAgents(): Promise<void> {
  const registry = await loadRegistry();
  const cutoff = Date.now() - (registry.metadata.autoCleanupHours * 60 * 60 * 1000);

  const oldCount = registry.agents.length;
  registry.agents = registry.agents.filter(a => {
    const agentTime = new Date(a.startTime).getTime();
    return agentTime > cutoff;
  });
  const removed = oldCount - registry.agents.length;

  registry.metadata.lastCleanup = new Date().toISOString();
  await saveRegistry(registry);

  console.log(`\x1b[32m[Goose]\x1b[0m Cleanup complete: removed ${removed} agents older than ${registry.metadata.autoCleanupHours}h`);
}

// --- Helpers ---
function showHelp(): void {
  console.log(`
\x1b[36mAgentStatus.ts\x1b[0m - Check and manage Goose agents

\x1b[33mUsage:\x1b[0m
  bun AgentStatus.ts [command] [options]

\x1b[33mCommands:\x1b[0m
  --list                    List all agents (default)
  --id <agent-id>           Get specific agent status
  --wait --id <agent-id>    Wait for agent to complete
  --kill --id <agent-id>    Terminate running agent
  --cleanup                 Remove agents older than 24h
  --help                    Show this help

\x1b[33mExamples:\x1b[0m
  bun AgentStatus.ts --list
  bun AgentStatus.ts --id agent-1706140800000
  bun AgentStatus.ts --wait --id agent-1706140800000
  bun AgentStatus.ts --kill --id agent-1706140800000
`);
}

// --- Main ---
async function main() {
  const args = process.argv.slice(2);

  if (args.includes("--help") || args.includes("-h")) {
    showHelp();
    process.exit(0);
  }

  if (args.includes("--cleanup")) {
    await cleanupOldAgents();
    return;
  }

  const idIndex = args.findIndex(a => a === "--id" || a === "-i");
  const agentId = idIndex !== -1 ? args[idIndex + 1] : null;

  if (args.includes("--wait") || args.includes("-w")) {
    if (!agentId) {
      console.error("\x1b[31m[Error]\x1b[0m --wait requires --id <agent-id>");
      process.exit(1);
    }
    await waitForAgent(agentId);
    return;
  }

  if (args.includes("--kill") || args.includes("-k")) {
    if (!agentId) {
      console.error("\x1b[31m[Error]\x1b[0m --kill requires --id <agent-id>");
      process.exit(1);
    }
    await killAgent(agentId);
    return;
  }

  if (agentId) {
    await getAgentStatus(agentId);
    return;
  }

  // Default: list all agents
  await listAgents();
}

main();
