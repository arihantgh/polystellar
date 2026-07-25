# 🚀 Deployment Checklist

Use this checklist to ensure successful deployment of PolyStellar.

## ✅ Pre-Deployment (Development Environment)

### System Requirements
- [ ] Windows with bash.exe (Git Bash, WSL, or Cygwin)
- [ ] Rust 1.70+ installed
- [ ] `wasm32-unknown-unknown` target added
- [ ] Node.js 18+ installed
- [ ] npm or yarn installed
- [ ] Git installed

### Install Tools
```bash
# Verify Rust
rustc --version

# Verify Node
node --version
npm --version

# Install Stellar CLI
cargo install --locked soroban-cli
soroban --version
```

- [ ] Rust compiler working
- [ ] Node.js working
- [ ] Stellar CLI (soroban) installed
- [ ] All commands execute without errors

### Wallet Setup
- [ ] Freighter wallet installed in browser
- [ ] Wallet created or imported
- [ ] Recovery phrase saved securely (CRITICAL!)
- [ ] Switched to Testnet
- [ ] Public key copied

### Get Test Tokens
```bash
# Fund your account
curl "https://friendbot.stellar.org?addr=YOUR_PUBLIC_KEY"
```

- [ ] Account funded with testnet XLM
- [ ] Confirmed balance in Freighter

## 📦 Smart Contract Deployment

### Preparation
- [ ] Navigate to `polystellar/contracts`
- [ ] Review `Cargo.toml` dependencies
- [ ] Read `src/market.rs` to understand logic

### Build Contract
```bash
cd contracts
soroban contract build
```

- [ ] Build completed without errors
- [ ] WASM file created at `target/wasm32-unknown-unknown/release/polystellar_contracts.wasm`
- [ ] File size reasonable (<200KB)

### Configure Network
```bash
soroban network add --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"
```

- [ ] Testnet network configured
- [ ] Network shows in `soroban network ls`

### Create Deployment Identity
```bash
soroban keys generate --global deployer --network testnet
soroban keys address deployer
```

- [ ] Identity created
- [ ] Public key displayed
- [ ] Account funded with XLM

### Deploy Contract
```bash
# Using automated script (recommended)
cd ../scripts
chmod +x deploy-contracts.sh
./deploy-contracts.sh testnet

# OR manual deployment
cd ../contracts
soroban contract deploy \
  --wasm target/wasm32v1-none/release/polystellar_contracts.wasm \
  --source deployer \
  --network testnet
```

- [ ] Contract deployed successfully
- [ ] CONTRACT_ID received and saved
- [ ] No error messages

### Deploy Token Contract
```bash
soroban lab token wrap \
  --asset native \
  --network testnet \
  --source deployer
```

- [ ] Token contract deployed
- [ ] TOKEN_ID received and savved

### Initialize Contract
```bash
soroban contract invoke \
  --id CALIYU53IAX44XDGQ3APUHWU4BSPZFDAPSYYXW5FJTO7R3PU66LT74DR\
  --source deployer \
  --network testnet \
  -- initialize \
  --admin GBMA7MT5CAAORFMIBVWJRWME5FABVPENAXISQ5MDVXLHW4KMTMNWRXOS \
  --token YOUR_TOKEN_ID
```

- [ ] Contract initialized
- [ ] No errors during initialization

### Verify Contract
```bash
soroban contract invoke \
  --id CALIYU53IAX44XDGQ3APUHWU4BSPZFDAPSYYXW5FJTO7R3PU66LT74DR \
  --network testnet \
  --source GBMA7MT5CAAORFMIBVWJRWME5FABVPENAXISQ5MDVXLHW4KMTMNWRXOS \
  -- get_market_count
```

- [ ] Returns `0` (zero markets)
- [ ] Contract is responsive

### Create Test Market (Optional)
```bash
cd ../scripts
chmod +x create-test-market.sh
./create-test-market.sh CALIYU53IAX44XDGQ3APUHWU4BSPZFDAPSYYXW5FJTO7R3PU66LT74DR deployer
```

- [ ] Test market created
- [ ] Market ID returned
- [ ] Can query market details

### Save Deployment Info
```bash
cat > deployment-info.txt << EOF
CONTRACT_ID=YOUR_CONTRACT_ID
TOKEN_ID=YOUR_TOKEN_ID
ADMIN_ADDRESS=YOUR_ADMIN_ADDRESS
NETWORK=testnet
DATE=$(date)
EOF
```

- [ ] Deployment info saved
- [ ] File backed up securely
- [ ] Info accessible for frontend config

## 🎨 Frontend Deployment

### Configure Frontend
```bash
cd ../frontend
```

Edit `src/config/constants.js`:
```javascript
export const CONTRACT_ID = 'CALIYU53IAX44XDGQ3APUHWU4BSPZFDAPSYYXW5FJTO7R3PU66LT74DR'
export const TOKEN_ID = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'
```

- [ ] CONTRACT_ID updated
- [ ] TOKEN_ID updated
- [ ] File saved

### Install Dependencies
```bash
npm install
```

- [ ] All dependencies installed
- [ ] No error messages
- [ ] `node_modules` folder created

### Test Locally
```bash
npm run dev
```

- [ ] Dev server starts
- [ ] Opens at http://localhost:3000
- [ ] No console errors
- [ ] Wallet connects successfully
- [ ] Markets load (or show empty state)

### Build for Production
```bash
npm run build
```

- [ ] Build completes successfully
- [ ] `dist` folder created
- [ ] No errors or warnings
- [ ] Build size reasonable (<2MB)

### Test Production Build
```bash
npm run preview
```

- [ ] Preview server starts
- [ ] Application works correctly
- [ ] No console errors

### Deploy to Cloudflare

#### Option A: Wrangler CLI
```bash
# Install Wrangler
npm install -g wrangler

# Login
wrangler login

# Deploy
cd ../scripts
chmod +x deploy-frontend.sh
./deploy-frontend.sh
```

- [ ] Wrangler installed
- [ ] Logged in to Cloudflare
- [ ] Deployment started
- [ ] Deployment URL received

#### Option B: GitHub + Cloudflare Dashboard
1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin YOUR_GITHUB_REPO
git push -u origin main
```

2. Configure Cloudflare Pages
- [ ] Logged in to Cloudflare Dashboard
- [ ] Connected GitHub repository
- [ ] Build settings configured:
  - Framework: Vite
  - Build command: `cd frontend && npm install && npm run build`
  - Output: `frontend/dist`
- [ ] Deployment triggered

### Verify Deployment
Visit your deployment URL:

- [ ] Page loads successfully
- [ ] No 404 errors
- [ ] Connect Wallet button visible
- [ ] Can connect Freighter
- [ ] Markets page loads
- [ ] Can view market details
- [ ] Trading interface works

## 🧪 Post-Deployment Testing

### Frontend Testing
- [ ] Connect wallet successfully
- [ ] Browse markets page
- [ ] View market details
- [ ] Create new market
- [ ] Buy shares (YES/NO)
- [ ] Sell shares
- [ ] View portfolio
- [ ] Prices update correctly
- [ ] Transactions confirm in Freighter
- [ ] No console errors

### Smart Contract Testing
```bash
# Test market count
soroban contract invoke --id CONTRACT_ID --network testnet -- get_market_count

# Test get market
soroban contract invoke --id CONTRACT_ID --network testnet -- get_market --market-id 1

# Test get position
soroban contract invoke --id CONTRACT_ID --network testnet -- get_position --user YOUR_ADDRESS --market-id 1
```

- [ ] All contract methods respond
- [ ] Data is correct
- [ ] No errors

### Integration Testing
- [ ] Create market from UI
- [ ] Market appears on blockchain
- [ ] Can trade in created market
- [ ] Position updates correctly
- [ ] Portfolio shows positions
- [ ] Prices update in real-time

### Mobile Testing
- [ ] Open on mobile device
- [ ] Layout is responsive
- [ ] Buttons are clickable
- [ ] Forms work correctly
- [ ] Wallet connection works

### Browser Testing
Test on:
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if available)
- [ ] All work correctly

## 📝 Documentation Review

- [ ] README.md is accurate
- [ ] QUICKSTART.md tested
- [ ] All URLs updated
- [ ] CONTRACT_ID in docs updated
- [ ] Screenshots added (if desired)

## 🔒 Security Checklist

### Smart Contract Security
- [ ] All functions have authorization
- [ ] Input validation in place
- [ ] No obvious vulnerabilities
- [ ] Tests pass (if added)
- [ ] Code reviewed

### Frontend Security
- [ ] No private keys in code
- [ ] No sensitive data exposed
- [ ] HTTPS only (Cloudflare handles this)
- [ ] No XSS vulnerabilities
- [ ] Input sanitization working

### Operational Security
- [ ] Recovery phrase backed up offline
- [ ] Deployment info saved securely
- [ ] Admin keys secured
- [ ] No keys in Git repository
- [ ] `.gitignore` configured correctly

## 🎯 Go-Live Checklist

### Before Announcing
- [ ] All features tested
- [ ] No critical bugs
- [ ] Mobile works
- [ ] Documentation complete
- [ ] Support plan ready

### Monitoring Setup
- [ ] Contract balance monitored
- [ ] Error tracking configured (optional)
- [ ] Analytics setup (optional)
- [ ] Alerts configured (optional)

### Communication
- [ ] Announcement prepared
- [ ] Social media ready
- [ ] Community informed
- [ ] Support channels open

## 🚨 Troubleshooting

If deployment fails, check:

### Smart Contract Issues
```bash
# Check account balance
soroban keys fund deployer --network testnet

# Rebuild contract
cd contracts
cargo clean
soroban contract build

# Verify network config
soroban network ls
```

### Frontend Issues
```bash
# Clear and reinstall
cd frontend
rm -rf node_modules dist package-lock.json
npm install
npm run build
```

### Cloudflare Issues
- Check build logs in dashboard
- Verify build settings
- Ensure `dist` folder path correct
- Try manual deployment

## 📊 Success Criteria

Deployment is successful when:
- [x] Smart contracts deployed and initialized
- [x] Frontend live on Cloudflare
- [x] Wallet connects successfully
- [x] Can create markets
- [x] Can trade shares
- [x] Positions track correctly
- [x] No critical errors
- [x] Mobile responsive
- [x] Documentation accurate

## 🎉 Post-Deployment

### Share Your Success!
- [ ] Test with real users
- [ ] Gather feedback
- [ ] Make improvements
- [ ] Share on social media
- [ ] Write blog post (optional)

### Maintenance
- [ ] Monitor contract balance
- [ ] Review error logs
- [ ] Update dependencies
- [ ] Fix bugs as found
- [ ] Add requested features

### Next Steps
- [ ] Plan mainnet deployment
- [ ] Get security audit
- [ ] Add more features
- [ ] Improve UI/UX
- [ ] Marketing campaign

---

## Final Verification

Before marking complete, verify:

```bash
# Contract responds
soroban contract invoke --id YOUR_CONTRACT_ID --network testnet -- get_market_count

# Frontend loads
curl -I https://your-deployment.pages.dev

# Test complete user flow manually
```

✅ All items checked? **Congratulations! You're live!** 🎉

---

**Need Help?**
- Review [QUICKSTART.md](QUICKSTART.md)
- Check [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- Review error messages carefully
- Test on testnet first
- Ask in Stellar Discord

**Built with ❤️ on Stellar Blockchain**
