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

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error connecting to database:', err.stack);
  } else {
    console.log('✅ Connected to PostgreSQL database');
    release();
  }
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

  if (!fid || !walletAddress) {
    return res.status(400).json({ success: false, message: 'FID and wallet address required' });
  }

  try {
    // Check if user exists
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE fid = $1 OR wallet_address = $2',
      [fid, walletAddress]
    );

    if (existingUser.rows.length > 0) {
      // Update existing user
      const updated = await pool.query(
        `UPDATE users 
         SET username = COALESCE($1, username),
             pfp_url = COALESCE($2, pfp_url),
             army = COALESCE($3, army),
             last_active = NOW()
         WHERE fid = $4
         RETURNING *`,
        [username, pfpUrl, army, fid]
      );
      return res.json({ success: true, user: updated.rows[0], isNew: false });
    }

    // Create new user
    const newUser = await pool.query(
      `INSERT INTO users (fid, wallet_address, username, pfp_url, army, paper_balance)
       VALUES ($1, $2, $3, $4, $5, 10000.00)
       RETURNING *`,
      [fid, walletAddress, username, pfpUrl, army || 'bulls']
    );

    res.json({ success: true, user: newUser.rows[0], isNew: true });
  } catch (error) {
    console.error('Error creating/updating user:', error);
    res.status(500).json({ success: false, message: 'Failed to process user' });
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
    // Check last claim time
    const user = await pool.query(
      'SELECT id, last_claim_time, paper_balance FROM users WHERE wallet_address = $1',
      [walletAddress]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
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

  if (leverage < 1 || leverage > 100) {
    return res.status(400).json({ 
      success: false, 
      message: 'Leverage must be between 1x and 100x' 
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

    // Calculate liquidation price
    const liquidationPrice = type === 'long' 
      ? entryPrice * (1 - 1 / leverage)
      : entryPrice * (1 + 1 / leverage);

    await pool.query('BEGIN');

    // Deduct from balance
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

    await pool.query('COMMIT');

    res.json({ success: true, trade: trade.rows[0] });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error opening trade:', error);
    res.status(500).json({ success: false, message: 'Failed to open trade' });
  }
});

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

    // Calculate P&L
    const priceChange = t.position_type === 'long' 
      ? exitPrice - t.entry_price 
      : t.entry_price - exitPrice;
    const pnlPercentage = (priceChange / t.entry_price) * t.leverage;
    let pnl = pnlPercentage * t.position_size;

    // Calculate trading fee based on leverage (0.1% per 1x leverage, minimum 0% for 1x)
    const feePercentage = t.leverage > 1 ? t.leverage * 0.1 : 0; // 2x = 0.2%, 10x = 1%, 50x = 5%, 100x = 10%
    const tradingFee = (feePercentage / 100) * t.position_size;
    
    // Apply fee to P&L
    const pnlAfterFee = pnl - tradingFee;

    // Determine if liquidated
    const isLiquidated = pnlAfterFee <= -t.position_size;
    const status = isLiquidated ? 'liquidated' : 'closed';
    const finalAmount = isLiquidated ? 0 : t.position_size + pnlAfterFee;

    // Update trade
    await pool.query(
      'UPDATE trades SET exit_price = $1, pnl = $2, status = $3, closed_at = NOW() WHERE id = $4',
      [exitPrice, pnl, status, tradeId]
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

    await pool.query('COMMIT');

    res.json({ 
      success: true, 
      pnl,
      pnlAfterFee,
      tradingFee,
      feePercentage,
      pnlPercentage: pnlPercentage * 100,
      status,
      finalAmount: Math.max(0, finalAmount),
      newBalance: finalAmount > 0 ? (await pool.query('SELECT paper_balance FROM users WHERE id = $1', [t.user_id])).rows[0].paper_balance : null
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
// LEADERBOARD ENDPOINTS
// ============================================

// Get current leaderboard
app.get('/api/leaderboard', async (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 100;
  const army = req.query.army as string;

  try {
    let query = 'SELECT * FROM current_leaderboard';
    const params: any[] = [];

    if (army && ['bears', 'bulls'].includes(army)) {
      query += ' WHERE army = $1';
      params.push(army);
    }

    query += ' LIMIT $' + (params.length + 1);
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
    const result = await pool.query(
      `SELECT 
        ROW_NUMBER() OVER (ORDER BY score DESC) as rank,
        *
       FROM current_leaderboard
       WHERE wallet_address = $1`,
      [walletAddress]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, rank: null, message: 'User not on leaderboard yet' });
    }

    res.json({ success: true, rank: result.rows[0].rank, user: result.rows[0] });
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
    const result = await pool.query('SELECT * FROM army_stats ORDER BY army');

    const stats = {
      bears: result.rows.find(r => r.army === 'bears'),
      bulls: result.rows.find(r => r.army === 'bulls')
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching army stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch army stats' });
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
