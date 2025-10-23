-- Migration: add_active_sessions
-- Created: 2025-10-16T20:01:00.000Z
-- Description: Add active sessions tracking for session management and security

-- UP
CREATE TABLE IF NOT EXISTS active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  session_id VARCHAR(255) NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  device_type VARCHAR(50),
  browser VARCHAR(50),
  os VARCHAR(50),
  location_country VARCHAR(2),
  location_city VARCHAR(100),
  is_current BOOLEAN DEFAULT false,
  last_activity TIMESTAMP NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_active_sessions_user_id ON active_sessions(user_id);
CREATE INDEX idx_active_sessions_session_id ON active_sessions(session_id);
CREATE INDEX idx_active_sessions_expires_at ON active_sessions(expires_at);
CREATE INDEX idx_active_sessions_last_activity ON active_sessions(last_activity DESC);

COMMENT ON TABLE active_sessions IS 'Tracks all active user sessions for management and security';
COMMENT ON COLUMN active_sessions.is_current IS 'Indicates if this is the current session for the user';

-- DOWN
DROP INDEX IF EXISTS idx_active_sessions_last_activity;
DROP INDEX IF EXISTS idx_active_sessions_expires_at;
DROP INDEX IF EXISTS idx_active_sessions_session_id;
DROP INDEX IF EXISTS idx_active_sessions_user_id;
DROP TABLE IF EXISTS active_sessions;
