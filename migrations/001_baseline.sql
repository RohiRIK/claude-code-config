-- Migration: 001_baseline
-- Description: Add _schema_version tracking table (baseline)
-- Date: 2026-03-16

-- UP
CREATE TABLE IF NOT EXISTS _schema_version (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  version     INTEGER NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  applied_at  TEXT NOT NULL DEFAULT (datetime('now')),
  checksum    TEXT NOT NULL
);

-- DOWN
DROP TABLE IF EXISTS _schema_version;
