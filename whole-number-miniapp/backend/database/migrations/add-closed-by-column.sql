-- Migration: Add closed_by column to trades table
-- This tracks how trades were closed (manual, stop_loss, liquidation, voided)

ALTER TABLE trades ADD COLUMN IF NOT EXISTS closed_by VARCHAR(20);

-- Add check constraint for valid closed_by values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_closed_by'
  ) THEN
    ALTER TABLE trades ADD CONSTRAINT chk_closed_by
      CHECK (closed_by IS NULL OR closed_by IN ('manual', 'stop_loss', 'liquidation', 'voided'));
  END IF;
END $$;

-- Add index for filtering by close type
CREATE INDEX IF NOT EXISTS idx_trades_closed_by ON trades(closed_by) WHERE closed_by IS NOT NULL;
