"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { categoryBadgeColors } from "@/lib/categoryColors";
import { nodeColor } from "@/lib/nodeColors";
import ImportanceStars from "@/components/ImportanceStars";
import type { ContextNode, CtxItem, GraphNode, MemoryDetail, ProjectNode } from "@/lib/types";

interface Props {
  node: GraphNode | null;
  onClose: () => void;
  onRelationClick?: (id: number) => void;
  nodeLabelById?: (id: number) => string | undefined;
}

// ── Shared micro-components ──────────────────────────────────────────────────


function ConfidenceBar({ v }: { v: number }) {
  const pct = Math.round(v * 100);
  const color = pct >= 70 ? "bg-green-500" : pct >= 40 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-gray-500 font-mono w-7 text-right">{pct}%</span>
    </div>
  );
}

function TagChip({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1 bg-gray-800 border border-gray-700 text-gray-300 text-[10px] px-2 py-0.5 rounded-full">
      {name}
    </span>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const colors = categoryBadgeColors[category] ?? "bg-gray-800 text-gray-400 border-gray-700";
  return (
    <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded border capitalize ${colors}`}>
      {category}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[9px] font-semibold uppercase tracking-widest text-gray-600 mb-1.5">
      {children}
    </div>
  );
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-gray-800/60 last:border-0">
      <span className="text-[10px] text-gray-600 shrink-0">{label}</span>
      <span className="text-[10px] text-gray-400 text-right">{children}</span>
    </div>
  );
}

function RelativeTime({ iso }: { iso: string }) {
  const date = new Date(iso);
  const now = Date.now();
  const diff = now - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return <span title={date.toLocaleString()}>today</span>;
  if (days === 1) return <span title={date.toLocaleString()}>yesterday</span>;
  if (days < 30) return <span title={date.toLocaleString()}>{days}d ago</span>;
  if (days < 365) return <span title={date.toLocaleString()}>{Math.floor(days / 30)}mo ago</span>;
  return <span title={date.toLocaleString()}>{Math.floor(days / 365)}y ago</span>;
}

// ── Memory panel ─────────────────────────────────────────────────────────────

function MemoryPanel({ node, onRelationClick, nodeLabelById }: {
  node: MemoryDetail;
  onRelationClick?: (id: number) => void;
  nodeLabelById?: (id: number) => string | undefined;
}) {
  return (
    <div className="space-y-5">
      {/* Content */}
      <div>
        <SectionLabel>Content</SectionLabel>
        <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap bg-gray-800/40 rounded-lg p-3 border border-gray-800">
          {node.content}
        </p>
      </div>

      {/* Header row: category + importance */}
      <div className="flex items-center justify-between">
        <CategoryBadge category={node.category} />
        <ImportanceStars n={node.importance} />
      </div>

      {/* Confidence */}
      <div>
        <SectionLabel>Confidence</SectionLabel>
        <ConfidenceBar v={node.confidence} />
      </div>

      {/* Tags */}
      {node.tags.length > 0 && (
        <div>
          <SectionLabel>Tags</SectionLabel>
          <div className="flex flex-wrap gap-1.5">
            {node.tags.map(t => <TagChip key={t} name={t} />)}
          </div>
        </div>
      )}

      {/* Relations */}
      {node.relations.length > 0 && (
        <div>
          <SectionLabel>Relations</SectionLabel>
          <div className="space-y-1">
            {node.relations.map((r, i) => {
              const label = nodeLabelById?.(r.related_id);
              return (
                <button
                  key={r.related_id}
                  onClick={() => onRelationClick?.(r.related_id)}
                  className="w-full flex items-center gap-2 text-[11px] bg-gray-800/40 rounded px-2.5 py-1.5 border border-gray-800 hover:border-gray-600 hover:bg-gray-700/40 transition-colors cursor-pointer text-left"
                >
                  <span className={r.direction === "outgoing" ? "text-sky-500" : "text-purple-500"}>
                    {r.direction === "outgoing" ? "↗" : "↙"}
                  </span>
                  <span className="text-gray-500 italic shrink-0">{r.type}</span>
                  {label && (
                    <span className="text-gray-400 truncate flex-1 text-[10px]">"{label}"</span>
                  )}
                  <span className="text-gray-600 font-mono shrink-0">#{r.related_id}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Metadata table */}
      <div>
        <SectionLabel>Metadata</SectionLabel>
        <div className="bg-gray-800/30 rounded-lg border border-gray-800 px-3 py-0.5">
          <MetaRow label="Confirmed">{node.confirm_count}×</MetaRow>
          {node.project_scope && (
            <MetaRow label="Project">
              <Link
                href={`/project/${encodeURIComponent(node.project_scope)}`}
                className="text-sky-400 hover:text-sky-300 transition-colors"
              >
                {node.project_scope}
              </Link>
            </MetaRow>
          )}
          {node.source && <MetaRow label="Source">{node.source}</MetaRow>}
          <MetaRow label="Last confirmed"><RelativeTime iso={node.last_confirmed_at} /></MetaRow>
          <MetaRow label="Created"><RelativeTime iso={node.created_at} /></MetaRow>
          {node.dedup_key && (
            <MetaRow label="Dedup key">
              <code className="text-[9px] text-gray-500 break-all">{node.dedup_key}</code>
            </MetaRow>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Context panel ─────────────────────────────────────────────────────────────

const CONTEXT_CATEGORY_COLORS: Record<string, string> = {
  goal: "bg-sky-900/40 text-sky-300 border-sky-800/50",
  decision: "bg-violet-900/40 text-violet-300 border-violet-800/50",
  gotcha: "bg-red-900/40 text-red-300 border-red-800/50",
  progress: "bg-emerald-900/40 text-emerald-300 border-emerald-800/50",
};

function ContextPanel({ node }: { node: ContextNode }) {
  const badgeColor = CONTEXT_CATEGORY_COLORS[node.category] ?? "bg-gray-800 text-gray-400 border-gray-700";
  return (
    <div className="space-y-5">
      <div>
        <SectionLabel>Content</SectionLabel>
        <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap bg-gray-800/40 rounded-lg p-3 border border-gray-800">
          {node.content}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded border capitalize ${badgeColor}`}>
          {node.category}
        </span>
        {node.permanent && (
          <span className="text-[10px] text-amber-500 bg-amber-900/20 border border-amber-800/40 rounded px-1.5 py-0.5">
            permanent
          </span>
        )}
      </div>
      <div>
        <SectionLabel>Metadata</SectionLabel>
        <div className="bg-gray-800/30 rounded-lg border border-gray-800 px-3 py-0.5">
          {node.project_scope && (
            <MetaRow label="Project">
              <Link
                href={`/project/${encodeURIComponent(node.project_scope)}`}
                className="text-sky-400 hover:text-sky-300 transition-colors"
              >
                {node.project_scope}
              </Link>
            </MetaRow>
          )}
          {node.session_id && (
            <MetaRow label="Session">
              <code className="text-[9px] text-gray-500">{node.session_id.substring(0, 12)}…</code>
            </MetaRow>
          )}
          <MetaRow label="Created"><RelativeTime iso={node.created_at} /></MetaRow>
        </div>
      </div>
    </div>
  );
}

// ── Project panel ─────────────────────────────────────────────────────────────

const CONTEXT_TAB_COLORS: Record<string, string> = {
  goal: "bg-sky-600 border-sky-500",
  decision: "bg-violet-600 border-violet-500",
  gotcha: "bg-red-700 border-red-600",
  progress: "bg-emerald-600 border-emerald-500",
};

function ProjectPanel({ node }: { node: ProjectNode }) {
  const [tab, setTab] = useState<"goal" | "decision" | "gotcha" | "progress">("goal");
  const [items, setItems] = useState<Record<string, CtxItem[]>>({});
  const [newestFirst, setNewestFirst] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    api.context(node.label)
      .then(d => { if (!controller.signal.aborted) setItems(d); })
      .catch(() => { /* ignore */ });
    return () => controller.abort();
  }, [node.label]);

  const tabs = ["goal", "decision", "gotcha", "progress"] as const;
  const rawList = items[tab] ?? [];
  const list = useMemo(
    () => newestFirst ? rawList : [...rawList].reverse(),
    [newestFirst, rawList]
  );
  const color = nodeColor("project");

  return (
    <div className="space-y-4">
      {/* Project header card */}
      <div
        className="rounded-xl p-4 border"
        style={{ background: `${color}10`, borderColor: `${color}30` }}
      >
        <div className="text-xs font-semibold" style={{ color }}>{node.label}</div>
        <div className="text-[10px] text-gray-500 mt-1">{node.confirm_count} context items</div>
        <Link
          href={`/project/${encodeURIComponent(node.label)}`}
          className="inline-block mt-2 text-[10px] text-sky-400 hover:text-sky-300 transition-colors"
        >
          View full project →
        </Link>
      </div>

      {/* Context tabs */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <SectionLabel>Context</SectionLabel>
          {rawList.length > 1 && (
            <button
              onClick={() => setNewestFirst(v => !v)}
              className="text-[9px] text-gray-500 hover:text-gray-300 transition-colors"
            >
              {newestFirst ? "↓ newest" : "↑ oldest"}
            </button>
          )}
        </div>
        <div className="flex gap-1 mb-3">
          {tabs.map(t => {
            const active = tab === t;
            const cnt = items[t]?.length ?? 0;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 text-[10px] py-1.5 rounded border font-medium transition-colors capitalize ${
                  active
                    ? `${CONTEXT_TAB_COLORS[t]} text-white`
                    : "bg-gray-800/60 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-600"
                }`}
              >
                {t}
                {cnt > 0 && (
                  <span className={`ml-1 text-[9px] ${active ? "opacity-70" : "text-gray-600"}`}>
                    {cnt}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {list.length === 0 ? (
          <p className="text-xs text-gray-600 italic text-center py-4">No {tab} items</p>
        ) : (
          <ul className="space-y-2">
            {list.map((item) => (
              <li key={item.created_at} className="text-xs text-gray-300 bg-gray-800/40 border border-gray-800 rounded-lg p-2.5 leading-relaxed">
                <p>{item.content}</p>
                <p className="text-[9px] text-gray-600 mt-1.5">
                  <RelativeTime iso={item.created_at} />
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ── Main Sidebar ──────────────────────────────────────────────────────────────

export default function Sidebar({ node, onClose, onRelationClick, nodeLabelById }: Props) {
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

  const typeLabel = isProject ? "Project" : isContext ? "Context" : "Memory";
  const accentColor = isProject ? nodeColor("project") : isContext ? "#6b7280" : nodeColor(node.category);

  return (
    <div className="w-80 min-w-[280px] bg-[#0d1117] border-l border-gray-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div
        className="px-4 pt-4 pb-3 border-b border-gray-800 relative"
        style={{ background: `linear-gradient(to bottom, ${accentColor}0d, transparent)` }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div
              className="text-[9px] font-semibold uppercase tracking-widest mb-1"
              style={{ color: accentColor }}
            >
              {typeLabel}
            </div>
            <div className="text-sm font-semibold text-white leading-snug truncate" title={node.label}>
              {node.label}
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-gray-600 hover:text-gray-300 hover:bg-gray-800 transition-colors mt-0.5"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4">
        {isProject && <ProjectPanel node={node as ProjectNode} />}
        {isContext && <ContextPanel node={node as ContextNode} />}
        {!isProject && !isContext && (
          detail
            ? <MemoryPanel node={detail} onRelationClick={onRelationClick} nodeLabelById={nodeLabelById} />
            : (
              <div className="flex items-center justify-center h-24 text-xs text-gray-600">
                Loading…
              </div>
            )
        )}
      </div>
    </div>
  );
}
