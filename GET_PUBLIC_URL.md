# 🔗 Getting the PUBLIC Database URL from Railway

## The Issue
The URL you have (`postgres.railway.internal`) only works INSIDE Railway's network. To connect from your local machine, you need the PUBLIC URL.

## ✅ How to Get the PUBLIC Database URL

### Option 1: Railway Dashboard (Easiest)

1. Go to your Railway dashboard: https://railway.app/
2. Open your project
3. Click on your **PostgreSQL** service
4. Look for the **"Connect"** tab or section
5. You'll see different connection options:
   - **Private URL** (postgres.railway.internal) ❌ Don't use this
   - **PUBLIC URL** (something like `monorail.proxy.rlwy.net` or similar) ✅ Use this one!

**The PUBLIC URL should look like:**
```
postgresql://postgres:PASSWORD@monorail.proxy.rlwy.net:12345/railway
```
or
```
postgresql://postgres:PASSWORD@containers-us-west-123.railway.app:6543/railway
```

### Option 2: In Railway Variables Tab

1. Railway Dashboard → Your Project → PostgreSQL
2. Click **"Variables"** tab
3. Look for either:
   - `DATABASE_PUBLIC_URL` (if it exists)
   - Or manually find the **host** value that's NOT `postgres.railway.internal`

### Option 3: Enable TCP Proxy (if you don't see public URL)

If you only see the internal URL, you may need to enable the public endpoint:

1. Railway Dashboard → PostgreSQL service
2. Look for **Settings** or **Networking**
3. Enable **"Public Networking"** or **"TCP Proxy"**
4. This will generate a public host like `containers-us-west-xxx.railway.app`

---

## 📝 Once You Have the Public URL

Update your `.env` file:

```bash
# whole-number-miniapp/backend/.env
DATABASE_URL=postgresql://postgres:QatWURBnrZpzqUfoiBwUdbnPyjzSdjcL@PUBLIC_HOST_HERE:PORT/railway
```

Then run the migration:
```bash
cd whole-number-miniapp/backend
node upgrade-leverage.js
```

---

## 🚀 Alternative: Run Migration FROM Railway

Since you're already ON Railway, you can run the migration as a one-time job:

### Method: Add Migration Command to Railway

1. Go to Railway Dashboard → Your Backend Service
2. Go to **"Settings"**
3. Look for **"Start Command"** or run a one-time command
4. Run this command:

```bash
node -e "const{Pool}=require('pg');const p=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});p.query('ALTER TABLE trades DROP CONSTRAINT IF EXISTS trades_leverage_check').then(()=>p.query('ALTER TABLE trades ADD CONSTRAINT trades_leverage_check CHECK (leverage>=1 AND leverage<=200)')).then(()=>{console.log('✅ Upgraded to 200x!');process.exit(0)}).catch(e=>{console.error(e);process.exit(1)})"
```

This one-liner will run the migration directly on Railway where it CAN access the internal database URL.

---

## 🎯 Recommendation

**Easiest approach:** 
Get the PUBLIC database URL from Railway and update your `.env` file. The public URL will work from anywhere!
