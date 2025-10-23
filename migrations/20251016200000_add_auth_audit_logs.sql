-- Migration: add_auth_audit_logs
-- Created: 2025-10-16T20:00:00.000Z
-- Description: Add authentication audit logging table for security tracking

-- UP
CREATE TABLE IF NOT EXISTS auth_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255),
  event_type VARCHAR(50) NOT NULL,
  event_status VARCHAR(20) NOT NULL,
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_audit_user_id ON auth_audit_logs(user_id);
CREATE INDEX idx_auth_audit_event_type ON auth_audit_logs(event_type);
CREATE INDEX idx_auth_audit_created_at ON auth_audit_logs(created_at DESC);
CREATE INDEX idx_auth_audit_ip_address ON auth_audit_logs(ip_address);
CREATE INDEX idx_auth_audit_session_id ON auth_audit_logs(session_id);

COMMENT ON TABLE auth_audit_logs IS 'Audit trail for authentication events';
COMMENT ON COLUMN auth_audit_logs.event_type IS 'login, logout, login_failed, session_created, session_expired, password_reset, etc.';
COMMENT ON COLUMN auth_audit_logs.event_status IS 'success, failure, pending';

-- DOWN
DROP INDEX IF EXISTS idx_auth_audit_session_id;
DROP INDEX IF EXISTS idx_auth_audit_ip_address;
DROP INDEX IF EXISTS idx_auth_audit_created_at;
DROP INDEX IF EXISTS idx_auth_audit_event_type;
DROP INDEX IF EXISTS idx_auth_audit_user_id;
DROP TABLE IF EXISTS auth_audit_logs;
