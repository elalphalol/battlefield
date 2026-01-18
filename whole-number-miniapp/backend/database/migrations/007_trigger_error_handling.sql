-- Migration: Add Error Handling to Database Triggers
-- Issue: Trigger failures can block user operations (trades, claims, etc.)
--
-- Problem: When triggers fail (e.g., army_stats table issues, constraint violations),
-- the entire transaction fails, preventing users from completing their operations.
--
-- Solution: Wrap trigger logic in EXCEPTION blocks that log warnings but don't
-- fail the transaction. This ensures user operations complete even if stats
-- updates fail temporarily.

-- ============================================
-- update_user_stats_after_trade() - Error Handling
-- ============================================
-- Updates user stats when a trade is closed or liquidated
CREATE OR REPLACE FUNCTION update_user_stats_after_trade()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    IF NEW.status IN ('closed', 'liquidated') AND OLD.status = 'open' THEN
      UPDATE users
      SET
        total_trades = total_trades + 1,
        winning_trades = CASE
          WHEN NEW.pnl > 0 THEN winning_trades + 1
          ELSE winning_trades
        END,
        current_streak = CASE
          WHEN NEW.pnl > 0 THEN current_streak + 1
          ELSE 0
        END,
        best_streak = GREATEST(
          best_streak,
          CASE WHEN NEW.pnl > 0 THEN current_streak + 1 ELSE current_streak END
        ),
        total_pnl = total_pnl + COALESCE(NEW.pnl, 0),
        times_liquidated = CASE
          WHEN NEW.status = 'liquidated' THEN times_liquidated + 1
          ELSE times_liquidated
        END,
        last_active = NOW()
      WHERE id = NEW.user_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Trigger error in update_user_stats_after_trade (trade_id=%, user_id=%): %',
      NEW.id, NEW.user_id, SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- update_army_stats() - Error Handling
-- ============================================
-- Incrementally updates army stats when user data changes
CREATE OR REPLACE FUNCTION update_army_stats()
RETURNS TRIGGER AS $$
DECLARE
  old_army VARCHAR(10);
  new_army VARCHAR(10);
  balance_diff DECIMAL(18, 2);
  pnl_diff DECIMAL(18, 2);
BEGIN
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
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Trigger error in update_army_stats (user_id=%, op=%): %',
      COALESCE(NEW.id::text, 'null'), TG_OP, SQLERRM;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- update_army_stats_on_delete() - Error Handling
-- ============================================
-- Updates army stats when a user is deleted
CREATE OR REPLACE FUNCTION update_army_stats_on_delete()
RETURNS TRIGGER AS $$
BEGIN
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
  EXCEPTION WHEN OTHERS THEN
    -- Log error but don't fail the transaction
    RAISE WARNING 'Trigger error in update_army_stats_on_delete (user_id=%, army=%): %',
      OLD.id, OLD.army, SQLERRM;
  END;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Update function comments
-- ============================================
COMMENT ON FUNCTION update_user_stats_after_trade() IS
  'Updates user trading statistics when a trade is closed. Includes error handling to prevent blocking trade operations.';

COMMENT ON FUNCTION update_army_stats() IS
  'Incrementally updates army stats on user changes. Includes error handling to prevent blocking user operations.';

COMMENT ON FUNCTION update_army_stats_on_delete() IS
  'Updates army stats when a user is deleted. Includes error handling to prevent blocking delete operations.';

-- ============================================
-- Verify triggers are still in place
-- ============================================
-- The triggers themselves don't need to be recreated since we're just
-- updating the functions they call. PostgreSQL will use the new function
-- definitions automatically.

-- Verify the triggers exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_user_stats'
  ) THEN
    RAISE NOTICE 'WARNING: trigger_update_user_stats does not exist - creating it';
    CREATE TRIGGER trigger_update_user_stats
      AFTER UPDATE ON trades
      FOR EACH ROW
      EXECUTE FUNCTION update_user_stats_after_trade();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_army_stats'
  ) THEN
    RAISE NOTICE 'WARNING: trigger_update_army_stats does not exist - creating it';
    CREATE TRIGGER trigger_update_army_stats
      AFTER INSERT OR UPDATE OF army, paper_balance, total_pnl ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_army_stats();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_army_stats_on_delete'
  ) THEN
    RAISE NOTICE 'WARNING: trigger_update_army_stats_on_delete does not exist - creating it';
    CREATE TRIGGER trigger_update_army_stats_on_delete
      AFTER DELETE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_army_stats_on_delete();
  END IF;
END $$;
