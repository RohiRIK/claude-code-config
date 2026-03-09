"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { api } from "@/lib/api";
import { nodeColor } from "@/lib/nodeColors";
import type { ContextNode, GraphNode, MemoryNode, ProjectDetail } from "@/lib/types";

const MiniGraph = dynamic(() => import("@/components/MiniGraph"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full text-gray-600 text-sm">Loading graph…</div>,
});

export default function ProjectPage() {
  const { name } = useParams<{ name: string }>();
  const projectName = decodeURIComponent(name);

  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.project(projectName)
      .then(setDetail)
      .catch(e => setError(String(e)));
  }, [projectName]);

  if (error) return (
    <div className="flex flex-col h-full bg-[#0d1117] text-gray-300 p-6">
      <BackButton />
      <p className="mt-4 text-red-400">Error: {error}</p>
    </div>
  );

  if (!detail) return (
    <div className="flex items-center justify-center h-full bg-[#0d1117] text-gray-600 text-sm">
      Loading…
    </div>
  );

  const totalMemories = detail.memories.length;
  const totalContext = detail.context_items.length;
  const totalRelations = detail.relations.length;

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-gray-300 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#30363d] flex items-center gap-4">
        <BackButton />
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-white truncate">{projectName}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {totalMemories} memories · {totalContext} context items · {totalRelations} relations
          </p>
        </div>
      </div>

      {/* Body: mini-graph + cards */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: MiniGraph */}
        <div className="flex-1 min-w-0 relative overflow-hidden">
          {(detail.memories.length > 0 || detail.context_items.length > 0) ? (
            <MiniGraph
              projectName={projectName}
              memories={detail.memories}
              contextItems={detail.context_items}
              relations={detail.relations}
              onNodeClick={n => setSelected(n as GraphNode)}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-600 text-sm">
              No nodes connected to this project yet.
            </div>
          )}
        </div>

        {/* Right: node cards + sidebar */}
        <div className="w-72 flex flex-col border-l border-[#30363d] overflow-y-auto">
          {/* Context items grouped */}
          {(["goal", "decision", "gotcha", "progress"] as const).map(type => {
            const items = detail.context[type] ?? [];
            if (items.length === 0) return null;
            return (
              <div key={type} className="border-b border-[#30363d]">
                <div className="px-4 py-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: nodeColor(type) }} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{type}</span>
                </div>
                {items.map((content, i) => (
                  <p key={i} className="px-4 py-1.5 text-xs text-gray-300 border-t border-[#21262d] last:pb-3">
                    {content}
                  </p>
                ))}
              </div>
            );
          })}

          {/* Memory cards */}
          {detail.memories.length > 0 && (
            <div>
              <div className="px-4 py-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Memories</span>
              </div>
              {detail.memories.map(m => (
                <MemoryCard key={m.id} memory={m} onClick={() => setSelected(m as GraphNode)} />
              ))}
            </div>
          )}
        </div>

        <Sidebar node={selected} onClose={() => setSelected(null)} />
      </div>
    </div>
  );
}

function BackButton() {
  return (
    <Link
      href="/"
      className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors shrink-0"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Back
    </Link>
  );
}

function MemoryCard({ memory, onClick }: { memory: MemoryNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-4 py-2.5 border-t border-[#21262d] hover:bg-[#161b22] transition-colors"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: nodeColor(memory.category) }} />
        <span className="text-xs text-gray-500">{memory.category} · imp {memory.importance}</span>
      </div>
      <p className="text-xs text-gray-300 line-clamp-2">{memory.content}</p>
      {memory.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {memory.tags.map(t => (
            <span key={t} className="px-1.5 py-0.5 rounded text-[10px] bg-[#1f2937] text-gray-400">{t}</span>
          ))}
        </div>
      )}
    </button>
  );
}
