"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { JanitorRunResult, SettingsModels } from "@/lib/types";
import SettingsForm from "@/components/SettingsForm";
import Link from "next/link";

function formatKeeperResult(r: JanitorRunResult): string {
  return (
    `Done in ${r.durationMs}ms: ${r.embed.embedded} embedded, ` +
    `${r.decay.decayed} decayed (${r.decay.deprecated} deprecated), ` +
    `${r.promote.promoted} promoted, ${r.dedup.candidatesFound} dedup candidates` +
    (r.errors.length > 0 ? ` | Errors: ${r.errors.join("; ")}` : "")
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [models, setModels] = useState<SettingsModels | null>(null);
  const [saving, setSaving] = useState(false);

  const [janitorStatus, setJanitorStatus] = useState<{ running: boolean; lastRun: string | null } | null>(null);
  const [janitorRunning, setJanitorRunning] = useState(false);
  const [janitorResult, setJanitorResult] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  };

  const loadData = useCallback(async () => {
    const [s, m, js] = await Promise.all([
      api.getSettings(),
      api.getModels(),
      api.janitorStatus(),
    ]);
    setSettings(s);
    setModels(m);
    setJanitorStatus(js);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => stopPolling, []); // cleanup on unmount

  const handleSave = async (updated: Record<string, string>) => {
    setSaving(true);
    try {
      await api.updateSettings(updated);
      setSettings(updated);
    } finally {
      setSaving(false);
    }
  };

  const handleRunJanitor = async () => {
    setJanitorRunning(true);
    setJanitorResult(null);
    try {
      await api.runJanitor();
    } catch (e) {
      setJanitorResult(`Error: ${String(e)}`);
      setJanitorRunning(false);
      return;
    }

    // Poll /api/janitor/status every 2s until done (max 60s)
    pollRef.current = setInterval(async () => {
      try {
        const status = await api.janitorStatus();
        if (!status.running) {
          stopPolling();
          setJanitorRunning(false);
          setJanitorStatus({ running: false, lastRun: status.lastRun });
          if (status.lastResult) {
            setJanitorResult(formatKeeperResult(status.lastResult));
          }
        }
      } catch { /* ignore transient errors */ }
    }, 2000);

    // 60s hard timeout
    timeoutRef.current = setTimeout(() => {
      stopPolling();
      setJanitorRunning(false);
      setJanitorResult("Timed out waiting for Memory Keeper to complete.");
    }, 60_000);
  };

  return (
    <div className="min-h-full overflow-y-auto bg-[#0d1117] text-gray-200">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl font-semibold text-white">Settings</h1>
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
            &larr; Back to Graph
          </Link>
        </div>

        {models && (
          <SettingsForm
            settings={settings}
            models={models}
            onSave={handleSave}
            saving={saving}
          />
        )}

        {/* Memory Keeper Controls */}
        <div className="mt-6 p-4 bg-[#161b22] rounded-lg border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-white">Memory Keeper</h3>
              <p className="text-xs text-gray-500 mt-1">
                Run decay, promote, dedup, and embedding generation.
                {janitorStatus?.lastRun && (
                  <span className="ml-1">
                    Last run: {new Date(janitorStatus.lastRun).toLocaleString()}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={handleRunJanitor}
              disabled={janitorRunning}
              className="px-3 py-1.5 text-xs bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded transition-colors"
            >
              {janitorRunning ? "Running..." : "Run Now"}
            </button>
          </div>
          {janitorResult && (
            <div className="mt-3 text-xs px-3 py-2 rounded bg-[#0d1117] border border-gray-800 text-gray-300 font-mono">
              {janitorResult}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
