
-- Add expires_at column to offline_messages table
ALTER TABLE offline_messages ADD COLUMN expires_at INTEGER;

-- Create rate limiting table
CREATE TABLE rate_limits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX idx_rate_limits_key ON rate_limits(key);
CREATE INDEX idx_rate_limits_created_at ON rate_limits(created_at);
