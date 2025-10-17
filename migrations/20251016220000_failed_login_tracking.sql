-- =====================================================
-- ENTERPRISE AUTH: Failed Login Tracking & Account Lockout
-- =====================================================

-- Failed login attempts tracking
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  attempt_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_failed_login_email ON failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_login_ip ON failed_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_login_time ON failed_login_attempts(attempt_time DESC);

-- Account lockout tracking
CREATE TABLE IF NOT EXISTS account_lockouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  email TEXT,
  lockout_type TEXT NOT NULL, -- 'temporary', 'permanent'
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_until TIMESTAMPTZ,
  unlock_at TIMESTAMPTZ,
  locked_by TEXT, -- 'system', 'admin'
  reason TEXT,
  failed_attempt_count INTEGER DEFAULT 0,
  unlocked_at TIMESTAMPTZ,
  unlocked_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_account_lockouts_user_id ON account_lockouts(user_id);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_email ON account_lockouts(email);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_active ON account_lockouts(locked_at) WHERE unlocked_at IS NULL;

-- IP blocklist/allowlist
CREATE TABLE IF NOT EXISTS ip_access_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address TEXT NOT NULL UNIQUE,
  list_type TEXT NOT NULL, -- 'blocklist', 'allowlist'
  reason TEXT,
  added_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_ip_access_control_ip ON ip_access_control(ip_address);
CREATE INDEX IF NOT EXISTS idx_ip_access_control_type ON ip_access_control(list_type);
CREATE INDEX IF NOT EXISTS idx_ip_access_control_active ON ip_access_control(is_active, expires_at);

-- Security notifications tracking
CREATE TABLE IF NOT EXISTS security_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- 'new_device', 'suspicious_login', 'password_change', 'account_lockout'
  severity TEXT NOT NULL, -- 'info', 'warning', 'critical'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_via TEXT[], -- ['email', 'sms', 'in_app']
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_notifications_user_id ON security_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_security_notifications_type ON security_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_security_notifications_read ON security_notifications(read_at);

-- Add lockout status to users table (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_login_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_failed_login TIMESTAMPTZ;

-- Create indexes on new user columns
CREATE INDEX IF NOT EXISTS idx_users_locked ON users(is_locked) WHERE is_locked = true;
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until) WHERE locked_until IS NOT NULL;
