import type { GraphData, MemoryDetail, SearchResult, Stats, Tag } from "./types";

const BASE = "/api";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export const api = {
  graph: (): Promise<GraphData> => get("/graph"),
  stats: (): Promise<Stats> => get("/stats"),
  tags: (): Promise<Tag[]> => get("/tags"),
  memory: (id: number): Promise<MemoryDetail> => get(`/memory/${id}`),
  search: (q: string): Promise<SearchResult[]> => get(`/search?q=${encodeURIComponent(q)}`),
  context: (project: string): Promise<Record<string, string[]>> => get(`/context/${encodeURIComponent(project)}`),
  reload: (): Promise<void> => fetch(`${BASE}/reload`, { method: "POST" }).then(() => undefined),
};
