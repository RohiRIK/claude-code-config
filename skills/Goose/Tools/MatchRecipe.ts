#!/usr/bin/env bun
/**
 * MatchRecipe.ts - Intent-to-recipe matching for Goose agents
 *
 * Usage:
 *   bun MatchRecipe.ts "<user intent>"
 *   bun MatchRecipe.ts --list
 *
 * Returns JSON with matched recipe, confidence score, alternatives, and reason.
 *
 * @author PAI System
 * @version 1.0.0
 */

import { resolve, dirname } from "node:path";

// --- Configuration ---
const TOOLS_DIR = dirname(import.meta.filename);
const CATALOG_PATH = resolve(TOOLS_DIR, "../recipe-catalog.json");

// --- Types ---
interface Recipe {
  name: string;
  file: string;
  description: string;
  triggers: string[];
  category: string;
  inputType: string;
}

interface Catalog {
  version: string;
  description: string;
  recipes: Recipe[];
  categories: Record<string, string>;
}

interface MatchResult {
  matched: boolean;
  recipe: string | null;
  file: string | null;
  confidence: number;
  alternatives: Array<{ name: string; confidence: number }>;
  reason: string;
  category: string | null;
}

// --- Jaro-Winkler Similarity ---
function jaroWinkler(s1: string, s2: string): number {
  const jaro = jaroSimilarity(s1, s2);

  // Find common prefix up to 4 characters
  let prefixLength = 0;
  const maxPrefix = Math.min(4, Math.min(s1.length, s2.length));
  for (let i = 0; i < maxPrefix; i++) {
    if (s1[i] === s2[i]) {
      prefixLength++;
    } else {
      break;
    }
  }

  // Winkler adjustment
  const p = 0.1; // scaling factor
  return jaro + (prefixLength * p * (1 - jaro));
}

function jaroSimilarity(s1: string, s2: string): number {
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;

  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Find matches
  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(i + matchDistance + 1, s2.length);

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  // Count transpositions
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  return (
    (matches / s1.length +
      matches / s2.length +
      (matches - transpositions / 2) / matches) /
    3
  );
}

// --- Matching Logic ---
function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s]/g, "");
}

function matchRecipe(intent: string, catalog: Catalog): MatchResult {
  const normalizedIntent = normalizeText(intent);
  const words = normalizedIntent.split(/\s+/);

  const scores: Array<{ recipe: Recipe; score: number; reason: string }> = [];

  for (const recipe of catalog.recipes) {
    let bestScore = 0;
    let bestReason = "";

    // 1. Exact trigger match (confidence 1.0)
    for (const trigger of recipe.triggers) {
      const normalizedTrigger = normalizeText(trigger);
      if (normalizedIntent.includes(normalizedTrigger)) {
        bestScore = 1.0;
        bestReason = `Exact trigger match: "${trigger}"`;
        break;
      }
    }

    // 2. Partial trigger match
    if (bestScore < 1.0) {
      for (const trigger of recipe.triggers) {
        const triggerWords = normalizeText(trigger).split(/\s+/);
        const matchingWords = triggerWords.filter(tw =>
          words.some(w => w === tw || jaroWinkler(w, tw) > 0.85)
        );
        const triggerScore = matchingWords.length / triggerWords.length;
        if (triggerScore > bestScore) {
          bestScore = triggerScore * 0.9; // Slight penalty for partial match
          bestReason = `Partial trigger match: "${trigger}" (${matchingWords.join(", ")})`;
        }
      }
    }

    // 3. Description fuzzy match
    if (bestScore < 0.6) {
      const descWords = normalizeText(recipe.description).split(/\s+/);
      const keyDescWords = descWords.filter(w => w.length > 3); // Skip small words

      let matchCount = 0;
      for (const word of words) {
        if (word.length < 3) continue;
        for (const descWord of keyDescWords) {
          const similarity = jaroWinkler(word, descWord);
          if (similarity > 0.85) {
            matchCount++;
            break;
          }
        }
      }

      const descScore = matchCount / Math.max(words.filter(w => w.length > 3).length, 1);
      if (descScore * 0.7 > bestScore) { // Description matches are weighted lower
        bestScore = descScore * 0.7;
        bestReason = `Fuzzy description match (${matchCount} keywords)`;
      }
    }

    // 4. Category match (lowest priority)
    if (bestScore < 0.4) {
      const categoryName = recipe.category.toLowerCase();
      if (normalizedIntent.includes(categoryName)) {
        bestScore = 0.4;
        bestReason = `Category match: "${recipe.category}"`;
      }
    }

    if (bestScore > 0.3) { // Minimum threshold
      scores.push({ recipe, score: bestScore, reason: bestReason });
    }
  }

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  if (scores.length === 0) {
    return {
      matched: false,
      recipe: null,
      file: null,
      confidence: 0,
      alternatives: [],
      reason: "No matching recipe found for intent",
      category: null,
    };
  }

  const best = scores[0];
  const alternatives = scores
    .slice(1, 4) // Top 3 alternatives
    .map(s => ({ name: s.recipe.name, confidence: Math.round(s.score * 100) / 100 }));

  return {
    matched: best.score >= 0.5, // Threshold for confident match
    recipe: best.recipe.name,
    file: best.recipe.file,
    confidence: Math.round(best.score * 100) / 100,
    alternatives,
    reason: best.reason,
    category: best.recipe.category,
  };
}

// --- CLI ---
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log(`
\x1b[36mMatchRecipe.ts\x1b[0m - Intent-to-recipe matching for Goose agents

\x1b[33mUsage:\x1b[0m
  bun MatchRecipe.ts "<user intent>"    Match intent to best recipe
  bun MatchRecipe.ts --list             List all available recipes
  bun MatchRecipe.ts --help             Show this help

\x1b[33mExamples:\x1b[0m
  bun MatchRecipe.ts "review my code for security issues"
  bun MatchRecipe.ts "generate tests for my functions"
  bun MatchRecipe.ts "roast my code"

\x1b[33mOutput:\x1b[0m
  JSON with: matched, recipe, confidence, alternatives, reason
`);
    process.exit(0);
  }

  // Load catalog
  let catalog: Catalog;
  try {
    const catalogFile = Bun.file(CATALOG_PATH);
    catalog = await catalogFile.json();
  } catch (error) {
    console.error(`\x1b[31m[Error]\x1b[0m Failed to load recipe catalog: ${CATALOG_PATH}`);
    process.exit(1);
  }

  if (args[0] === "--list") {
    console.log("\x1b[36m[Goose Recipes]\x1b[0m Available recipes:\n");
    for (const recipe of catalog.recipes) {
      console.log(`  \x1b[33m${recipe.name}\x1b[0m`);
      console.log(`    ${recipe.description.substring(0, 80)}...`);
      console.log(`    Triggers: ${recipe.triggers.slice(0, 3).join(", ")}`);
      console.log("");
    }
    process.exit(0);
  }

  const intent = args.join(" ");
  const result = matchRecipe(intent, catalog);

  // Output as JSON for programmatic use
  console.log(JSON.stringify(result, null, 2));

  // Exit code based on match
  process.exit(result.matched ? 0 : 1);
}

main();
