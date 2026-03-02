#!/usr/bin/env bun
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, readdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { resolveProject, PROJECTS_DIR } from "../lib/resolveProject.js";

// Evaluate Session Hook
// Extracts patterns from transcript

const CLAUDE_DIR = join(homedir(), ".claude");
const LEARNED_DIR = join(CLAUDE_DIR, "skills", "Learned");
const PATTERNS_DIR = join(LEARNED_DIR, "patterns");
const SUMMARY_FILE = join(LEARNED_DIR, "summary.md");
const HISTORY_FILE = join(CLAUDE_DIR, "history.jsonl");
const MAX_SUMMARY_LINES = 50;
const SUMMARY_HEADER_LINES = 10;
const MIN_SESSION_MESSAGES = 5; // Lowered for testing

async function findTranscript(sessionId: string | undefined): Promise<{ path: string, id: string } | null> {
  if (!existsSync(HISTORY_FILE)) return null;

  const historyLines = readFileSync(HISTORY_FILE, "utf-8").trim().split('\n');
  if (historyLines.length === 0) return null;

  // Find the entry matching sessionId, or the last one if not provided
  let historyEntry: any = null;
  if (sessionId) {
    // Search backwards
    for (let i = historyLines.length - 1; i >= 0; i--) {
      try {
        const line = JSON.parse(historyLines[i]);
        if (line.sessionId === sessionId) {
          historyEntry = line;
          break;
        }
      } catch (e) {}
    }
  } else {
    // Just take the last valid one
    try {
      historyEntry = JSON.parse(historyLines[historyLines.length - 1]);
    } catch (e) {}
  }

  if (!historyEntry) return null;

  const finalSessionId = historyEntry.sessionId;
  const projectPath = historyEntry.project;
  if (!finalSessionId || !projectPath) return null;

  const filename = `${finalSessionId}.jsonl`;

  // Try registry-resolved project dir first, then scan all project dirs for the session file
  const { projectDir } = resolveProject(projectPath);
  let transcriptPath = join(projectDir, filename);

  if (!existsSync(transcriptPath)) {
    // Claude Code may use a different slug format — scan all dirs
    try {
      const dirs = readdirSync(PROJECTS_DIR);
      for (const dir of dirs) {
        const candidate = join(PROJECTS_DIR, dir, filename);
        if (existsSync(candidate)) {
          transcriptPath = candidate;
          break;
        }
      }
    } catch (_) {}
  }

  if (!existsSync(transcriptPath)) return null;

  return { path: transcriptPath, id: finalSessionId };
}

async function main() {
  let inputStr = "";
  // Hook inputs are optional for this tool now, but we pass through stdin
  try {
    for await (const chunk of Bun.stdin.stream()) {
      const text = new TextDecoder().decode(chunk);
      inputStr += text;
      process.stdout.write(chunk); // Pass through immediately
    }
  } catch (e) {
    // Stdin might be empty or closed
  }

  try {
    let input: any = {};
    try {
      input = JSON.parse(inputStr);
    } catch (e) {}

    let transcriptPath = input.transcript_path;
    let sessionId = input.session_id;

    if (!transcriptPath || !existsSync(transcriptPath)) {
      const found = await findTranscript(sessionId);
      if (found) {
        transcriptPath = found.path;
        sessionId = found.id;
      }
    }

    if (!transcriptPath || !existsSync(transcriptPath)) {
      // console.error("[ContinuousLearning] Could not find transcript path.");
      return;
    }

    const transcriptContent = readFileSync(transcriptPath, "utf-8");
    // Parse JSONL
    const messages = transcriptContent.trim().split('\n').map(l => {
        try { return JSON.parse(l); } catch(e) { return null; }
    }).filter(Boolean);

    const messageCount = messages.length;

    if (messageCount < MIN_SESSION_MESSAGES) {
    //   console.error(`[ContinuousLearning] Session too short (${messageCount} messages), skipping`);
      return;
    }

    if (!existsSync(PATTERNS_DIR)) mkdirSync(PATTERNS_DIR, { recursive: true });

    const today = new Date().toISOString().split('T')[0];
    const patternFile = join(PATTERNS_DIR, `${today}.md`);

    let fileContent = `# Session Patterns: ${today}\n`;
    fileContent += `**Session ID:** ${sessionId || "unknown"}\n`;
    fileContent += `**Messages:** ${messageCount}\n\n---\n\n`;

    // Collect all tool_use content blocks from assistant messages
    const toolUseBlocks: any[] = [];
    messages.forEach((m: any) => {
      const content = m.message?.content;
      if (Array.isArray(content)) {
        content.forEach((block: any) => {
          if (block.type === 'tool_use') toolUseBlocks.push(block);
        });
      }
    });

    // Collect tool result blocks (errors) from user messages
    const errorBlocks: string[] = [];
    messages.forEach((m: any) => {
      const content = m.message?.content;
      if (Array.isArray(content)) {
        content.forEach((block: any) => {
          if (block.type === 'tool_result' && block.is_error) {
            const output = Array.isArray(block.content)
              ? block.content.map((c: any) => c.text || '').join(' ')
              : String(block.content || '');
            errorBlocks.push(output.substring(0, 200).replace(/\n/g, ' '));
          }
        });
      }
      // Also catch top-level error messages
      if (m.type === 'error') {
        errorBlocks.push((m.error?.message || 'Unknown error').substring(0, 200));
      }
    });

    fileContent += "## Errors Encountered\n";
    errorBlocks.slice(0, 10).forEach(msg => fileContent += `- ${msg}\n`);
    fileContent += "\n";

    // Extract Tool Usage
    const toolUsage: Record<string, number> = {};
    toolUseBlocks.forEach((block: any) => {
      toolUsage[block.name] = (toolUsage[block.name] || 0) + 1;
    });

    fileContent += "## Tools Used\n";
    Object.entries(toolUsage)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .forEach(([tool, count]) => fileContent += `- ${tool} (${count} times)\n`);
    fileContent += "\n";

    // Extract Files Modified
    const files = new Set<string>();
    toolUseBlocks.forEach((block: any) => {
      if (block.name === 'Write' || block.name === 'Edit' || block.name === 'MultiEdit') {
        const path = block.input?.file_path || block.input?.path;
        if (path) files.add(path);
      }
    });
    fileContent += "## Files Modified\n";
    [...files].slice(0, 20).forEach(f => fileContent += `- ${f}\n`);
    fileContent += "\n";

    writeFileSync(patternFile, fileContent);
    // console.error(`[ContinuousLearning] Patterns saved to: ${patternFile}`);

    // Update Summary (deduplicate by sessionId)
    if (!existsSync(SUMMARY_FILE)) {
      writeFileSync(SUMMARY_FILE, "# Learned Patterns Summary\n\nThis file is auto-updated.\n\n---\n\n## Recent Sessions\n\n");
    }

    const summaryContent = readFileSync(SUMMARY_FILE, "utf-8");
    const shortId = sessionId ? sessionId.substring(0, 8) : 'unknown';
    if (!summaryContent.includes(shortId)) {
      const newLine = `- **${today}** (${messageCount} msgs): Session ${shortId}... (Errors: ${errorBlocks.length})\n`;
      appendFileSync(SUMMARY_FILE, newLine);

      // Trim using in-memory content — avoid a second disk read
      const updatedLines = (summaryContent + newLine).split('\n');
      if (updatedLines.length > MAX_SUMMARY_LINES) {
        const newSummary = updatedLines.slice(0, SUMMARY_HEADER_LINES)
          .concat(updatedLines.slice(updatedLines.length - (MAX_SUMMARY_LINES - SUMMARY_HEADER_LINES)))
          .join('\n');
        writeFileSync(SUMMARY_FILE, newSummary);
      }
    }

    // console.error(`[ContinuousLearning] Summary updated: ${SUMMARY_FILE}`);

  } catch (error) {
    // Fail silently on parse error or logic error to not break hook
    console.error("[ContinuousLearning] Error analyzing session:", error);
  }
}

main();