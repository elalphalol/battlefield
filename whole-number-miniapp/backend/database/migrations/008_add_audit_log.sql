-- Audit log table for tracking balance audit runs and fixes
-- Created: 2026-01-18

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  audit_type VARCHAR(20) NOT NULL,  -- 'full', 'user', 'fix', 'rollback'
  run_at TIMESTAMP DEFAULT NOW(),

  -- Summary stats
  total_users_checked INTEGER,
  discrepancies_found INTEGER,
  fixes_applied INTEGER,
  total_adjustment_cents BIGINT,

  -- Detailed data (JSON)
  discrepancies JSONB,  -- Array of all discrepancies found
  fixes JSONB,          -- Array of fixes applied (with before/after)

  -- Metadata
  triggered_by VARCHAR(50),  -- 'cli', 'admin_panel', 'api'
  notes TEXT,

  -- For rollback support
  rollback_of INTEGER REFERENCES audit_log(id),
  rolled_back_at TIMESTAMP,
  rolled_back_by INTEGER REFERENCES audit_log(id)
);

CREATE INDEX idx_audit_log_run_at ON audit_log(run_at DESC);
CREATE INDEX idx_audit_log_audit_type ON audit_log(audit_type);
