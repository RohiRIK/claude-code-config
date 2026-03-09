"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import type { SearchResult } from "@/lib/types";

interface Props {
  onSearch: (results: SearchResult[] | null) => void;
  onImportanceMin: (min: number) => void;
  importanceMin: number;
}

export default function FilterBar({ onSearch, onImportanceMin, importanceMin }: Props) {
  const [query, setQuery] = useState("");

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length < 2) { onSearch(null); return; }
    try {
      const results = await api.search(q);
      onSearch(results);
    } catch { onSearch(null); }
  };

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-[#161b22] border-b border-gray-800 text-xs flex-shrink-0">
      <input
        type="text"
        value={query}
        onChange={e => handleSearch(e.target.value)}
        placeholder="Search memories…"
        className="bg-gray-800 text-gray-200 placeholder-gray-600 border border-gray-700 rounded px-2 py-1 text-xs w-48 outline-none focus:border-gray-500"
      />
      <label className="text-gray-500 flex items-center gap-1.5">
        Min importance:
        <input
          type="range"
          min={1}
          max={5}
          value={importanceMin}
          onChange={e => onImportanceMin(Number(e.target.value))}
          className="w-20 accent-purple-400"
        />
        <span className="text-gray-300 w-3">{importanceMin}</span>
      </label>
    </div>
  );
}
