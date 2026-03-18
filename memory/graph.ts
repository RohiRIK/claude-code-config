/**
 * graph.ts — Graph traversal engine for LTM reasoning.
 * BFS from a seed memory, up to configurable depth.
 * Detects conflicts, reinforcements, and infers implicit edges via LLM.
 */
import type { Database } from "bun:sqlite";
import { getDb } from "./shared-db.js";
import type { Memory, RelationshipType } from "./db.js";

export interface MemoryNode {
  id: number;
  content: string;
  category: string;
  importance: number;
  project_scope: string | null;
}

export interface MemoryPair {
  a: MemoryNode;
  b: MemoryNode;
  type: RelationshipType;
}

export interface InferredRelation {
  a: MemoryNode;
  b: MemoryNode;
  type: RelationshipType;
  persisted: boolean;
}

export interface TraversalResult {
  chain: MemoryNode[];
  conflicts: MemoryPair[];
  reinforcements: MemoryPair[];
  clusters: MemoryNode[][];
  inferred: InferredRelation[];
}

const CONFLICT_TYPES = new Set<RelationshipType>(["contradicts", "supersedes"]);
const REINFORCE_TYPES = new Set<RelationshipType>(["supports", "refines"]);

interface EdgeRow {
  neighbor_id: number;
  relationship_type: RelationshipType;
}

function getNeighbors(db: Database, id: number): EdgeRow[] {
  const out = db.query<EdgeRow, [number]>(
    `SELECT target_memory_id as neighbor_id, relationship_type FROM memory_relations WHERE source_memory_id=?`
  ).all(id);
  const inc = db.query<{ neighbor_id: number; relationship_type: RelationshipType }, [number]>(
    `SELECT source_memory_id as neighbor_id, relationship_type FROM memory_relations WHERE target_memory_id=?`
  ).all(id);
  return [...out, ...inc];
}

function getMemoryNode(db: Database, id: number): MemoryNode | null {
  return db.query<MemoryNode, [number]>(
    `SELECT id, content, category, importance, project_scope FROM memories WHERE id=? AND status='active'`
  ).get(id) ?? null;
}

/**
 * BFS traversal from startId up to depth hops.
 * Returns ordered chain (BFS order), plus pairs classified by edge type.
 */
export async function traverseGraph(
  startId: number,
  depth = 2,
  inferImplicit = false,
): Promise<TraversalResult> {
  const db = getDb();

  const seedNode = getMemoryNode(db, startId);
  if (!seedNode) {
    return { chain: [], conflicts: [], reinforcements: [], clusters: [], inferred: [] };
  }

  const visited = new Set<number>([startId]);
  const chain: MemoryNode[] = [seedNode];
  const conflicts: MemoryPair[] = [];
  const reinforcements: MemoryPair[] = [];

  // BFS queue: [nodeId, depth]
  const queue: Array<[number, number]> = [[startId, 0]];

  const edgeMap = new Map<string, RelationshipType>(); // "a:b" -> type

  while (queue.length > 0) {
    const [curId, curDepth] = queue.shift()!;
    if (curDepth >= depth) continue;

    const neighbors = getNeighbors(db, curId);
    for (const edge of neighbors) {
      const curNode = getMemoryNode(db, curId);
      const neighborNode = getMemoryNode(db, edge.neighbor_id);
      if (!neighborNode || !curNode) continue;

      const edgeKey = [Math.min(curId, edge.neighbor_id), Math.max(curId, edge.neighbor_id)].join(":");
      edgeMap.set(edgeKey, edge.relationship_type);

      if (CONFLICT_TYPES.has(edge.relationship_type)) {
        conflicts.push({ a: curNode, b: neighborNode, type: edge.relationship_type });
      } else if (REINFORCE_TYPES.has(edge.relationship_type)) {
        reinforcements.push({ a: curNode, b: neighborNode, type: edge.relationship_type });
      }

      if (!visited.has(edge.neighbor_id)) {
        visited.add(edge.neighbor_id);
        chain.push(neighborNode);
        queue.push([edge.neighbor_id, curDepth + 1]);
      }
    }
  }

  // Build connected components (clusters) from visited nodes
  const clusters = buildClusters(db, [...visited]);

  // Optionally infer implicit edges between visited nodes that lack a direct edge
  const inferred: InferredRelation[] = [];
  if (inferImplicit && chain.length >= 2) {
    const { classifyRelation } = await import("./embeddings.js");
    const { relate } = await import("./db.js");

    const pairs = getPairsWithoutEdge(chain, edgeMap);
    const results = await Promise.allSettled(
      pairs.map(async ([a, b]) => {
        const relType = await classifyRelation(a.content, b.content);
        if (!relType) return null;

        let persisted = false;
        try {
          relate({ source_id: a.id, target_id: b.id, relationship_type: relType });
          persisted = true;
        } catch {
          // Memory deleted between traversal and relate — ignore
        }

        return { a, b, type: relType as RelationshipType, persisted };
      })
    );

    for (const r of results) {
      if (r.status === "fulfilled" && r.value) {
        inferred.push(r.value);
        if (CONFLICT_TYPES.has(r.value.type)) {
          conflicts.push({ a: r.value.a, b: r.value.b, type: r.value.type });
        } else if (REINFORCE_TYPES.has(r.value.type)) {
          reinforcements.push({ a: r.value.a, b: r.value.b, type: r.value.type });
        }
      }
    }
  }

  return { chain, conflicts, reinforcements, clusters, inferred };
}

function getPairsWithoutEdge(nodes: MemoryNode[], edgeMap: Map<string, RelationshipType>): Array<[MemoryNode, MemoryNode]> {
  const pairs: Array<[MemoryNode, MemoryNode]> = [];
  // Limit to avoid O(n^2) explosion — cap at first 6 nodes (15 pairs max)
  const subset = nodes.slice(0, 6);
  for (let i = 0; i < subset.length; i++) {
    for (let j = i + 1; j < subset.length; j++) {
      const a = subset[i]!;
      const b = subset[j]!;
      const key = [Math.min(a.id, b.id), Math.max(a.id, b.id)].join(":");
      if (!edgeMap.has(key)) {
        pairs.push([a, b]);
      }
    }
  }
  return pairs;
}

function buildClusters(db: Database, ids: number[]): MemoryNode[][] {
  if (ids.length === 0) return [];
  // Build adjacency from memory_relations among visited set
  const idSet = new Set(ids);
  const adj = new Map<number, Set<number>>();
  for (const id of ids) adj.set(id, new Set());

  for (const id of ids) {
    const neighbors = getNeighbors(db, id);
    for (const n of neighbors) {
      if (idSet.has(n.neighbor_id)) {
        adj.get(id)!.add(n.neighbor_id);
        adj.get(n.neighbor_id)!.add(id);
      }
    }
  }

  const visited = new Set<number>();
  const clusters: MemoryNode[][] = [];

  for (const id of ids) {
    if (visited.has(id)) continue;
    const cluster: MemoryNode[] = [];
    const q = [id];
    while (q.length > 0) {
      const cur = q.pop()!;
      if (visited.has(cur)) continue;
      visited.add(cur);
      const node = db.query<MemoryNode, [number]>(
        `SELECT id, content, category, importance, project_scope FROM memories WHERE id=?`
      ).get(cur);
      if (node) cluster.push(node);
      for (const neighbor of adj.get(cur) ?? []) {
        if (!visited.has(neighbor)) q.push(neighbor);
      }
    }
    if (cluster.length > 0) clusters.push(cluster);
  }

  return clusters;
}

/**
 * Build a human-readable reasoning context block (max 5 bullets).
 * Suitable for injecting into session context.
 */
export function buildReasoningContext(result: TraversalResult): string {
  const lines: string[] = [];

  if (result.chain.length > 1) {
    const chainSnippet = result.chain
      .slice(0, 4)
      .map(n => n.content.substring(0, 50).replace(/\n/g, " "))
      .join(" → ");
    lines.push(`[Chain] ${chainSnippet}`);
  }

  for (const c of result.conflicts.slice(0, 2)) {
    const a = c.a.content.substring(0, 40).replace(/\n/g, " ");
    const b = c.b.content.substring(0, 40).replace(/\n/g, " ");
    lines.push(`[Conflict] "${a}" ↔ "${b}" — verify before applying`);
  }

  if (result.reinforcements.length > 0) {
    const count = result.reinforcements.length;
    const sample = result.reinforcements[0]!;
    const topic = sample.a.content.substring(0, 50).replace(/\n/g, " ");
    lines.push(`[Reinforcement] ${count} memor${count === 1 ? "y" : "ies"} agree: "${topic}"`);
  }

  return lines.slice(0, 5).join("\n");
}

// CLI entry: bun graph.ts <memoryId> [depth]
if (import.meta.main) {
  const id = parseInt(process.argv[2] ?? "0", 10);
  const depth = parseInt(process.argv[3] ?? "2", 10);
  if (!id) {
    console.error("Usage: bun graph.ts <memoryId> [depth=2]");
    process.exit(1);
  }
  const result = await traverseGraph(id, depth, true);
  console.log(JSON.stringify({
    chainLength: result.chain.length,
    conflicts: result.conflicts.length,
    reinforcements: result.reinforcements.length,
    clusters: result.clusters.length,
    inferred: result.inferred.length,
    context: buildReasoningContext(result),
  }, null, 2));
}
