# 🚀 Quick Start: Upgrade to 200x Leverage

## ⚡ EASIEST METHOD: Run the Migration Script

I've created a simple script that will upgrade your database. Just follow these 3 steps:

### Step 1: Get Your Database URL from Railway

1. Go to your Railway dashboard: https://railway.app/
2. Open your project
3. Click on your **PostgreSQL** service (in your services list)
4. Click on the **"Variables"** tab (or "Connect" tab)
5. Find **DATABASE_URL** and copy the full connection string
   - It looks like: `postgresql://postgres:password@hostname:port/railway`
   - Click the copy icon next to it

### Step 2: Add DATABASE_URL to Your .env File

In your project root, create or edit the `.env` file in the `backend` folder:

```bash
# backend/.env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:PORT/railway
```

**OR** you can paste it directly into the script at line 10:
```javascript
const connectionString = process.env.DATABASE_URL || "paste-your-url-here";
```

### Step 3: Run the Migration Script

Open your terminal in the project root and run:

```bash
# Make sure you're in the backend directory
cd whole-number-miniapp/backend

# Install pg if you haven't already
npm install pg

# Run the upgrade script
node upgrade-leverage.js
```

You should see:
```
🚀 Starting upgrade to 200x leverage...
📊 Step 1: Checking current constraint...
✅ Current constraint: CHECK ((leverage >= 1) AND (leverage <= 100))
...
🎉 UPGRADE COMPLETE!
```

### Step 4: Redeploy (if needed)

After the script succeeds, you can safely redeploy your backend on Railway without any crashes!

---

## 🔧 Alternative Method: Use Railway CLI

If you have Railway CLI installed:

```bash
# Login to Railway
railway login

# Link to your project
railway link

# Connect to database and run SQL
railway run psql $DATABASE_URL -c "ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_leverage_check; ALTER TABLE trades ADD CONSTRAINT trades_leverage_check CHECK (leverage >= 1 AND leverage <= 200);"
```

---

## 📋 Alternative Method: TablePlus or pgAdmin

If you have a PostgreSQL client like TablePlus or pgAdmin:

1. Get your DATABASE_URL from Railway (see Step 1 above)
2. Open your PostgreSQL client
3. Create a new connection using the DATABASE_URL details:
   - Host: (from URL)
   - Port: (from URL)
   - User: postgres
   - Password: (from URL)
   - Database: railway
4. Once connected, run this SQL:

```sql
ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_leverage_check;
ALTER TABLE trades ADD CONSTRAINT trades_leverage_check 
  CHECK (leverage >= 1 AND leverage <= 200);
```

---

## ✅ How to Verify It Worked

Run this SQL to check:

```sql
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'trades_leverage_check';
```

You should see: `CHECK ((leverage >= 1) AND (leverage <= 200))`

---

## ❓ Troubleshooting

### "DATABASE_URL not found"
- Make sure you added it to your `.env` file in the backend folder
- Or paste it directly in the script

### "Connection refused" or SSL error
- The script handles SSL automatically
- Make sure your IP is allowed (Railway usually allows all)

### "pg module not found"
```bash
cd whole-number-miniapp/backend
npm install pg
```

### Script runs but nothing happens
- Check the output - it will tell you exactly what's happening
- The script is safe and can be run multiple times

---

## 🎯 Summary

**Easiest approach:**
1. Copy DATABASE_URL from Railway dashboard
2. Add to `backend/.env` file
3. Run: `node backend/upgrade-leverage.js`
4. Done! ✅

**Time required:** < 2 minutes  
**Risk:** Zero (safe, reversible)  
**Downtime:** None

---

Need help? The script provides detailed output at each step showing exactly what it's doing!
