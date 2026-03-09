"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FilterBar from "@/components/FilterBar";
import ProjectList from "@/components/ProjectList";
import Sidebar from "@/components/Sidebar";
import SpotlightModal from "@/components/SpotlightModal";
import StatsBar from "@/components/StatsBar";
import TagFilterBar from "@/components/TagFilterBar";
import { api } from "@/lib/api";
import { useWebSocket } from "@/lib/useWebSocket";
import type { GraphData, GraphLink, GraphNode, SearchResult, Stats, Tag } from "@/lib/types";
import type { GraphHandle } from "@/components/Graph";

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
  const [tags, setTags] = useState<Tag[]>([]);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResult[] | null>(null);
  const [importanceMin, setImportanceMin] = useState(1);
  const [activeTags, setActiveTags] = useState<Set<string>>(new Set());
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const graphRef = useRef<GraphHandle>(null);

  const load = useCallback(async () => {
    const [g, s] = await Promise.all([api.graph(), api.stats()]);
    setData(g);
    setStats(s);
  }, []);

  // Tags change rarely — fetch once on mount, not on every WS refresh
  useEffect(() => { void api.tags().then(setTags); }, []);
  useEffect(() => { void load(); }, [load]);
  useWebSocket(WS_URL, load);

  // ⌘K / Ctrl+K opens spotlight
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSpotlightOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const toggleTag = useCallback((name: string) => {
    setActiveTags(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }, []);

  // Compute dimmedIds: nodes that don't have any active tag
  const dimmedIds = useMemo((): Set<number> | undefined => {
    if (!activeTags.size || !data) return undefined;
    const dimmed = new Set<number>();
    for (const n of data.nodes) {
      if ("is_project" in n) continue; // never dim project nodes
      const hasMatch = n.tags.some(t => activeTags.has(t));
      if (!hasMatch) dimmed.add(n.id);
    }
    return dimmed;
  }, [data?.nodes, activeTags]);

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

  const handleSpotlightSelect = useCallback((result: SearchResult) => {
    graphRef.current?.zoomToNode(result.id);
    // Find the node in data and open Sidebar
    const node = data?.nodes.find(n => n.id === result.id);
    if (node) setSelected(node);
  }, [data]);

  return (
    <div className="flex flex-col h-full">
      <StatsBar stats={stats} />
      <FilterBar
        onSearch={setSearchResults}
        onImportanceMin={setImportanceMin}
        importanceMin={importanceMin}
      />
      <TagFilterBar tags={tags} activeTags={activeTags} onToggle={toggleTag} onClearAll={() => setActiveTags(new Set())} />
      <div className="flex flex-1 overflow-hidden">
        <ProjectList
          nodes={data?.nodes ?? []}
          activeProject={activeProject}
          onSelect={setActiveProject}
        />
        <div className="flex-1 relative overflow-hidden">
          {filteredData ? (
            <Graph
              ref={graphRef}
              data={filteredData}
              activeProject={activeProject}
              dimmedIds={dimmedIds}
              onNodeClick={setSelected}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">
              Loading graph…
            </div>
          )}
          {/* ⌘K hint */}
          <button
            onClick={() => setSpotlightOpen(true)}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] text-gray-500 text-xs hover:text-gray-300 hover:border-gray-500 transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
            <span>⌘K</span>
          </button>
        </div>
        <Sidebar node={selected} onClose={() => setSelected(null)} />
      </div>

      <SpotlightModal
        open={spotlightOpen}
        onClose={() => setSpotlightOpen(false)}
        onSelect={handleSpotlightSelect}
      />
    </div>
  );
}
