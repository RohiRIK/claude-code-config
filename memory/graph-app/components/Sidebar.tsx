"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ContextNode, GraphNode, MemoryDetail, ProjectNode } from "@/lib/types";

interface Props {
  node: GraphNode | null;
  onClose: () => void;
}

function ImportanceStars({ n }: { n: number }) {
  return (
    <span className="text-yellow-400">
      {"★".repeat(n)}{"☆".repeat(5 - n)}
    </span>
  );
}

function ConfidenceBar({ v }: { v: number }) {
  return (
    <div className="w-full bg-gray-700 rounded h-1.5 mt-1">
      <div className="bg-green-400 h-1.5 rounded" style={{ width: `${v * 100}%` }} />
    </div>
  );
}

function TagChip({ name }: { name: string }) {
  return (
    <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">{name}</span>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value && value !== 0) return null;
  return (
    <div className="mb-3">
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-sm text-gray-200">{value}</div>
    </div>
  );
}

function MemoryPanel({ node }: { node: MemoryDetail }) {
  return (
    <>
      <Field label="Content" value={<p className="whitespace-pre-wrap leading-relaxed">{node.content}</p>} />
      <Field label="Category" value={<span className="capitalize">{node.category}</span>} />
      <Field label="Importance" value={<ImportanceStars n={node.importance} />} />
      <Field label="Confidence" value={<ConfidenceBar v={node.confidence} />} />
      <Field label="Confirm count" value={node.confirm_count} />
      {node.source && <Field label="Source" value={node.source} />}
      {node.dedup_key && <Field label="Dedup key" value={<code className="text-xs">{node.dedup_key}</code>} />}
      <Field label="Last confirmed" value={node.last_confirmed_at} />
      <Field label="Created" value={node.created_at} />
      {node.project_scope && <Field label="Project" value={node.project_scope} />}
      {node.tags.length > 0 && (
        <Field label="Tags" value={
          <div className="flex flex-wrap gap-1 mt-1">
            {node.tags.map(t => <TagChip key={t} name={t} />)}
          </div>
        } />
      )}
      {node.relations.length > 0 && (
        <div className="mb-3">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Relations</div>
          <ul className="space-y-1">
            {node.relations.map((r, i) => (
              <li key={i} className="text-xs text-gray-400">
                <span className="text-gray-500">{r.direction === "outgoing" ? "→" : "←"}</span>{" "}
                <span className="text-blue-400">#{r.related_id}</span>{" "}
                <span className="italic">{r.type}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function ContextPanel({ node }: { node: ContextNode }) {
  return (
    <>
      <Field label="Content" value={<p className="whitespace-pre-wrap leading-relaxed">{node.content}</p>} />
      <Field label="Type" value={
        <span className="capitalize px-2 py-0.5 rounded text-xs bg-blue-900 text-blue-300">{node.category}</span>
      } />
      <Field label="Project" value={node.project_scope} />
      {node.session_id && <Field label="Session" value={<code className="text-xs">{node.session_id}</code>} />}
      <Field label="Permanent" value={node.permanent ? "Yes" : "No"} />
      <Field label="Created" value={node.created_at} />
    </>
  );
}

function ProjectPanel({ node }: { node: ProjectNode }) {
  const [tab, setTab] = useState<"goal" | "decision" | "gotcha" | "progress">("goal");
  const [items, setItems] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const controller = new AbortController();
    api.context(node.label)
      .then(d => { if (!controller.signal.aborted) setItems(d); })
      .catch(() => { /* ignore */ });
    return () => controller.abort();
  }, [node.label]);

  const tabs = ["goal", "decision", "gotcha", "progress"] as const;
  const list = items[tab] ?? [];

  return (
    <>
      <Field label="Project" value={node.label} />
      <Field label="Context items" value={node.confirm_count} />
      <div className="flex gap-1 mb-3 flex-wrap">
        {tabs.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs px-2 py-1 rounded capitalize ${tab === t ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"}`}
          >
            {t}
          </button>
        ))}
      </div>
      {list.length === 0
        ? <p className="text-xs text-gray-500 italic">No {tab} items</p>
        : (
          <ul className="space-y-2">
            {list.map((item, i) => (
              <li key={i} className="text-sm text-gray-300 bg-gray-800 rounded p-2 leading-relaxed">{item}</li>
            ))}
          </ul>
        )
      }
    </>
  );
}

export default function Sidebar({ node, onClose }: Props) {
  const [detail, setDetail] = useState<MemoryDetail | null>(null);

  useEffect(() => {
    setDetail(null);
    if (!node || "is_project" in node || "is_context" in node) return;
    const controller = new AbortController();
    api.memory(node.id)
      .then(d => { if (!controller.signal.aborted) setDetail(d); })
      .catch(() => { /* ignore */ });
    return () => controller.abort();
  }, [node]);

  if (!node) return null;

  const isProject = "is_project" in node;
  const isContext = "is_context" in node;
  const label = isProject ? `Project: ${node.label}` : isContext ? `Context: ${node.category}` : `Memory #${node.id}`;

  return (
    <div className="w-80 min-w-[280px] bg-[#161b22] border-l border-gray-800 flex flex-col overflow-hidden">
      <div className="flex items-start justify-between p-4 border-b border-gray-800">
        <div>
          <div className="text-xs text-gray-500 mb-0.5">{label}</div>
          <div className="text-sm font-medium text-gray-200 leading-snug">{node.label}</div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-300 ml-3 mt-0.5 text-lg leading-none"
        >
          ×
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {isProject && <ProjectPanel node={node as ProjectNode} />}
        {isContext && <ContextPanel node={node as ContextNode} />}
        {!isProject && !isContext && (
          detail ? <MemoryPanel node={detail} /> : <p className="text-xs text-gray-500">Loading…</p>
        )}
      </div>
    </div>
  );
}
