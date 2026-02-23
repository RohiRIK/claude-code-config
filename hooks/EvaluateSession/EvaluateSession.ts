#!/usr/bin/env bun
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "fs";
import { join, sep } from "path";
import { homedir } from "os";

// Evaluate Session Hook
// Extracts patterns from transcript

const CLAUDE_DIR = join(homedir(), ".claude");
const LEARNED_DIR = join(CLAUDE_DIR, "skills", "Learned");
const PATTERNS_DIR = join(LEARNED_DIR, "patterns");
const SUMMARY_FILE = join(LEARNED_DIR, "summary.md");
const HISTORY_FILE = join(CLAUDE_DIR, "history.jsonl");
const MAX_SUMMARY_LINES = 50;
const MIN_SESSION_MESSAGES = 5; // Lowered for testing

function getProjectSlug(projectPath: string): string {
  // Mimic Claude's slug generation: replace all separators with '-'
  // e.g. /Users/foo -> -Users-foo
  return projectPath.replace(new RegExp(sep, 'g'), '-');
}

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

  const slug = getProjectSlug(projectPath);
  // Try to find the project folder in ~/.claude/projects/
  const projectsDir = join(CLAUDE_DIR, "projects");
  const projectDirName = slug; // The slug seems to be exact name in projects/
  
  // Note: The slug might vary slightly (e.g. windows vs mac), but usually it's direct replacement.
  // We can try to fuzzy match if exact fails, but let's try exact first.
  let transcriptPath = join(projectsDir, projectDirName, `${finalSessionId}.jsonl`);

  if (!existsSync(transcriptPath)) {
    // Fallback: try to find any directory ending with the project name or check known patterns
    // For now, let's assume the slug is correct.
    // If exact path fails, we can't do much without listing all dirs.
    return null;
  }

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

    // Extract Errors
    const errors = messages.filter((m: any) => m.type === 'error' || (m.tool_output && m.tool_output.is_error));
    fileContent += "## Errors Encountered\n";
    errors.slice(0, 10).forEach((e: any) => {
        const msg = e.error?.message || e.tool_output?.output || "Unknown error";
        fileContent += `- ${msg.substring(0, 200).replace(/\n/g, ' ')}\n`;
    });
    fileContent += "\n";

    // Extract Tool Usage
    const toolUsage: Record<string, number> = {};
    messages.forEach((m: any) => {
        if (m.type === 'tool_use' && m.tool_use) {
            const tool = m.tool_use.name;
            toolUsage[tool] = (toolUsage[tool] || 0) + 1;
        }
    });
    
    fileContent += "## Tools Used\n";
    Object.entries(toolUsage)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .forEach(([tool, count]) => fileContent += `- ${tool} (${count} times)\n`);
    fileContent += "\n";

    // Extract Files Modified (Look for write_file / replace tools)
    const files = new Set<string>();
    messages.forEach((m: any) => {
        if (m.type === 'tool_use' && m.tool_use) {
            if (m.tool_use.name === 'Write' || m.tool_use.name === 'Edit' || m.tool_use.name === 'MultiEdit') {
                const path = m.tool_use.input?.file_path || m.tool_use.input?.path;
                if (path) files.add(path);
            }
        }
    });
    fileContent += "## Files Modified\n";
    [...files].slice(0, 20).forEach(f => fileContent += `- ${f}\n`);
    fileContent += "\n";

    writeFileSync(patternFile, fileContent);
    // console.error(`[ContinuousLearning] Patterns saved to: ${patternFile}`);

    // Update Summary
    if (!existsSync(SUMMARY_FILE)) {
      writeFileSync(SUMMARY_FILE, "# Learned Patterns Summary\n\nThis file is auto-updated.\n\n---\n\n## Recent Sessions\n\n");
    }

    appendFileSync(SUMMARY_FILE, `- **${today}** (${messageCount} msgs): Session ${sessionId ? sessionId.substring(0,8) : 'unknown'}... (Errors: ${errors.length})\n`);

    // Trim summary
    const summaryLines = readFileSync(SUMMARY_FILE, "utf-8").split('\n');
    if (summaryLines.length > MAX_SUMMARY_LINES) {
      const newSummary = summaryLines.slice(0, 10).concat(summaryLines.slice(summaryLines.length - (MAX_SUMMARY_LINES - 10))).join('\n');
      writeFileSync(SUMMARY_FILE, newSummary);
    }

    // console.error(`[ContinuousLearning] Summary updated: ${SUMMARY_FILE}`);

  } catch (error) {
    // Fail silently on parse error or logic error to not break hook
    console.error("[ContinuousLearning] Error analyzing session:", error);
  }
}

main();