-- Add stop_loss column to trades table
-- Stop loss price at which trade automatically closes

ALTER TABLE trades ADD COLUMN IF NOT EXISTS stop_loss DECIMAL(18, 2);

-- Create index for efficient stop loss checking
CREATE INDEX IF NOT EXISTS idx_trades_stop_loss ON trades(stop_loss) WHERE stop_loss IS NOT NULL AND status = 'open';

-- Comment
COMMENT ON COLUMN trades.stop_loss IS 'Stop loss price - trade closes automatically if BTC reaches this price';
