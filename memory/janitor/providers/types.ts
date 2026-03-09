/**
 * types.ts — Provider interfaces for the janitor system.
 * Supports embedding generation (for semantic search/dedup)
 * and LLM calls (for smart promote/dedup decisions).
 */

/** A single embedding vector — float32 array stored as BLOB in SQLite. */
export type EmbeddingVector = Float32Array;

/** Input for batch embedding generation. */
export interface EmbedInput {
  /** Text strings to embed. */
  texts: string[];
}

/** Result from embedding generation. */
export interface EmbedResult {
  /** Embedding vectors, one per input text. Same order as input. */
  vectors: EmbeddingVector[];
  /** Model used for generation. */
  model: string;
  /** Dimensionality of each vector. */
  dimensions: number;
  /** Total tokens consumed (for cost tracking). */
  totalTokens: number;
}

/** Embedding provider — generates vector representations of text. */
export interface EmbeddingProvider {
  /** Provider name for display/logging. */
  readonly name: string;
  /** Generate embeddings for a batch of texts. */
  embed(input: EmbedInput): Promise<EmbedResult>;
  /** Verify the provider is configured and reachable. */
  verify(): Promise<{ ok: boolean; error?: string }>;
}

/** A single chat message for LLM calls. */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Input for LLM chat completion. */
export interface ChatInput {
  messages: ChatMessage[];
  /** Max tokens to generate. */
  maxTokens?: number;
  /** Temperature (0.0 = deterministic, 1.0 = creative). */
  temperature?: number;
  /** If true, expect JSON output. */
  jsonMode?: boolean;
}

/** Result from LLM chat completion. */
export interface ChatResult {
  content: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
}

/** LLM provider — used for smart dedup/promote decisions. */
export interface LLMProvider {
  readonly name: string;
  chat(input: ChatInput): Promise<ChatResult>;
  verify(): Promise<{ ok: boolean; error?: string }>;
}

/** Settings keys used by the janitor for provider configuration. */
export const SETTING_KEYS = {
  /** Embedding provider: "gemini" | "openrouter" | "ollama" */
  EMBED_PROVIDER: "ltm.embed.provider",
  /** LLM provider for smart decisions: "gemini" | "openrouter" | "ollama" */
  LLM_PROVIDER: "ltm.llm.provider",
  /** Gemini API key */
  GEMINI_API_KEY: "ltm.gemini.apiKey",
  /** Gemini embedding model */
  GEMINI_EMBED_MODEL: "ltm.gemini.embedModel",
  /** Gemini LLM model */
  GEMINI_LLM_MODEL: "ltm.gemini.llmModel",
  /** OpenRouter API key */
  OPENROUTER_API_KEY: "ltm.openrouter.apiKey",
  /** OpenRouter embedding model */
  OPENROUTER_EMBED_MODEL: "ltm.openrouter.embedModel",
  /** OpenRouter LLM model */
  OPENROUTER_LLM_MODEL: "ltm.openrouter.llmModel",
  /** Ollama base URL (default http://localhost:11434) */
  OLLAMA_BASE_URL: "ltm.ollama.baseUrl",
  /** Ollama embedding model */
  OLLAMA_EMBED_MODEL: "ltm.ollama.embedModel",
  /** Ollama LLM model */
  OLLAMA_LLM_MODEL: "ltm.ollama.llmModel",
  /** Decay: days before confidence starts decaying */
  DECAY_GRACE_DAYS: "ltm.decay.graceDays",
  /** Decay: rate per day after grace period (0.0 to 1.0) */
  DECAY_RATE: "ltm.decay.rate",
  /** Decay: minimum confidence before deprecation */
  DECAY_MIN_CONFIDENCE: "ltm.decay.minConfidence",
  /** Auto-promote: minimum importance threshold for context_items */
  PROMOTE_MIN_IMPORTANCE: "ltm.promote.minImportance",
  /** Janitor: auto-run interval in minutes (0 = disabled) */
  JANITOR_INTERVAL_MINUTES: "ltm.janitor.intervalMinutes",
} as const;

/** Default values for all settings. */
export const SETTING_DEFAULTS: Record<string, string> = {
  [SETTING_KEYS.EMBED_PROVIDER]: "gemini",
  [SETTING_KEYS.LLM_PROVIDER]: "gemini",
  [SETTING_KEYS.GEMINI_API_KEY]: "",
  [SETTING_KEYS.GEMINI_EMBED_MODEL]: "text-embedding-004",
  [SETTING_KEYS.GEMINI_LLM_MODEL]: "gemini-2.0-flash",
  [SETTING_KEYS.OPENROUTER_API_KEY]: "",
  [SETTING_KEYS.OPENROUTER_EMBED_MODEL]: "openai/text-embedding-3-small",
  [SETTING_KEYS.OPENROUTER_LLM_MODEL]: "google/gemini-2.0-flash-001",
  [SETTING_KEYS.OLLAMA_BASE_URL]: "http://localhost:11434",
  [SETTING_KEYS.OLLAMA_EMBED_MODEL]: "nomic-embed-text",
  [SETTING_KEYS.OLLAMA_LLM_MODEL]: "llama3.2",
  [SETTING_KEYS.DECAY_GRACE_DAYS]: "30",
  [SETTING_KEYS.DECAY_RATE]: "0.02",
  [SETTING_KEYS.DECAY_MIN_CONFIDENCE]: "0.2",
  [SETTING_KEYS.PROMOTE_MIN_IMPORTANCE]: "3",
  [SETTING_KEYS.JANITOR_INTERVAL_MINUTES]: "0",
};

/** Provider type identifiers. */
export type ProviderType = "gemini" | "openrouter" | "ollama";

/** Get a default setting value, guaranteed non-undefined. */
export function getDefault(key: string): string {
  return SETTING_DEFAULTS[key] ?? "";
}
