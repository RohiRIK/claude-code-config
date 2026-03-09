"use client";
import * as d3 from "d3";
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { useRouter } from "next/navigation";
import { nodeColor, nodeRadius } from "@/lib/nodeColors";
import type { GraphData, GraphNode } from "@/lib/types";

export interface GraphHandle {
  zoomToNode: (id: number) => void;
}

interface Props {
  data: GraphData;
  activeProject: string | null;
  dimmedIds?: Set<number>;
  onNodeClick: (node: GraphNode) => void;
}

// Flat node shape for D3 — avoids union extension issues
interface RawNode {
  id: number;
  label: string;
  content: string;
  category: string;
  importance: number;
  project_scope: string | null;
  is_project?: boolean;
  is_context?: boolean;
  // D3 simulation fields
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  // Original GraphNode reference
  _original: GraphNode;
}

interface RawLink {
  source: RawNode;
  target: RawNode;
  type: string;
}

const Graph = forwardRef<GraphHandle, Props>(function Graph(
  { data, activeProject, dimmedIds, onNodeClick },
  ref
) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simNodesRef = useRef<RawNode[]>([]);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const router = useRouter();

  useImperativeHandle(ref, () => ({
    zoomToNode(id: number) {
      const node = simNodesRef.current.find(n => n.id === id);
      const svgEl = svgRef.current;
      if (!node || !zoomRef.current || !svgEl) return;
      const W = svgEl.clientWidth || 900;
      const H = svgEl.clientHeight || 600;
      d3.select(svgEl).transition().duration(600).call(
        zoomRef.current.transform,
        d3.zoomIdentity.translate(W / 2 - (node.x ?? 0), H / 2 - (node.y ?? 0)).scale(1.5)
      );
    },
  }), []);

  // Main effect: build simulation. Only reruns when data changes.
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();

    const width = svgEl.clientWidth || 900;
    const height = svgEl.clientHeight || 600;
    const g = svg.append("g");

    // Cache selection for zoom handler — avoids DOM query on every zoom tick
    let memoryLabels: d3.Selection<SVGTextElement, RawNode, SVGGElement, unknown> | null = null;

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
        if (memoryLabels) {
          memoryLabels.attr("opacity", Math.max(0, (event.transform.k - 0.8) / 0.4));
        }
      });
    zoomRef.current = zoom;
    svg.call(zoom);

    const defs = svg.append("defs");
    // Glow filter for project nodes
    const filter = defs.append("filter").attr("id", "glow").attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
    filter.append("feGaussianBlur").attr("in", "SourceGraphic").attr("stdDeviation", "3").attr("result", "blur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "blur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const rawNodes: RawNode[] = data.nodes.map(n => ({
      id: n.id,
      label: n.label,
      content: n.content,
      category: n.category,
      importance: n.importance,
      project_scope: n.project_scope,
      is_project: "is_project" in n ? true : undefined,
      is_context: "is_context" in n ? true : undefined,
      _original: n,
    }));
    simNodesRef.current = rawNodes;

    const nodeById = new Map(rawNodes.map(n => [n.id, n]));

    const rawLinks: RawLink[] = data.links.flatMap(l => {
      const src = nodeById.get(typeof l.source === "number" ? l.source : (l.source as GraphNode).id);
      const tgt = nodeById.get(typeof l.target === "number" ? l.target : (l.target as GraphNode).id);
      return src && tgt ? [{ source: src, target: tgt, type: l.type }] : [];
    });

    const linkForce = d3.forceLink<RawNode, RawLink>(rawLinks).id(d => d.id)
      .distance(50)
      .strength(d => {
        if (d.type === "context_of") return 0.04;    // context items float loosely
        if (d.type === "project_scope") return 0.25; // project members: moderate pull
        return 0.6;                                   // memory relations: strong
      });

    const simulation = d3.forceSimulation<RawNode>(rawNodes)
      .force("link", linkForce)
      .force("charge", d3.forceManyBody<RawNode>().strength(-80))
      .force("center", d3.forceCenter(width / 2, height / 2).strength(0.08))
      .force("collision", d3.forceCollide<RawNode>().radius(d => nodeRadius(d.importance, d.is_project, d.is_context) + 2))
      .alphaDecay(0.025);

    const link = g.selectAll<SVGLineElement, RawLink>("line")
      .data(rawLinks)
      .join("line")
      .attr("stroke", d => d.type === "project_scope" ? "#334155" : "#1e3a5f")
      .attr("stroke-width", d => d.type === "project_scope" ? 1 : 0.8)
      .attr("stroke-opacity", 0.7)
      .attr("stroke-dasharray", d => d.type === "context_of" ? "2,2" : null);

    const node = g.selectAll<SVGGElement, RawNode>("g.node")
      .data(rawNodes)
      .join("g")
      .attr("class", "node")
      .style("cursor", "pointer")
      .on("click", (_event, d) => {
        if (d.is_project) {
          router.push(`/project/${encodeURIComponent(d.label)}`);
        } else {
          onNodeClick(d._original);
        }
      })
      .call(
        d3.drag<SVGGElement, RawNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
          })
          .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null; d.fy = null;
          })
      );

    node.append("circle")
      .attr("class", "node-circle")
      .attr("r", d => nodeRadius(d.importance, d.is_project, d.is_context))
      .attr("fill", d => nodeColor(d.category))
      .attr("fill-opacity", d => d.is_project ? 1 : 0.85)
      .attr("stroke", d => d.is_project ? nodeColor(d.category) : "transparent")
      .attr("stroke-width", d => d.is_project ? 1.5 : 0)
      .attr("filter", d => d.is_project ? "url(#glow)" : null);

    // Project labels — always visible
    node.filter(d => !!d.is_project)
      .append("text")
      .attr("class", "node-label-project")
      .attr("dy", d => nodeRadius(d.importance, d.is_project, d.is_context) + 9)
      .attr("text-anchor", "middle")
      .attr("font-size", 8)
      .attr("fill", d => nodeColor(d.category))
      .attr("font-weight", "600")
      .attr("pointer-events", "none")
      .text(d => d.label.length > 14 ? d.label.substring(0, 13) + "…" : d.label);

    // Memory labels — only visible when zoomed in (CSS opacity trick via zoom handler)
    node.filter(d => !d.is_project)
      .append("text")
      .attr("class", "node-label-memory")
      .attr("dy", d => nodeRadius(d.importance, d.is_project, d.is_context) + 7)
      .attr("text-anchor", "middle")
      .attr("font-size", 6)
      .attr("fill", "#6b7280")
      .attr("pointer-events", "none")
      .text(d => d.label.length > 16 ? d.label.substring(0, 15) + "…" : d.label);

    node.append("title").text(d => `[${d.category}] ${d.label}`);

    // Populate cached selection now that labels exist
    memoryLabels = g.selectAll<SVGTextElement, RawNode>(".node-label-memory");

    simulation.on("end", () => {
      if (rawNodes.length === 0) return;
      const bounds = rawNodes.reduce(
        (acc, n) => ({
          minX: Math.min(acc.minX, n.x ?? 0), maxX: Math.max(acc.maxX, n.x ?? 0),
          minY: Math.min(acc.minY, n.y ?? 0), maxY: Math.max(acc.maxY, n.y ?? 0),
        }),
        { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
      );
      const x0 = bounds.minX - 40, x1 = bounds.maxX + 40;
      const y0 = bounds.minY - 40, y1 = bounds.maxY + 40;
      const scale = Math.min(width / (x1 - x0), height / (y1 - y0), 1);
      const tx = (width - scale * (x0 + x1)) / 2;
      const ty = (height - scale * (y0 + y1)) / 2;
      d3.select(svgEl).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    });

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x ?? 0)
        .attr("y1", d => d.source.y ?? 0)
        .attr("x2", d => d.target.x ?? 0)
        .attr("y2", d => d.target.y ?? 0);
      node.attr("transform", d => `translate(${d.x ?? 0},${d.y ?? 0})`);
    });

    return () => { simulation.stop(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Highlight activeProject without rebuilding simulation
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    d3.select(svgEl).selectAll<SVGCircleElement, RawNode>("circle.node-circle")
      .attr("stroke", d => activeProject && d.project_scope === activeProject ? "#ffffff" : "#1f2937")
      .attr("stroke-width", d => activeProject && d.project_scope === activeProject ? 2.5 : 1);
  }, [activeProject]);

  // Dim nodes not matching active tag filter
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    d3.select(svgEl).selectAll<SVGGElement, RawNode>("g.node")
      .attr("opacity", d => dimmedIds?.size && dimmedIds.has(d.id) ? 0.15 : 1);
  }, [dimmedIds]);

  return <svg ref={svgRef} className="w-full h-full bg-[#0d1117]" />;
});

export default Graph;
