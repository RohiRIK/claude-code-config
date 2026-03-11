"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { categoryTextColors } from "@/lib/categoryColors";
import type { SemanticResult } from "@/lib/types";

interface SemanticSearchProps {
  onSelect: (id: number) => void;
}

export default function SemanticSearch({ onSelect }: SemanticSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SemanticResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setLoading(true);
    try {
      const res = await api.semanticSearch(query.trim(), 10);
      setResults(res);
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") void handleSearch();
  };

  return (
    <div className="px-4 py-2 border-b border-gray-800 bg-[#0d1117]">
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Semantic search memories…"
          className="flex-1 px-3 py-1.5 text-sm bg-[#161b22] border border-gray-700 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-sky-500"
        />
        <button
          onClick={() => void handleSearch()}
          disabled={loading || !query.trim()}
          className="px-3 py-1.5 text-xs bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded transition-colors text-white"
        >
          {loading ? "…" : "Search"}
        </button>
      </div>

      {results !== null && results.length === 0 && (
        <p className="text-xs text-gray-500 py-1">No results above similarity threshold.</p>
      )}

      {results !== null && results.length > 0 && (
        <div className="space-y-1 max-h-52 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.id}
              onClick={() => onSelect(r.id)}
              className="w-full text-left px-3 py-2 rounded bg-[#161b22] hover:bg-[#1c2128] border border-gray-800 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-mono bg-sky-900/40 text-sky-400 border border-sky-800/50 rounded px-1.5 py-0.5">
                  {Math.round(r.similarity * 100)}%
                </span>
                <span className={`text-[10px] font-medium ${categoryTextColors[r.category] ?? "text-gray-400"}`}>
                  {r.category}
                </span>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">{r.content}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
