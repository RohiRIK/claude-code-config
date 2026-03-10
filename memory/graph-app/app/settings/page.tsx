"use client";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { SettingsModels } from "@/lib/types";
import SettingsForm from "@/components/SettingsForm";
import Link from "next/link";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [models, setModels] = useState<SettingsModels | null>(null);
  const [saving, setSaving] = useState(false);

  const [janitorStatus, setJanitorStatus] = useState<{ running: boolean; lastRun: string | null } | null>(null);
  const [janitorRunning, setJanitorRunning] = useState(false);
  const [janitorResult, setJanitorResult] = useState<string | null>(null);

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
      const result = await api.runJanitor();
      setJanitorResult(
        `Done in ${result.durationMs}ms: ${result.embed.embedded} embedded, ${result.decay.decayed} decayed (${result.decay.deprecated} deprecated), ${result.promote.promoted} promoted, ${result.dedup.candidatesFound} dedup candidates` +
        (result.errors.length > 0 ? ` | Errors: ${result.errors.join("; ")}` : "")
      );
      setJanitorStatus({ running: false, lastRun: result.timestamp });
    } catch (e) {
      setJanitorResult(`Error: ${String(e)}`);
    } finally {
      setJanitorRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-200">
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

        {/* Janitor Controls */}
        <div className="mt-6 p-4 bg-[#161b22] rounded-lg border border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-white">Janitor</h3>
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
