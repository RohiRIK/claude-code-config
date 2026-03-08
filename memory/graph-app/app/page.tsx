"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import FilterBar from "@/components/FilterBar";
import ProjectList from "@/components/ProjectList";
import Sidebar from "@/components/Sidebar";
import StatsBar from "@/components/StatsBar";
import { api } from "@/lib/api";
import { useWebSocket } from "@/lib/useWebSocket";
import type { GraphData, GraphLink, GraphNode, SearchResult, Stats } from "@/lib/types";

// D3 uses browser APIs — must be dynamically imported (no SSR)
const Graph = dynamic(() => import("@/components/Graph"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full text-gray-600 text-sm">Loading graph…</div>
  ),
});

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:7331";

export default function Home() {
  const [data, setData] = useState<GraphData | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [importanceMin, setImportanceMin] = useState(1);

  const load = useCallback(async () => {
    const [g, s] = await Promise.all([api.graph(), api.stats()]);
    setData(g);
    setStats(s);
  }, []);

  useEffect(() => { void load(); }, [load]);
  useWebSocket(WS_URL, load);

  const filteredData = useMemo((): GraphData | null => {
    if (!data) return null;
    const searchIds = searchResults ? new Set(searchResults.map(r => r.id)) : null;

    const nodes = data.nodes.filter((n: GraphNode) => {
      if ("is_project" in n) return true;
      if (activeProject && n.project_scope !== activeProject) return false;
      if (!("is_context" in n) && n.importance < importanceMin) return false;
      if (searchIds && !("is_project" in n) && !("is_context" in n) && !searchIds.has(n.id)) return false;
      return true;
    });

    const nodeIds = new Set(nodes.map((n: GraphNode) => n.id));
    const links = data.links.filter((l: GraphLink) => {
      const src = typeof l.source === "number" ? l.source : (l.source as GraphNode).id;
      const tgt = typeof l.target === "number" ? l.target : (l.target as GraphNode).id;
      return nodeIds.has(src) && nodeIds.has(tgt);
    });

    return { nodes, links };
  }, [data, activeProject, importanceMin, searchResults]);

  return (
    <div className="flex flex-col h-full">
      <StatsBar stats={stats} />
      <FilterBar
        onSearch={setSearchResults}
        onImportanceMin={setImportanceMin}
        importanceMin={importanceMin}
      />
      <div className="flex flex-1 overflow-hidden">
        <ProjectList
          nodes={data?.nodes ?? []}
          activeProject={activeProject}
          onSelect={setActiveProject}
        />
        <div className="flex-1 relative overflow-hidden">
          {filteredData ? (
            <Graph
              data={filteredData}
              activeProject={activeProject}
              onNodeClick={setSelected}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">
              Loading graph…
            </div>
          )}
        </div>
        <Sidebar node={selected} onClose={() => setSelected(null)} />
      </div>
    </div>
  );
}
