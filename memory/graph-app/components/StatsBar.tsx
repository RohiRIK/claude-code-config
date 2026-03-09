"use client";
import type { Stats } from "@/lib/types";

interface Props {
  stats: Stats | null;
}

export default function StatsBar({ stats }: Props) {
  if (!stats) return <div className="h-8 bg-[#161b22] border-b border-gray-800" />;

  const items = [
    { label: "memories", value: stats.memories, color: "text-purple-400" },
    { label: "relations", value: stats.relations, color: "text-blue-400" },
    { label: "projects", value: stats.projects, color: "text-sky-400" },
    { label: "context items", value: stats.context_items, color: "text-orange-400" },
    { label: "tags", value: stats.tags, color: "text-green-400" },
  ];

  return (
    <div className="h-10 bg-[#161b22] border-b border-gray-800 flex items-center px-4 gap-4 text-xs flex-shrink-0">
      <span className="text-gray-500 font-medium mr-2">LTM</span>
      {items.map((item, i) => (
        <span key={item.label}>
          {i > 0 && <span className="text-gray-700 mr-4">·</span>}
          <span className={`font-bold ${item.color}`}>{item.value}</span>
          <span className="text-gray-500 ml-1">{item.label}</span>
        </span>
      ))}
    </div>
  );
}
