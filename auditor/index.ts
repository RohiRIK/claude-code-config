#!/usr/bin/env bun
/**
 * ~/.claude/auditor/index.ts
 *
 * Read-only auditor: sends ~/.claude files to isolated Gemini CLI instances
 * (Flash for quick checks, Pro for deep analysis) and writes a merged report.
 *
 * PERMISSIONS: reads ~/.claude, writes ~/.claude/auditor/reports/ only. Makes NO changes.
 *
 * Usage:
 *   bun run ~/.claude/auditor/index.ts           # audits entire ~/.claude
 *   bun run ~/.claude/auditor/index.ts <path>    # audits specific file/dir
 */

import { readdir, readFile, stat, writeFile, mkdir, mkdtemp, rm } from "fs/promises";
import { join, relative, extname } from "path";
import { tmpdir } from "os";
import { spawnSync } from "child_process";

const CLAUDE_DIR = join(process.env.HOME!, ".claude");
const REPORTS_DIR = join(CLAUDE_DIR, "auditor", "reports");
const PROMPTS_DIR = join(CLAUDE_DIR, "auditor", "prompts");

// Files/dirs to skip when reading ~/.claude
const SKIP_PATTERNS = [
  "auditor",
  ".git",
  "node_modules",
  ".last-ingested",
  "projects", // per-project context, may contain sensitive data
];

// Only audit these extensions
const AUDIT_EXTENSIONS = new Set([".ts", ".json", ".md", ".yaml", ".yml"]);

// Max chars to send per model (rough token budget)
const MAX_CHARS = 150_000;

interface Finding {
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO";
  file: string;
  line?: number | null;
  title: string;
  description: string;
  suggestion?: string;
}

async function collectFiles(target?: string): Promise<Map<string, string>> {
  const root = target ? join(CLAUDE_DIR, target) : CLAUDE_DIR;
  const files = new Map<string, string>();

  async function walk(dir: string) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const rel = relative(CLAUDE_DIR, fullPath);

      if (SKIP_PATTERNS.some((p) => rel.startsWith(p) || entry.name === p)) {
        continue;
      }

      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && AUDIT_EXTENSIONS.has(extname(entry.name))) {
        try {
          const content = await readFile(fullPath, "utf-8");
          if (content.length < 100_000) {
            // skip huge files
            files.set(rel, content);
          }
        } catch {
          // skip unreadable files
        }
      }
    }
  }

  const rootStat = await stat(root).catch(() => null);
  if (!rootStat) return files;

  if (rootStat.isDirectory()) {
    await walk(root);
  } else {
    const content = await readFile(root, "utf-8");
    files.set(relative(CLAUDE_DIR, root), content);
  }

  return files;
}

function buildContext(files: Map<string, string>): string {
  let context = "";
  for (const [path, content] of files) {
    const block = `### ${path}\n\`\`\`\n${content}\n\`\`\`\n\n`;
    if (context.length + block.length > MAX_CHARS) break;
    context += block;
  }
  return context;
}

async function runGemini(
  model: "gemini-3-flash-preview" | "gemini-3-pro-preview",
  systemPromptFile: string,
  context: string
): Promise<Finding[]> {
  // Create isolated throwaway config dir
  const configDir = await mkdtemp(join(tmpdir(), `audit-gemini-`));

  try {
    const systemPrompt = await readFile(systemPromptFile, "utf-8");
    const fullPrompt = `${systemPrompt}\n\n## Files to Audit\n\n${context}`;

    const result = spawnSync(
      "gemini",
      ["--model", model, "--prompt", fullPrompt],
      {
        env: {
          ...process.env,
          // Isolate session history/cache but keep HOME (auth credentials needed)
          GEMINI_CONFIG_DIR: configDir,
        },
        timeout: 120_000,
        maxBuffer: 10 * 1024 * 1024,
        encoding: "utf-8",
      }
    );

    if (result.error) {
      console.error(`[${model}] spawn error:`, result.error.message);
      return [];
    }

    const raw = (result.stdout || "") + (result.stderr || "");
    return parseFindings(raw);
  } finally {
    await rm(configDir, { recursive: true, force: true });
  }
}

function parseFindings(raw: string): Finding[] {
  // Extract JSON array from response (may be wrapped in markdown code block)
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mergeFindings(
  flashFindings: Finding[],
  proFindings: Finding[]
): Finding[] {
  const all: (Finding & { sources: string[] })[] = [];

  for (const f of flashFindings) {
    all.push({ ...f, sources: ["gemini-3-flash-preview"] });
  }

  for (const p of proFindings) {
    // Check if a similar finding already exists (same file + similar title)
    const existing = all.find(
      (f) =>
        f.file === p.file &&
        f.title.toLowerCase().includes(p.title.toLowerCase().slice(0, 20))
    );
    if (existing) {
      existing.sources.push("gemini-3-pro-preview");
      // Boost severity if pro also flagged it
      if (
        severityRank(p.severity) > severityRank(existing.severity)
      ) {
        existing.severity = p.severity;
      }
    } else {
      all.push({ ...p, sources: ["gemini-3-pro-preview"] });
    }
  }

  // Sort by severity
  return all.sort(
    (a, b) => severityRank(b.severity) - severityRank(a.severity)
  );
}

function severityRank(s: string): number {
  return { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1, INFO: 0 }[s] ?? 0;
}

function formatReport(
  findings: (Finding & { sources?: string[] })[],
  filesAudited: number,
  flashDuration: number,
  proDuration: number
): string {
  const now = new Date().toISOString().replace("T", " ").slice(0, 16);
  const lines: string[] = [
    `# Audit Report — ${now}`,
    `**Files audited**: ${filesAudited}  `,
    `**Gemini 3 Flash Preview**: ${flashDuration}ms · **Gemini 3 Pro Preview**: ${proDuration}ms`,
    "",
    "---",
    "",
  ];

  if (findings.length === 0) {
    lines.push("## Result: Clean", "", "No findings from either auditor.");
    return lines.join("\n");
  }

  const bySeverity: Record<string, (Finding & { sources?: string[] })[]> = {
    CRITICAL: [],
    HIGH: [],
    MEDIUM: [],
    LOW: [],
    INFO: [],
  };

  for (const f of findings) {
    bySeverity[f.severity]?.push(f);
  }

  for (const [sev, items] of Object.entries(bySeverity)) {
    if (items.length === 0) continue;
    lines.push(`## ${sev} (${items.length})`, "");
    for (const item of items) {
      const loc = item.line ? `:${item.line}` : "";
      const consensus =
        item.sources && item.sources.length > 1 ? " *(consensus)*" : "";
      lines.push(
        `### ${item.title}${consensus}`,
        `- **File**: \`${item.file}${loc}\``,
        `- **Description**: ${item.description}`
      );
      if (item.suggestion) {
        lines.push(`- **Fix**: ${item.suggestion}`);
      }
      if (item.sources) {
        lines.push(`- **Flagged by**: ${item.sources.join(", ")}`);
      }
      lines.push("");
    }
  }

  lines.push("---", "", "> Audit is read-only. No changes were made.");
  return lines.join("\n");
}

async function main() {
  const target = process.argv[2];

  console.error("Collecting files...");
  const files = await collectFiles(target);

  if (files.size === 0) {
    console.error("No auditable files found.");
    process.exit(1);
  }

  console.error(`Found ${files.size} files. Building context...`);
  const context = buildContext(files);

  console.error("Running Gemini Flash + Pro in parallel (isolated instances)...");

  const startTime = Date.now();
  let flashDuration = 0;
  let proDuration = 0;

  const [flashFindings, proFindings] = await Promise.all([
    runGemini("gemini-3-flash-preview", join(PROMPTS_DIR, "flash.md"), context).then((r) => {
      flashDuration = Date.now() - startTime;
      console.error(`Flash done (${flashDuration}ms), ${r.length} findings`);
      return r;
    }),
    runGemini("gemini-3-pro-preview", join(PROMPTS_DIR, "pro.md"), context).then((r) => {
      proDuration = Date.now() - startTime;
      console.error(`Pro done (${proDuration}ms), ${r.length} findings`);
      return r;
    }),
  ]);

  const merged = mergeFindings(flashFindings, proFindings);
  const report = formatReport(merged, files.size, flashDuration, proDuration);

  // Write report
  await mkdir(REPORTS_DIR, { recursive: true });
  const ts = new Date()
    .toISOString()
    .replace("T", "-")
    .replace(/:/g, "-")
    .slice(0, 16);
  const slug = target ? target.replace(/\//g, "-").replace(/\./g, "-") : "full";
  const reportPath = join(REPORTS_DIR, `${ts}-${slug}.md`);
  await writeFile(reportPath, report, "utf-8");

  console.error(`\nReport saved: ${reportPath}`);
  console.log(report);
}

main().catch((err) => {
  console.error("Audit failed:", err);
  process.exit(1);
});
