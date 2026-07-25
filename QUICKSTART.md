# 🚀 Quick Start Guide - PolyStellar

Get your prediction market up and running in under 15 minutes!

## Prerequisites Checklist

- [ ] Windows with bash.exe (Git Bash, WSL, or similar)
- [ ] Rust installed (`rustup` with `wasm32-unknown-unknown` target)
- [ ] Node.js 18+ and npm
- [ ] Freighter wallet browser extension

## 📦 Installation Steps

### 1. Install Rust & Stellar CLI (5 minutes)

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env

# Add WASM target
rustup target add wasm32-unknown-unknown

# Install Stellar CLI
cargo install --locked soroban-cli

# Verify installation
soroban --version
```

### 2. Setup Freighter Wallet (3 minutes)

1. Install from https://www.freighter.app/
2. Create new wallet or import existing
3. **SAVE YOUR RECOVERY PHRASE SECURELY!**
4. Switch to Testnet:
   - Open Freighter → Settings → Network → Test Net

### 3. Get Testnet Tokens (1 minute)

```bash
# Get your public key from Freighter
# Then fund it:
curl "https://friendbot.stellar.org?addr=YOUR_PUBLIC_KEY"
```

## 🔧 Deploy Smart Contracts (5 minutes)

```bash
cd polystellar/scripts

# Make script executable
chmod +x deploy-contracts.sh

# Run deployment
./deploy-contracts.sh testnet

# ✅ This will output your CONTRACT_ID and TOKEN_ID
# Save these values!
```

**What this does**:
- ✅ Builds smart contracts
- ✅ Deploys to Stellar Testnet
- ✅ Creates token contract
- ✅ Initializes everything
- ✅ Saves deployment info

## ⚙️ Configure Frontend (2 minutes)

```bash
# Edit frontend/src/config/constants.js
# Update these two lines:

export const CONTRACT_ID = 'CXXXXX...' // Your deployed contract
export const TOKEN_ID = 'CXXXXX...'    // Your token contract
```

**Quick way**:
```bash
cd polystellar/frontend
nano src/config/constants.js
# or use any text editor
```

## 🌐 Deploy Frontend (3 minutes)

### Option A: Cloudflare Pages (Recommended)

```bash
# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
cd polystellar/scripts
chmod +x deploy-frontend.sh
./deploy-frontend.sh
```

### Option B: Test Locally First

```bash
cd polystellar/frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Open http://localhost:3000
```

## ✅ Verify Deployment

### Test Smart Contracts

```bash
# Get market count (should be 0)
soroban contract invoke \
  --id YOUR_CONTRACT_ID \
  --network testnet \
  -- get_market_count

# Create a test market
cd polystellar/scripts
chmod +x create-test-market.sh
./create-test-market.sh YOUR_CONTRACT_ID deployer
```

### Test Frontend

1. Visit your deployment URL
2. Click "Connect Wallet"
3. Approve in Freighter
4. You should see your address in navbar
5. Try creating a market!

## 🎉 You're Live!

Your prediction market is now running on:
- **Blockchain**: Stellar Testnet
- **Frontend**: Cloudflare Pages (or localhost)

## 📝 Common Issues & Fixes

### Issue: "soroban: command not found"

```bash
# Ensure Rust's bin is in PATH
export PATH="$HOME/.cargo/bin:$PATH"
echo 'export PATH="$HOME/.cargo/bin:$PATH"' >> ~/.bashrc
```

### Issue: "Account not found"

```bash
# Fund your account
curl "https://friendbot.stellar.org?addr=$(soroban keys address deployer)"
```

### Issue: "Freighter not connecting"

1. Ensure Freighter is installed and unlocked
2. Check you're on Testnet in Freighter
3. Refresh the page
4. Clear browser cache

### Issue: "Build failed" (Frontend)

```bash
# Clear and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: "Transaction failed"

1. Check you have sufficient XLM for fees
2. Verify contract addresses in constants.js
3. Ensure market is Active (for trading)
4. Check browser console for detailed errors

## 🎯 Next Steps

### For Testing

1. **Create Markets**: Try different questions and parameters
2. **Trade**: Buy and sell shares to test pricing
3. **Multiple Accounts**: Test with different Freighter accounts
4. **Resolution**: Resolve a market and claim winnings

### For Development

1. **Customize UI**: Edit files in `frontend/src/`
2. **Add Features**: Extend smart contracts in `contracts/src/`
3. **Styling**: Modify `frontend/tailwind.config.js`
4. **Add Pages**: Create new routes in `frontend/src/App.jsx`

### For Production

1. **Security Audit**: Get contracts professionally audited
2. **Testing Period**: Run on testnet for weeks/months
3. **Community Testing**: Get feedback from users
4. **Mainnet Deploy**: Deploy to Stellar mainnet
5. **Marketing**: Launch and promote

## 📚 Learn More

- **README.md**: Full project documentation
- **docs/USER_GUIDE.md**: How to use the platform
- **docs/API.md**: Complete API reference
- **docs/ARCHITECTURE.md**: Technical deep dive
- **docs/DEPLOYMENT.md**: Detailed deployment guide

## 🆘 Need Help?

1. Check documentation in `/docs`
2. Review error messages in console
3. Test on testnet first
4. Check Stellar Discord community
5. Review smart contract code comments

## 🔍 Quick Commands Reference

```bash
# Build contracts
cd contracts && soroban contract build

# Deploy contracts
cd scripts && ./deploy-contracts.sh testnet

# Create test market
./create-test-market.sh CONTRACT_ID deployer

# Build frontend
cd frontend && npm run build

# Deploy frontend
cd scripts && ./deploy-frontend.sh

# Start local dev server
cd frontend && npm run dev
```

## 📊 What You Built

✅ **Smart Contracts**: Soroban contracts on Stellar
✅ **Trading Engine**: AMM with buy/sell functionality  
✅ **Frontend**: React app with wallet integration
✅ **Deployment**: Cloudflare Pages hosting
✅ **Documentation**: Complete user and dev guides

## 🎓 Understanding the Flow

```
User Opens App
    ↓
Connects Freighter Wallet
    ↓
Browses Markets (from blockchain)
    ↓
Clicks Market → Views Details
    ↓
Enters Trade (Buy/Sell)
    ↓
Signs Transaction (Freighter)
    ↓
Smart Contract Executes
    ↓
Position Updated On-Chain
    ↓
UI Refreshes
```

## 💰 Token Economics

**Initial Market**:
- Creator deposits 1000 tokens
- Split: 500 YES shares, 500 NO shares
- Initial price: 50% YES, 50% NO

**After Trading**:
- Prices adjust based on supply/demand
- More YES buyers → YES price increases
- More NO buyers → NO price increases
- Always: YES% + NO% = 100%

## 🎮 Try These Scenarios

### Scenario 1: Simple Trade
1. Create market: "Will it rain tomorrow?"
2. Buy 100 tokens of YES
3. Check new price (should be > 50%)
4. Sell 50 tokens of YES
5. Check price again (should decrease)

### Scenario 2: Market Resolution
1. Create market with end_time = now + 1 hour
2. Trade in the market
3. Wait for end_time
4. Resolve market (as admin)
5. Claim winnings

### Scenario 3: Portfolio Management
1. Create multiple markets
2. Take positions in each
3. Go to Portfolio page
4. View all your positions
5. Sell some to lock profits

## 🚨 Important Reminders

- ⚠️ This is TESTNET - use test tokens only
- ⚠️ Never share your recovery phrase
- ⚠️ Audit contracts before mainnet
- ⚠️ Start with small amounts
- ⚠️ Test thoroughly before production

## ✨ Congratulations!

You've successfully deployed a decentralized prediction market! 🎉

Your platform now features:
- ✅ Decentralized trading on Stellar
- ✅ Automated market making
- ✅ Non-custodial wallet integration
- ✅ Beautiful, responsive UI
- ✅ Global CDN deployment

**Happy trading!** 🚀

---

**Questions?** Check the documentation or Stellar community resources.

Built with ❤️ on Stellar Blockchain
