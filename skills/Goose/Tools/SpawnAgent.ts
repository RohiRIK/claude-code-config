#!/usr/bin/env bun
/**
 * SpawnAgent.ts - Non-blocking agent spawning using Goose headless mode
 *
 * Usage:
 *   bun SpawnAgent.ts <recipe_name> [--params key=value] [--wait]
 *   bun SpawnAgent.ts code-reviewer --params user_input="Review src/"
 *   bun SpawnAgent.ts code-reviewer --wait  # Blocking mode (legacy)
 *
 * Returns immediately with agent ID while process runs in background.
 * Use AgentStatus.ts to check progress and CollectResults.ts to get output.
 *
 * @author PAI System
 * @version 1.0.0
 */

import { spawn, file } from "bun";
import { mkdir } from "node:fs/promises";
import { resolve, parse } from "node:path";

import {
  RECIPES_DIR,
  LOG_DIR,
  type Agent,
  registerAgent,
  updateAgentStatus,
} from "./lib/Registry.ts";

interface SpawnOptions {
  recipeName: string;
  params: Record<string, string>;
  wait: boolean;
}

// --- Argument Parsing ---
function parseArgs(): SpawnOptions {
  const args = process.argv.slice(2);
  const params: Record<string, string> = {};
  let recipeName = "";
  let wait = false;
  let paramsMode = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--wait" || arg === "-w") {
      wait = true;
    } else if (arg === "--params" || arg === "-p") {
      paramsMode = true;
    } else if (arg === "--help" || arg === "-h") {
      showHelp();
      process.exit(0);
    } else if (paramsMode && arg.includes("=")) {
      const [key, ...valueParts] = arg.split("=");
      params[key] = valueParts.join("=");
    } else if (!recipeName && !arg.startsWith("-")) {
      recipeName = arg;
      paramsMode = false; // Reset after getting recipe name
    }
  }

  if (!recipeName) {
    showHelp();
    process.exit(1);
  }

  return { recipeName, params, wait };
}

function showHelp(): void {
  console.log(`
\x1b[36mSpawnAgent.ts\x1b[0m - Non-blocking Goose agent spawning

\x1b[33mUsage:\x1b[0m
  bun SpawnAgent.ts <recipe> [options]

\x1b[33mOptions:\x1b[0m
  --params, -p <key=value>   Recipe parameters (can specify multiple)
  --wait, -w                 Wait for completion (blocking mode)
  --help, -h                 Show this help

\x1b[33mExamples:\x1b[0m
  # Non-blocking (default) - returns immediately
  bun SpawnAgent.ts code-reviewer --params user_input="Review src/"

  # Blocking (legacy) - waits for completion
  bun SpawnAgent.ts code-reviewer --wait --params user_input="Review src/"

  # Multiple agents in parallel
  bun SpawnAgent.ts code-reviewer --params user_input="Review src/" &
  bun SpawnAgent.ts security-reviewer --params user_input="Audit auth/" &

\x1b[33mAfter Spawning:\x1b[0m
  bun AgentStatus.ts --list              # Check all agents
  bun AgentStatus.ts --id <agent-id>     # Check specific agent
  bun CollectResults.ts --id <agent-id>  # Get summarized results
`);
}

// --- Agent Spawning ---
async function spawnAgent(options: SpawnOptions): Promise<{ agentId: string; pid: number }> {
  const { recipeName, params, wait } = options;

  // Resolve recipe path
  const parsed = parse(recipeName);
  const safeName = parsed.ext === ".yaml" ? recipeName : `${recipeName}.yaml`;
  const recipePath = resolve(RECIPES_DIR, safeName);

  // Generate agent ID and log path
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const agentId = `agent-${Date.now()}`;
  const logName = `${timestamp}-${parsed.name}.log`;
  const logPath = resolve(LOG_DIR, logName);

  // Ensure log directory exists
  await mkdir(LOG_DIR, { recursive: true });

  // Build command with Goose headless mode flags
  const cmd = ["goose", "run", "--no-session", "--recipe", recipePath];

  // Add params
  for (const [key, value] of Object.entries(params)) {
    cmd.push("--params", `${key}=${value}`);
  }

  // Environment for headless mode
  const env = {
    ...process.env,
    NO_COLOR: "true",
    GOOSE_MODE: "auto",
    GOOSE_MAX_TURNS: "50",
  };

  console.log(`\x1b[36m[Goose]\x1b[0m Spawning agent: ${agentId}`);
  console.log(`\x1b[36m[Goose]\x1b[0m Recipe: ${safeName}`);
  console.log(`\x1b[36m[Goose]\x1b[0m Log: ${logName}`);
  if (Object.keys(params).length > 0) {
    console.log(`\x1b[36m[Goose]\x1b[0m Params: ${JSON.stringify(params)}`);
  }

  const logFile = file(logPath);
  const logWriter = logFile.writer();

  // Write header to log
  logWriter.write(`[Agent] ID: ${agentId}\n`);
  logWriter.write(`[Agent] Recipe: ${safeName}\n`);
  logWriter.write(`[Agent] Started: ${new Date().toISOString()}\n`);
  logWriter.write(`[Agent] Params: ${JSON.stringify(params)}\n`);
  logWriter.write(`${"=".repeat(60)}\n\n`);

  // Spawn process
  const proc = spawn(cmd, {
    stdout: "pipe",
    stderr: "pipe",
    cwd: process.cwd(),
    env,
  });

  const pid = proc.pid;

  // Register agent
  const agent: Agent = {
    id: agentId,
    recipe: parsed.name,
    pid,
    status: "running",
    startTime: new Date().toISOString(),
    logFile: logName,
    params: Object.keys(params).length > 0 ? params : undefined,
  };
  await registerAgent(agent);

  if (wait) {
    // Blocking mode - wait for completion
    console.log(`\x1b[36m[Goose]\x1b[0m Waiting for completion (blocking mode)...`);

    // Pipe output to both log and stdout
    const decoder = new TextDecoder();

    const pipeStream = async (stream: ReadableStream<Uint8Array> | null, isErr: boolean) => {
      if (!stream) return;
      for await (const chunk of stream) {
        const text = decoder.decode(chunk);
        logWriter.write(text);
        (isErr ? process.stderr : process.stdout).write(text);
      }
    };

    await Promise.all([
      pipeStream(proc.stdout, false),
      pipeStream(proc.stderr, true),
      proc.exited,
    ]);

    await logWriter.flush();
    logWriter.end();

    const exitCode = proc.exitCode ?? 1;
    const status = exitCode === 0 ? "completed" : "failed";
    await updateAgentStatus(agentId, status, exitCode);

    if (exitCode === 0) {
      console.log(`\n${"─".repeat(60)}`);
      console.log(`\x1b[32m[Goose]\x1b[0m Agent completed successfully`);
      console.log(`${"─".repeat(60)}`);
    } else {
      console.error(`\n\x1b[31m[Goose]\x1b[0m Agent failed with exit code ${exitCode}`);
    }

    return { agentId, pid };
  }

  // Non-blocking mode - set up background completion handler
  (async () => {
    const decoder = new TextDecoder();

    const pipeStream = async (stream: ReadableStream<Uint8Array> | null) => {
      if (!stream) return;
      for await (const chunk of stream) {
        logWriter.write(decoder.decode(chunk));
      }
    };

    await Promise.all([
      pipeStream(proc.stdout),
      pipeStream(proc.stderr),
      proc.exited,
    ]);

    await logWriter.flush();
    logWriter.end();

    const exitCode = proc.exitCode ?? 1;
    const status = exitCode === 0 ? "completed" : "failed";
    await updateAgentStatus(agentId, status, exitCode);

    // Auto-summarize on completion (using PAI Inference)
    try {
      const { processCompletedAgents } = await import("./CheckAndSummarize.ts");
      await processCompletedAgents();
    } catch {
      // Silent failure - summarization is optional
    }
  })();

  // Return immediately
  console.log(`\x1b[32m[Goose]\x1b[0m Agent spawned (non-blocking)`);
  console.log(`\x1b[36m[Goose]\x1b[0m Check status: bun AgentStatus.ts --id ${agentId}`);

  // Output JSON for programmatic use
  const result = {
    agentId,
    pid,
    status: "spawned",
    recipe: parsed.name,
    logFile: logName,
  };
  console.log(`\n${JSON.stringify(result, null, 2)}`);

  return { agentId, pid };
}

// --- Main ---
async function main() {
  try {
    const options = parseArgs();
    await spawnAgent(options);
  } catch (error) {
    console.error(`\x1b[31m[Goose]\x1b[0m Fatal error:`, error);
    process.exit(1);
  }
}

main();
