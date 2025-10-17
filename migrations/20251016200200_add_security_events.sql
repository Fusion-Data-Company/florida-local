-- Migration: add_security_events
-- Created: 2025-10-16T20:02:00.000Z
-- Description: Add security events table for monitoring suspicious activities

-- UP
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  user_id VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  description TEXT,
  metadata JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  resolved_by VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_created_at ON security_events(created_at DESC);
CREATE INDEX idx_security_events_resolved ON security_events(resolved) WHERE NOT resolved;

COMMENT ON TABLE security_events IS 'Security events and suspicious activities for monitoring';
COMMENT ON COLUMN security_events.event_type IS 'rate_limit_exceeded, multiple_failed_logins, suspicious_ip, session_hijack_attempt, etc.';
COMMENT ON COLUMN security_events.severity IS 'low, medium, high, critical';

-- DOWN
DROP INDEX IF EXISTS idx_security_events_resolved;
DROP INDEX IF EXISTS idx_security_events_created_at;
DROP INDEX IF EXISTS idx_security_events_user_id;
DROP INDEX IF EXISTS idx_security_events_severity;
DROP INDEX IF EXISTS idx_security_events_type;
DROP TABLE IF EXISTS security_events;
