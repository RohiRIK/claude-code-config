export interface MemoryNode {
  id: number;
  label: string;
  content: string;
  category: string;
  importance: number;
  confidence: number;
  confirm_count: number;
  source: string | null;
  dedup_key: string | null;
  last_confirmed_at: string;
  project_scope: string | null;
  created_at: string;
  tags: string[];
}

export interface ContextNode {
  id: number;
  label: string;
  content: string;
  category: string; // "goal" | "decision" | "gotcha" | "progress"
  importance: number;
  confidence: number;
  confirm_count: number;
  project_scope: string | null;
  session_id: string | null;
  permanent: boolean;
  created_at: string;
  tags: string[];
  is_context: true;
}

export interface ProjectNode {
  id: number;
  label: string;
  content: string;
  category: "project";
  importance: number;
  confidence: number;
  confirm_count: number;
  project_scope: null;
  created_at: string;
  tags: string[];
  is_project: true;
}

export type GraphNode = MemoryNode | ContextNode | ProjectNode;

export interface GraphLink {
  source: number | GraphNode;
  target: number | GraphNode;
  type: string;
  relation_id?: number;
  created_at?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface Stats {
  memories: number;
  relations: number;
  projects: number;
  context_items: number;
  tags: number;
  by_category: Record<string, number>;
  by_project: Record<string, number>;
}

export interface Tag {
  id: number;
  name: string;
  memory_count: number;
}

export interface MemoryDetail extends MemoryNode {
  relations: Array<{ related_id: number; type: string; direction: string }>;
}

export interface SearchResult {
  id: number;
  content: string;
  category: string;
  importance: number;
  project_scope: string | null;
}

export interface ProjectDetail {
  name: string;
  context: Record<string, string[]>;
  memories: MemoryNode[];
  context_items: ContextNode[];
  relations: GraphLink[];
}
