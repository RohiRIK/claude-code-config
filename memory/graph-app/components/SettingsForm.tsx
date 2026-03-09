"use client";
import { useState } from "react";
import type { SettingsModels } from "@/lib/types";

interface Props {
  settings: Record<string, string>;
  models: SettingsModels;
  onSave: (settings: Record<string, string>) => Promise<void>;
  saving: boolean;
}

/** Human-readable labels for setting keys. */
const LABELS: Record<string, string> = {
  "ltm.embed.provider": "Embedding Provider",
  "ltm.llm.provider": "LLM Provider",
  "ltm.gemini.apiKey": "Gemini API Key",
  "ltm.gemini.embedModel": "Gemini Embed Model",
  "ltm.gemini.llmModel": "Gemini LLM Model",
  "ltm.openrouter.apiKey": "OpenRouter API Key",
  "ltm.openrouter.embedModel": "OpenRouter Embed Model",
  "ltm.openrouter.llmModel": "OpenRouter LLM Model",
  "ltm.ollama.baseUrl": "Ollama Base URL",
  "ltm.ollama.embedModel": "Ollama Embed Model",
  "ltm.ollama.llmModel": "Ollama LLM Model",
  "ltm.decay.graceDays": "Decay Grace Days",
  "ltm.decay.rate": "Decay Rate (per day)",
  "ltm.decay.minConfidence": "Min Confidence (deprecation threshold)",
  "ltm.promote.minImportance": "Promote Min Importance",
  "ltm.janitor.intervalMinutes": "Auto-run Interval (minutes, 0=disabled)",
};

/** Group settings into sections. */
const SECTIONS: Array<{ title: string; keys: string[] }> = [
  {
    title: "Provider Selection",
    keys: ["ltm.embed.provider", "ltm.llm.provider"],
  },
  {
    title: "Gemini",
    keys: ["ltm.gemini.apiKey", "ltm.gemini.embedModel", "ltm.gemini.llmModel"],
  },
  {
    title: "OpenRouter",
    keys: ["ltm.openrouter.apiKey", "ltm.openrouter.embedModel", "ltm.openrouter.llmModel"],
  },
  {
    title: "Ollama",
    keys: ["ltm.ollama.baseUrl", "ltm.ollama.embedModel", "ltm.ollama.llmModel"],
  },
  {
    title: "Memory Decay",
    keys: ["ltm.decay.graceDays", "ltm.decay.rate", "ltm.decay.minConfidence"],
  },
  {
    title: "Auto-Promote & Janitor",
    keys: ["ltm.promote.minImportance", "ltm.janitor.intervalMinutes"],
  },
];

export default function SettingsForm({ settings, models, onSave, saving }: Props) {
  const [draft, setDraft] = useState<Record<string, string>>({ ...settings });
  const [dirty, setDirty] = useState(false);

  const handleChange = (key: string, value: string) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    await onSave(draft);
    setDirty(false);
  };

  const isApiKey = (key: string) => key.includes("apiKey");
  const isProviderSelect = (key: string) =>
    key === "ltm.embed.provider" || key === "ltm.llm.provider";

  return (
    <div className="space-y-6">
      {SECTIONS.map((section) => (
        <div key={section.title} className="p-4 bg-[#161b22] rounded-lg border border-gray-800">
          <h3 className="text-sm font-medium text-white mb-3">{section.title}</h3>
          <div className="space-y-3">
            {section.keys.map((key) => (
              <div key={key}>
                <label className="block text-xs text-gray-400 mb-1">
                  {LABELS[key] || key}
                </label>
                {isProviderSelect(key) ? (
                  <select
                    value={draft[key] || ""}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full bg-[#0d1117] border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 focus:border-blue-500 focus:outline-none"
                  >
                    {(key.includes("embed")
                      ? models.embeddingProviders
                      : models.llmProviders
                    ).map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={isApiKey(key) ? "password" : "text"}
                    value={draft[key] || ""}
                    onChange={(e) => handleChange(key, e.target.value)}
                    placeholder={models.defaults[key] || ""}
                    className="w-full bg-[#0d1117] border border-gray-700 rounded px-3 py-1.5 text-sm text-gray-200 placeholder-gray-600 focus:border-blue-500 focus:outline-none font-mono"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        onClick={handleSave}
        disabled={!dirty || saving}
        className="w-full py-2 text-sm font-medium bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
