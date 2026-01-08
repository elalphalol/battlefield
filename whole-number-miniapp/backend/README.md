# BATTLEFIELD Backend API

Express.js backend server for BATTLEFIELD paper trading game.

## 🚀 Quick Start

```bash
# Install dependencies
cd backend
npm install

# Set up environment variables
cp ../.env.local.example ../.env.local
# Edit .env.local with your DATABASE_URL

# Run development server
npm run dev

# Build for production
npm run build
npm start
```

## 📡 API Endpoints

### Health Check
- `GET /health` - Check server and database status

### Users
- `POST /api/users` - Create or update user
- `GET /api/users/:walletAddress` - Get user by wallet
- `PATCH /api/users/:walletAddress/army` - Update user's army

### Paper Money Claims
- `POST /api/claims/status` - Check if user can claim
- `POST /api/claims` - Claim $1,000 paper money

### Trading
- `POST /api/trades/open` - Open new position
- `POST /api/trades/close` - Close position
- `GET /api/trades/:walletAddress/open` - Get open trades
- `GET /api/trades/:walletAddress/history` - Get trade history

### Leaderboard
- `GET /api/leaderboard` - Get leaderboard (optionally filtered by army)
- `GET /api/leaderboard/rank/:walletAddress` - Get user's rank

### Army Stats
- `GET /api/army/stats` - Get Bears vs Bulls statistics

### System Config
- `GET /api/config` - Get system configuration

## 🔧 Environment Variables

Required in `.env.local`:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/battlefield
PORT=3001
NODE_ENV=development
```

## 📝 API Examples

### Create User
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "fid": 12345,
    "walletAddress": "0x1234...",
    "username": "trader1",
    "army": "bulls"
  }'
```

### Claim Paper Money
```bash
curl -X POST http://localhost:3001/api/claims \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0x1234..."}'
```

### Open Trade
```bash
curl -X POST http://localhost:3001/api/trades/open \
  -H "Content-Type: application/json" \
  -d '{
    "walletAddress": "0x1234...",
    "type": "long",
    "leverage": 50,
    "size": 1000,
    "entryPrice": 91500
  }'
```

## 🗄️ Database

Requires PostgreSQL 14+. See `database/README.md` for setup instructions.

## 📦 Dependencies

- **express** - Web framework
- **cors** - CORS middleware
- **dotenv** - Environment variables
- **pg** - PostgreSQL client

## 🛠️ Development

```bash
# Watch mode with auto-reload
npm run dev

# Type checking
tsc --noEmit

# Build
npm run build
```

## 🚀 Deployment

### Railway
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway up
```

### Render
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically

See main README for full deployment guide.

⚔️ **Bears 🐻 vs Bulls 🐂**
