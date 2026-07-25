# Deployment Guide

This guide covers deploying PolyStellar to Stellar Testnet (smart contracts) and Cloudflare Pages (frontend).

## Prerequisites

- Stellar CLI (soroban-cli) installed
- Rust toolchain with wasm32-unknown-unknown target
- Node.js 18+ and npm
- Cloudflare account
- Freighter wallet with testnet XLM

## Part 1: Deploy Smart Contracts

### Step 1: Setup Stellar CLI

```bash
# Install Stellar CLI (if not already installed)
cargo install --locked soroban-cli

# Verify installation
soroban --version
```

### Step 2: Configure Testnet Network

```bash
# Add testnet network configuration
soroban network add --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"

# Verify network was added
soroban network ls
```

### Step 3: Create and Fund Identity

```bash
# Generate a new keypair for deployment
soroban keys generate --global deployer --network testnet

# Get the public key
soroban keys address deployer

# Output will be something like:
# GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Fund your account**:

Option A - Using Stellar Laboratory:
1. Visit https://laboratory.stellar.org/#account-creator?network=test
2. Paste your public key
3. Click "Get test network lumens"

Option B - Using Friendbot:
```bash
curl "https://friendbot.stellar.org?addr=$(soroban keys address deployer)"
```

**Verify funding**:
```bash
soroban keys fund deployer --network testnet
```

### Step 4: Build Smart Contract

```bash
# Navigate to contracts directory
cd contracts

# Build the contract
soroban contract build

# Verify the WASM file was created
ls -lh target/wasm32-unknown-unknown/release/polystellar_contracts.wasm
```

**Optimize the WASM** (optional but recommended):
```bash
soroban contract optimize \
  --wasm target/wasm32-unknown-unknown/release/polystellar_contracts.wasm
```

### Step 5: Deploy Prediction Market Contract

```bash
# Deploy the contract
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/polystellar_contracts.wasm \
  --source deployer \
  --network testnet

# Output will be your CONTRACT_ID:
# CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Save this ID - you'll need it!
export CONTRACT_ID="CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

### Step 6: Deploy/Wrap Token Contract

**Option A - Use Native XLM (Wrapped)**:
```bash
# Wrap native Stellar lumens as a Soroban token
soroban lab token wrap \
  --asset native \
  --network testnet \
  --source deployer

# Output will be your TOKEN_ID:
# CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

export TOKEN_ID="CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
```

**Option B - Deploy Custom Token** (if you want a custom token):
```bash
# Deploy Stellar Asset Contract
soroban lab token deploy \
  --asset USDC:GXXXXXXXXXXXXX \
  --network testnet \
  --source deployer
```

### Step 7: Initialize Contract

```bash
# Get your admin address
export ADMIN_ADDRESS=$(soroban keys address deployer)

# Initialize the prediction market contract
soroban contract invoke \
  --id $CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- initialize \
  --admin $ADMIN_ADDRESS \
  --token $TOKEN_ID

# Should output: Success!
```

### Step 8: Verify Deployment

```bash
# Test getting market count (should be 0)
soroban contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_market_count

# Output should be: 0
```

### Step 9: Create a Test Market

```bash
# Calculate timestamps (7 days and 8 days from now)
END_TIME=$(date -d "+7 days" +%s)
RESOLUTION_TIME=$(date -d "+8 days" +%s)

# Create test market
soroban contract invoke \
  --id $CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- create_market \
  --creator $ADMIN_ADDRESS \
  --question "Will Bitcoin reach 100k by 2025?" \
  --description "Resolves YES if Bitcoin reaches or exceeds $100,000 USD" \
  --end-time $END_TIME \
  --resolution-time $RESOLUTION_TIME \
  --initial-liquidity 10000000000

# Output: 1 (market ID)
```

### Step 10: Save Contract Information

Create a file to store your deployed contract details:

```bash
cat > deployment-info.txt << EOF
=== PolyStellar Deployment Info ===
Network: Stellar Testnet
Date: $(date)

CONTRACT_ID=$CONTRACT_ID
TOKEN_ID=$TOKEN_ID
ADMIN_ADDRESS=$ADMIN_ADDRESS

Test Market ID: 1
EOF

cat deployment-info.txt
```

## Part 2: Deploy Frontend

### Step 1: Update Frontend Configuration

```bash
cd ../frontend

# Edit src/config/constants.js
# Update the following values:
```

Edit `src/config/constants.js`:
```javascript
export const CONTRACT_ID = 'YOUR_CONTRACT_ID_HERE'  // Replace with your actual CONTRACT_ID
export const TOKEN_ID = 'YOUR_TOKEN_ID_HERE'        // Replace with your actual TOKEN_ID
```

### Step 2: Test Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000 in browser
# Test wallet connection and viewing markets
```

### Step 3: Build for Production

```bash
# Create optimized production build
npm run build

# Test production build locally
npm run preview
```

### Step 4: Deploy to Cloudflare Pages

#### Method A: Using Wrangler CLI (Recommended)

```bash
# Install Wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login
# This will open a browser window to authenticate

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=polystellar

# Output will show your deployment URL:
# https://polystellar.pages.dev
```

#### Method B: Using Cloudflare Dashboard

1. **Push code to GitHub**:
```bash
cd ..
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/polystellar.git
git push -u origin main
```

2. **Setup Cloudflare Pages**:
   - Go to https://dash.cloudflare.com/
   - Navigate to "Pages"
   - Click "Create a project"
   - Click "Connect to Git"
   - Select your GitHub repository
   - Configure build settings:
     - **Framework preset**: Vite
     - **Build command**: `cd frontend && npm install && npm run build`
     - **Build output directory**: `frontend/dist`
   - Click "Save and Deploy"

3. **Wait for deployment**:
   - First build takes 2-5 minutes
   - You'll get a URL like: https://polystellar-xxx.pages.dev

4. **Configure Custom Domain** (optional):
   - In Cloudflare Pages project settings
   - Go to "Custom domains"
   - Add your domain
   - Update DNS records as instructed

### Step 5: Verify Deployment

1. Visit your Cloudflare Pages URL
2. Connect Freighter wallet (ensure it's on Testnet)
3. Check that markets are displayed
4. Try creating a test market
5. Try trading in a market

## Part 3: Post-Deployment Setup

### Setup Automated Builds (GitHub + Cloudflare)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: cd frontend && npm install
      
      - name: Build
        run: cd frontend && npm run build
      
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: polystellar
          directory: frontend/dist
```

### Monitor Your Deployment

```bash
# Watch contract activity
soroban events \
  --id $CONTRACT_ID \
  --start-ledger latest \
  --network testnet

# Check market count periodically
soroban contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_market_count
```

## Troubleshooting

### Smart Contract Deployment Issues

**Error: Account not found**
```bash
# Ensure account is funded
soroban keys fund deployer --network testnet
```

**Error: Contract already exists**
```bash
# You can't deploy the same contract twice
# Either use the existing contract or create a new identity
soroban keys generate --global deployer2 --network testnet
```

**Error: Insufficient balance for transaction**
```bash
# Fund your account with more XLM
curl "https://friendbot.stellar.org?addr=$(soroban keys address deployer)"
```

### Frontend Deployment Issues

**Build Errors**
```bash
# Clear cache and rebuild
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

**Cloudflare 404 Errors**
- Check that build output directory is correct: `frontend/dist`
- Ensure `index.html` exists in dist folder
- Check Cloudflare Pages build logs

**Wallet Connection Issues**
- Ensure Freighter is set to Testnet
- Clear browser cache and reload
- Check browser console for errors
- Verify CONTRACT_ID and TOKEN_ID are correct

### Contract Interaction Issues

**Transaction Simulation Failed**
```bash
# Check contract is initialized
soroban contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_market_count

# If error, reinitialize
soroban contract invoke \
  --id $CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- initialize \
  --admin $(soroban keys address deployer) \
  --token $TOKEN_ID
```

## Updating Deployment

### Update Smart Contract

```bash
# Rebuild contract
cd contracts
soroban contract build

# Deploy new version (gets new contract ID)
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/polystellar_contracts.wasm \
  --source deployer \
  --network testnet

# Update frontend with new CONTRACT_ID
```

### Update Frontend

```bash
cd frontend

# Make your changes
# ...

# Test locally
npm run dev

# Build and deploy
npm run build
wrangler pages deploy dist --project-name=polystellar
```

Or if using GitHub integration, just push:
```bash
git add .
git commit -m "Update frontend"
git push
# Cloudflare automatically rebuilds
```

## Production Checklist

Before deploying to mainnet:

- [ ] Comprehensive contract audit completed
- [ ] All tests passing
- [ ] Frontend tested on testnet
- [ ] Security review completed
- [ ] Admin key secured (hardware wallet)
- [ ] Emergency pause mechanism tested
- [ ] Documentation updated
- [ ] Monitoring and alerting setup
- [ ] Backup and recovery procedures documented
- [ ] Legal review if needed

## Maintenance

### Regular Tasks

**Weekly**:
- Check contract balance
- Review transaction logs
- Monitor gas costs
- Update dependencies

**Monthly**:
- Security audit
- Performance optimization
- User feedback review

### Backup Contract State

```bash
# Export contract state periodically
soroban contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_all_markets \
  --start 0 \
  --limit 100 > markets_backup.json
```

## Next Steps

- Set up monitoring and alerts
- Create admin dashboard for market resolution
- Implement oracle integration for automated resolution
- Add analytics tracking
- Create user documentation
- Set up support channels

---

Congratulations! Your PolyStellar prediction market is now deployed and running! 🎉
