// BATTLEFIELD Backend API Server
// Bears 🐻 vs Bulls 🐂 Paper Trading Game
// Fixed: Auto-create users when opening positions

// Import and initialize Sentry FIRST, before any other imports
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: "https://829222b2bf1c24e1135948d3d605ef2a@o4510706963251200.ingest.us.sentry.io/4510706982060032",
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV || "development",
  serverName: process.env.RAILWAY_SERVICE_NAME || "battlefield-backend",
});

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import cron from 'node-cron';
import rateLimit from 'express-rate-limit';
import { NeynarAPIClient, Configuration } from '@neynar/nodejs-sdk';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Neynar client for Farcaster API (follow verification)
let neynarClient: NeynarAPIClient | null = null;
if (process.env.NEYNAR_API_KEY) {
  const config = new Configuration({ apiKey: process.env.NEYNAR_API_KEY });
  neynarClient = new NeynarAPIClient(config);
  console.log('✅ Neynar client initialized for Farcaster verification');
} else {
  console.warn('⚠️ NEYNAR_API_KEY not set - follow verification disabled');
}

// Target accounts to follow for missions (FIDs will be fetched dynamically)
const TARGET_FOLLOW_USERNAMES = ['btcbattle', 'elalpha.eth'];

// Cache for target account FIDs (to avoid repeated lookups)
const targetFidCache: Map<string, { fid: number; cachedAt: number }> = new Map();
const FID_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Rate limiting for follow verification (1 attempt per 5 minutes per user)
const verifyRateLimitCache: Map<number, number> = new Map(); // userId -> lastAttemptTimestamp
const VERIFY_RATE_LIMIT_MS = 5 * 60 * 1000; // 5 minutes

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
  
  // Auto-run volume tracking migration
  try {
    console.log('📊 Checking volume tracking...');
    
    // Check if total_volume column exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'total_volume'
    `);
    
    if (columnCheck.rows.length === 0) {
      console.log('🚀 Adding volume tracking...');
      
      // Add total_volume column
      await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS total_volume DECIMAL(18, 2) DEFAULT 0.00');
      
      // Backfill existing volumes
      await client.query(`
        UPDATE users u
        SET total_volume = COALESCE(
          (SELECT SUM(position_size * leverage) 
           FROM trades 
           WHERE user_id = u.id 
           AND status IN ('closed', 'liquidated')),
          0
        )
      `);
      
      // Create index
      await client.query('CREATE INDEX IF NOT EXISTS idx_users_volume ON users(total_volume DESC)');
      
      console.log('✅ Volume tracking added and backfilled successfully!');
    } else {
      console.log('✅ Volume tracking already enabled');
    }
  } catch (volumeError) {
    console.error('⚠️  Volume tracking setup failed (non-critical):', volumeError);
  }

  // Auto-fix sequence mismatches to prevent "duplicate key" errors
  try {
    console.log('🔧 Checking database sequences...');

    const tables = ['trades', 'users', 'referrals'];
    let fixedCount = 0;

    for (const table of tables) {
      const seqName = `${table}_id_seq`;

      // Check if sequence exists
      const seqExists = await client.query(
        `SELECT EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = $1)`,
        [seqName]
      );

      if (seqExists.rows[0].exists) {
        // Get max ID and current sequence value
        const maxResult = await client.query(`SELECT COALESCE(MAX(id), 0) as max_id FROM ${table}`);
        const seqResult = await client.query(`SELECT last_value FROM ${seqName}`);

        const maxId = parseInt(maxResult.rows[0].max_id);
        const seqVal = parseInt(seqResult.rows[0].last_value);

        if (maxId >= seqVal) {
          const newVal = maxId + 1;
          await client.query(`SELECT setval($1, $2, false)`, [seqName, newVal]);
          console.log(`   ✅ ${table}: sequence reset from ${seqVal} to ${newVal}`);
          fixedCount++;
        }
      }
    }

    if (fixedCount > 0) {
      console.log(`✅ Fixed ${fixedCount} sequence(s)`);
    } else {
      console.log('✅ All sequences OK');
    }
  } catch (seqError) {
    console.error('⚠️  Sequence check failed (non-critical):', seqError);
  }

  release();
});

// CORS Configuration - Restrict to specific origins
const allowedOrigins = [
  'http://localhost:3000',                    // Local development
  'https://battlefield-roan.vercel.app',      // Vercel production (legacy)
  'https://btcbattlefield.com',               // Production VPS
  'https://www.btcbattlefield.com',           // Production VPS (www)
  'https://warpcast.com',                     // Warpcast origin
  'https://client.warpcast.com',              // Warpcast client
  process.env.FRONTEND_URL,                   // Custom domain (env override)
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, same-origin)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Rate limiters
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.headers['x-real-ip'] as string || req.ip || 'unknown'
});

const tradingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute for trading
  message: { error: 'Too many trading requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.headers['x-real-ip'] as string || req.ip || 'unknown'
});

const claimLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute for claims
  message: { error: 'Too many claim requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.headers['x-real-ip'] as string || req.ip || 'unknown'
});

// Apply general rate limit to all API routes
app.use('/api/', generalLimiter);

// ============================================
// MAINTENANCE MODE
// ============================================
// In-memory maintenance state (persisted in database for restarts)
let maintenanceMode = {
  enabled: false,
  message: 'Trading is temporarily disabled for scheduled maintenance.',
  enabledAt: null as Date | null,
  enabledBy: null as string | null,
  estimatedEndTime: null as Date | null
};

// Load maintenance mode from database on startup
(async () => {
  try {
    // Create maintenance_settings table if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS maintenance_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        enabled BOOLEAN DEFAULT false,
        message TEXT DEFAULT 'Trading is temporarily disabled for scheduled maintenance.',
        enabled_at TIMESTAMP,
        enabled_by TEXT,
        estimated_end_time TIMESTAMP,
        CONSTRAINT single_row CHECK (id = 1)
      )
    `);

    // Insert default row if not exists
    await pool.query(`
      INSERT INTO maintenance_settings (id, enabled) VALUES (1, false)
      ON CONFLICT (id) DO NOTHING
    `);

    // Load current state
    const result = await pool.query('SELECT * FROM maintenance_settings WHERE id = 1');
    if (result.rows.length > 0) {
      const row = result.rows[0];
      maintenanceMode = {
        enabled: row.enabled,
        message: row.message,
        enabledAt: row.enabled_at,
        enabledBy: row.enabled_by,
        estimatedEndTime: row.estimated_end_time
      };
      if (maintenanceMode.enabled) {
        console.log('⚠️ MAINTENANCE MODE IS ACTIVE');
      }
    }
  } catch (err) {
    console.error('Failed to load maintenance settings:', err);
  }
})();

// Middleware to check maintenance mode for trading endpoints
const checkMaintenance = (req: Request, res: Response, next: NextFunction) => {
  if (maintenanceMode.enabled) {
    return res.status(503).json({
      success: false,
      error: 'MAINTENANCE_MODE',
      message: maintenanceMode.message,
      estimatedEndTime: maintenanceMode.estimatedEndTime
    });
  }
  next();
};

// Admin audit logging
const auditLog = (action: string, details: Record<string, unknown>, ip: string, success: boolean) => {
  const entry = {
    timestamp: new Date().toISOString(),
    type: 'ADMIN_AUDIT',
    action,
    ip,
    success,
    details
  };
  console.log(JSON.stringify(entry));
};

// Admin authentication middleware
const adminAuth = (req: Request, res: Response, next: NextFunction) => {
  const adminKey = req.headers['x-admin-key'];
  const ip = req.headers['x-real-ip'] as string || req.ip || 'unknown';

  if (!process.env.ADMIN_API_KEY) {
    auditLog('AUTH_FAILURE', { reason: 'ADMIN_API_KEY not configured', path: req.path }, ip, false);
    console.error('ADMIN_API_KEY environment variable not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }
  if (adminKey !== process.env.ADMIN_API_KEY) {
    auditLog('AUTH_FAILURE', { reason: 'Invalid API key', path: req.path }, ip, false);
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Attach IP to request for use in endpoint logging
  (req as any).adminIp = ip;
  auditLog('AUTH_SUCCESS', { path: req.path }, ip, true);
  next();
};

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

// Helper: Generate referral code from username
function generateReferralCode(username: string, fid?: number | null): string {
  // Start with username
  let name = (username || '').toLowerCase();

  // Strip common ENS suffixes (e.g., elalpha.eth -> elalpha, name.base.eth -> name)
  name = name.replace(/\.base\.eth$/, '').replace(/\.eth$/, '');

  // Clean: alphanumeric only, max 20 chars
  const clean = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
  if (clean.length >= 3) return `${clean}.battle`;
  // Fallback to FID
  if (fid) return `soldier${fid}.battle`;
  // Last resort: random
  return `soldier${Math.random().toString(36).slice(2, 8)}.battle`;
}

// Get or create user
app.post('/api/users', async (req: Request, res: Response) => {
  const { fid, walletAddress, username, pfpUrl, army, referralCode } = req.body;

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

    // Check for valid referrer (if referral code provided)
    // ANTI-EXPLOIT: Both referrer and new user must have Farcaster FID
    let referrerId: number | null = null;
    if (referralCode) {
      // Only process referral if new user has a Farcaster FID
      if (!fid) {
        console.log(`⚠️ Referral code ignored - new user has no Farcaster FID`);
      } else {
        const referrerResult = await pool.query(
          'SELECT id, username, fid FROM users WHERE LOWER(referral_code) = LOWER($1)',
          [referralCode]
        );
        if (referrerResult.rows.length > 0) {
          // Only allow if referrer also has a Farcaster FID
          if (referrerResult.rows[0].fid) {
            referrerId = referrerResult.rows[0].id;
            console.log(`🔗 New user referred by: ${referrerResult.rows[0].username}`);
          } else {
            console.log(`⚠️ Referral code ignored - referrer has no Farcaster FID`);
          }
        } else {
          console.log(`⚠️ Invalid referral code: ${referralCode}`);
        }
      }
    }

    // Generate referral code for new user
    const finalUsername = username || `Trader${walletAddress.slice(2, 8)}`;
    const newUserReferralCode = generateReferralCode(finalUsername, fid);

    // Create new user (FID can be null for regular wallet users)
    const newUser = await pool.query(
      `INSERT INTO users (fid, wallet_address, username, pfp_url, army, paper_balance, referral_code, referred_by)
       VALUES ($1, LOWER($2), $3, $4, $5, 10000.00, $6, $7)
       RETURNING *`,
      [fid, walletAddress, finalUsername, pfpUrl || '/battlefield-logo.jpg', army || 'bulls', newUserReferralCode, referrerId]
    );

    // If referred, create pending referral entry
    if (referrerId) {
      await pool.query(
        `INSERT INTO referrals (referrer_id, referred_user_id, status)
         VALUES ($1, $2, 'pending')
         ON CONFLICT (referred_user_id) DO NOTHING`,
        [referrerId, newUser.rows[0].id]
      );
      console.log(`📝 Created pending referral: referrer ${referrerId} → new user ${newUser.rows[0].id}`);
    }

    console.log(`✅ Created new user: ${newUser.rows[0].username} (FID: ${fid || 'null - regular wallet'}, Referral Code: ${newUserReferralCode})`);
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
      'SELECT * FROM users WHERE LOWER(wallet_address) = LOWER($1)',
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

// ============================================
// REFERRAL ENDPOINTS
// ============================================

// Get user's referral stats
app.get('/api/referrals/:walletAddress', async (req: Request, res: Response) => {
  const { walletAddress } = req.params;

  try {
    // Get user and their referral info, including who referred them
    const userResult = await pool.query(
      `SELECT u.id, u.username, u.referral_code, u.referral_count, u.referral_earnings, u.referred_by,
              referrer.username as referred_by_username, referrer.pfp_url as referred_by_pfp
       FROM users u
       LEFT JOIN users referrer ON referrer.id = u.referred_by
       WHERE LOWER(u.wallet_address) = LOWER($1)`,
      [walletAddress]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get list of referred users (as referrer)
    const referralsResult = await pool.query(
      `SELECT u.username, u.pfp_url, r.status, r.created_at, r.completed_at, r.referrer_claimed
       FROM referrals r
       JOIN users u ON u.id = r.referred_user_id
       WHERE r.referrer_id = $1
       ORDER BY r.created_at DESC
       LIMIT 20`,
      [user.id]
    );

    // Check for claimable rewards as referrer (users this person referred who traded)
    const claimableAsReferrerResult = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(r.referrer_reward), 0) as total_reward
       FROM referrals r
       WHERE r.referrer_id = $1 AND r.status = 'claimable' AND r.referrer_claimed = false`,
      [user.id]
    );

    // Check for claimable rewards as referred user (this person was referred and traded)
    const claimableAsReferredResult = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(r.referred_reward), 0) as total_reward
       FROM referrals r
       WHERE r.referred_user_id = $1 AND r.status = 'claimable' AND r.referred_claimed = false`,
      [user.id]
    );

    // Check for pending referral (user was referred but hasn't traded yet)
    const pendingReferralResult = await pool.query(
      `SELECT r.id, r.referred_reward, u.username as referrer_username
       FROM referrals r
       JOIN users u ON u.id = r.referrer_id
       WHERE r.referred_user_id = $1 AND r.status = 'pending'`,
      [user.id]
    );

    const claimableAsReferrer = {
      count: Number(claimableAsReferrerResult.rows[0].count),
      amount: Number(claimableAsReferrerResult.rows[0].total_reward) / 100 // cents to dollars
    };

    const claimableAsReferred = {
      count: Number(claimableAsReferredResult.rows[0].count),
      amount: Number(claimableAsReferredResult.rows[0].total_reward) / 100 // cents to dollars
    };

    const totalClaimable = claimableAsReferrer.amount + claimableAsReferred.amount;

    // Pending referral info (user needs to make first trade)
    const pendingReferral = pendingReferralResult.rows.length > 0 ? {
      amount: Number(pendingReferralResult.rows[0].referred_reward) / 100,
      referrerUsername: pendingReferralResult.rows[0].referrer_username
    } : null;

    res.json({
      success: true,
      referralCode: user.referral_code,
      referralCount: user.referral_count || 0,
      referralEarnings: Number(user.referral_earnings || 0) / 100, // Convert cents to dollars
      referrals: referralsResult.rows,
      // Info about who referred this user (if anyone)
      referredBy: user.referred_by ? {
        username: user.referred_by_username,
        pfpUrl: user.referred_by_pfp
      } : null,
      // Claimable rewards info
      claimable: {
        asReferrer: claimableAsReferrer,
        asReferred: claimableAsReferred,
        total: totalClaimable
      },
      // Pending referral (awaiting first trade)
      pendingReferral
    });
  } catch (error) {
    console.error('Error fetching referral stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch referral stats' });
  }
});

// Apply referral code to existing user (manual entry)
app.post('/api/referrals/apply', checkMaintenance, async (req: Request, res: Response) => {
  const { walletAddress, referralCode } = req.body;

  if (!walletAddress || !referralCode) {
    return res.status(400).json({ success: false, message: 'Wallet address and referral code required' });
  }

  try {
    // Get the user
    const userResult = await pool.query(
      'SELECT id, username, referred_by, total_trades, fid FROM users WHERE LOWER(wallet_address) = LOWER($1)',
      [walletAddress]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];

    // ANTI-EXPLOIT: Require the referred user to have a valid Farcaster FID
    if (!user.fid) {
      return res.status(400).json({
        success: false,
        message: 'Referrals are only available for Farcaster users. Please connect your Farcaster account first.'
      });
    }

    // Check if already referred
    if (user.referred_by) {
      return res.status(400).json({
        success: false,
        message: 'You have already been referred by someone'
      });
    }

    // Look up the referrer by their referral code
    const referrerResult = await pool.query(
      'SELECT id, username, pfp_url, fid FROM users WHERE LOWER(referral_code) = LOWER($1)',
      [referralCode.trim()]
    );

    if (referrerResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invalid referral code. Please check and try again.'
      });
    }

    const referrer = referrerResult.rows[0];

    // ANTI-EXPLOIT: Require the referrer to also have a valid Farcaster FID
    if (!referrer.fid) {
      return res.status(400).json({
        success: false,
        message: 'This referral code is invalid. The referrer must have a Farcaster account.'
      });
    }

    // Prevent self-referral
    if (referrer.id === user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot use your own referral code'
      });
    }

    // Check if referral already exists (shouldn't happen but safety check)
    const existingReferral = await pool.query(
      'SELECT id FROM referrals WHERE referred_user_id = $1',
      [user.id]
    );

    if (existingReferral.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A referral record already exists for your account'
      });
    }

    // Create the referral relationship
    await pool.query(
      'UPDATE users SET referred_by = $1 WHERE id = $2',
      [referrer.id, user.id]
    );

    // Create referral record with pending status
    // Reward amounts stored in cents (500000 cents = $5,000)
    const REFERRAL_REWARD_CENTS = 500000;
    const REFERRAL_REWARD_DOLLARS = REFERRAL_REWARD_CENTS / 100; // $5,000

    await pool.query(
      `INSERT INTO referrals (referrer_id, referred_user_id, status, referrer_reward, referred_reward)
       VALUES ($1, $2, 'pending', $3, $3)`,
      [referrer.id, user.id, REFERRAL_REWARD_CENTS]
    );

    console.log(`🔗 Referral code applied: ${user.username} used code from ${referrer.username}`);

    // If user has already made trades, mark as claimable immediately
    if (user.total_trades > 0) {
      await pool.query(
        `UPDATE referrals SET status = 'claimable'
         WHERE referrer_id = $1 AND referred_user_id = $2`,
        [referrer.id, user.id]
      );

      console.log(`🎁 Referral now claimable (user already traded): ${referrer.username} & ${user.username}`);

      return res.json({
        success: true,
        message: 'Referral applied! Go to the Referrals section to claim your $5,000 bonus!',
        referredBy: {
          username: referrer.username,
          pfpUrl: referrer.pfp_url
        },
        claimable: true,
        bonusAmount: 5000
      });
    }

    res.json({
      success: true,
      message: 'Referral code applied! Open your first trade to unlock $5,000 for both of you!',
      referredBy: {
        username: referrer.username,
        pfpUrl: referrer.pfp_url
      },
      claimable: false
    });
  } catch (error) {
    console.error('Error applying referral code:', error);
    res.status(500).json({ success: false, message: 'Failed to apply referral code' });
  }
});

// Claim referral reward
app.post('/api/referrals/claim', checkMaintenance, async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ success: false, message: 'Wallet address is required' });
    }

    // Get user
    const userResult = await pool.query(
      'SELECT id, username, fid FROM users WHERE LOWER(wallet_address) = LOWER($1)',
      [walletAddress]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];

    // ANTI-EXPLOIT: Require Farcaster FID to claim referral rewards
    if (!user.fid) {
      return res.status(400).json({
        success: false,
        message: 'Referral rewards are only available for Farcaster users.'
      });
    }

    // Check if user has a claimable referral (either as referrer or referred)
    // First check as referred user
    const asReferredResult = await pool.query(
      `SELECT r.id, r.referrer_id, r.referred_reward, r.referrer_claimed, r.referred_claimed,
              u.username as referrer_username
       FROM referrals r
       JOIN users u ON u.id = r.referrer_id
       WHERE r.referred_user_id = $1 AND r.status = 'claimable' AND r.referred_claimed = false`,
      [user.id]
    );

    // Then check as referrer
    const asReferrerResult = await pool.query(
      `SELECT r.id, r.referred_user_id, r.referrer_reward, r.referrer_claimed, r.referred_claimed,
              u.username as referred_username
       FROM referrals r
       JOIN users u ON u.id = r.referred_user_id
       WHERE r.referrer_id = $1 AND r.status = 'claimable' AND r.referrer_claimed = false`,
      [user.id]
    );

    let totalClaimed = 0;
    const claimedReferrals: any[] = [];

    // Process claims as referred user
    for (const referral of asReferredResult.rows) {
      const rewardDollars = Number(referral.referred_reward) / 100;

      await pool.query(
        'UPDATE users SET paper_balance = paper_balance + $1 WHERE id = $2',
        [rewardDollars, user.id]
      );

      await pool.query(
        'UPDATE referrals SET referred_claimed = true WHERE id = $1',
        [referral.id]
      );

      // Check if both have claimed, then mark as completed
      if (referral.referrer_claimed) {
        await pool.query(
          `UPDATE referrals SET status = 'completed', completed_at = NOW() WHERE id = $1`,
          [referral.id]
        );
      }

      totalClaimed += rewardDollars;
      claimedReferrals.push({
        type: 'referred',
        referrerUsername: referral.referrer_username,
        amount: rewardDollars
      });

      console.log(`🎉 User ${user.username} claimed $${rewardDollars} referral bonus (referred by ${referral.referrer_username})`);
    }

    // Process claims as referrer
    for (const referral of asReferrerResult.rows) {
      const rewardDollars = Number(referral.referrer_reward) / 100;

      await pool.query(
        'UPDATE users SET paper_balance = paper_balance + $1, referral_count = referral_count + 1, referral_earnings = referral_earnings + $2 WHERE id = $3',
        [rewardDollars, referral.referrer_reward, user.id]
      );

      await pool.query(
        'UPDATE referrals SET referrer_claimed = true WHERE id = $1',
        [referral.id]
      );

      // Check if both have claimed, then mark as completed
      if (referral.referred_claimed) {
        await pool.query(
          `UPDATE referrals SET status = 'completed', completed_at = NOW() WHERE id = $1`,
          [referral.id]
        );
      }

      totalClaimed += rewardDollars;
      claimedReferrals.push({
        type: 'referrer',
        referredUsername: referral.referred_username,
        amount: rewardDollars
      });

      console.log(`🎉 User ${user.username} claimed $${rewardDollars} referral bonus (for referring ${referral.referred_username})`);
    }

    if (totalClaimed === 0) {
      return res.status(400).json({
        success: false,
        message: 'No claimable referral rewards found'
      });
    }

    // Get updated balance
    const updatedUser = await pool.query(
      'SELECT paper_balance FROM users WHERE id = $1',
      [user.id]
    );

    res.json({
      success: true,
      message: `Successfully claimed $${totalClaimed.toLocaleString()} in referral rewards!`,
      totalClaimed,
      claimedReferrals,
      newBalance: Number(updatedUser.rows[0].paper_balance)
    });
  } catch (error) {
    console.error('Error claiming referral reward:', error);
    res.status(500).json({ success: false, message: 'Failed to claim referral reward' });
  }
});

// Admin: Get referral analytics
app.get('/api/admin/referrals', async (req: Request, res: Response) => {
  try {
    // Overall stats
    const statsResult = await pool.query(`
      SELECT
        COUNT(*) as total_referrals,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_referrals,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_referrals,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN referrer_reward + referred_reward ELSE 0 END), 0) as total_rewards_cents
      FROM referrals
    `);

    // Top referrers
    const topReferrersResult = await pool.query(`
      SELECT u.username, u.pfp_url, u.referral_count, u.referral_earnings / 100 as earnings_dollars
      FROM users u
      WHERE u.referral_count > 0
      ORDER BY u.referral_count DESC
      LIMIT 10
    `);

    // Recent activity (include ID for admin actions)
    const recentActivityResult = await pool.query(`
      SELECT
        r.id,
        referrer.username as referrer_username,
        referred.username as referred_username,
        r.status,
        r.referrer_reward / 100 as referrer_reward_dollars,
        r.referred_reward / 100 as referred_reward_dollars,
        r.created_at,
        r.completed_at
      FROM referrals r
      JOIN users referrer ON referrer.id = r.referrer_id
      JOIN users referred ON referred.id = r.referred_user_id
      ORDER BY r.created_at DESC
      LIMIT 20
    `);

    const stats = statsResult.rows[0];

    res.json({
      success: true,
      stats: {
        totalReferrals: Number(stats.total_referrals),
        pendingReferrals: Number(stats.pending_referrals),
        completedReferrals: Number(stats.completed_referrals),
        totalRewardsDistributed: Number(stats.total_rewards_cents) / 100 // Convert cents to dollars
      },
      topReferrers: topReferrersResult.rows,
      recentActivity: recentActivityResult.rows
    });
  } catch (error) {
    console.error('Error fetching admin referral stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch referral stats' });
  }
});

// Admin: Revert a referral (undo rewards and delete relationship)
app.post('/api/admin/referrals/revert', async (req: Request, res: Response) => {
  const { referralId } = req.body;

  if (!referralId) {
    return res.status(400).json({ success: false, message: 'Referral ID required' });
  }

  try {
    // Get the referral details
    const referralResult = await pool.query(
      `SELECT r.*, referrer.username as referrer_username, referred.username as referred_username
       FROM referrals r
       JOIN users referrer ON referrer.id = r.referrer_id
       JOIN users referred ON referred.id = r.referred_user_id
       WHERE r.id = $1`,
      [referralId]
    );

    if (referralResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Referral not found' });
    }

    const referral = referralResult.rows[0];

    // If the referral was completed, we need to reverse the rewards
    if (referral.status === 'completed') {
      // Convert cents to dollars for paper_balance deduction
      const referrerRewardDollars = referral.referrer_reward / 100;
      const referredRewardDollars = referral.referred_reward / 100;

      // Deduct rewards from referrer (paper_balance is in dollars, referral_earnings stays in cents)
      await pool.query(
        `UPDATE users SET
          paper_balance = paper_balance - $1,
          referral_count = GREATEST(referral_count - 1, 0),
          referral_earnings = GREATEST(referral_earnings - $2, 0)
         WHERE id = $3`,
        [referrerRewardDollars, referral.referrer_reward, referral.referrer_id]
      );

      // Deduct rewards from referred user
      await pool.query(
        'UPDATE users SET paper_balance = GREATEST(paper_balance - $1, 0) WHERE id = $2',
        [referredRewardDollars, referral.referred_user_id]
      );

      console.log(`💰 Reverted rewards: -$${referrerRewardDollars} from ${referral.referrer_username}, -$${referredRewardDollars} from ${referral.referred_username}`);
    }

    // Clear the referred_by on the user
    await pool.query(
      'UPDATE users SET referred_by = NULL WHERE id = $1',
      [referral.referred_user_id]
    );

    // Delete the referral record
    await pool.query('DELETE FROM referrals WHERE id = $1', [referralId]);

    console.log(`🔄 Admin reverted referral #${referralId}: ${referral.referrer_username} → ${referral.referred_username} (was ${referral.status})`);

    res.json({
      success: true,
      message: `Referral reverted. ${referral.status === 'completed' ? 'Rewards have been deducted from both users.' : 'Pending referral removed.'}`,
      revertedRewards: referral.status === 'completed',
      referrerRewardDeducted: referral.status === 'completed' ? referral.referrer_reward / 100 : 0,
      referredRewardDeducted: referral.status === 'completed' ? referral.referred_reward / 100 : 0
    });
  } catch (error) {
    console.error('Error reverting referral:', error);
    res.status(500).json({ success: false, message: 'Failed to revert referral' });
  }
});

// Update user army
app.patch('/api/users/:walletAddress/army', async (req: Request, res: Response) => {
  const { walletAddress } = req.params;
  const { army, signerAddress } = req.body;

  // Verify the signer owns the wallet being modified
  if (!signerAddress || signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
    return res.status(403).json({ success: false, message: 'Unauthorized: Can only modify your own army' });
  }

  if (!army || !['bears', 'bulls'].includes(army)) {
    return res.status(400).json({ success: false, message: 'Invalid army. Must be "bears" or "bulls"' });
  }

  try {
    const result = await pool.query(
      'UPDATE users SET army = $1, last_active = NOW() WHERE LOWER(wallet_address) = LOWER($2) RETURNING *',
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

// Check claim status - Daily claim + emergency claim if balance < $100
app.post('/api/claims/status', async (req: Request, res: Response) => {
  const { walletAddress } = req.body;

  if (!walletAddress) {
    return res.status(400).json({ success: false, message: 'Wallet address required' });
  }

  try {
    const user = await pool.query(
      'SELECT last_claim_time, paper_balance FROM users WHERE wallet_address = $1',
      [walletAddress]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const lastClaim = user.rows[0].last_claim_time;
    const paperBalance = Number(user.rows[0].paper_balance);
    const now = new Date();

    // Get today's UTC midnight
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    // Get tomorrow's UTC midnight for countdown
    const tomorrowUTC = new Date(todayUTC.getTime() + 24 * 60 * 60 * 1000);

    // Check if already claimed today
    const claimedToday = lastClaim && lastClaim >= todayUTC;
    // Emergency claim allowed if balance < $100
    const emergencyClaim = paperBalance < 100;
    // Can claim if: no claim today OR balance < $100 (emergency claim)
    const canClaim = !claimedToday || emergencyClaim;

    // Time left until next daily reset (midnight UTC)
    const timeLeft = claimedToday && !emergencyClaim ? Math.ceil((tomorrowUTC.getTime() - now.getTime()) / 1000) : 0;

    res.json({
      success: true,
      canClaim,
      timeLeft,
      lastClaim,
      emergencyClaim: emergencyClaim && claimedToday,
      nextReset: tomorrowUTC.toISOString()
    });
  } catch (error) {
    console.error('Error checking claim status:', error);
    res.status(500).json({ success: false, message: 'Failed to check claim status' });
  }
});

// Claim paper money - Daily claim + emergency claim if balance < $100
app.post('/api/claims', claimLimiter, checkMaintenance, async (req: Request, res: Response) => {
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

    const lastClaim = user.rows[0].last_claim_time;
    const paperBalance = Number(user.rows[0].paper_balance);
    const now = new Date();

    // Get today's UTC midnight
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const tomorrowUTC = new Date(todayUTC.getTime() + 24 * 60 * 60 * 1000);

    // Check if already claimed today
    const claimedToday = lastClaim && lastClaim >= todayUTC;
    // Emergency claim allowed if balance < $100
    const emergencyClaim = paperBalance < 100;

    // Only check for open positions if this is an EMERGENCY claim (not daily claim)
    if (emergencyClaim) {
      const openPositions = await pool.query(
        'SELECT COUNT(*) as count FROM trades WHERE user_id = $1 AND status = $2',
        [user.rows[0].id, 'open']
      );

      if (openPositions.rows[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot use emergency claim while you have open positions. Close all positions first.',
          hasOpenPositions: true
        });
      }
    }

    // Block if already claimed today AND balance >= $100
    if (claimedToday && !emergencyClaim) {
      const timeLeft = Math.ceil((tomorrowUTC.getTime() - now.getTime()) / 1000);
      return res.status(429).json({
        success: false,
        message: `Already claimed today. Next claim at midnight UTC.`,
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

    // Update mission progress for claim streak
    updateClaimStreakProgress(user.rows[0].id);

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
app.post('/api/trades/open', tradingLimiter, checkMaintenance, async (req: Request, res: Response) => {
  const { walletAddress, type, leverage, size, entryPrice, stopLoss } = req.body;

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
    // Calculate trading fee (will be deducted from P&L when closing, not upfront)
    const feePercentage = leverage > 1 ? leverage * 0.05 : 0; // 2x = 0.1%, 10x = 0.5%, 50x = 2.5%, 100x = 5%, 200x = 10%
    const tradingFee = (feePercentage / 100) * size;

    // Calculate liquidation price
    const liquidationPrice = type === 'long'
      ? entryPrice * (1 - 1 / leverage)
      : entryPrice * (1 + 1 / leverage);

    // Start transaction BEFORE checking balance to prevent race conditions
    await pool.query('BEGIN');

    // Get or create user WITH ROW LOCK to prevent race conditions
    let user = await pool.query(
      'SELECT id, paper_balance FROM users WHERE LOWER(wallet_address) = LOWER($1) FOR UPDATE',
      [walletAddress]
    );

    // Auto-create user if they don't exist (inside transaction)
    if (user.rows.length === 0) {
      console.log(`🆕 Auto-creating new user for wallet: ${walletAddress}`);
      const newUser = await pool.query(
        `INSERT INTO users (wallet_address, username, army, paper_balance)
         VALUES (LOWER($1), $2, 'bulls', 10000.00)
         RETURNING id, paper_balance`,
        [walletAddress, `Trader${walletAddress.slice(2, 8)}`]
      );
      user = newUser;
      console.log(`✅ New user created with $10,000 balance`);
    }

    // Calculate collateral (position_size / leverage)
    const collateral = size / leverage;

    // Check balance INSIDE transaction with row locked
    if (user.rows[0].paper_balance < collateral) {
      await pool.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Insufficient balance. Available: $${user.rows[0].paper_balance.toFixed(2)}, Required: $${collateral.toFixed(2)}`
      });
    }

    // Deduct collateral from balance (fee will be deducted from P&L when closing)
    await pool.query(
      'UPDATE users SET paper_balance = paper_balance - $1, last_active = NOW() WHERE id = $2',
      [collateral, user.rows[0].id]
    );

    // Validate stop loss if provided
    if (stopLoss !== undefined && stopLoss !== null) {
      if (type === 'long' && stopLoss >= entryPrice) {
        await pool.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Stop loss for LONG must be below entry price'
        });
      }
      if (type === 'short' && stopLoss <= entryPrice) {
        await pool.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Stop loss for SHORT must be above entry price'
        });
      }
    }

    // Create trade
    const trade = await pool.query(
      `INSERT INTO trades (user_id, position_type, leverage, entry_price, position_size, liquidation_price, stop_loss, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'open')
       RETURNING *`,
      [user.rows[0].id, type, leverage, entryPrice, size, liquidationPrice, stopLoss || null]
    );

    console.log(`
🚀 Trade Opened:
- Position: ${type.toUpperCase()} ${leverage}x
- Position Size: $${size}
- Collateral: $${collateral.toFixed(2)}
- Entry: $${entryPrice}
- Fee (deducted from P&L when closing): $${tradingFee.toFixed(2)} (${feePercentage.toFixed(2)}%)
- Balance Deducted: $${collateral.toFixed(2)}
    `);

    await pool.query('COMMIT');

    // Update mission progress for trade missions
    updateMissionProgress(user.rows[0].id, 'trade', 1);

    // Update trading streak (unique days of trading)
    updateTradingStreakProgress(user.rows[0].id);

    // Check for "Two Faces" mission - having both long and short open at same time
    checkTwoFacesMission(user.rows[0].id);

    // Check for referral reward on first trade
    checkReferralReward(user.rows[0].id);

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
    // Get current army before update
    const currentArmyResult = await pool.query(
      'SELECT army FROM users WHERE id = $1',
      [userId]
    );
    const currentArmy = currentArmyResult.rows[0]?.army;

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

    // Check if army changed - trigger "The Betrayer" mission
    if (currentArmy && currentArmy !== newArmy) {
      console.log(`🗡️ User ${userId} switched from ${currentArmy.toUpperCase()} to ${newArmy.toUpperCase()} - The Betrayer!`);
      updateMissionProgress(userId, 'army_change', 1);
    }

    return newArmy;
  } catch (error) {
    console.error('Error updating user army:', error);
  }
}

// Close trade
app.post('/api/trades/close', tradingLimiter, checkMaintenance, async (req: Request, res: Response) => {
  const { tradeId, exitPrice } = req.body;

  if (!tradeId || !exitPrice) {
    return res.status(400).json({ 
      success: false, 
      message: 'Trade ID and exit price required' 
    });
  }

  try {
    await pool.query('BEGIN');

    // Get trade details WITH ROW LOCK to prevent race conditions (multiple close requests)
    const trade = await pool.query(
      'SELECT * FROM trades WHERE id = $1 AND status = $2 FOR UPDATE',
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
    const positionSize = Number(t.position_size); // This is the full leveraged position size
    const leverage = Number(t.leverage);

    // Calculate actual collateral (position_size / leverage)
    const collateral = positionSize / leverage;

    // The leveraged position size is already stored in position_size
    const leveragedPositionSize = positionSize;

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
    
    // CRITICAL: Cap PnL at -100% of collateral (player can never lose more than they put in)
    // The absolute maximum loss is the entire collateral
    const maxLoss = -collateral;
    const cappedPnl = Math.max(pnl, maxLoss);
    
    // Deduct fee from capped P&L (this is where fee is actually paid)
    const pnlAfterFee = cappedPnl - tradingFee;
    
    // Final PnL can never be worse than losing entire collateral
    const finalPnl = Math.max(pnlAfterFee, -collateral);

    // Determine if liquidated (loss is 100% of collateral or more)
    const isLiquidated = finalPnl <= -collateral;
    const status = isLiquidated ? 'liquidated' : 'closed';
    const finalAmount = isLiquidated ? 0 : collateral + finalPnl;

    console.log(`
📊 Trade Close Details:
- Trade ID: ${tradeId}
- Position Type: ${t.position_type}
- Entry Price: $${t.entry_price}
- Exit Price: $${exitPrice}
- Price Change: $${priceChange.toFixed(2)} (${(priceChangePercentage * 100).toFixed(2)}%)
- Leverage: ${t.leverage}x
- Position Size: $${positionSize.toLocaleString()}
- Collateral: $${collateral.toFixed(2)}
- Raw P&L: $${pnl.toFixed(2)} (${((pnl / collateral) * 100).toFixed(2)}% of collateral)
- Capped P&L: $${cappedPnl.toFixed(2)} (max loss = -100% collateral)
- Trading Fee: $${tradingFee.toFixed(2)} (${feePercentage.toFixed(2)}%)
- Final P&L (capped): $${finalPnl.toFixed(2)}
- Final Amount: $${Number(finalAmount).toFixed(2)}
- Status: ${status}
    `);

    // Update trade (store CAPPED final P&L - player never loses more than collateral)
    // closed_by is 'manual' for user-initiated closes, or 'liquidation' if manually closed at liquidation
    const closedBy = isLiquidated ? 'liquidation' : 'manual';
    await pool.query(
      'UPDATE trades SET exit_price = $1, pnl = $2, status = $3, closed_by = $4, closed_at = NOW() WHERE id = $5',
      [exitPrice, finalPnl, status, closedBy, tradeId]
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

    // Update mission progress for win missions (only if profitable)
    if (finalPnl > 0) {
      updateMissionProgress(t.user_id, 'win', 1);
    }

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

// Auto-liquidate positions that have hit liquidation price
app.post('/api/trades/auto-liquidate', async (req: Request, res: Response) => {
  const { currentPrice } = req.body;

  if (!currentPrice) {
    return res.status(400).json({ 
      success: false, 
      message: 'Current BTC price required' 
    });
  }

  try {
    // Get all open trades
    const openTrades = await pool.query(
      'SELECT * FROM trades WHERE status = $1',
      ['open']
    );

    const liquidatedTrades = [];

    const stoppedTrades: any[] = [];

    for (const trade of openTrades.rows) {
      const entryPrice = Number(trade.entry_price);
      const liquidationPrice = Number(trade.liquidation_price);
      const stopLoss = trade.stop_loss ? Number(trade.stop_loss) : null;
      const positionSize = Number(trade.position_size);
      const leverage = Number(trade.leverage);
      const collateral = positionSize / leverage; // Actual collateral = position_size / leverage

      // Check if stop loss was hit
      let shouldStopLoss = false;
      if (stopLoss) {
        if (trade.position_type === 'long') {
          // Long stop loss triggers when price drops to or below stop loss
          shouldStopLoss = currentPrice <= stopLoss;
        } else {
          // Short stop loss triggers when price rises to or above stop loss
          shouldStopLoss = currentPrice >= stopLoss;
        }
      }

      // Check if position should be liquidated
      let shouldLiquidate = false;

      if (trade.position_type === 'long') {
        // Long position liquidates when price drops to liquidation price
        shouldLiquidate = currentPrice <= liquidationPrice;
      } else {
        // Short position liquidates when price rises to liquidation price
        shouldLiquidate = currentPrice >= liquidationPrice;
      }

      // Handle stop loss first (if hit and not already at liquidation)
      if (shouldStopLoss && !shouldLiquidate) {
        await pool.query('BEGIN');

        try {
          // Calculate P&L at stop loss price
          const leveragedPositionSize = positionSize; // position_size IS the leveraged position
          const priceChange = trade.position_type === 'long'
            ? currentPrice - entryPrice
            : entryPrice - currentPrice;
          const priceChangePercentage = priceChange / entryPrice;
          let pnl = priceChangePercentage * leveragedPositionSize;

          // Deduct trading fee
          const feePercentage = leverage > 1 ? leverage * 0.05 : 0;
          const tradingFee = (feePercentage / 100) * collateral;
          const finalPnl = pnl - tradingFee;

          // Close trade at stop loss (not liquidated)
          await pool.query(
            'UPDATE trades SET exit_price = $1, pnl = $2, status = $3, closed_by = $4, closed_at = NOW() WHERE id = $5',
            [currentPrice, finalPnl, 'closed', 'stop_loss', trade.id]
          );

          // Return collateral + pnl to user (can be positive or negative)
          const finalAmount = Math.max(0, collateral + finalPnl);
          if (finalAmount > 0) {
            await pool.query(
              'UPDATE users SET paper_balance = paper_balance + $1, last_active = NOW() WHERE id = $2',
              [finalAmount, trade.user_id]
            );
          } else {
            await pool.query(
              'UPDATE users SET last_active = NOW() WHERE id = $1',
              [trade.user_id]
            );
          }

          // Update user's army
          await updateUserArmy(trade.user_id);

          await pool.query('COMMIT');

          stoppedTrades.push({
            tradeId: trade.id,
            userId: trade.user_id,
            type: trade.position_type,
            leverage: trade.leverage,
            entryPrice,
            stopLoss,
            exitPrice: currentPrice,
            pnl: finalPnl,
            returnedAmount: finalAmount
          });

          console.log(`🛑 STOP LOSS TRIGGERED: Trade #${trade.id} - ${trade.position_type.toUpperCase()} ${leverage}x - P&L: $${finalPnl.toFixed(2)} - Returned: $${finalAmount.toFixed(2)}`);
        } catch (error) {
          await pool.query('ROLLBACK');
          console.error(`Error triggering stop loss for trade #${trade.id}:`, error);
        }
        continue; // Skip liquidation check since stop loss was handled
      }

      if (shouldLiquidate) {
        await pool.query('BEGIN');

        try {
          // Calculate final P&L at liquidation
          const leveragedPositionSize = positionSize; // position_size IS the leveraged position
          const priceChange = trade.position_type === 'long' 
            ? currentPrice - entryPrice 
            : entryPrice - currentPrice;
          const priceChangePercentage = priceChange / entryPrice;
          let pnl = priceChangePercentage * leveragedPositionSize;

          // Deduct trading fee
          const feePercentage = leverage > 1 ? leverage * 0.05 : 0;
          const tradingFee = (feePercentage / 100) * collateral;
          
          // CRITICAL: Cap PnL at -100% of collateral (player can never lose more than they put in)
          const maxLoss = -collateral;
          const cappedPnl = Math.max(pnl, maxLoss);
          const pnlAfterFee = cappedPnl - tradingFee;
          
          // Final PnL can never be worse than losing entire collateral
          const finalPnl = Math.max(pnlAfterFee, -collateral);

          // Mark as liquidated (store capped final P&L)
          await pool.query(
            'UPDATE trades SET exit_price = $1, pnl = $2, status = $3, closed_by = $4, closed_at = NOW() WHERE id = $5',
            [currentPrice, finalPnl, 'liquidated', 'liquidation', trade.id]
          );

          // No money returned on liquidation (user loses entire collateral)
          await pool.query(
            'UPDATE users SET last_active = NOW() WHERE id = $1',
            [trade.user_id]
          );

          // Update user's army
          await updateUserArmy(trade.user_id);

          await pool.query('COMMIT');

          liquidatedTrades.push({
            tradeId: trade.id,
            userId: trade.user_id,
            type: trade.position_type, 
            leverage: trade.leverage,
            entryPrice,
            liquidationPrice:currentPrice,
            loss: collateral
          });

          console.log(`💥 AUTO-LIQUIDATED: Trade #${trade.id} - ${trade.position_type.toUpperCase()} ${leverage}x - Loss: $${collateral.toFixed(2)}`);
        } catch (error) {
          await pool.query('ROLLBACK');
          console.error(`Error liquidating trade #${trade.id}:`, error);
        }
      }
    }

    const totalClosed = liquidatedTrades.length + stoppedTrades.length;
    let message = '';
    if (liquidatedTrades.length > 0 && stoppedTrades.length > 0) {
      message = `Auto-liquidated ${liquidatedTrades.length} and stopped ${stoppedTrades.length} position(s)`;
    } else if (liquidatedTrades.length > 0) {
      message = `Auto-liquidated ${liquidatedTrades.length} position(s)`;
    } else if (stoppedTrades.length > 0) {
      message = `Stopped ${stoppedTrades.length} position(s) at stop loss`;
    } else {
      message = 'No positions liquidated or stopped';
    }

    res.json({
      success: true,
      liquidatedCount: liquidatedTrades.length,
      liquidatedTrades,
      stoppedCount: stoppedTrades.length,
      stoppedTrades,
      message
    });
  } catch (error) {
    console.error('Error in auto-liquidation:', error);
    res.status(500).json({ success: false, message: 'Failed to process auto-liquidation' });
  }
});

// Add collateral to open position (averaging into position)
app.post('/api/trades/add-collateral', checkMaintenance, async (req: Request, res: Response) => {
  const { tradeId, additionalCollateral, walletAddress, currentPrice } = req.body;

  if (!tradeId || !additionalCollateral || !walletAddress || !currentPrice) {
    return res.status(400).json({ 
      success: false, 
      message: 'Trade ID, additional collateral, wallet address, and current price required' 
    });
  }

  if (additionalCollateral <= 0) {
    return res.status(400).json({ 
      success: false, 
      message: 'Additional collateral must be greater than 0' 
    });
  }

  try {
    await pool.query('BEGIN');

    // Get trade details WITH ROW LOCK to prevent race conditions
    const trade = await pool.query(
      'SELECT t.*, u.paper_balance FROM trades t JOIN users u ON t.user_id = u.id WHERE t.id = $1 AND t.status = $2 AND LOWER(u.wallet_address) = LOWER($3) FOR UPDATE OF t',
      [tradeId, 'open', walletAddress]
    );

    if (trade.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Trade not found or already closed'
      });
    }

    const t = trade.rows[0];
    const currentBalance = Number(t.paper_balance);

    // Check if user has enough balance
    if (currentBalance < additionalCollateral) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ 
        success: false, 
        message: `Insufficient balance. Available: $${currentBalance.toFixed(2)}` 
      });
    }

    const oldCollateral = Number(t.position_size);
    const oldEntryPrice = Number(t.entry_price);
    const leverage = Number(t.leverage);
    
    // Calculate weighted average entry price
    // Old position value + New position value / Total collateral
    const oldPositionValue = oldCollateral * oldEntryPrice;
    const newPositionValue = additionalCollateral * currentPrice;
    const totalCollateral = oldCollateral + additionalCollateral;
    const newEntryPrice = (oldPositionValue + newPositionValue) / totalCollateral;
    
    // Recalculate liquidation price with SAME leverage but new entry price
    const newLiquidationPrice = t.position_type === 'long'
      ? newEntryPrice * (1 - 1 / leverage)
      : newEntryPrice * (1 + 1 / leverage);

    // Deduct additional collateral from balance
    await pool.query(
      'UPDATE users SET paper_balance = paper_balance - $1, last_active = NOW() WHERE id = $2',
      [additionalCollateral, t.user_id]
    );

    // Update trade with new collateral, new entry price, and new liquidation price
    const updatedTrade = await pool.query(
      'UPDATE trades SET position_size = $1, entry_price = $2, liquidation_price = $3 WHERE id = $4 RETURNING *',
      [totalCollateral, newEntryPrice, newLiquidationPrice, tradeId]
    );

    await pool.query('COMMIT');

    console.log(`
💰 Collateral Added (Position Averaging):
- Trade ID: ${tradeId}
- Position: ${t.position_type.toUpperCase()} ${leverage}x
- Old Collateral: $${oldCollateral.toFixed(2)}
- Added: $${additionalCollateral.toFixed(2)} at $${currentPrice.toFixed(2)}
- New Collateral: $${totalCollateral.toFixed(2)}
- Old Entry Price: $${oldEntryPrice.toFixed(2)}
- New Entry Price: $${newEntryPrice.toFixed(2)} (weighted average)
- Leverage: ${leverage}x (unchanged)
- Old Liquidation Price: $${Number(t.liquidation_price).toFixed(2)}
- New Liquidation Price: $${newLiquidationPrice.toFixed(2)}
    `);

    res.json({ 
      success: true, 
      trade: updatedTrade.rows[0],
      oldCollateral,
      newCollateral: totalCollateral,
      oldEntryPrice,
      newEntryPrice,
      oldLiquidationPrice: Number(t.liquidation_price),
      newLiquidationPrice,
      leverage // Same leverage, not effective
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error adding collateral:', error);
    res.status(500).json({ success: false, message: 'Failed to add collateral' });
  }
});

// Update stop loss for open position
app.post('/api/trades/update-stop-loss', checkMaintenance, async (req: Request, res: Response) => {
  const { tradeId, stopLoss, walletAddress } = req.body;

  if (!tradeId || !walletAddress) {
    return res.status(400).json({
      success: false,
      message: 'Trade ID and wallet address required'
    });
  }

  try {
    // Get trade details
    const trade = await pool.query(
      `SELECT t.* FROM trades t
       JOIN users u ON t.user_id = u.id
       WHERE t.id = $1 AND t.status = 'open' AND LOWER(u.wallet_address) = LOWER($2)`,
      [tradeId, walletAddress]
    );

    if (trade.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Trade not found or already closed'
      });
    }

    const t = trade.rows[0];
    const entryPrice = Number(t.entry_price);

    // Validate stop loss if provided (null means remove stop loss)
    if (stopLoss !== null && stopLoss !== undefined) {
      if (t.position_type === 'long' && stopLoss >= entryPrice) {
        return res.status(400).json({
          success: false,
          message: 'Stop loss for LONG must be below entry price'
        });
      }
      if (t.position_type === 'short' && stopLoss <= entryPrice) {
        return res.status(400).json({
          success: false,
          message: 'Stop loss for SHORT must be above entry price'
        });
      }
    }

    // Update stop loss
    const updatedTrade = await pool.query(
      'UPDATE trades SET stop_loss = $1 WHERE id = $2 RETURNING *',
      [stopLoss || null, tradeId]
    );

    console.log(`🛑 Stop Loss Updated: Trade #${tradeId} - ${t.position_type.toUpperCase()} - Stop Loss: ${stopLoss ? `$${stopLoss}` : 'REMOVED'}`);

    res.json({
      success: true,
      trade: updatedTrade.rows[0],
      message: stopLoss ? `Stop loss set at $${stopLoss}` : 'Stop loss removed'
    });
  } catch (error) {
    console.error('Error updating stop loss:', error);
    res.status(500).json({ success: false, message: 'Failed to update stop loss' });
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
       WHERE LOWER(u.wallet_address) = LOWER($1) AND t.status = 'open'
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
       WHERE LOWER(u.wallet_address) = LOWER($1) AND t.status IN ('closed', 'liquidated')
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
        army: user.army,
        referral_code: user.referral_code
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
        const positionSize = Number(trade.position_size);
        const leverage = Number(trade.leverage);
        const collateral = positionSize / leverage; // Actual collateral

        // Calculate current P&L if currentPrice is provided
        let current_pnl = null;
        if (currentPrice) {
          const leveragedPositionSize = positionSize; // position_size IS the leveraged position
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
          position_size: positionSize,
          collateral: collateral, // Add actual collateral to response
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
        stop_loss: trade.stop_loss ? Number(trade.stop_loss) : null,
        closed_by: trade.closed_by || null,
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
    // Get the most recent Monday at noon (start of current week)
    const getCurrentWeekStart = () => {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const currentHour = now.getHours();
      
      let daysToSubtract;
      if (dayOfWeek === 1 && currentHour < 12) {
        // It's Monday before noon - go back to last Monday
        daysToSubtract = 7;
      } else if (dayOfWeek === 0) {
        // It's Sunday - go back 6 days to last Monday
        daysToSubtract = 6;
      } else if (dayOfWeek === 1) {
        // It's Monday after noon - this is the current week start
        daysToSubtract = 0;
      } else {
        // Any other day - calculate days back to last Monday
        daysToSubtract = dayOfWeek - 1;
      }
      
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - daysToSubtract);
      weekStart.setHours(12, 0, 0, 0);
      
      return weekStart;
    };

    // Get next Monday at noon (end of current week / start of next week)
    const getNextWeekStart = () => {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const currentHour = now.getHours();
      
      let daysToAdd;
      if (dayOfWeek === 1 && currentHour < 12) {
        // It's Monday before noon - snapshot is today at noon
        daysToAdd = 0;
      } else if (dayOfWeek === 0) {
        // It's Sunday - next Monday is tomorrow
        daysToAdd = 1;
      } else {
        // Calculate days until next Monday
        daysToAdd = 8 - dayOfWeek;
      }
      
      const nextWeekStart = new Date(now);
      nextWeekStart.setDate(now.getDate() + daysToAdd);
      nextWeekStart.setHours(12, 0, 0, 0);
      
      return nextWeekStart;
    };

    const weekStart = getCurrentWeekStart();
    const weekEnd = getNextWeekStart();

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
// VOLUME STATS ENDPOINT
// ============================================

// Get global and user volume stats
app.get('/api/volume/stats', async (req: Request, res: Response) => {
  const walletAddress = req.query.walletAddress as string;

  try {
    // Get global volume (sum of all users' total_volume)
    const globalVolumeResult = await pool.query(
      'SELECT COALESCE(SUM(total_volume), 0) as global_volume FROM users'
    );

    // Get total number of traders
    const traderCountResult = await pool.query(
      'SELECT COUNT(*) as trader_count FROM users WHERE total_trades > 0'
    );

    const stats: any = {
      globalVolume: Number(globalVolumeResult.rows[0].global_volume),
      totalTraders: Number(traderCountResult.rows[0].trader_count)
    };

    // If wallet address provided, get user-specific volume
    if (walletAddress) {
      const userVolumeResult = await pool.query(
        'SELECT total_volume, total_trades FROM users WHERE LOWER(wallet_address) = LOWER($1)',
        [walletAddress]
      );

      if (userVolumeResult.rows.length > 0) {
        stats.userVolume = Number(userVolumeResult.rows[0].total_volume);
        stats.userTrades = userVolumeResult.rows[0].total_trades;
      }
    }

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching volume stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch volume stats' });
  }
});

// ============================================
// ADMIN ENDPOINTS
// ============================================

// Update a specific user's Farcaster profile data
app.post('/api/admin/update-user-profile', adminAuth, async (req: Request, res: Response) => {
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

    auditLog('UPDATE_USER_PROFILE', { walletAddress, fid, username, pfpUrl }, (req as any).adminIp, true);
    res.json({ success: true, user: updated.rows[0] });
  } catch (error) {
    console.error('Error updating user profile:', error);
    auditLog('UPDATE_USER_PROFILE', { walletAddress, fid, username, error: String(error) }, (req as any).adminIp, false);
    res.status(500).json({ success: false, message: 'Failed to update user profile' });
  }
});

// Recalculate all user armies based on closed positions
app.post('/api/admin/recalculate-armies', adminAuth, async (req: Request, res: Response) => {
  try {
    // Get all users
    const users = await pool.query('SELECT id FROM users');
    
    let updated = 0;
    for (const user of users.rows) {
      await updateUserArmy(user.id);
      updated++;
    }

    auditLog('RECALCULATE_ARMIES', { usersUpdated: updated }, (req as any).adminIp, true);
    res.json({
      success: true,
      message: `Successfully recalculated armies for ${updated} users`
    });
  } catch (error) {
    console.error('Error recalculating armies:', error);
    auditLog('RECALCULATE_ARMIES', { error: String(error) }, (req as any).adminIp, false);
    res.status(500).json({ success: false, message: 'Failed to recalculate armies' });
  }
});

// Fix all user balances based on actual trade history
app.post('/api/admin/fix-balances', adminAuth, async (req: Request, res: Response) => {
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

    auditLog('FIX_BALANCES', { usersUpdated: results.rows.length }, (req as any).adminIp, true);
    res.json({
      success: true,
      message: `Successfully recalculated balances for ${results.rows.length} users`,
      users: results.rows
    });
  } catch (error) {
    console.error('Error fixing balances:', error);
    auditLog('FIX_BALANCES', { error: String(error) }, (req as any).adminIp, false);
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
// FARCASTER NOTIFICATIONS
// ============================================

// Webhook endpoint for Farcaster events
app.post('/api/farcaster/webhook', express.json(), async (req: Request, res: Response) => {
  try {
    const { event, data } = req.body;

    console.log('📬 Farcaster webhook received:', event);

    if (event === 'notifications_enabled') {
      // User enabled notifications
      const { fid, token, url } = data.notificationDetails;

      // Store token in database
      await pool.query(`
        INSERT INTO notification_tokens (fid, token, url, enabled)
        VALUES ($1, $2, $3, true)
        ON CONFLICT (fid, token)
        DO UPDATE SET url = $3, enabled = true, updated_at = CURRENT_TIMESTAMP
      `, [fid, token, url]);

      console.log(`✅ Notification enabled for FID ${fid}`);

      // Send welcome notification
      try {
        await sendNotification(fid, {
          notificationId: `welcome_${fid}`,
          title: '⚔️ BATTLEFIELD Alerts Enabled!',
          body: 'You\'ll now get daily reminders to check your positions',
          targetUrl: 'https://battlefield-roan.vercel.app'
        });
      } catch (notifError) {
        console.error('Failed to send welcome notification:', notifError);
      }

    } else if (event === 'notifications_disabled') {
      // User disabled notifications
      const { fid } = data;

      await pool.query(`
        UPDATE notification_tokens
        SET enabled = false, updated_at = CURRENT_TIMESTAMP
        WHERE fid = $1
      `, [fid]);

      console.log(`❌ Notifications disabled for FID ${fid}`);

    } else if (event === 'miniapp_removed') {
      // User removed the mini app
      const { fid } = data;

      await pool.query(`
        DELETE FROM notification_tokens WHERE fid = $1
      `, [fid]);

      console.log(`🗑️ Mini app removed for FID ${fid}, tokens deleted`);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ success: false, message: 'Webhook processing failed' });
  }
});

// Send notification to a specific FID
async function sendNotification(fid: number, notification: {
  notificationId: string;
  title: string;
  body: string;
  targetUrl: string;
}) {
  try {
    // Get active tokens for this FID
    const tokensResult = await pool.query(`
      SELECT token, url
      FROM notification_tokens
      WHERE fid = $1 AND enabled = true
    `, [fid]);

    if (tokensResult.rows.length === 0) {
      console.log(`No active tokens for FID ${fid}`);
      return { success: false, reason: 'no_tokens' };
    }

    const tokens = tokensResult.rows.map(row => row.token);
    const notificationUrl = tokensResult.rows[0].url;

    // Send to Farcaster notification API
    const response = await fetch(notificationUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notificationId: notification.notificationId,
        title: notification.title.slice(0, 32), // Max 32 chars
        body: notification.body.slice(0, 128), // Max 128 chars
        targetUrl: notification.targetUrl.slice(0, 1024), // Max 1024 chars
        tokens
      })
    });

    const result = await response.json();

    // Log the notification (deduplication happens via UNIQUE constraint on fid, notification_id, sent_date)
    await pool.query(`
      INSERT INTO notification_log (fid, notification_id, type, title, body, success)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (fid, notification_id, sent_date) DO NOTHING
    `, [
      fid,
      notification.notificationId,
      'push',
      notification.title,
      notification.body,
      response.ok
    ]);

    console.log(`📤 Notification sent to FID ${fid}:`, notification.title);

    return { success: true, result };
  } catch (error) {
    console.error(`Error sending notification to FID ${fid}:`, error);
    return { success: false, error };
  }
}

// API endpoint to send daily position reminder
app.post('/api/notifications/daily-reminder', async (req: Request, res: Response) => {
  try {
    // Get all users with open positions and notifications enabled
    const usersResult = await pool.query(`
      SELECT DISTINCT u.fid, u.username, COUNT(t.id) as open_positions
      FROM users u
      JOIN trades t ON t.user_id = u.id
      WHERE t.status = 'open'
        AND u.fid IS NOT NULL
        AND u.notifications_enabled = true
        AND u.daily_reminder_enabled = true
      GROUP BY u.fid, u.username
    `);

    let sent = 0;
    let failed = 0;

    for (const user of usersResult.rows) {
      try {
        const result = await sendNotification(user.fid, {
          notificationId: `daily_reminder_${new Date().toISOString().split('T')[0]}`,
          title: `⚔️ ${user.open_positions} Position${user.open_positions > 1 ? 's' : ''} Open!`,
          body: `Check your ${user.open_positions} active trade${user.open_positions > 1 ? 's' : ''} on BATTLEFIELD`,
          targetUrl: 'https://battlefield-roan.vercel.app'
        });

        if (result.success) {
          sent++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Failed to send reminder to FID ${user.fid}:`, error);
        failed++;
      }
    }

    res.json({
      success: true,
      stats: {
        total: usersResult.rows.length,
        sent,
        failed
      }
    });
  } catch (error) {
    console.error('Error sending daily reminders:', error);
    res.status(500).json({ success: false, message: 'Failed to send reminders' });
  }
});

// API endpoint to send achievement notification
app.post('/api/notifications/achievement', async (req: Request, res: Response) => {
  try {
    const { fid, achievementId, title, description } = req.body;

    if (!fid || !achievementId || !title) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const result = await sendNotification(fid, {
      notificationId: `achievement_${achievementId}_${fid}`,
      title: `🏆 ${title}`,
      body: description || 'Achievement unlocked!',
      targetUrl: 'https://battlefield-roan.vercel.app'
    });

    res.json({ success: true, result });
  } catch (error) {
    console.error('Error sending achievement notification:', error);
    res.status(500).json({ success: false, message: 'Failed to send achievement notification' });
  }
});

// Get notification settings for a user
app.get('/api/notifications/settings/:walletAddress', async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;

    const result = await pool.query(`
      SELECT
        notifications_enabled,
        daily_reminder_enabled,
        achievement_notifications_enabled,
        (SELECT COUNT(*) FROM notification_tokens WHERE fid = u.fid AND enabled = true) as active_tokens
      FROM users u
      WHERE wallet_address = $1
    `, [walletAddress]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, settings: result.rows[0] });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
});

// Update notification settings for a user
app.post('/api/notifications/settings', async (req: Request, res: Response) => {
  try {
    const { walletAddress, signerAddress, notifications_enabled, daily_reminder_enabled, achievement_notifications_enabled } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ success: false, message: 'Wallet address required' });
    }

    // Verify the signer owns the wallet being modified
    if (!signerAddress || signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Can only modify your own settings' });
    }

    await pool.query(`
      UPDATE users
      SET
        notifications_enabled = COALESCE($2, notifications_enabled),
        daily_reminder_enabled = COALESCE($3, daily_reminder_enabled),
        achievement_notifications_enabled = COALESCE($4, achievement_notifications_enabled)
      WHERE LOWER(wallet_address) = LOWER($1)
    `, [walletAddress, notifications_enabled, daily_reminder_enabled, achievement_notifications_enabled]);

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ success: false, message: 'Failed to update settings' });
  }
});

// ============================================
// MISSIONS SYSTEM
// ============================================

// Helper: Get current daily period (resets at 12:00 UTC)
function getDailyPeriod(): { start: Date; end: Date } {
  const now = new Date();
  const todayNoon = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0));

  let start: Date;
  let end: Date;

  if (now.getTime() < todayNoon.getTime()) {
    // Before noon today - period is yesterday noon to today noon
    start = new Date(todayNoon.getTime() - 24 * 60 * 60 * 1000);
    end = todayNoon;
  } else {
    // After noon today - period is today noon to tomorrow noon
    start = todayNoon;
    end = new Date(todayNoon.getTime() + 24 * 60 * 60 * 1000);
  }

  return { start, end };
}

// Helper: Get current weekly period (resets Monday 12:00 UTC)
function getWeeklyPeriod(): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0 = Sunday, 1 = Monday, ...
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  // Get this week's Monday at noon UTC
  const thisMonday = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - daysFromMonday,
    12, 0, 0
  ));

  let start: Date;
  let end: Date;

  if (now.getTime() < thisMonday.getTime()) {
    // Before Monday noon - period is last week
    start = new Date(thisMonday.getTime() - 7 * 24 * 60 * 60 * 1000);
    end = thisMonday;
  } else {
    // After Monday noon - period is this week
    start = thisMonday;
    end = new Date(thisMonday.getTime() + 7 * 24 * 60 * 60 * 1000);
  }

  return { start, end };
}

// Helper: Get one-time mission period (never resets - use a fixed epoch start)
function getOnetimePeriod(): { start: Date; end: Date } {
  // Use a fixed date far in the past as start, and far in the future as end
  // This ensures one-time missions are only ever completed once
  const start = new Date('2020-01-01T00:00:00Z');
  const end = new Date('2099-12-31T23:59:59Z');
  return { start, end };
}

// Helper: Get target account FID with caching (saves 2 API calls per verification)
async function getTargetFid(username: string): Promise<number | null> {
  if (!neynarClient) return null;

  // Check cache first
  const cached = targetFidCache.get(username);
  if (cached && Date.now() - cached.cachedAt < FID_CACHE_TTL) {
    console.log(`📦 Using cached FID for @${username}: ${cached.fid}`);
    return cached.fid;
  }

  // Fetch from API
  try {
    const userResponse = await neynarClient.lookupUserByUsername({ username });
    const fid = userResponse.user.fid;
    targetFidCache.set(username, { fid, cachedAt: Date.now() });
    console.log(`🔄 Fetched and cached FID for @${username}: ${fid}`);
    return fid;
  } catch (err) {
    console.error(`Failed to look up user ${username}:`, err);
    return null;
  }
}

// Helper: Verify if a user follows the target accounts on Farcaster
async function verifyFollowsTargetAccounts(userFid: number): Promise<{ follows: boolean; followedAccounts: string[]; missingAccounts: string[] }> {
  if (!neynarClient) {
    console.warn('Neynar client not initialized - cannot verify follow');
    return { follows: false, followedAccounts: [], missingAccounts: TARGET_FOLLOW_USERNAMES };
  }

  try {
    // Get user's following list (fetch up to 150 at a time, paginate if needed)
    const followingSet = new Set<number>();
    let cursor: string | undefined = undefined;

    // Fetch user's following (may need pagination for users following many accounts)
    do {
      const response = await neynarClient.fetchUserFollowing({
        fid: userFid,
        limit: 100,
        cursor
      });

      // response.users is Array<Follower>, each Follower has a .user property with .fid
      for (const follower of response.users) {
        followingSet.add(follower.user.fid);
      }

      cursor = response.next?.cursor ?? undefined;
    } while (cursor && followingSet.size < 1000); // Safety limit

    // Look up target account FIDs (uses cache - saves API calls)
    const followedAccounts: string[] = [];
    const missingAccounts: string[] = [];

    for (const username of TARGET_FOLLOW_USERNAMES) {
      const targetFid = await getTargetFid(username);
      if (targetFid === null) {
        missingAccounts.push(username);
        continue;
      }

      if (followingSet.has(targetFid)) {
        followedAccounts.push(username);
      } else {
        missingAccounts.push(username);
      }
    }

    const follows = missingAccounts.length === 0;
    console.log(`🔍 Follow verification for FID ${userFid}: follows=${follows}, followed=${followedAccounts.join(',')}, missing=${missingAccounts.join(',')}`);

    return { follows, followedAccounts, missingAccounts };
  } catch (error) {
    console.error('Error verifying follows:', error);
    return { follows: false, followedAccounts: [], missingAccounts: TARGET_FOLLOW_USERNAMES };
  }
}

// Helper: Get mission period based on type
function getMissionPeriod(missionType: string): { start: Date; end: Date } {
  switch (missionType) {
    case 'daily':
      return getDailyPeriod();
    case 'weekly':
      return getWeeklyPeriod();
    case 'onetime':
      return getOnetimePeriod();
    default:
      return getDailyPeriod();
  }
}

// GET /api/missions - List all active missions
app.get('/api/missions', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      `SELECT id, mission_key, mission_type, title, description, objective_type,
              objective_value, reward_amount, icon, display_order
       FROM missions
       WHERE is_active = true
       ORDER BY mission_type, display_order`
    );

    res.json({ success: true, missions: result.rows });
  } catch (error) {
    console.error('Error fetching missions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch missions' });
  }
});

// GET /api/missions/:walletAddress - Get user's missions with progress
app.get('/api/missions/:walletAddress', async (req: Request, res: Response) => {
  const { walletAddress } = req.params;

  try {
    // Get user
    const userResult = await pool.query(
      'SELECT id FROM users WHERE LOWER(wallet_address) = LOWER($1)',
      [walletAddress]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userId = userResult.rows[0].id;
    const dailyPeriod = getDailyPeriod();
    const weeklyPeriod = getWeeklyPeriod();
    const onetimePeriod = getOnetimePeriod();

    // Get all active missions
    const missionsResult = await pool.query(
      `SELECT id, mission_key, mission_type, title, description, objective_type,
              objective_value, reward_amount, icon, display_order
       FROM missions
       WHERE is_active = true
       ORDER BY mission_type, display_order`
    );

    // Get user's progress for current periods (including one-time)
    const progressResult = await pool.query(
      `SELECT mission_id, progress, is_completed, is_claimed, completed_at, claimed_at, period_start
       FROM user_missions
       WHERE user_id = $1
         AND ((period_start = $2) OR (period_start = $3) OR (period_start = $4))`,
      [userId, dailyPeriod.start, weeklyPeriod.start, onetimePeriod.start]
    );

    const progressMap = new Map();
    progressResult.rows.forEach(p => {
      progressMap.set(`${p.mission_id}-${p.period_start.toISOString()}`, p);
    });

    // Combine missions with progress
    const missions = missionsResult.rows.map(mission => {
      const period = getMissionPeriod(mission.mission_type);
      const key = `${mission.id}-${period.start.toISOString()}`;
      const progress = progressMap.get(key);

      return {
        ...mission,
        progress: progress?.progress || 0,
        is_completed: progress?.is_completed || false,
        is_claimed: progress?.is_claimed || false,
        completed_at: progress?.completed_at,
        claimed_at: progress?.claimed_at,
        period_start: period.start,
        period_end: period.end
      };
    });

    res.json({
      success: true,
      missions,
      daily_reset: dailyPeriod.end,
      weekly_reset: weeklyPeriod.end
    });
  } catch (error) {
    console.error('Error fetching user missions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch missions' });
  }
});

// POST /api/missions/:missionId/claim - Claim mission reward
app.post('/api/missions/:missionId/claim', checkMaintenance, async (req: Request, res: Response) => {
  const { missionId } = req.params;
  const { walletAddress } = req.body;

  if (!walletAddress) {
    return res.status(400).json({ success: false, message: 'Wallet address required' });
  }

  try {
    await pool.query('BEGIN');

    // Get user
    const userResult = await pool.query(
      'SELECT id, paper_balance FROM users WHERE LOWER(wallet_address) = LOWER($1)',
      [walletAddress]
    );

    if (userResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const userId = userResult.rows[0].id;

    // Get mission
    const missionResult = await pool.query(
      'SELECT * FROM missions WHERE id = $1 AND is_active = true',
      [missionId]
    );

    if (missionResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Mission not found' });
    }

    const mission = missionResult.rows[0];
    const period = getMissionPeriod(mission.mission_type);

    // Get user's mission progress
    const progressResult = await pool.query(
      `SELECT * FROM user_missions
       WHERE user_id = $1 AND mission_id = $2 AND period_start = $3`,
      [userId, missionId, period.start]
    );

    if (progressResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Mission not started' });
    }

    const progress = progressResult.rows[0];

    if (!progress.is_completed) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Mission not completed' });
    }

    if (progress.is_claimed) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Already claimed' });
    }

    // Mark as claimed and add reward to user balance
    // reward_amount is stored in dollars directly (not cents)
    const rewardAmount = Number(mission.reward_amount);

    await pool.query(
      `UPDATE user_missions SET is_claimed = true, claimed_at = NOW(), reward_paid = $1
       WHERE id = $2`,
      [rewardAmount, progress.id]
    );

    const balanceResult = await pool.query(
      `UPDATE users SET paper_balance = paper_balance + $1
       WHERE id = $2 RETURNING paper_balance`,
      [rewardAmount, userId]
    );

    await pool.query('COMMIT');

    console.log(`🎯 Mission claimed: ${mission.title} by user ${userId}, reward: $${rewardAmount}`);

    res.json({
      success: true,
      reward: rewardAmount,
      new_balance: Number(balanceResult.rows[0].paper_balance)
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error claiming mission:', error);
    res.status(500).json({ success: false, message: 'Failed to claim mission' });
  }
});

// GET /api/missions/verify-follow/:walletAddress - Verify if user follows target accounts
app.get('/api/missions/verify-follow/:walletAddress', async (req: Request, res: Response) => {
  const { walletAddress } = req.params;

  try {
    // Get user with FID
    const userResult = await pool.query(
      'SELECT id, fid, username FROM users WHERE LOWER(wallet_address) = LOWER($1)',
      [walletAddress]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];

    if (!user.fid) {
      return res.json({
        success: false,
        verified: false,
        message: 'No Farcaster account linked. Please connect via Farcaster to verify follows.',
        followedAccounts: [],
        missingAccounts: TARGET_FOLLOW_USERNAMES
      });
    }

    // Rate limiting: 1 verification attempt per 5 minutes per user
    const lastAttempt = verifyRateLimitCache.get(user.id);
    const now = Date.now();
    if (lastAttempt && now - lastAttempt < VERIFY_RATE_LIMIT_MS) {
      const waitSeconds = Math.ceil((VERIFY_RATE_LIMIT_MS - (now - lastAttempt)) / 1000);
      const waitMinutes = Math.ceil(waitSeconds / 60);
      console.log(`⏳ Rate limited verification for user ${user.id} (${user.username}), wait ${waitSeconds}s`);
      return res.status(429).json({
        success: false,
        verified: false,
        rateLimited: true,
        message: `Please wait ${waitMinutes} minute${waitMinutes > 1 ? 's' : ''} before verifying again.`,
        retryAfterSeconds: waitSeconds,
        followedAccounts: [],
        missingAccounts: TARGET_FOLLOW_USERNAMES
      });
    }

    // Update rate limit timestamp
    verifyRateLimitCache.set(user.id, now);

    // Verify follows via Neynar
    const verification = await verifyFollowsTargetAccounts(user.fid);

    res.json({
      success: true,
      verified: verification.follows,
      followedAccounts: verification.followedAccounts,
      missingAccounts: verification.missingAccounts,
      message: verification.follows
        ? 'All accounts followed! You can claim the reward.'
        : `Please follow: ${verification.missingAccounts.map(u => '@' + u).join(', ')}`
    });
  } catch (error) {
    console.error('Error verifying follow:', error);
    res.status(500).json({ success: false, message: 'Failed to verify follow status' });
  }
});

// POST /api/missions/complete - Mark manual mission as complete (with verification)
app.post('/api/missions/complete', async (req: Request, res: Response) => {
  const { walletAddress, missionKey } = req.body;

  if (!walletAddress || !missionKey) {
    return res.status(400).json({ success: false, message: 'Wallet address and mission key required' });
  }

  try {
    // Get user with FID
    const userResult = await pool.query(
      'SELECT id, fid, username FROM users WHERE LOWER(wallet_address) = LOWER($1)',
      [walletAddress]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = userResult.rows[0];
    const userId = user.id;

    // Get mission
    const missionResult = await pool.query(
      'SELECT * FROM missions WHERE mission_key = $1 AND is_active = true',
      [missionKey]
    );

    if (missionResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Mission not found' });
    }

    const mission = missionResult.rows[0];

    // For follow missions, verify the follow before completing
    if (mission.objective_type === 'follow' || mission.objective_type === 'follow_both') {
      if (!user.fid) {
        return res.status(400).json({
          success: false,
          message: 'Please connect your Farcaster account to complete this mission.',
          requiresFarcaster: true
        });
      }

      // Verify follows via Neynar
      const verification = await verifyFollowsTargetAccounts(user.fid);

      if (!verification.follows) {
        return res.status(400).json({
          success: false,
          message: `Please follow: ${verification.missingAccounts.map(u => '@' + u).join(', ')}`,
          verified: false,
          missingAccounts: verification.missingAccounts
        });
      }

      console.log(`✅ Follow verification passed for user ${userId} (FID: ${user.fid})`);
    }

    const period = getMissionPeriod(mission.mission_type);

    // Upsert user mission progress
    await pool.query(
      `INSERT INTO user_missions (user_id, mission_id, progress, is_completed, completed_at, period_start, period_end)
       VALUES ($1, $2, $3, true, NOW(), $4, $5)
       ON CONFLICT (user_id, mission_id, period_start)
       DO UPDATE SET progress = $3, is_completed = true, completed_at = NOW()
       WHERE user_missions.is_completed = false`,
      [userId, mission.id, mission.objective_value, period.start, period.end]
    );

    console.log(`🎯 Mission completed: ${mission.title} by user ${userId}`);

    res.json({ success: true, message: 'Mission completed' });
  } catch (error) {
    console.error('Error completing mission:', error);
    res.status(500).json({ success: false, message: 'Failed to complete mission' });
  }
});

// Helper: Update claim streak progress
async function updateClaimStreakProgress(userId: number): Promise<void> {
  try {
    // Get the claim_streak mission
    const missionResult = await pool.query(
      `SELECT id, objective_value FROM missions WHERE objective_type = 'claim_streak' AND is_active = true`
    );

    if (missionResult.rows.length === 0) return;

    const mission = missionResult.rows[0];
    const period = getWeeklyPeriod();

    // Get user's claims from the past few days
    const claimsResult = await pool.query(
      `SELECT DATE(claimed_at AT TIME ZONE 'UTC') as claim_date
       FROM claims
       WHERE user_id = $1 AND claimed_at >= $2
       ORDER BY claim_date DESC`,
      [userId, period.start]
    );

    // Count unique claim days within the weekly period
    const claimDates = claimsResult.rows.map(r => r.claim_date.toISOString().split('T')[0]);
    const uniqueDays = [...new Set(claimDates)].length;

    console.log(`💵 Claim days for user ${userId}: ${uniqueDays} unique days this week (dates: ${[...new Set(claimDates)].join(', ')})`);

    if (uniqueDays === 0) {
      console.log(`⚠️ No claims found this week`);
      return;
    }

    // Update mission progress with unique days count
    await pool.query(
      `INSERT INTO user_missions (user_id, mission_id, progress, period_start, period_end)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, mission_id, period_start)
       DO UPDATE SET progress = $3
       WHERE user_missions.is_completed = false
       RETURNING progress`,
      [userId, mission.id, uniqueDays, period.start, period.end]
    );

    // Check if completed
    if (uniqueDays >= mission.objective_value) {
      await pool.query(
        `UPDATE user_missions SET is_completed = true, completed_at = NOW()
         WHERE user_id = $1 AND mission_id = $2 AND period_start = $3 AND is_completed = false`,
        [userId, mission.id, period.start]
      );
      console.log(`🎯 Claim mission completed: ${uniqueDays} unique days for user ${userId}`);
    }
  } catch (error) {
    console.error('Error updating claim streak progress:', error);
  }
}

// Helper: Check and award referral bonus on first trade
async function checkReferralReward(userId: number): Promise<void> {
  try {
    // Check if user was referred and has a pending referral
    const referralResult = await pool.query(
      `SELECT r.id, r.referrer_id, r.referrer_reward, r.referred_reward, u.username as referrer_username
       FROM referrals r
       JOIN users u ON u.id = r.referrer_id
       WHERE r.referred_user_id = $1 AND r.status = 'pending'`,
      [userId]
    );

    if (referralResult.rows.length === 0) {
      return; // No pending referral
    }

    const referral = referralResult.rows[0];

    // Check if this is their first trade (should only have 1 trade now - the one just opened)
    const tradeCount = await pool.query(
      'SELECT COUNT(*) as count FROM trades WHERE user_id = $1',
      [userId]
    );

    if (Number(tradeCount.rows[0].count) !== 1) {
      return; // Not first trade, already processed
    }

    // Mark referral as claimable (both users need to claim their reward)
    await pool.query(
      `UPDATE referrals SET status = 'claimable' WHERE id = $1`,
      [referral.id]
    );

    console.log(`🎁 Referral now claimable! Referrer ${referral.referrer_username} and user ${userId} can now claim their rewards`);
  } catch (error) {
    console.error('Error checking referral reward:', error);
  }
}

// Helper: Check Two Faces mission (both long and short open at same time)
async function checkTwoFacesMission(userId: number): Promise<void> {
  try {
    // Check if user has both long and short positions open
    const openTrades = await pool.query(
      `SELECT DISTINCT position_type FROM trades WHERE user_id = $1 AND status = 'open'`,
      [userId]
    );

    const positionTypes = openTrades.rows.map(r => r.position_type);
    const hasBoth = positionTypes.includes('long') && positionTypes.includes('short');

    if (hasBoth) {
      // Complete the two_faces mission
      updateMissionProgress(userId, 'two_faces', 1);
      console.log(`🎭 Two Faces mission triggered for user ${userId}`);
    }
  } catch (error) {
    console.error('Error checking Two Faces mission:', error);
  }
}

// Helper: Update trading streak progress (track unique days of trading)
async function updateTradingStreakProgress(userId: number): Promise<void> {
  try {
    // Get the weekly_streak mission
    const missionResult = await pool.query(
      `SELECT id, objective_value FROM missions WHERE mission_key = 'weekly_streak' AND is_active = true`
    );

    if (missionResult.rows.length === 0) return;

    const mission = missionResult.rows[0];
    const period = getWeeklyPeriod();

    // Count unique trading days within this weekly period
    const tradingDaysResult = await pool.query(
      `SELECT COUNT(DISTINCT DATE(opened_at)) as unique_days
       FROM trades
       WHERE user_id = $1
         AND opened_at >= $2
         AND opened_at < $3`,
      [userId, period.start, period.end]
    );

    const uniqueDays = parseInt(tradingDaysResult.rows[0].unique_days) || 0;

    // Upsert progress with the count of unique days (not increment)
    await pool.query(
      `INSERT INTO user_missions (user_id, mission_id, progress, period_start, period_end)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, mission_id, period_start)
       DO UPDATE SET progress = $3
       WHERE user_missions.is_completed = false`,
      [userId, mission.id, uniqueDays, period.start, period.end]
    );

    // Check if completed
    if (uniqueDays >= mission.objective_value) {
      await pool.query(
        `UPDATE user_missions SET is_completed = true, completed_at = NOW()
         WHERE user_id = $1 AND mission_id = $2 AND period_start = $3 AND is_completed = false`,
        [userId, mission.id, period.start]
      );
      console.log(`🎯 Trading streak mission completed: ${uniqueDays} unique days for user ${userId}`);
    } else {
      console.log(`📊 Trading streak updated: ${uniqueDays}/${mission.objective_value} days for user ${userId}`);
    }
  } catch (error) {
    console.error('Error updating trading streak progress:', error);
  }
}

// Helper: Update mission progress (called from other endpoints)
async function updateMissionProgress(userId: number, objectiveType: string, incrementBy: number = 1): Promise<void> {
  try {
    // Get missions matching this objective type
    const missionsResult = await pool.query(
      `SELECT id, mission_type, objective_value FROM missions
       WHERE objective_type = $1 AND is_active = true`,
      [objectiveType]
    );

    for (const mission of missionsResult.rows) {
      const period = getMissionPeriod(mission.mission_type);

      // Upsert progress
      const result = await pool.query(
        `INSERT INTO user_missions (user_id, mission_id, progress, period_start, period_end)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id, mission_id, period_start)
         DO UPDATE SET progress = user_missions.progress + $3
         WHERE user_missions.is_completed = false
         RETURNING progress`,
        [userId, mission.id, incrementBy, period.start, period.end]
      );

      // Check if completed
      if (result.rows.length > 0) {
        const newProgress = result.rows[0].progress;
        if (newProgress >= mission.objective_value) {
          await pool.query(
            `UPDATE user_missions SET is_completed = true, completed_at = NOW()
             WHERE user_id = $1 AND mission_id = $2 AND period_start = $3 AND is_completed = false`,
            [userId, mission.id, period.start]
          );
          console.log(`🎯 Mission auto-completed: mission ${mission.id} for user ${userId}`);
        }
      }
    }
  } catch (error) {
    console.error('Error updating mission progress:', error);
    // Don't throw - mission progress is non-critical
  }
}

// ============================================
// ADMIN API ENDPOINTS
// ============================================

/// Admin: Get comprehensive analytics dashboard
app.get('/api/admin/analytics', async (req: Request, res: Response) => {
  try {
    // === USER OVERVIEW ===
    const userOverview = await pool.query(`
      SELECT
        COUNT(*) as total_users,
        COUNT(CASE WHEN last_active >= NOW() - INTERVAL '24 hours' THEN 1 END) as active_24h,
        COUNT(CASE WHEN last_active >= NOW() - INTERVAL '7 days' THEN 1 END) as active_7d,
        COUNT(CASE WHEN last_active >= NOW() - INTERVAL '30 days' THEN 1 END) as active_30d,
        COUNT(CASE WHEN total_trades > 0 THEN 1 END) as users_with_trades,
        COUNT(CASE WHEN total_trades >= 10 THEN 1 END) as power_traders,
        COUNT(CASE WHEN total_trades >= 20 THEN 1 END) as super_traders
      FROM users
    `);
    const userStats = userOverview.rows[0];

    // === TRADING ACTIVITY BY DAY (last 14 days) ===
    const tradingByDay = await pool.query(`
      SELECT
        DATE(opened_at) as day,
        COUNT(*) as trades_opened,
        COUNT(CASE WHEN status = 'closed' THEN 1 END) as closed,
        COUNT(CASE WHEN status = 'liquidated' THEN 1 END) as liquidated,
        COUNT(DISTINCT user_id) as unique_traders,
        ROUND(AVG(leverage)::numeric, 1) as avg_leverage,
        ROUND(SUM(position_size)::numeric, 0) as total_volume
      FROM trades
      WHERE opened_at >= NOW() - INTERVAL '14 days'
      GROUP BY DATE(opened_at)
      ORDER BY day DESC
    `);

    // === LEVERAGE DISTRIBUTION ===
    const leverageStats = await pool.query(`
      SELECT
        leverage,
        COUNT(*) as trade_count,
        ROUND(COUNT(*)::numeric / NULLIF((SELECT COUNT(*) FROM trades), 0) * 100, 1) as percentage,
        COUNT(DISTINCT user_id) as unique_users
      FROM trades
      GROUP BY leverage
      ORDER BY trade_count DESC
      LIMIT 10
    `);

    // === ARMY ANALYSIS ===
    const armyStats = await pool.query(`
      SELECT
        army,
        COUNT(*) as users,
        ROUND(AVG(total_pnl)::numeric, 0) as avg_pnl,
        ROUND(SUM(total_pnl)::numeric, 0) as total_pnl,
        ROUND(AVG(total_trades)::numeric, 1) as avg_trades
      FROM users
      WHERE army IS NOT NULL
      GROUP BY army
    `);

    // === LONG VS SHORT ANALYSIS ===
    const positionTypeStats = await pool.query(`
      SELECT
        position_type,
        COUNT(*) as count,
        ROUND(COUNT(*)::numeric / NULLIF((SELECT COUNT(*) FROM trades), 0) * 100, 1) as percentage,
        COUNT(CASE WHEN status = 'closed' AND pnl > 0 THEN 1 END) as wins,
        COUNT(CASE WHEN status = 'closed' AND pnl <= 0 THEN 1 END) as losses,
        COUNT(CASE WHEN status = 'liquidated' THEN 1 END) as liquidations,
        ROUND(SUM(CASE WHEN pnl > 0 THEN pnl ELSE 0 END)::numeric, 0) as profit,
        ROUND(SUM(CASE WHEN pnl < 0 THEN pnl ELSE 0 END)::numeric, 0) as loss
      FROM trades
      GROUP BY position_type
    `);

    // === TOP TRADERS ===
    const topTraders = await pool.query(`
      SELECT
        COALESCE(u.username, LEFT(u.wallet_address, 8) || '...') as username,
        u.army,
        u.total_trades,
        ROUND(u.total_pnl::numeric, 0) as pnl,
        u.winning_trades,
        ROUND((u.winning_trades::float / NULLIF(u.total_trades, 0) * 100)::numeric, 0) as win_rate,
        u.times_liquidated as liquidations,
        ROUND(u.paper_balance::numeric, 0) as balance
      FROM users u
      WHERE u.total_trades > 0
      ORDER BY u.total_trades DESC
      LIMIT 15
    `);

    // === HOURLY ACTIVITY (UTC) ===
    const hourlyActivity = await pool.query(`
      SELECT
        EXTRACT(HOUR FROM opened_at)::int as hour_utc,
        COUNT(*) as trades,
        COUNT(DISTINCT user_id) as unique_traders
      FROM trades
      WHERE opened_at >= NOW() - INTERVAL '7 days'
      GROUP BY EXTRACT(HOUR FROM opened_at)
      ORDER BY trades DESC
      LIMIT 12
    `);

    // === NEW USER SIGNUPS BY DAY ===
    const newUsers = await pool.query(`
      SELECT
        DATE(created_at) as day,
        COUNT(*) as new_users
      FROM users
      WHERE created_at >= NOW() - INTERVAL '14 days'
      GROUP BY DATE(created_at)
      ORDER BY day DESC
    `);

    // === RETENTION FUNNEL ===
    const retentionFunnel = await pool.query(`
      SELECT
        'Registered' as metric, COUNT(*)::int as count FROM users
      UNION ALL
      SELECT 'Made 1+ trades', COUNT(*)::int FROM users WHERE total_trades >= 1
      UNION ALL
      SELECT 'Made 5+ trades', COUNT(*)::int FROM users WHERE total_trades >= 5
      UNION ALL
      SELECT 'Made 10+ trades', COUNT(*)::int FROM users WHERE total_trades >= 10
      UNION ALL
      SELECT 'Made 20+ trades', COUNT(*)::int FROM users WHERE total_trades >= 20
      UNION ALL
      SELECT 'Balance > 0', COUNT(*)::int FROM users WHERE paper_balance > 0
      UNION ALL
      SELECT 'Positive P&L', COUNT(*)::int FROM users WHERE total_pnl > 0
      UNION ALL
      SELECT 'Got liquidated', COUNT(*)::int FROM users WHERE times_liquidated > 0
    `);

    // === CURRENT STATE ===
    const currentState = await pool.query(`
      SELECT
        COUNT(DISTINCT user_id) as users_with_open,
        COUNT(*) as total_open,
        ROUND(SUM(position_size / leverage)::numeric, 0) as collateral_at_risk
      FROM trades
      WHERE status = 'open'
    `);

    // === MISSIONS ENGAGEMENT ===
    const missionsEngagement = await pool.query(`
      SELECT
        m.title,
        m.mission_type,
        COUNT(um.id) as total_progress,
        COUNT(CASE WHEN um.is_completed THEN 1 END) as completed,
        COUNT(CASE WHEN um.is_claimed THEN 1 END) as claimed,
        ROUND(m.reward_amount / 100.0, 0) as reward
      FROM missions m
      LEFT JOIN user_missions um ON m.id = um.mission_id
      GROUP BY m.id, m.title, m.mission_type, m.reward_amount, m.display_order
      ORDER BY m.mission_type, m.display_order
    `);

    // === CLAIMS ACTIVITY ===
    const claimsActivity = await pool.query(`
      SELECT
        DATE(claimed_at) as day,
        COUNT(*) as claims,
        COUNT(DISTINCT user_id) as unique_claimers,
        ROUND(SUM(amount)::numeric, 0) as total_claimed
      FROM claims
      WHERE claimed_at >= NOW() - INTERVAL '14 days'
      GROUP BY DATE(claimed_at)
      ORDER BY day DESC
    `);

    // === PAPER MONEY ECONOMY STATS ===
    // Total trading fees collected (calculated from closed/liquidated trades)
    // Fee formula: leverage > 1 ? leverage * 0.05% of position_size : 0
    const feesCollected = await pool.query(`
      SELECT
        ROUND(SUM(
          CASE WHEN leverage > 1 THEN (leverage * 0.05 / 100) * position_size ELSE 0 END
        )::numeric, 2) as total_fees
      FROM trades
      WHERE status IN ('closed', 'liquidated')
    `);

    // Total claims distributed (all time)
    const totalClaimsDistributed = await pool.query(`
      SELECT
        COUNT(*) as claim_count,
        ROUND(SUM(amount)::numeric, 2) as total_amount
      FROM claims
    `);

    // Total mission rewards distributed (all time)
    const totalMissionRewards = await pool.query(`
      SELECT
        COUNT(um.id) as missions_claimed,
        ROUND(SUM(m.reward_amount) / 100.0, 2) as total_rewards
      FROM user_missions um
      JOIN missions m ON m.id = um.mission_id
      WHERE um.is_claimed = true
    `);

    // Total referral rewards distributed (all time)
    const totalReferralRewards = await pool.query(`
      SELECT
        COUNT(*) as completed_referrals,
        ROUND(SUM(referrer_reward + referred_reward) / 100.0, 2) as total_rewards
      FROM referrals
      WHERE status = 'completed'
    `);

    // Build legacy format for backward compatibility
    const totalUsers = parseInt(userStats.total_users);
    const activeUsers24h = parseInt(userStats.active_24h);
    const totalTrades = tradingByDay.rows.reduce((sum: number, r: { trades_opened: string }) => sum + parseInt(r.trades_opened || '0'), 0) ||
      (await pool.query('SELECT COUNT(*) as c FROM trades')).rows[0].c;
    const totalVolume = tradingByDay.rows.reduce((sum: number, r: { total_volume: string }) => sum + parseFloat(r.total_volume || '0'), 0);

    let bullsCount = 0, bearsCount = 0, bullsPnl = 0, bearsPnl = 0;
    for (const row of armyStats.rows) {
      if (row.army === 'bulls') {
        bullsCount = parseInt(row.users);
        bullsPnl = parseFloat(row.total_pnl);
      } else if (row.army === 'bears') {
        bearsCount = parseInt(row.users);
        bearsPnl = parseFloat(row.total_pnl);
      }
    }

    const missionsClaimed = missionsEngagement.rows.reduce((sum: number, r: { claimed: string }) => sum + parseInt(r.claimed || '0'), 0);
    const missionsRewards = missionsEngagement.rows.reduce((sum: number, r: { claimed: string; reward: string }) => sum + (parseInt(r.claimed || '0') * parseFloat(r.reward || '0') * 100), 0);

    res.json({
      success: true,
      analytics: {
        // Legacy fields
        totalUsers,
        activeUsers24h,
        totalTrades: parseInt((await pool.query('SELECT COUNT(*) as c FROM trades')).rows[0].c),
        totalVolume: parseFloat((await pool.query('SELECT COALESCE(SUM(position_size), 0) as v FROM trades')).rows[0].v),
        bullsCount,
        bearsCount,
        bullsPnl,
        bearsPnl,
        totalMissionsClaimed: missionsClaimed,
        totalMissionsRewards: missionsRewards,

        // New detailed stats
        userOverview: {
          total: parseInt(userStats.total_users),
          active24h: parseInt(userStats.active_24h),
          active7d: parseInt(userStats.active_7d),
          active30d: parseInt(userStats.active_30d),
          withTrades: parseInt(userStats.users_with_trades),
          powerTraders: parseInt(userStats.power_traders),
          superTraders: parseInt(userStats.super_traders)
        },
        tradingByDay: tradingByDay.rows,
        leverageDistribution: leverageStats.rows,
        armyAnalysis: armyStats.rows,
        positionTypeAnalysis: positionTypeStats.rows,
        topTraders: topTraders.rows,
        hourlyActivity: hourlyActivity.rows,
        newUsersByDay: newUsers.rows,
        retentionFunnel: retentionFunnel.rows,
        currentState: currentState.rows[0],
        missionsEngagement: missionsEngagement.rows,
        claimsActivity: claimsActivity.rows,

        // Paper money economy
        paperMoneyEconomy: {
          feesCollected: parseFloat(feesCollected.rows[0]?.total_fees || '0'),
          claims: {
            count: parseInt(totalClaimsDistributed.rows[0]?.claim_count || '0'),
            totalAmount: parseFloat(totalClaimsDistributed.rows[0]?.total_amount || '0')
          },
          missionRewards: {
            claimedCount: parseInt(totalMissionRewards.rows[0]?.missions_claimed || '0'),
            totalAmount: parseFloat(totalMissionRewards.rows[0]?.total_rewards || '0')
          },
          referralRewards: {
            completedCount: parseInt(totalReferralRewards.rows[0]?.completed_referrals || '0'),
            totalAmount: parseFloat(totalReferralRewards.rows[0]?.total_rewards || '0')
          },
          totalAwarded: parseFloat(totalClaimsDistributed.rows[0]?.total_amount || '0') +
                        parseFloat(totalMissionRewards.rows[0]?.total_rewards || '0') +
                        parseFloat(totalReferralRewards.rows[0]?.total_rewards || '0')
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
});

// Admin: Balance Audit - Check all user balances and optionally fix discrepancies
app.get('/api/admin/audit', async (req: Request, res: Response) => {
  try {
    const autoFix = req.query.autoFix === 'true';

    // Calculate expected balance for all users
    // Uses CALCULATED PnL from trades (not stored total_pnl) + balance_adjustment for manual corrections
    const auditResult = await pool.query(`
      WITH user_claims AS (
        SELECT user_id, COALESCE(SUM(amount), 0) / 100.0 as total_claims
        FROM claims GROUP BY user_id
      ),
      user_missions AS (
        -- reward_paid is stored in dollars directly (not cents)
        SELECT user_id, COALESCE(SUM(reward_paid), 0) as total_mission_rewards
        FROM user_missions
        WHERE is_claimed = true GROUP BY user_id
      ),
      user_referrer_rewards AS (
        -- Only count CLAIMED referrer rewards (referrer_claimed = true)
        SELECT referrer_id as user_id, COALESCE(SUM(referrer_reward), 0) / 100.0 as referrer_rewards
        FROM referrals WHERE referrer_claimed = true GROUP BY referrer_id
      ),
      user_referred_rewards AS (
        -- Only count CLAIMED referred rewards (referred_claimed = true)
        SELECT referred_user_id as user_id, COALESCE(SUM(referred_reward), 0) / 100.0 as referred_rewards
        FROM referrals WHERE referred_claimed = true GROUP BY referred_user_id
      ),
      user_pnl AS (
        -- Calculate CORRECT PnL from price changes, not stored (buggy) values
        SELECT user_id, COALESCE(SUM(
          CASE
            WHEN position_type = 'long' THEN ((exit_price - entry_price) / NULLIF(entry_price, 0)) * position_size
            WHEN position_type = 'short' THEN ((entry_price - exit_price) / NULLIF(entry_price, 0)) * position_size
          END
        ), 0) as calculated_pnl
        FROM trades
        WHERE status IN ('closed', 'liquidated')
          AND exit_price IS NOT NULL
          AND entry_price > 0
        GROUP BY user_id
      ),
      open_positions AS (
        SELECT user_id, COALESCE(SUM(position_size / leverage), 0) as collateral_locked
        FROM trades WHERE status = 'open' GROUP BY user_id
      )
      SELECT
        u.id,
        u.username,
        u.paper_balance as current_balance,
        COALESCE(op.collateral_locked, 0) as open_collateral,
        u.paper_balance + COALESCE(op.collateral_locked, 0) as total_assets,
        COALESCE(pnl.calculated_pnl, 0) as total_pnl,
        COALESCE(u.balance_adjustment, 0) as balance_adjustment,
        COALESCE(c.total_claims, 0) as claims,
        COALESCE(m.total_mission_rewards, 0) as missions,
        COALESCE(rr.referrer_rewards, 0) + COALESCE(rd.referred_rewards, 0) as referrals,
        COALESCE(u.balance_adjustment, 0) as balance_adjustment,
        -- Max assets = starting + claims + missions + referrals + pnl (NO balance_adjustment - that's for correction)
        ROUND((10000 + COALESCE(c.total_claims, 0) + COALESCE(m.total_mission_rewards, 0) +
               COALESCE(rr.referrer_rewards, 0) + COALESCE(rd.referred_rewards, 0) +
               COALESCE(pnl.calculated_pnl, 0))::numeric, 2) as max_assets,
        -- Expected available = max_assets - open_collateral
        ROUND((10000 + COALESCE(c.total_claims, 0) + COALESCE(m.total_mission_rewards, 0) +
               COALESCE(rr.referrer_rewards, 0) + COALESCE(rd.referred_rewards, 0) +
               COALESCE(pnl.calculated_pnl, 0) - COALESCE(op.collateral_locked, 0))::numeric, 2) as expected_balance,
        -- Discrepancy: (paper_balance + adjustment) vs expected (positive = user has more than expected)
        ROUND(((u.paper_balance + COALESCE(u.balance_adjustment, 0)) - (10000 + COALESCE(c.total_claims, 0) + COALESCE(m.total_mission_rewards, 0) +
               COALESCE(rr.referrer_rewards, 0) + COALESCE(rd.referred_rewards, 0) +
               COALESCE(pnl.calculated_pnl, 0) - COALESCE(op.collateral_locked, 0)))::numeric, 2) as discrepancy,
        CASE WHEN COALESCE(op.collateral_locked, 0) > 0 THEN true ELSE false END as has_open_positions
      FROM users u
      LEFT JOIN user_claims c ON c.user_id = u.id
      LEFT JOIN user_missions m ON m.user_id = u.id
      LEFT JOIN user_referrer_rewards rr ON rr.user_id = u.id
      LEFT JOIN user_referred_rewards rd ON rd.user_id = u.id
      LEFT JOIN user_pnl pnl ON pnl.user_id = u.id
      LEFT JOIN open_positions op ON op.user_id = u.id
      ORDER BY ABS((u.paper_balance + COALESCE(u.balance_adjustment, 0)) - (10000 + COALESCE(c.total_claims, 0) + COALESCE(m.total_mission_rewards, 0) +
               COALESCE(rr.referrer_rewards, 0) + COALESCE(rd.referred_rewards, 0) +
               COALESCE(pnl.calculated_pnl, 0) - COALESCE(op.collateral_locked, 0))) DESC
    `);

    const allUsers = auditResult.rows;
    const discrepancies = allUsers.filter((u: any) => Math.abs(u.discrepancy) > 1);
    const fixable = discrepancies.filter((u: any) => !u.has_open_positions);
    const needsManualReview = discrepancies.filter((u: any) => u.has_open_positions);

    let fixedUsers: any[] = [];

    // Auto-fix users without open positions if requested
    // For users without open positions, set paper_balance directly and reset adjustment
    if (autoFix && fixable.length > 0) {
      for (const user of fixable) {
        await pool.query(
          'UPDATE users SET paper_balance = $1, balance_adjustment = 0 WHERE id = $2',
          [user.expected_balance, user.id]
        );
        fixedUsers.push({
          id: user.id,
          username: user.username,
          previousBalance: user.current_balance,
          newBalance: user.expected_balance,
          adjustment: Number(user.expected_balance) - Number(user.current_balance)
        });
        console.log(`🔧 Auto-fixed balance for ${user.username}: $${user.current_balance} -> $${user.expected_balance}`);
      }
    }

    // Summary stats
    const summary = {
      totalUsers: allUsers.length,
      usersWithDiscrepancy: discrepancies.length,
      usersFixable: fixable.length,
      usersNeedingManualReview: needsManualReview.length,
      totalExcess: discrepancies.filter((u: any) => u.discrepancy > 0).reduce((sum: number, u: any) => sum + Number(u.discrepancy), 0),
      totalDeficit: discrepancies.filter((u: any) => u.discrepancy < 0).reduce((sum: number, u: any) => sum + Math.abs(Number(u.discrepancy)), 0),
      usersFixed: fixedUsers.length
    };

    res.json({
      success: true,
      summary,
      discrepancies: discrepancies.map((u: any) => ({
        id: u.id,
        username: u.username,
        currentBalance: Number(u.current_balance),
        openCollateral: Number(u.open_collateral),
        totalAssets: Number(u.total_assets),
        maxAssets: Number(u.max_assets),
        expectedBalance: Number(u.expected_balance),
        discrepancy: Number(u.discrepancy),
        hasOpenPositions: u.has_open_positions,
        claims: Number(u.claims),
        missions: Number(u.missions),
        referrals: Number(u.referrals),
        pnl: Number(u.total_pnl)
      })),
      fixedUsers,
      auditTimestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error running balance audit:', error);
    res.status(500).json({ success: false, message: 'Failed to run audit' });
  }
});

// Admin: Get users list with pagination and search
app.get('/api/admin/users', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string || '';
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: (string | number)[] = [];

    if (search) {
      whereClause = `WHERE username ILIKE $1 OR wallet_address ILIKE $1 OR fid::text = $2`;
      params.push(`%${search}%`, search);
    }

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as count FROM users ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get users
    const usersResult = await pool.query(
      `SELECT id, fid, username, wallet_address, army, paper_balance, total_pnl,
              total_trades, winning_trades, times_liquidated, battle_tokens_earned,
              created_at, last_active
       FROM users
       ${whereClause}
       ORDER BY last_active DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      users: usersResult.rows,
      total,
      page,
      limit
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// Admin: Update user balance
app.post('/api/admin/users/balance', async (req: Request, res: Response) => {
  try {
    const { userId, newBalance } = req.body;

    if (!userId || newBalance === undefined) {
      return res.status(400).json({ success: false, message: 'Missing userId or newBalance' });
    }

    await pool.query(
      'UPDATE users SET paper_balance = $1 WHERE id = $2',
      [newBalance, userId]
    );

    console.log(`[ADMIN] Updated user ${userId} balance to ${newBalance}`);
    res.json({ success: true, message: 'Balance updated' });
  } catch (error) {
    console.error('Error updating user balance:', error);
    res.status(500).json({ success: false, message: 'Failed to update balance' });
  }
});

// Admin: Reset user stats
app.post('/api/admin/users/reset', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'Missing userId' });
    }

    await pool.query(
      `UPDATE users SET
        paper_balance = 10000,
        total_pnl = 0,
        total_trades = 0,
        winning_trades = 0,
        current_streak = 0,
        best_streak = 0,
        times_liquidated = 0,
        total_volume = 0
       WHERE id = $1`,
      [userId]
    );

    // Close all open trades
    await pool.query(
      `UPDATE trades SET status = 'closed', exit_price = entry_price, pnl = 0, closed_at = NOW()
       WHERE user_id = $1 AND status = 'open'`,
      [userId]
    );

    console.log(`[ADMIN] Reset stats for user ${userId}`);
    res.json({ success: true, message: 'User stats reset' });
  } catch (error) {
    console.error('Error resetting user stats:', error);
    res.status(500).json({ success: false, message: 'Failed to reset stats' });
  }
});

// Admin: Get all missions with stats
app.get('/api/admin/missions', async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT
        m.*,
        COALESCE(
          (SELECT COUNT(*) FROM user_missions um WHERE um.mission_id = m.id AND um.is_completed = true),
          0
        ) as completions_count,
        COALESCE(
          (SELECT COUNT(*) FROM user_missions um WHERE um.mission_id = m.id AND um.is_claimed = true),
          0
        ) as claims_count
      FROM missions m
      ORDER BY m.mission_type, m.display_order
    `);

    res.json({
      success: true,
      missions: result.rows
    });
  } catch (error) {
    console.error('Error fetching admin missions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch missions' });
  }
});

// Admin: Update mission
app.post('/api/admin/missions/update', async (req: Request, res: Response) => {
  try {
    const { id, title, description, objective_value, reward_amount, icon } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Missing mission id' });
    }

    await pool.query(
      `UPDATE missions SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        objective_value = COALESCE($3, objective_value),
        reward_amount = COALESCE($4, reward_amount),
        icon = COALESCE($5, icon)
       WHERE id = $6`,
      [title, description, objective_value, reward_amount, icon, id]
    );

    console.log(`[ADMIN] Updated mission ${id}`);
    res.json({ success: true, message: 'Mission updated' });
  } catch (error) {
    console.error('Error updating mission:', error);
    res.status(500).json({ success: false, message: 'Failed to update mission' });
  }
});

// Admin: Toggle mission active status
app.post('/api/admin/missions/toggle', async (req: Request, res: Response) => {
  try {
    const { missionId, isActive } = req.body;

    if (!missionId || isActive === undefined) {
      return res.status(400).json({ success: false, message: 'Missing missionId or isActive' });
    }

    await pool.query(
      'UPDATE missions SET is_active = $1 WHERE id = $2',
      [isActive, missionId]
    );

    console.log(`[ADMIN] Toggled mission ${missionId} active=${isActive}`);
    res.json({ success: true, message: 'Mission toggled' });
  } catch (error) {
    console.error('Error toggling mission:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle mission' });
  }
});

// Admin: Get recent activity feed
app.get('/api/admin/activity', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;

    // Get recent trades (opened, closed, liquidated, stopped by stop loss)
    const recentTrades = await pool.query(`
      SELECT
        t.id,
        'trade' as type,
        CASE
          WHEN t.closed_by = 'stop_loss' THEN 'stopped'
          ELSE t.status
        END as action,
        t.position_type,
        t.leverage,
        ROUND(t.position_size::numeric, 0) as amount,
        ROUND(t.pnl::numeric, 0) as pnl,
        COALESCE(u.username, LEFT(u.wallet_address, 8) || '...') as username,
        u.army,
        CASE
          WHEN t.status = 'open' THEN t.opened_at
          ELSE COALESCE(t.closed_at, t.opened_at)
        END as timestamp
      FROM trades t
      JOIN users u ON t.user_id = u.id
      WHERE t.opened_at >= NOW() - INTERVAL '24 hours'
         OR t.closed_at >= NOW() - INTERVAL '24 hours'
      ORDER BY CASE
        WHEN t.status = 'open' THEN t.opened_at
        ELSE COALESCE(t.closed_at, t.opened_at)
      END DESC
      LIMIT $1
    `, [limit]);

    // Get recent user signups
    const recentSignups = await pool.query(`
      SELECT
        id,
        'signup' as type,
        'new_user' as action,
        COALESCE(username, LEFT(wallet_address, 8) || '...') as username,
        army,
        created_at as timestamp
      FROM users
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT $1
    `, [limit]);

    // Get recent claims
    const recentClaims = await pool.query(`
      SELECT
        c.id,
        'claim' as type,
        'claimed' as action,
        ROUND(c.amount::numeric, 0) as amount,
        COALESCE(u.username, LEFT(u.wallet_address, 8) || '...') as username,
        u.army,
        c.claimed_at as timestamp
      FROM claims c
      JOIN users u ON c.user_id = u.id
      WHERE c.claimed_at >= NOW() - INTERVAL '24 hours'
      ORDER BY c.claimed_at DESC
      LIMIT $1
    `, [limit]);

    // Get recent mission completions
    const recentMissions = await pool.query(`
      SELECT
        um.id,
        'mission' as type,
        CASE WHEN um.is_claimed THEN 'mission_claimed' ELSE 'mission_completed' END as action,
        m.title as mission_title,
        m.icon as mission_icon,
        ROUND(m.reward_amount / 100.0, 0) as amount,
        COALESCE(u.username, LEFT(u.wallet_address, 8) || '...') as username,
        u.army,
        COALESCE(um.claimed_at, um.completed_at) as timestamp
      FROM user_missions um
      JOIN missions m ON um.mission_id = m.id
      JOIN users u ON um.user_id = u.id
      WHERE (um.completed_at >= NOW() - INTERVAL '24 hours' OR um.claimed_at >= NOW() - INTERVAL '24 hours')
        AND um.is_completed = true
      ORDER BY COALESCE(um.claimed_at, um.completed_at) DESC
      LIMIT $1
    `, [limit]);

    // Combine and sort all activities
    const allActivities = [
      ...recentTrades.rows.map(r => ({
        ...r,
        timestamp: new Date(r.timestamp)
      })),
      ...recentSignups.rows.map(r => ({
        ...r,
        timestamp: new Date(r.timestamp)
      })),
      ...recentClaims.rows.map(r => ({
        ...r,
        timestamp: new Date(r.timestamp)
      })),
      ...recentMissions.rows.map(r => ({
        ...r,
        timestamp: new Date(r.timestamp)
      }))
    ]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);

    res.json({
      success: true,
      activities: allActivities
    });
  } catch (error) {
    console.error('Error fetching admin activity:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch activity' });
  }
});

// ============================================
// MAINTENANCE MODE ADMIN ENDPOINTS
// ============================================

// Get maintenance status (public)
app.get('/api/maintenance/status', async (req: Request, res: Response) => {
  res.json({
    success: true,
    maintenance: {
      enabled: maintenanceMode.enabled,
      message: maintenanceMode.message,
      estimatedEndTime: maintenanceMode.estimatedEndTime
    }
  });
});

// Get maintenance status (admin only - full details)
app.get('/api/admin/maintenance', adminAuth, async (req: Request, res: Response) => {
  res.json({
    success: true,
    enabled: maintenanceMode.enabled,
    message: maintenanceMode.message,
    enabledAt: maintenanceMode.enabledAt,
    enabledBy: maintenanceMode.enabledBy,
    estimatedEndTime: maintenanceMode.estimatedEndTime
  });
});

// Toggle maintenance mode (admin only)
app.post('/api/admin/maintenance', adminAuth, async (req: Request, res: Response) => {
  const { enabled, message, durationMinutes } = req.body;
  const ip = (req as any).adminIp || 'unknown';

  try {
    const newEnabled = enabled === true;
    const newMessage = message || 'Trading is temporarily disabled for scheduled maintenance.';
    const estimatedEnd = durationMinutes
      ? new Date(Date.now() + durationMinutes * 60 * 1000)
      : null;

    // Update database
    await pool.query(`
      UPDATE maintenance_settings
      SET enabled = $1,
          message = $2,
          enabled_at = $3,
          enabled_by = $4,
          estimated_end_time = $5
      WHERE id = 1
    `, [
      newEnabled,
      newMessage,
      newEnabled ? new Date() : null,
      newEnabled ? ip : null,
      estimatedEnd
    ]);

    // Update in-memory state
    maintenanceMode = {
      enabled: newEnabled,
      message: newMessage,
      enabledAt: newEnabled ? new Date() : null,
      enabledBy: newEnabled ? ip : null,
      estimatedEndTime: estimatedEnd
    };

    auditLog(
      newEnabled ? 'MAINTENANCE_ENABLED' : 'MAINTENANCE_DISABLED',
      { message: newMessage, durationMinutes, estimatedEnd },
      ip,
      true
    );

    console.log(newEnabled
      ? `⚠️ MAINTENANCE MODE ENABLED by ${ip}`
      : `✅ MAINTENANCE MODE DISABLED by ${ip}`
    );

    res.json({
      success: true,
      maintenance: maintenanceMode
    });
  } catch (error) {
    console.error('Error toggling maintenance mode:', error);
    res.status(500).json({ success: false, message: 'Failed to toggle maintenance mode' });
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

// Sentry error handler - must be before other error handlers
Sentry.setupExpressErrorHandler(app);

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

  // ============================================
  // CRON JOBS - Daily Notification Scheduler
  // ============================================

  // Send daily reminders at 12:00 PM UTC (8 AM EST / 5 AM PST)
  // This is a good time when traders check their positions
  cron.schedule('0 12 * * *', async () => {
    console.log('⏰ Running daily notification cron job...');

    try {
      const response = await fetch(`http://localhost:${PORT}/api/notifications/daily-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json() as { stats?: { total: number; sent: number; failed: number } };
      console.log('✅ Daily reminders sent:', result.stats);
    } catch (error) {
      console.error('❌ Failed to send daily reminders:', error);
    }
  }, {
    timezone: "UTC"
  });

  console.log('📅 Cron scheduler started: Daily reminders at 12:00 PM UTC');
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
