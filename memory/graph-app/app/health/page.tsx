"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { HealthData } from "@/lib/types";

export default function HealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [boosting, setBoosting] = useState<number | null>(null);

  const loadHealth = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.health();
      setHealth(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadHealth(); }, [loadHealth]);

  const handleBoost = async (id: number) => {
    setBoosting(id);
    try {
      await api.boostMemory(id);
      // Optimistic: remove from at-risk list without full reload
      setHealth((prev) =>
        prev ? { ...prev, atRisk: prev.atRisk.filter((m) => m.id !== id) } : prev
      );
    } finally {
      setBoosting(null);
    }
  };

  const activeCount = health?.stats.find((s) => s.status === "active")?.count ?? 0;
  const deprecatedCount = health?.stats.find((s) => s.status === "deprecated")?.count ?? 0;
  const maxDistCount = health ? Math.max(...health.distribution.map((d) => d.count), 1) : 1;

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-semibold text-white">Memory Health</h1>
            <p className="text-sm text-gray-500 mt-1">Confidence distribution and at-risk memories</p>
          </div>
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors px-3 py-1.5">
            &larr; Graph
          </Link>
        </div>

        {loading ? (
          <div className="text-center text-gray-500 py-12">Loading...</div>
        ) : health ? (
          <div className="space-y-8">
            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Active" value={activeCount} color="text-green-400" />
              <StatCard label="Deprecated" value={deprecatedCount} color="text-gray-500" />
              <StatCard
                label="Avg Confidence"
                value={`${(health.avgConf * 100).toFixed(0)}%`}
                color={health.avgConf < 0.4 ? "text-red-400" : "text-sky-400"}
              />
              <StatCard label="At-Risk" value={health.atRisk.length} color={health.atRisk.length > 0 ? "text-orange-400" : "text-green-400"} />
            </div>

            {/* Confidence Distribution */}
            <section>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Confidence Distribution
              </h2>
              <div className="bg-[#161b22] rounded-lg border border-gray-800 p-4 space-y-2">
                {health.distribution.length === 0 ? (
                  <p className="text-sm text-gray-500">No data.</p>
                ) : (
                  health.distribution.map((d) => (
                    <div key={d.bucket} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-8 text-right font-mono">
                        {(d.bucket * 100).toFixed(0)}%
                      </span>
                      <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            d.bucket < 0.3
                              ? "bg-red-500/70"
                              : d.bucket < 0.6
                              ? "bg-yellow-500/70"
                              : "bg-green-500/70"
                          }`}
                          style={{ width: `${(d.count / maxDistCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-400 w-8">{d.count}</span>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* At-Risk Memories */}
            <section>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
                At-Risk Memories <span className="text-gray-600 normal-case">(confidence &lt; 30%)</span>
              </h2>
              {health.atRisk.length === 0 ? (
                <div className="text-center py-8 text-gray-600 text-sm bg-[#161b22] rounded-lg border border-gray-800">
                  No at-risk memories. Memory health is good.
                </div>
              ) : (
                <div className="bg-[#161b22] rounded-lg border border-gray-800 divide-y divide-gray-800">
                  {health.atRisk.map((m) => (
                    <div key={m.id} className="flex items-start gap-4 p-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono bg-red-900/40 text-red-400 border border-red-800/50 rounded px-1.5 py-0.5">
                            {(m.confidence * 100).toFixed(0)}%
                          </span>
                          <span className="text-[10px] text-gray-500">{m.category}</span>
                          {m.project_scope && (
                            <span className="text-[10px] text-gray-600">{m.project_scope}</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-300 leading-relaxed line-clamp-2">{m.content}</p>
                      </div>
                      <button
                        onClick={() => void handleBoost(m.id)}
                        disabled={boosting === m.id}
                        className="flex-shrink-0 px-3 py-1.5 text-xs bg-sky-600 hover:bg-sky-700 disabled:opacity-50 rounded transition-colors"
                      >
                        {boosting === m.id ? "…" : "Boost"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">Failed to load health data.</div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-[#161b22] rounded-lg border border-gray-800 p-4 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}
