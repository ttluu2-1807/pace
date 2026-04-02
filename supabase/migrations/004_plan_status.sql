-- Add status column to training_plans for richer plan lifecycle management
ALTER TABLE training_plans
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active'
  CHECK (status IN ('active', 'paused', 'completed', 'archived'));

-- Sync status with existing active flag on first run
UPDATE training_plans SET status = 'active' WHERE active = true;
UPDATE training_plans SET status = 'completed' WHERE active = false;
