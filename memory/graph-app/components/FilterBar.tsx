"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { SearchResult } from "@/lib/types";

interface Props {
  onSearch: (results: SearchResult[] | null) => void;
  onImportanceMin: (min: number) => void;
  importanceMin: number;
  onSpotlightOpen: () => void;
}

export default function FilterBar({ onSearch, onImportanceMin, importanceMin, onSpotlightOpen }: Props) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (query.length < 2) { onSearch(null); return; }
    const t = setTimeout(async () => {
      try {
        const results = await api.search(query);
        onSearch(results);
      } catch { onSearch(null); }
    }, 200);
    return () => clearTimeout(t);
  }, [query, onSearch]);

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-[#161b22] border-b border-gray-800 text-xs flex-shrink-0">
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search memories…"
        className="bg-gray-800 text-gray-200 placeholder-gray-600 border border-gray-700 rounded px-2 py-1 text-xs w-48 outline-none focus:border-gray-500"
      />
      <label className="text-gray-500 flex items-center gap-1.5">
        Min importance:
        <span className="text-gray-600 text-xs">1</span>
        <input
          type="range"
          min={1}
          max={5}
          value={importanceMin}
          onChange={e => onImportanceMin(Number(e.target.value))}
          className="w-20 accent-purple-400"
        />
        <span className="text-gray-600 text-xs">5</span>
        <span className="text-gray-300 w-3">{importanceMin}</span>
      </label>
      <button
        onClick={onSpotlightOpen}
        className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded border border-[#484f58] bg-[#21262d] text-gray-400 hover:text-white hover:border-gray-400 transition-colors text-xs"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <span>⌘K</span>
      </button>
    </div>
  );
}
