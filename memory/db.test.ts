import { describe, test, expect } from "bun:test";
import { computeDecayScore } from "./db.js";
import type { Memory } from "./db.js";

function makeMemory(overrides: Partial<Memory> = {}): Memory {
  const now = new Date().toISOString();
  return {
    id: 1,
    content: "test memory",
    category: "pattern",
    importance: 3,
    confidence: 1.0,
    source: null,
    project_scope: null,
    dedup_key: null,
    created_at: now,
    last_confirmed_at: now,
    last_used_at: now,
    confirm_count: 1,
    status: "active",
    ...overrides,
  };
}

describe("computeDecayScore", () => {
  test("importance=5 never decays — returns importance × confidence", () => {
    const mem = makeMemory({ importance: 5, confidence: 0.8 });
    expect(computeDecayScore(mem)).toBeCloseTo(4.0);
  });

  test("fresh memory returns close to importance × confidence", () => {
    const mem = makeMemory({ importance: 3, confidence: 1.0 });
    expect(computeDecayScore(mem)).toBeCloseTo(3.0, 1);
  });

  test("old memory decays toward zero", () => {
    const old = new Date(Date.now() - 365 * 86_400_000).toISOString(); // 1 year ago
    const mem = makeMemory({ importance: 3, confidence: 1.0, last_used_at: old, last_confirmed_at: old, created_at: old });
    const score = computeDecayScore(mem);
    expect(score).toBeLessThan(1.0);
    expect(score).toBeGreaterThan(0);
  });

  test("score uses the most recent of last_used_at, last_confirmed_at, created_at", () => {
    const old = new Date(Date.now() - 180 * 86_400_000).toISOString();
    const recent = new Date().toISOString();
    const memOldConfirm = makeMemory({ importance: 3, confidence: 1.0, last_used_at: recent, last_confirmed_at: old, created_at: old });
    const memNoRecent = makeMemory({ importance: 3, confidence: 1.0, last_used_at: old, last_confirmed_at: old, created_at: old });
    expect(computeDecayScore(memOldConfirm)).toBeGreaterThan(computeDecayScore(memNoRecent));
  });

  test("lower confidence reduces score proportionally", () => {
    const high = makeMemory({ importance: 3, confidence: 1.0 });
    const low = makeMemory({ importance: 3, confidence: 0.5 });
    expect(computeDecayScore(high)).toBeCloseTo(computeDecayScore(low) * 2, 1);
  });

  test("half-life: imp=3 memory at 90 days scores ~half of fresh", () => {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86_400_000).toISOString();
    const fresh = makeMemory({ importance: 3, confidence: 1.0 });
    const stale = makeMemory({ importance: 3, confidence: 1.0, last_used_at: ninetyDaysAgo, last_confirmed_at: ninetyDaysAgo, created_at: ninetyDaysAgo });
    expect(computeDecayScore(stale)).toBeCloseTo(computeDecayScore(fresh) * 0.5, 1);
  });
});
