-- Migration: 002_add_context_items_index
-- Description: Add status index to context_items for decay queries
-- Date: 2026-03-16

-- UP
CREATE INDEX IF NOT EXISTS idx_ctx_status ON context_items(status);

-- DOWN
DROP INDEX IF EXISTS idx_ctx_status;
