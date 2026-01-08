# ⚔️ WHOLE NUMBER WAR - Farcaster Mini App

A Bitcoin strategy battle game built as a Farcaster Mini App using Base's OnchainKit.

## 🚀 Live Demo
Currently running at: `http://localhost:3000`

## ✅ Features Implemented

- ✅ **Live Bitcoin Price Tracking** - Real-time BTC price from multiple APIs
- ✅ **Whole Number Strategy** - Calculate coordinates, zones, and beams
- ✅ **Market Direction Detection** - Bullish/Bearish/Neutral signals
- ✅ **Intelligent Recommendations** - Action suggestions based on market conditions
- ✅ **Wallet Connection** - OnchainKit integration for Base network
- ✅ **Farcaster Integration** - Share results to Farcaster feed
- ✅ **Frame Metadata** - Ready for Warpcast embedding
- ✅ **Responsive Design** - Works on mobile and desktop

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Blockchain**: Base L2 (via OnchainKit)
- **Wallet**: Wagmi + Viem
- **Social**: Farcaster Frame SDK
- **Data Fetching**: Axios + TanStack Query

## 📦 Installation

Already installed! Dependencies include:
```
@coinbase/onchainkit
wagmi
viem@2.x
@tanstack/react-query
@farcaster/frame-sdk
date-fns
axios
```

## ⚙️ Configuration

### Environment Variables (`.env.local`)

You need to add your API keys:

```bash
# Get from: https://portal.cdp.coinbase.com/
NEXT_PUBLIC_ONCHAINKIT_API_KEY=your_coinbase_api_key_here

# Base Network (8453 = Mainnet, 84532 = Sepolia Testnet)
NEXT_PUBLIC_CHAIN_ID=8453

# Your deployment URL (update after deploying)
NEXT_PUBLIC_APP_URL=https://your-app-url.vercel.app

# Optional: WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

**🔑 To get your OnchainKit API Key:**
1. Go to [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)
2. Sign in or create account
3. Create a new project
4. Copy your API key
5. Paste it in `.env.local`

## 🚀 Deployment to Vercel

### Step 1: Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit - Whole Number War Mini App"
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Step 3: Add Environment Variables in Vercel

In Vercel Dashboard → Your Project → Settings → Environment Variables:

Add these variables:
- `NEXT_PUBLIC_ONCHAINKIT_API_KEY`
- `NEXT_PUBLIC_CHAIN_ID`
- `NEXT_PUBLIC_APP_URL` (use your vercel domain)
- `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` (optional)

### Step 4: Redeploy

After adding environment variables, redeploy:
- Go to Deployments tab
- Click "..." on latest deployment
- Click "Redeploy"

## 🖼️ Frame Setup

### Create OG Image

You need to create an OpenGraph image for Frame previews:

1. Create a 1200x630px image with your app branding
2. Save as `public/opengraph-image.png`
3. Redeploy

**Quick OG Image Tips:**
- Include "⚔️ WHOLE NUMBER WAR" title
- Show BTC price and coordinate visualization
- Use dark theme (slate/yellow colors)
- Add "Built on Base" badge

### Test Your Frame

1. Once deployed, copy your Vercel URL
2. Open Warpcast
3. Create a cast with your URL
4. You should see a Frame preview
5. Click to open the mini app

## 📱 Test in Farcaster

1. Install Warpcast mobile app or use desktop
2. Post a cast with your deployed URL
3. The Frame should appear with preview image
4. Click to launch the mini app
5. Test wallet connection
6. Test "Share to Farcaster" button

## 🎯 Frame Validation

Use the [Warpcast Frame Validator](https://warpcast.com/~/developers/frames):
1. Enter your deployed URL
2. Check for any metadata issues
3. Fix any warnings

## 🐛 Troubleshooting

### Wallet Won't Connect
- Check OnchainKit API key is valid
- Verify CHAIN_ID is 8453 (Base Mainnet)
- Clear browser cache and try again

### Frame Not Showing
- Ensure `NEXT_PUBLIC_APP_URL` matches your domain
- Check `opengraph-image.png` exists in `/public`
- Validate metadata with Frame Validator

### Price Not Updating
- Check browser console for API errors
- Multiple API sources are used as fallbacks
- If all fail, check internet connection

### Farcaster Share Not Working
- Only works when running inside Warpcast
- Test in actual Warpcast app, not just browser
- MiniKit needs to be initialized in Frame context

## 📝 Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## 🔮 Future Enhancements

Potential features to add:
- [ ] Paper trading system with position tracking
- [ ] Leaderboard smart contract on Base
- [ ] NFT badges for achievements
- [ ] Historical price chart
- [ ] Alert notifications
- [ ] Multi-timeframe analysis
- [ ] Social feed of user positions
- [ ] Onchain betting/predictions

## 📚 Documentation

Full documentation available in:
- `FARCASTER_MINI_APP_DOCUMENTATION.md` - Complete implementation guide
- `WHOLE_NUMBER_STRATEGY_DOCUMENTATION.md` - Strategy explanation

## ⚠️ Disclaimer

This application is for educational and entertainment purposes only. Trading cryptocurrencies, especially with leverage, carries substantial risk of loss. Never risk more than you can afford to lose. This is not financial advice.

## 🤝 Contributing

Built for the Whole Number War community. Based on the Oracle WHOLE NUMBER Strategy.

## 📄 License

MIT License - Feel free to use and modify!

---

**Built with ❤️ on Base L2**
