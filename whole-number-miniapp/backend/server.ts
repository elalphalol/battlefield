// BATTLEFIELD Backend API Server
// Bears 🐻 vs Bulls 🐂 Paper Trading Game

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
});

// Test database connection and run migration
pool.connect(async (err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.stack);
    return;
  }
  
  if (!client) {
    console.error('❌ Database client is undefined');
    return;
  }
  
  console.log('✅ Connected to PostgreSQL database');
  
  // Auto-upgrade leverage constraint to 200x if needed
  try {
    console.log('🔧 Checking leverage constraint...');
    
    // Check current constraint
    const constraintCheck = await client.query(`
      SELECT pg_get_constraintdef(oid) as def
      FROM pg_constraint 
      WHERE conname = 'trades_leverage_check'
    `);
    
    if (constraintCheck.rows.length > 0) {
      const currentDef = constraintCheck.rows[0].def;
      
      // If constraint exists and is limiting to 100x, upgrade it
      if (currentDef.includes('<= 100') || currentDef.includes('<=100')) {
        console.log('🚀 Upgrading leverage limit from 100x to 200x...');
        
        await client.query('ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_leverage_check');
        await client.query('ALTER TABLE trades ADD CONSTRAINT trades_leverage_check CHECK (leverage >= 1 AND leverage <= 200)');
        
        console.log('✅ Leverage upgraded to 200x successfully!');
      } else if (currentDef.includes('<= 200') || currentDef.includes('<=200')) {
        console.log('✅ Leverage already set to 200x');
      }
    }
  } catch (migrationError) {
    console.error('⚠️  Migration check failed (non-critical):', migrationError);
  }
  
  release();
});

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: result.rows[0].now 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: 'Database connection failed'
    });
  }
});

// ============================================
// USER ENDPOINTS
// ============================================

// Get or create user
app.post('/api/users', async (req: Request, res: Response) => {
  const { fid, walletAddress, username, pfpUrl, army } = req.body;

  // Wallet address is REQUIRED, FID is optional (null for non-Farcaster users)
  if (!walletAddress) {
    return res.status(400).json({ success: false, message: 'Wallet address required' });
  }

  try {
    // Check if user exists by FID (if provided) or wallet address
    let existingUser;
    if (fid) {
      existingUser = await pool.query(
        'SELECT * FROM users WHERE fid = $1 OR LOWER(wallet_address) = LOWER($2)',
        [fid, walletAddress]
      );
    } else {
      // For non-Farcaster users, only check by wallet address
      existingUser = await pool.query(
        'SELECT * FROM users WHERE LOWER(wallet_address) = LOWER($1)',
        [walletAddress]
      );
    }

    if (existingUser.rows.length > 0) {
      // Update existing user
      const updated = await pool.query(
        `UPDATE users 
         SET fid = COALESCE($1, fid),
             username = $2,
             pfp_url = $3,
             wallet_address = LOWER($4),
             army = COALESCE($5, army),
             last_active = NOW()
         WHERE id = $6
         RETURNING *`,
        [fid, username || existingUser.rows[0].username, pfpUrl, walletAddress, army, existingUser.rows[0].id]
      );
      console.log(`✅ Updated existing user: ${username} (FID: ${fid || 'null'})`);
      return res.json({ success: true, user: updated.rows[0], isNew: false });
    }

    // Create new user (FID can be null for regular wallet users)
    const newUser = await pool.query(
      `INSERT INTO users (fid, wallet_address, username, pfp_url, army, paper_balance)
       VALUES ($1, LOWER($2), $3, $4, $5, 10000.00)
       RETURNING *`,
      [fid, walletAddress, username || `Trader${walletAddress.slice(2, 8)}`, pfpUrl || '/battlefield-logo.jpg', army || 'bulls']
    );

    console.log(`✅ Created new user: ${newUser.rows[0].username} (FID: ${fid || 'null - regular wallet'})`);
    res.json({ success: true, user: newUser.rows[0], isNew: true });
  } catch (error) {
    console.error('Error creating/updating user:', error);
    res.status(500).json({ success: false, message: 'Failed to process user' });
  }
});

// Update existing user with Farcaster data
app.post('/api/users/update-farcaster', async (req: Request, res: Response) => {
  const { walletAddress, fid, username, pfpUrl } = req.body;

  if (!walletAddress || !fid) {
    return res.status(400).json({ 
      success: false, 
      message: 'Wallet address and FID required' 
    });
  }

  try {
    const updated = await pool.query(
      `UPDATE users 
       SET fid = $1, 
           username = $2, 
           pfp_url = $3, 
           last_active = NOW()
       WHERE LOWER(wallet_address) = LOWER($4)
       RETURNING *`,
      [fid, username, pfpUrl, walletAddress]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    console.log(`✅ Updated user with Farcaster data: ${username} (FID: ${fid})`);
    res.json({ success: true, user: updated.rows[0] });
  } catch (error) {
    console.error('Error updating user with Farcaster data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update user' 
    });
  }
});

// Get user by wallet
app.get('/api/users/:walletAddress', async (req: Request, res: Response) => {
  const { walletAddress } = req.params;

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE wallet_address = $1',
      [walletAddress]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
});

// Update user army
app.patch('/api/users/:walletAddress/army', async (req: Request, res: Response) => {
  const { walletAddress } = req.params;
  const { army } = req.body;

  if (!army || !['bears', 'bulls'].includes(army)) {
    return res.status(400).json({ success: false, message: 'Invalid army. Must be "bears" or "bulls"' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET army = $1, last_active = NOW() WHERE wallet_address = $2 RETURNING *',
      [army, walletAddress]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Error updating army:', error);
    res.status(500).json({ success: false, message: 'Failed to update army' });
  }
});

// ============================================
// PAPER MONEY CLAIM ENDPOINTS
// ============================================

// Check claim status
app.post('/api/claims/status', async (req: Request, res: Response) => {
  const { walletAddress } = req.body;

  if (!walletAddress) {
    return res.status(400).json({ success: false, message: 'Wallet address required' });
  }

  try {
    const user = await pool.query(
      'SELECT last_claim_time FROM users WHERE wallet_address = $1',
      [walletAddress]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const lastClaim = user.rows[0].last_claim_time;
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    if (!lastClaim || lastClaim < tenMinutesAgo) {
      res.json({ 
        success: true, 
        canClaim: true, 
        timeLeft: 0,
        lastClaim: lastClaim 
      });
    } else {
      const timeLeft = Math.ceil((lastClaim.getTime() + 10 * 60 * 1000 - now.getTime()) / 1000);
      res.json({ 
        success: true, 
        canClaim: false, 
        timeLeft,
        lastClaim: lastClaim 
      });
    }
  } catch (error) {
    console.error('Error checking claim status:', error);
    res.status(500).json({ success: false, message: 'Failed to check claim status' });
  }
});

// Claim paper money
app.post('/api/claims', async (req: Request, res: Response) => {
  const { walletAddress } = req.body;

  if (!walletAddress) {
    return res.status(400).json({ success: false, message: 'Wallet address required' });
  }

  try {
    // Check last claim time and balance
    const user = await pool.query(
      'SELECT id, last_claim_time, paper_balance FROM users WHERE wallet_address = $1',
      [walletAddress]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if user has any open positions
    const openPositions = await pool.query(
      'SELECT COUNT(*) as count FROM trades WHERE user_id = $1 AND status = $2',
      [user.rows[0].id, 'open']
    );

    if (openPositions.rows[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot claim while you have open positions. Close all positions first.',
        hasOpenPositions: true
      });
    }

    // Check if balance is too high
    if (user.rows[0].paper_balance >= 100) {
      return res.status(400).json({
        success: false,
        message: `Balance too high ($${user.rows[0].paper_balance}). Claims only available when balance < $100.`,
        balance: user.rows[0].paper_balance
      });
    }

    const lastClaim = user.rows[0].last_claim_time;
    const now = new Date();
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    if (lastClaim && lastClaim > tenMinutesAgo) {
      const timeLeft = Math.ceil((lastClaim.getTime() + 10 * 60 * 1000 - now.getTime()) / 1000);
      return res.status(429).json({
        success: false,
        message: `Cooldown active. ${timeLeft}s remaining.`,
        timeLeft
      });
    }

    // Add $1,000 and update claim time
    await pool.query('BEGIN');

    const updated = await pool.query(
      `UPDATE users 
       SET paper_balance = paper_balance + 1000, 
           last_claim_time = NOW(),
           last_active = NOW()
       WHERE wallet_address = $1 
       RETURNING paper_balance`,
      [walletAddress]
    );

    // Log claim
    await pool.query(
      'INSERT INTO claims (user_id, amount) VALUES ($1, 1000)',
      [user.rows[0].id]
    );

    await pool.query('COMMIT');

    res.json({ 
      success: true, 
      amount: 1000,
      newBalance: updated.rows[0].paper_balance
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error claiming paper money:', error);
    res.status(500).json({ success: false, message: 'Failed to claim paper money' });
  }
});

// ============================================
// TRADING ENDPOINTS
// ============================================

// Open trade
app.post('/api/trades/open', async (req: Request, res: Response) => {
  const { walletAddress, type, leverage, size, entryPrice } = req.body;

  if (!walletAddress || !type || !leverage || !size || !entryPrice) {
    return res.status(400).json({ 
      success: false, 
      message: 'Missing required fields' 
    });
  }

  if (!['long', 'short'].includes(type)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Type must be "long" or "short"' 
    });
  }

  if (leverage < 1 || leverage > 200) {
    return res.status(400).json({ 
      success: false, 
      message: 'Leverage must be between 1x and 200x' 
    });
  }

  try {
    // Get user
    const user = await pool.query(
      'SELECT id, paper_balance FROM users WHERE wallet_address = $1',
      [walletAddress]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.rows[0].paper_balance < size) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient balance. Available: $${user.rows[0].paper_balance}` 
      });
    }

    // Calculate trading fee (will be deducted from P&L when closing, not upfront)
    const feePercentage = leverage > 1 ? leverage * 0.05 : 0; // 2x = 0.1%, 10x = 0.5%, 50x = 2.5%, 100x = 5%, 200x = 10%
    const tradingFee = (feePercentage / 100) * size;
    
    // Check if user has enough for position size only (fee comes from P&L later)
    if (user.rows[0].paper_balance < size) {
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient balance. Available: $${user.rows[0].paper_balance}, Required: $${size.toFixed(2)}` 
      });
    }

    // Calculate liquidation price
    const liquidationPrice = type === 'long' 
      ? entryPrice * (1 - 1 / leverage)
      : entryPrice * (1 + 1 / leverage);

    await pool.query('BEGIN');

    // Deduct ONLY position size from balance (fee will be deducted from P&L when closing)
    await pool.query(
      'UPDATE users SET paper_balance = paper_balance - $1, last_active = NOW() WHERE wallet_address = $2',
      [size, walletAddress]
    );

    // Create trade
    const trade = await pool.query(
      `INSERT INTO trades (user_id, position_type, leverage, entry_price, position_size, liquidation_price, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'open')
       RETURNING *`,
      [user.rows[0].id, type, leverage, entryPrice, size, liquidationPrice]
    );

    console.log(`
🚀 Trade Opened:
- Position: ${type.toUpperCase()} ${leverage}x
- Collateral: $${size}
- Entry: $${entryPrice}
- Fee (deducted from P&L when closing): $${tradingFee.toFixed(2)} (${feePercentage.toFixed(2)}%)
- Balance Deducted: $${size.toFixed(2)} (collateral only)
    `);

    await pool.query('COMMIT');

    res.json({ success: true, trade: trade.rows[0] });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error opening trade:', error);
    res.status(500).json({ success: false, message: 'Failed to open trade' });
  }
});

// Helper function to update user's army based on P&L from longs vs shorts
async function updateUserArmy(userId: number) {
  try {
    // Get total P&L from long positions
    const longPnl = await pool.query(
      `SELECT COALESCE(SUM(pnl), 0) as total_pnl 
       FROM trades 
       WHERE user_id = $1 AND position_type = 'long' AND status IN ('closed', 'liquidated')`,
      [userId]
    );

    // Get total P&L from short positions
    const shortPnl = await pool.query(
      `SELECT COALESCE(SUM(pnl), 0) as total_pnl 
       FROM trades 
       WHERE user_id = $1 AND position_type = 'short' AND status IN ('closed', 'liquidated')`,
      [userId]
    );

    const longTotal = Number(longPnl.rows[0].total_pnl);
    const shortTotal = Number(shortPnl.rows[0].total_pnl);

    // Assign army based on which position type made more profit
    const newArmy = longTotal > shortTotal ? 'bulls' : 'bears';

    // Update user's army
    await pool.query(
      'UPDATE users SET army = $1 WHERE id = $2',
      [newArmy, userId]
    );

    console.log(`👤 User ${userId} army updated to ${newArmy.toUpperCase()} (LONG P&L: $${longTotal.toFixed(2)}, SHORT P&L: $${shortTotal.toFixed(2)})`);
    
    return newArmy;
  } catch (error) {
    console.error('Error updating user army:', error);
  }
}

// Close trade
app.post('/api/trades/close', async (req: Request, res: Response) => {
  const { tradeId, exitPrice } = req.body;

  if (!tradeId || !exitPrice) {
    return res.status(400).json({ 
      success: false, 
      message: 'Trade ID and exit price required' 
    });
  }

  try {
    await pool.query('BEGIN');

    // Get trade details
    const trade = await pool.query(
      'SELECT * FROM trades WHERE id = $1 AND status = $2',
      [tradeId, 'open']
    );

    if (trade.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ 
        success: false, 
        message: 'Trade not found or already closed' 
      });
    }

    const t = trade.rows[0];

    // Convert all numeric values from database to proper numbers
    const entryPrice = Number(t.entry_price);
    const collateral = Number(t.position_size); // This is the collateral/margin
    const leverage = Number(t.leverage);

    // Calculate leveraged position size
    const leveragedPositionSize = collateral * leverage;

    // Calculate P&L based on leveraged position
    const priceChange = t.position_type === 'long' 
      ? exitPrice - entryPrice 
      : entryPrice - exitPrice;
    
    // P&L is based on leveraged position size and price change
    const priceChangePercentage = priceChange / entryPrice;
    let pnl = priceChangePercentage * leveragedPositionSize;

    // Calculate trading fee (deducted from P&L when closing)
    const feePercentage = leverage > 1 ? leverage * 0.05 : 0;
    const tradingFee = (feePercentage / 100) * collateral;
    
    // Deduct fee from P&L (this is where fee is actually paid)
    const pnlAfterFee = pnl - tradingFee;

    // Determine if liquidated (loss + fee is greater than or equal to 100% of collateral)
    const isLiquidated = pnlAfterFee <= -collateral;
    const status = isLiquidated ? 'liquidated' : 'closed';
    const finalAmount = isLiquidated ? 0 : collateral + pnlAfterFee;

    console.log(`
📊 Trade Close Details:
- Trade ID: ${tradeId}
- Position Type: ${t.position_type}
- Entry Price: $${t.entry_price}
- Exit Price: $${exitPrice}
- Price Change: $${priceChange.toFixed(2)} (${(priceChangePercentage * 100).toFixed(2)}%)
- Leverage: ${t.leverage}x
- Collateral: $${t.position_size}
- Leveraged Position: $${leveragedPositionSize.toLocaleString()}
- P&L: $${pnl.toFixed(2)} (${((pnl / collateral) * 100).toFixed(2)}% of collateral)
- Trading Fee: $${tradingFee.toFixed(2)} (paid upfront, ${feePercentage.toFixed(2)}%)
- Final Amount: $${Number(finalAmount).toFixed(2)}
- Status: ${status}
    `);

    // Update trade (store P&L AFTER fees - this is what user actually gets/loses)
    await pool.query(
      'UPDATE trades SET exit_price = $1, pnl = $2, status = $3, closed_at = NOW() WHERE id = $4',
      [exitPrice, pnlAfterFee, status, tradeId]
    );

    // Update user balance (triggers will update stats)
    if (finalAmount > 0) {
      const balanceUpdate = await pool.query(
        'UPDATE users SET paper_balance = paper_balance + $1, last_active = NOW() WHERE id = $2 RETURNING paper_balance',
        [finalAmount, t.user_id]
      );
      console.log(`✅ Trade closed: Added $${finalAmount.toFixed(2)} back. New balance: $${balanceUpdate.rows[0].paper_balance}`);
    } else {
      await pool.query(
        'UPDATE users SET last_active = NOW() WHERE id = $1',
        [t.user_id]
      );
      console.log(`💥 Trade liquidated: $0 returned`);
    }

    // Update user's army based on P&L performance
    const updatedArmy = await updateUserArmy(t.user_id);

    await pool.query('COMMIT');

    res.json({ 
      success: true, 
      pnl,
      tradingFee,
      feePercentage,
      pnlPercentage: (pnl / collateral) * 100,
      leveragedPositionSize,
      status,
      finalAmount: Math.max(0, finalAmount),
      newBalance: finalAmount > 0 ? (await pool.query('SELECT paper_balance FROM users WHERE id = $1', [t.user_id])).rows[0].paper_balance : null,
      updatedArmy
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error closing trade:', error);
    res.status(500).json({ success: false, message: 'Failed to close trade' });
  }
});

// Get user's open trades
app.get('/api/trades/:walletAddress/open', async (req: Request, res: Response) => {
  const { walletAddress } = req.params;

  try {
    const result = await pool.query(
      `SELECT t.* 
       FROM trades t
       JOIN users u ON t.user_id = u.id
       WHERE u.wallet_address = $1 AND t.status = 'open'
       ORDER BY t.opened_at DESC`,
      [walletAddress]
    );

    res.json({ success: true, trades: result.rows });
  } catch (error) {
    console.error('Error fetching open trades:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trades' });
  }
});

// Get user's trade history
app.get('/api/trades/:walletAddress/history', async (req: Request, res: Response) => {
  const { walletAddress } = req.params;
  const limit = parseInt(req.query.limit as string) || 50;

  try {
    const result = await pool.query(
      `SELECT t.* 
       FROM trades t
       JOIN users u ON t.user_id = u.id
       WHERE u.wallet_address = $1 AND t.status IN ('closed', 'liquidated')
       ORDER BY t.closed_at DESC
       LIMIT $2`,
      [walletAddress, limit]
    );

    res.json({ success: true, trades: result.rows });
  } catch (error) {
    console.error('Error fetching trade history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch trade history' });
  }
});

// ============================================
// USER PROFILE ENDPOINT
// ============================================

// Get user profile by FID or wallet
app.get('/api/profile/:identifier', async (req: Request, res: Response) => {
  const { identifier } = req.params;
  const currentPrice = req.query.currentPrice ? Number(req.query.currentPrice) : null;

  try {
    // Check if identifier is FID (numeric) or wallet address
    const isFid = /^\d+$/.test(identifier);
    
    // Get user profile with stats
    const userQuery = isFid
      ? 'SELECT * FROM users WHERE fid = $1'
      : 'SELECT * FROM users WHERE wallet_address = $1';
    
    const userResult = await pool.query(userQuery, [identifier]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const user = userResult.rows[0];
    const userId = user.id;

    // Get ALL open positions
    const openPositions = await pool.query(
      `SELECT * FROM trades 
       WHERE user_id = $1 AND status = 'open'
       ORDER BY opened_at DESC`,
      [userId]
    );

    // Get ALL closed/liquidated positions (no pagination for recent history)
    const closedPositions = await pool.query(
      `SELECT * FROM trades 
       WHERE user_id = $1 AND status IN ('closed', 'liquidated')
       ORDER BY closed_at DESC`,
      [userId]
    );

    const totalClosedTrades = closedPositions.rows.length;

    // Calculate win rate
    const winRate = user.total_trades > 0 
      ? ((user.winning_trades / user.total_trades) * 100).toFixed(2)
      : '0.00';

    // Get user's rank
    const rankResult = await pool.query(
      `SELECT COUNT(*) + 1 as rank
       FROM users
       WHERE total_pnl > $1 AND total_trades > 0`,
      [user.total_pnl]
    );

    const profile = {
      user: {
        fid: user.fid,
        username: user.username || `Trader ${user.fid}`,
        pfp_url: user.pfp_url,
        wallet_address: user.wallet_address,
        army: user.army
      },
      stats: {
        paper_balance: Number(user.paper_balance),
        total_pnl: Number(user.total_pnl),
        total_trades: user.total_trades,
        winning_trades: user.winning_trades,
        win_rate: Number(winRate),
        current_streak: user.current_streak,
        best_streak: user.best_streak,
        times_liquidated: user.times_liquidated,
        battle_tokens_earned: user.battle_tokens_earned,
        rank: rankResult.rows[0].rank,
        last_active: user.last_active
      },
      openPositions: openPositions.rows.map(trade => {
        const entryPrice = Number(trade.entry_price);
        const collateral = Number(trade.position_size);
        const leverage = Number(trade.leverage);
        
        // Calculate current P&L if currentPrice is provided
        let current_pnl = null;
        if (currentPrice) {
          const leveragedPositionSize = collateral * leverage;
          const priceChange = trade.position_type === 'long'
            ? currentPrice - entryPrice
            : entryPrice - currentPrice;
          const priceChangePercentage = priceChange / entryPrice;
          const pnl = priceChangePercentage * leveragedPositionSize;
          
          // Deduct trading fee from P&L
          const feePercentage = leverage > 1 ? leverage * 0.05 : 0;
          const tradingFee = (feePercentage / 100) * collateral;
          current_pnl = pnl - tradingFee;
        }
        
        return {
          id: trade.id,
          position_type: trade.position_type,
          leverage: trade.leverage,
          entry_price: entryPrice,
          position_size: collateral,
          liquidation_price: Number(trade.liquidation_price),
          opened_at: trade.opened_at,
          current_pnl: current_pnl
        };
      }),
      recentHistory: closedPositions.rows.map(trade => ({
        id: trade.id,
        position_type: trade.position_type,
        leverage: trade.leverage,
        entry_price: Number(trade.entry_price),
        exit_price: Number(trade.exit_price),
        position_size: Number(trade.position_size),
        pnl: Number(trade.pnl),
        status: trade.status,
        opened_at: trade.opened_at,
        closed_at: trade.closed_at
      })),
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalRecords: totalClosedTrades,
        recordsPerPage: totalClosedTrades
      }
    };

    res.json({ success: true, profile });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user profile' 
    });
  }
});

// ============================================
// LEADERBOARD ENDPOINTS
// ============================================

// Get current leaderboard
app.get('/api/leaderboard', async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const army = req.query.army as string;

  try {
    // Calculate army dynamically based on closed positions only
    let query = `
      SELECT 
        u.id,
        u.fid,
        u.wallet_address,
        u.username,
        u.pfp_url,
        u.paper_balance,
        u.total_pnl,
        u.winning_trades,
        u.total_trades,
        u.current_streak,
        u.best_streak,
        u.times_liquidated,
        u.battle_tokens_earned,
        CASE 
          WHEN u.total_trades > 0 THEN (u.winning_trades::DECIMAL / u.total_trades::DECIMAL * 100)
          ELSE 0
        END as win_rate,
        COALESCE(long_pnl.total, 0) as long_total,
        COALESCE(short_pnl.total, 0) as short_total,
        CASE 
          WHEN COALESCE(long_pnl.total, 0) > COALESCE(short_pnl.total, 0) THEN 'bulls'
          ELSE 'bears'
        END as army
      FROM users u
      LEFT JOIN (
        SELECT user_id, SUM(pnl) as total 
        FROM trades 
        WHERE position_type = 'long' AND status IN ('closed', 'liquidated')
        GROUP BY user_id
      ) long_pnl ON u.id = long_pnl.user_id
      LEFT JOIN (
        SELECT user_id, SUM(pnl) as total 
        FROM trades 
        WHERE position_type = 'short' AND status IN ('closed', 'liquidated')
        GROUP BY user_id
      ) short_pnl ON u.id = short_pnl.user_id
      WHERE u.total_trades > 0
    `;
    
    const params: any[] = [];

    if (army && ['bears', 'bulls'].includes(army)) {
      query += ` AND (CASE 
        WHEN COALESCE(long_pnl.total, 0) > COALESCE(short_pnl.total, 0) THEN 'bulls'
        ELSE 'bears'
      END) = $1`;
      params.push(army);
    }

    query += ' ORDER BY u.total_pnl DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await pool.query(query, params);

    res.json({ success: true, leaderboard: result.rows });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch leaderboard' });
  }
});

// Get user's leaderboard rank
app.get('/api/leaderboard/rank/:walletAddress', async (req: Request, res: Response) => {
  const { walletAddress } = req.params;

  try {
    // Get the user's P&L first
    const userResult = await pool.query(
      'SELECT total_pnl FROM users WHERE wallet_address = $1',
      [walletAddress]
    );

    if (userResult.rows.length === 0) {
      return res.json({ success: true, rank: null, message: 'User not found' });
    }

    const userPnl = Number(userResult.rows[0].total_pnl);

    // Count how many users have higher P&L
    const rankResult = await pool.query(
      'SELECT COUNT(*) + 1 as rank FROM users WHERE total_pnl > $1',
      [userPnl]
    );

    res.json({ success: true, rank: Number(rankResult.rows[0].rank) });
  } catch (error) {
    console.error('Error fetching user rank:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch rank' });
  }
});

// ============================================
// ARMY STATS ENDPOINTS
// ============================================

// Get army stats
app.get('/api/army/stats', async (req: Request, res: Response) => {
  try {
    // Calculate next Monday for weekly snapshot
    const getNextMonday = () => {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek); // Days until next Monday
      
      const nextMonday = new Date(now);
      nextMonday.setDate(now.getDate() + daysUntilMonday);
      nextMonday.setHours(12, 0, 0, 0); // Set to 12:00 PM (noon) on Monday
      
      return nextMonday;
    };

    // Get last Monday (beginning of current week)
    const getLastMonday = () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Days since last Monday
      
      const lastMonday = new Date(now);
      lastMonday.setDate(now.getDate() - daysToSubtract);
      lastMonday.setHours(12, 0, 0, 0); // Set to 12:00 PM (noon) on Monday
      
      return lastMonday;
    };

    const weekStart = getLastMonday();
    const weekEnd = getNextMonday();

    // Calculate army membership dynamically based on ALL closed positions (not just this week)
    // Then sum only THIS WEEK's positive P&L for each army
    
    // For Bulls Army: Users where long P&L > short P&L
    const bullsStats = await pool.query(
      `WITH user_armies AS (
        SELECT 
          u.id,
          COALESCE(long_pnl.total, 0) as long_total,
          COALESCE(short_pnl.total, 0) as short_total,
          CASE 
            WHEN COALESCE(long_pnl.total, 0) > COALESCE(short_pnl.total, 0) THEN 'bulls'
            ELSE 'bears'
          END as calculated_army
        FROM users u
        LEFT JOIN (
          SELECT user_id, SUM(pnl) as total 
          FROM trades 
          WHERE position_type = 'long' AND status IN ('closed', 'liquidated')
          GROUP BY user_id
        ) long_pnl ON u.id = long_pnl.user_id
        LEFT JOIN (
          SELECT user_id, SUM(pnl) as total 
          FROM trades 
          WHERE position_type = 'short' AND status IN ('closed', 'liquidated')
          GROUP BY user_id
        ) short_pnl ON u.id = short_pnl.user_id
        WHERE u.total_trades > 0
      )
      SELECT 
        COUNT(DISTINCT ua.id) as player_count,
        COALESCE(SUM(CASE WHEN t.pnl > 0 THEN t.pnl ELSE 0 END), 0) as total_pnl
      FROM user_armies ua
      LEFT JOIN trades t ON ua.id = t.user_id 
        AND t.position_type = 'long' 
        AND t.status IN ('closed', 'liquidated')
        AND t.closed_at >= $1
        AND t.closed_at < $2
      WHERE ua.calculated_army = 'bulls'`,
      [weekStart, weekEnd]
    );

    // For Bears Army: Users where short P&L >= long P&L
    const bearsStats = await pool.query(
      `WITH user_armies AS (
        SELECT 
          u.id,
          COALESCE(long_pnl.total, 0) as long_total,
          COALESCE(short_pnl.total, 0) as short_total,
          CASE 
            WHEN COALESCE(long_pnl.total, 0) > COALESCE(short_pnl.total, 0) THEN 'bulls'
            ELSE 'bears'
          END as calculated_army
        FROM users u
        LEFT JOIN (
          SELECT user_id, SUM(pnl) as total 
          FROM trades 
          WHERE position_type = 'long' AND status IN ('closed', 'liquidated')
          GROUP BY user_id
        ) long_pnl ON u.id = long_pnl.user_id
        LEFT JOIN (
          SELECT user_id, SUM(pnl) as total 
          FROM trades 
          WHERE position_type = 'short' AND status IN ('closed', 'liquidated')
          GROUP BY user_id
        ) short_pnl ON u.id = short_pnl.user_id
        WHERE u.total_trades > 0
      )
      SELECT 
        COUNT(DISTINCT ua.id) as player_count,
        COALESCE(SUM(CASE WHEN t.pnl > 0 THEN t.pnl ELSE 0 END), 0) as total_pnl
      FROM user_armies ua
      LEFT JOIN trades t ON ua.id = t.user_id 
        AND t.position_type = 'short' 
        AND t.status IN ('closed', 'liquidated')
        AND t.closed_at >= $1
        AND t.closed_at < $2
      WHERE ua.calculated_army = 'bears'`,
      [weekStart, weekEnd]
    );

    const stats = {
      bulls: {
        totalPnl: Number(bullsStats.rows[0].total_pnl),
        playerCount: Number(bullsStats.rows[0].player_count)
      },
      bears: {
        totalPnl: Number(bearsStats.rows[0].total_pnl),
        playerCount: Number(bearsStats.rows[0].player_count)
      },
      weekEndsAt: weekEnd.toISOString()
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching army stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch army stats' });
  }
});

// ============================================
// ADMIN ENDPOINTS
// ============================================

// Update a specific user's Farcaster profile data
app.post('/api/admin/update-user-profile', async (req: Request, res: Response) => {
  const { walletAddress, fid, username, pfpUrl } = req.body;

  if (!walletAddress || !fid || !username) {
    return res.status(400).json({ 
      success: false, 
      message: 'Wallet address, FID, and username required' 
    });
  }

  try {
    const updated = await pool.query(
      `UPDATE users 
       SET fid = $1, 
           username = $2, 
           pfp_url = $3,
           last_active = NOW()
       WHERE LOWER(wallet_address) = LOWER($4)
       RETURNING *`,
      [fid, username, pfpUrl, walletAddress]
    );

    if (updated.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    console.log(`✅ Admin updated user: ${username} (FID: ${fid}) for wallet ${walletAddress}`);
    res.json({ success: true, user: updated.rows[0] });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ success: false, message: 'Failed to update user profile' });
  }
});

// Recalculate all user armies based on closed positions
app.post('/api/admin/recalculate-armies', async (req: Request, res: Response) => {
  try {
    // Get all users
    const users = await pool.query('SELECT id FROM users');
    
    let updated = 0;
    for (const user of users.rows) {
      await updateUserArmy(user.id);
      updated++;
    }

    res.json({ 
      success: true, 
      message: `Successfully recalculated armies for ${updated} users` 
    });
  } catch (error) {
    console.error('Error recalculating armies:', error);
    res.status(500).json({ success: false, message: 'Failed to recalculate armies' });
  }
});

// Fix all user balances based on actual trade history  
app.post('/api/admin/fix-balances', async (req: Request, res: Response) => {
  try {
    // Recalculate balances for all users
    // NEW SYSTEM: Fees are deducted from P&L when closing, NOT when opening
    await pool.query(`
      UPDATE users u
      SET paper_balance = (
        -- Starting balance
        10000.00 + 
        
        -- Add all claims
        COALESCE((
          SELECT SUM(amount) 
          FROM claims 
          WHERE user_id = u.id
        ), 0) +
        
        -- Add net P&L from all closed/liquidated trades (fees already deducted from P&L)
        COALESCE((
          SELECT SUM(pnl) 
          FROM trades 
          WHERE user_id = u.id 
          AND status IN ('closed', 'liquidated')
        ), 0) -
        
        -- Subtract ONLY collateral locked in open positions (fees NOT deducted upfront anymore)
        COALESCE((
          SELECT SUM(position_size)
          FROM trades 
          WHERE user_id = u.id 
          AND status = 'open'
        ), 0)
      );
    `);

    // Get updated results
    const results = await pool.query(`
      SELECT 
        u.fid,
        u.username,
        u.paper_balance as new_balance,
        u.total_pnl,
        (SELECT COUNT(*) FROM trades WHERE user_id = u.id AND status = 'open') as open_positions,
        (SELECT COUNT(*) FROM trades WHERE user_id = u.id AND status IN ('closed', 'liquidated')) as closed_trades
      FROM users u
      WHERE u.total_trades > 0
      ORDER BY u.total_pnl DESC
    `);

    res.json({ 
      success: true, 
      message: `Successfully recalculated balances for ${results.rows.length} users`,
      users: results.rows
    });
  } catch (error) {
    console.error('Error fixing balances:', error);
    res.status(500).json({ success: false, message: 'Failed to fix balances' });
  }
});

// ============================================
// SYSTEM CONFIG ENDPOINTS
// ============================================

// Get system config
app.get('/api/config', async (req: Request, res: Response) => {
  try {
    const result = await pool.query('SELECT * FROM system_config');
    
    const config: Record<string, string> = {};
    result.rows.forEach(row => {
      config[row.key] = row.value;
    });

    res.json({ success: true, config });
  } catch (error) {
    console.error('Error fetching config:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch config' });
  }
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    success: false, 
    message: 'Endpoint not found' 
  });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
    ⚔️  BATTLEFIELD API Server
    🐻 Bears vs Bulls 🐂
    
    ✅ Server running on port ${PORT}
    🗄️  Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}
    🌍 Environment: ${process.env.NODE_ENV || 'development'}
    
    📡 API Endpoints:
    - GET  /health
    - POST /api/users
    - GET  /api/users/:walletAddress
    - POST /api/claims
    - POST /api/claims/status
    - POST /api/trades/open
    - POST /api/trades/close
    - GET  /api/trades/:walletAddress/open
    - GET  /api/profile/:identifier (FID or wallet)
    - GET  /api/leaderboard
    - GET  /api/army/stats
    - GET  /api/config
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

export default app;
    console.log('Database pool closed');
