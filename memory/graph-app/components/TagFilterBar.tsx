"use client";
import type { Tag } from "@/lib/types";

interface Props {
  tags: Tag[];
  activeTags: Set<string>;
  onToggle: (name: string) => void;
  onClearAll: () => void;
}

export default function TagFilterBar({ tags, activeTags, onToggle, onClearAll }: Props) {
  if (tags.length === 0) return null;
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161b22] border-b border-[#30363d] overflow-x-auto">
      <span className="text-gray-500 text-xs shrink-0">Tags:</span>
      {tags.map(tag => {
        const active = activeTags.has(tag.name);
        return (
          <button
            key={tag.id}
            onClick={() => onToggle(tag.name)}
            className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
              active
                ? "bg-sky-500 border-sky-400 text-white"
                : "bg-transparent border-gray-600 text-gray-400 hover:border-gray-400"
            }`}
          >
            {tag.name}
            <span className="ml-1 opacity-60">{tag.memory_count}</span>
          </button>
        );
      })}
      {activeTags.size > 0 && (
        <button
          onClick={onClearAll}
          className="shrink-0 ml-1 text-xs text-gray-500 hover:text-gray-300 underline"
        >
          clear
        </button>
      )}
    </div>
  );
}
