"use client";
import type { GraphNode } from "@/lib/types";

interface Props {
  nodes: GraphNode[];
  activeProject: string | null;
  onSelect: (name: string | null) => void;
}

export default function ProjectList({ nodes, activeProject, onSelect }: Props) {
  const projects = nodes.filter(n => "is_project" in n);

  return (
    <div className="w-44 min-w-[160px] bg-[#161b22] border-r border-gray-800 flex flex-col overflow-hidden">
      <div className="text-xs text-gray-500 uppercase tracking-wide px-3 py-2 border-b border-gray-800 font-medium">
        Projects
      </div>
      <div className="flex-1 overflow-y-auto">
        <button
          onClick={() => onSelect(null)}
          className={`w-full text-left text-xs px-3 py-2 hover:bg-gray-800 ${!activeProject ? "text-white font-medium bg-gray-800" : "text-gray-400"}`}
        >
          All
        </button>
        {projects.map(p => (
          <button
            key={p.id}
            onClick={() => onSelect(activeProject === p.label ? null : p.label)}
            className={`w-full text-left text-xs px-3 py-2 hover:bg-gray-800 truncate ${activeProject === p.label ? "text-sky-400 font-medium bg-gray-800" : "text-gray-400"}`}
            title={p.label}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
