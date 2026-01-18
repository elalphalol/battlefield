-- Migration: Optimize Army Stats Trigger to Avoid Full Table Scans
-- Issue #16: Army Stats Trigger Full Table Scans
--
-- Problem: The previous trigger did 10 full table scans (5 per army) on every
-- user INSERT or UPDATE of army/paper_balance/total_pnl fields.
--
-- Solution: Use incremental updates instead of recalculating everything.
-- Only update the affected army, and only when values actually change.

-- Drop the old trigger first
DROP TRIGGER IF EXISTS trigger_update_army_stats ON users;

-- Create optimized function with incremental updates
CREATE OR REPLACE FUNCTION update_army_stats()
RETURNS TRIGGER AS $$
DECLARE
  old_army VARCHAR(10);
  new_army VARCHAR(10);
  balance_diff DECIMAL(18, 2);
  pnl_diff DECIMAL(18, 2);
BEGIN
  -- Handle INSERT: Add new user to their army stats
  IF TG_OP = 'INSERT' THEN
    IF NEW.army IS NOT NULL THEN
      UPDATE army_stats
      SET
        total_members = total_members + 1,
        total_paper_wealth = total_paper_wealth + COALESCE(NEW.paper_balance, 0),
        total_pnl = total_pnl + COALESCE(NEW.total_pnl, 0),
        -- Recalculate average only for affected army
        average_pnl = CASE
          WHEN total_members + 1 > 0 THEN (total_pnl + COALESCE(NEW.total_pnl, 0)) / (total_members + 1)
          ELSE 0
        END,
        -- active_traders needs a check (can't avoid this one easily)
        active_traders = CASE
          WHEN NEW.last_active > NOW() - INTERVAL '24 hours' THEN active_traders + 1
          ELSE active_traders
        END,
        updated_at = NOW()
      WHERE army = NEW.army;
    END IF;
    RETURN NEW;
  END IF;

  -- Handle UPDATE: Only process if relevant fields changed
  IF TG_OP = 'UPDATE' THEN
    old_army := OLD.army;
    new_army := NEW.army;

    -- Case 1: Army changed - need to move user between armies
    IF old_army IS DISTINCT FROM new_army THEN
      -- Remove from old army
      IF old_army IS NOT NULL THEN
        UPDATE army_stats
        SET
          total_members = GREATEST(0, total_members - 1),
          total_paper_wealth = total_paper_wealth - COALESCE(OLD.paper_balance, 0),
          total_pnl = total_pnl - COALESCE(OLD.total_pnl, 0),
          average_pnl = CASE
            WHEN GREATEST(0, total_members - 1) > 0
            THEN (total_pnl - COALESCE(OLD.total_pnl, 0)) / GREATEST(1, total_members - 1)
            ELSE 0
          END,
          active_traders = CASE
            WHEN OLD.last_active > NOW() - INTERVAL '24 hours'
            THEN GREATEST(0, active_traders - 1)
            ELSE active_traders
          END,
          updated_at = NOW()
        WHERE army = old_army;
      END IF;

      -- Add to new army
      IF new_army IS NOT NULL THEN
        UPDATE army_stats
        SET
          total_members = total_members + 1,
          total_paper_wealth = total_paper_wealth + COALESCE(NEW.paper_balance, 0),
          total_pnl = total_pnl + COALESCE(NEW.total_pnl, 0),
          average_pnl = CASE
            WHEN total_members + 1 > 0
            THEN (total_pnl + COALESCE(NEW.total_pnl, 0)) / (total_members + 1)
            ELSE 0
          END,
          active_traders = CASE
            WHEN NEW.last_active > NOW() - INTERVAL '24 hours' THEN active_traders + 1
            ELSE active_traders
          END,
          updated_at = NOW()
        WHERE army = new_army;
      END IF;

      RETURN NEW;
    END IF;

    -- Case 2: Same army, but balance or pnl changed - apply incremental diff
    IF new_army IS NOT NULL THEN
      balance_diff := COALESCE(NEW.paper_balance, 0) - COALESCE(OLD.paper_balance, 0);
      pnl_diff := COALESCE(NEW.total_pnl, 0) - COALESCE(OLD.total_pnl, 0);

      -- Only update if there's actually a difference
      IF balance_diff != 0 OR pnl_diff != 0 THEN
        UPDATE army_stats
        SET
          total_paper_wealth = total_paper_wealth + balance_diff,
          total_pnl = total_pnl + pnl_diff,
          average_pnl = CASE
            WHEN total_members > 0 THEN (total_pnl + pnl_diff) / total_members
            ELSE 0
          END,
          updated_at = NOW()
        WHERE army = new_army;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER trigger_update_army_stats
  AFTER INSERT OR UPDATE OF army, paper_balance, total_pnl ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_army_stats();

-- Also add a trigger for DELETE to keep stats accurate
CREATE OR REPLACE FUNCTION update_army_stats_on_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.army IS NOT NULL THEN
    UPDATE army_stats
    SET
      total_members = GREATEST(0, total_members - 1),
      total_paper_wealth = total_paper_wealth - COALESCE(OLD.paper_balance, 0),
      total_pnl = total_pnl - COALESCE(OLD.total_pnl, 0),
      average_pnl = CASE
        WHEN GREATEST(0, total_members - 1) > 0
        THEN (total_pnl - COALESCE(OLD.total_pnl, 0)) / GREATEST(1, total_members - 1)
        ELSE 0
      END,
      active_traders = CASE
        WHEN OLD.last_active > NOW() - INTERVAL '24 hours'
        THEN GREATEST(0, active_traders - 1)
        ELSE active_traders
      END,
      updated_at = NOW()
    WHERE army = OLD.army;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_army_stats_on_delete ON users;
CREATE TRIGGER trigger_update_army_stats_on_delete
  AFTER DELETE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_army_stats_on_delete();

-- Recalculate current army stats to ensure consistency after migration
-- This is a one-time full recalculation to sync incremental counters
UPDATE army_stats
SET
  total_members = (SELECT COUNT(*) FROM users WHERE army = 'bears'),
  total_paper_wealth = (SELECT COALESCE(SUM(paper_balance), 0) FROM users WHERE army = 'bears'),
  total_pnl = (SELECT COALESCE(SUM(total_pnl), 0) FROM users WHERE army = 'bears'),
  average_pnl = (SELECT COALESCE(AVG(total_pnl), 0) FROM users WHERE army = 'bears'),
  active_traders = (SELECT COUNT(*) FROM users WHERE army = 'bears' AND last_active > NOW() - INTERVAL '24 hours'),
  updated_at = NOW()
WHERE army = 'bears';

UPDATE army_stats
SET
  total_members = (SELECT COUNT(*) FROM users WHERE army = 'bulls'),
  total_paper_wealth = (SELECT COALESCE(SUM(paper_balance), 0) FROM users WHERE army = 'bulls'),
  total_pnl = (SELECT COALESCE(SUM(total_pnl), 0) FROM users WHERE army = 'bulls'),
  average_pnl = (SELECT COALESCE(AVG(total_pnl), 0) FROM users WHERE army = 'bulls'),
  active_traders = (SELECT COUNT(*) FROM users WHERE army = 'bulls' AND last_active > NOW() - INTERVAL '24 hours'),
  updated_at = NOW()
WHERE army = 'bulls';

-- Add comment documenting the optimization
COMMENT ON FUNCTION update_army_stats() IS 'Incrementally updates army stats on user changes. Optimized to avoid full table scans by using incremental counters.';
