# PolyStellar - Decentralized Prediction Market

A decentralized prediction market built on the Stellar blockchain where users can trade tokenized event contracts on future real-world outcomes.

<img width="1366" height="616" alt="image" src="https://github.com/user-attachments/assets/5d9ae007-0b78-4ca8-ad35-b8c972044cd5" />
<img width="1350" height="613" alt="image" src="https://github.com/user-attachments/assets/5df92000-bda5-4fc7-8f38-4b525f289b49" />
<img width="1352" height="609" alt="image" src="https://github.com/user-attachments/assets/9ee0d9da-4e77-4d2f-aec3-dd71b3bf97e5" />
<img width="1355" height="613" alt="image" src="https://github.com/user-attachments/assets/ee95be1a-2b0d-40fc-a124-91914d6886a4" />





## 🌟 Features

- **Create Markets**: Anyone can create prediction markets for future events
- **Trade Shares**: Buy and sell YES/NO shares using an automated market maker (AMM)
- **Instant Settlement**: Automated payouts when markets resolve
- **Low Fees**: Leveraging Stellar's fast and low-cost transactions
- **Non-Custodial**: Your keys, your tokens - fully decentralized

## 🏗️ Architecture

### Smart Contracts (Rust/Soroban)
- **Prediction Market Contract**: Core contract managing market creation, trading, and settlement
- **Automated Market Maker**: Constant product formula (x * y = k) for price discovery
- **Token Integration**: Uses Stellar native tokens for trading

### Frontend (React)
- **Vite + React**: Fast development and optimized builds
- **Freighter Wallet**: Stellar wallet integration
- **TailwindCSS**: Modern, responsive UI
- **React Router**: Client-side routing

### Deployment
- **Smart Contracts**: Deployed on Stellar Testnet
- **Frontend**: Deployed on Cloudflare Pages

## 📁 Project Structure

```
polystellar/
├── contracts/               # Rust smart contracts
│   ├── src/
│   │   ├── lib.rs          # Contract entry point
│   │   ├── market.rs       # Main market logic
│   │   └── types.rs        # Data structures
│   └── Cargo.toml          # Rust dependencies
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts (wallet)
│   │   ├── pages/          # Page components
│   │   ├── services/       # Contract interaction
│   │   ├── utils/          # Helper functions
│   │   └── config/         # Configuration
│   └── package.json
├── docs/                   # Documentation
└── scripts/                # Deployment scripts
```

## 🚀 Quick Start

### Prerequisites

- **Rust** 1.70+ with `wasm32-unknown-unknown` target
- **Stellar CLI** (soroban-cli)
- **Node.js** 18+
- **Freighter Wallet** browser extension

### 1. Setup Development Environment

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
rustup target add wasm32-unknown-unknown

# Install Stellar CLI
cargo install --locked soroban-cli

# Configure for Testnet
soroban network add --global testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"
```

### 2. Create Testnet Identity

```bash
# Create new identity
soroban keys generate --global alice --network testnet

# Get public key
soroban keys address alice

# Fund account (visit Stellar Laboratory)
# https://laboratory.stellar.org/#account-creator?network=test
```

### 3. Deploy Smart Contracts

```bash
cd contracts

# Build contract
soroban contract build

# Deploy contract
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/polystellar_contracts.wasm \
  --source alice \
  --network testnet

# Save the contract ID - you'll need it!
```

### 4. Deploy Token Contract

```bash
# Wrap native Stellar asset for testing
soroban lab token wrap \
  --asset native \
  --network testnet \
  --source alice

# Save the token ID
```

### 5. Initialize Contract

```bash
# Initialize with admin and token addresses
soroban contract invoke \
  --id YOUR_CONTRACT_ID \
  --source alice \
  --network testnet \
  -- initialize \
  --admin YOUR_ADMIN_ADDRESS \
  --token YOUR_TOKEN_ID
```

### 6. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Update contract addresses in src/config/constants.js
# Set CONTRACT_ID and TOKEN_ID

# Start development server
npm run dev
```

## Contract details
ID: CALIYU53IAX44XDGQ3APUHWU4BSPZFDAPSYYXW5FJTO7R3PU66LT74DR
<img width="1360" height="620" alt="image" src="https://github.com/user-attachments/assets/82d23283-c70d-49fd-b753-954eccfc38bf" />


Visit http://localhost:3000

## 📝 Usage Guide

### Creating a Market

1. Connect your Freighter wallet
2. Click "Create Market"
3. Fill in market details:
   - **Question**: Clear yes/no question
   - **Description**: Detailed resolution criteria
   - **End Date**: When trading stops
   - **Resolution Date**: When outcome is determined
   - **Initial Liquidity**: Minimum 100 tokens
4. Approve transaction in Freighter
5. Market is now live!

### Trading

1. Browse markets on the home page
2. Click on a market to view details
3. Select YES or NO
4. Choose Buy or Sell
5. Enter amount
6. Approve transaction
7. Your position updates automatically

### Claiming Winnings

1. Go to "Portfolio" to view your positions
2. When a market resolves in your favor
3. Click on the market
4. Click "Claim Winnings"
5. Approve transaction to receive payout

## 🧪 Testing

### Test Smart Contracts

```bash
cd contracts
cargo test
```

Runs 11 tests

### Test Frontend

```bash
cd frontend
npm test           # Run all tests
npm run test:watch # Watch mode for development
```

Runs 56 tests

<img width="686" height="280" alt="image" src="https://github.com/user-attachments/assets/c339af3c-ccdd-4ef9-a6e0-06828baef2d1" />
<img width="1304" height="793" alt="image" src="https://github.com/user-attachments/assets/b9fd1116-af59-407e-a57f-59984a25fa2f" />


### Manual Testing

Use the Stellar CLI to interact with contracts:

```bash
# Create a test market
soroban contract invoke \
  --id CONTRACT_ID \
  --source alice \
  --network testnet \
  -- create_market \
  --creator YOUR_ADDRESS \
  --question "Test market?" \
  --description "Testing" \
  --end-time $(date -d "+7 days" +%s) \
  --resolution-time $(date -d "+8 days" +%s) \
  --initial-liquidity 1000000000

# Buy shares
soroban contract invoke \
  --id CONTRACT_ID \
  --source alice \
  --network testnet \
  -- buy_shares \
  --user YOUR_ADDRESS \
  --market-id 1 \
  --outcome '{"Yes": []}' \
  --amount 1000000000

# Get market info
soroban contract invoke \
  --id CONTRACT_ID \
  --network testnet \
  -- get_market \
  --market-id 1
```

## 🔄 CI/CD Pipeline

The project uses **GitHub Actions** for continuous integration and deployment. On every push/PR to `main`, the pipeline runs three jobs in parallel:

| Job | What it does | Verifies |
|-----|-------------|----------|
| **Contracts** | `cargo test` + `cargo build --target wasm32-unknown-unknown --release` | Unit tests pass and WASM compiles |
| **Frontend** | `npm ci` + `npm run build` | Dependencies install and production build succeeds |

After both pass, a **deploy** job runs (only on `main`) that publishes the frontend to Cloudflare Pages.

### Required Secrets

Add these in your GitHub repo under **Settings → Secrets and variables → Actions**:

| Secret | Purpose |
|--------|---------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token with Pages permissions |
| `CLOUDFLARE_ACCOUNT_ID` | Your Cloudflare account ID (find in Cloudflare dashboard) |

The deploy job uses `GITHUB_TOKEN` automatically (no setup needed) to create visible GitHub Deployments.

<img width="1463" height="858" alt="image" src="https://github.com/user-attachments/assets/95457f5e-bd21-495d-bc51-53866f5d9a81" />


### Manual Verification

```bash
# Run what CI checks locally:

# 1. Contracts
cd contracts
cargo test                        # runs all unit tests
cargo build --target wasm32-unknown-unknown --release  # verifies WASM build

# 2. Frontend
cd frontend
npm ci                            # clean install from lockfile
npm run build                     # production build

# Push to GitHub — check Actions tab for pipeline run
git push origin main
```

## 🌐 Deploying to Cloudflare Pages

### Method 1: Using Wrangler CLI

```bash
cd frontend

# Install Wrangler
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Build and deploy
npm run build
wrangler pages deploy dist --project-name=polystellar
```

### Method 2: GitHub Integration

1. Push code to GitHub
2. Go to Cloudflare Dashboard
3. Navigate to Pages
4. Click "Create a project"
5. Connect your GitHub repository
6. Configure build settings:
   - **Framework**: Vite
   - **Build command**: `npm run build`
   - **Build output**: `dist`
7. Click "Save and Deploy"

### Environment Variables (if needed)

Add in Cloudflare Pages settings:
- `VITE_CONTRACT_ID`: Your deployed contract ID
- `VITE_TOKEN_ID`: Your token contract ID

## 🔧 Configuration

### Contract Configuration

Edit `contracts/src/market.rs` to customize:
- Minimum liquidity requirements
- Fee structure (if desired)
- Trading rules

### Frontend Configuration

Edit `frontend/src/config/constants.js`:
- `CONTRACT_ID`: Your deployed contract
- `TOKEN_ID`: Token contract address
- `HORIZON_URL`: Stellar Horizon server
- `NETWORK_PASSPHRASE`: Network identifier

## 📊 How It Works

### Automated Market Maker (AMM)

PolyStellar uses a constant product formula for pricing:

```
x * y = k

Where:
- x = YES shares pool
- y = NO shares pool
- k = constant product
```

When you buy YES shares:
1. You add tokens to the NO pool
2. YES shares are removed from YES pool
3. Price automatically adjusts based on ratio

### Market Resolution

1. Market creator or admin resolves the market
2. Winning shares can be redeemed for proportional payout
3. Payout = (your_shares / total_winning_shares) * total_liquidity

## 🔐 Security Considerations

### Smart Contract
- ✅ Auth checks on all state-changing functions
- ✅ Input validation (amounts, timestamps)
- ✅ Reentrancy protection via Stellar's execution model
- ✅ Integer overflow protection

### Frontend
- ✅ Non-custodial - no private keys stored
- ✅ Transaction signing via Freighter
- ✅ Input validation before contract calls

### Production Checklist
- [ ] Audit smart contracts
- [ ] Test on testnet extensively
- [ ] Add admin multisig for resolution
- [ ] Implement oracle integration for automated resolution
- [ ] Add slippage protection for trades
- [ ] Rate limiting on contract calls

## 🛠️ Development

### Building Contracts

```bash
cd contracts
soroban contract build
soroban contract optimize --wasm target/wasm32-unknown-unknown/release/polystellar_contracts.wasm
```

### Frontend Development

```bash
cd frontend
npm run dev     # Start dev server
npm run build   # Production build
npm run preview # Preview production build
```

## 📚 API Reference

### Smart Contract Methods

#### `initialize(admin: Address, token: Address)`
Initialize the contract with admin and token addresses.

#### `create_market(...) -> u64`
Create a new prediction market. Returns market ID.

#### `buy_shares(user: Address, market_id: u64, outcome: Outcome, amount: i128) -> i128`
Buy shares in a market. Returns shares received.

#### `sell_shares(user: Address, market_id: u64, outcome: Outcome, shares: i128) -> i128`
Sell shares in a market. Returns tokens received.

#### `resolve_market(admin: Address, market_id: u64, outcome: Outcome)`
Resolve a market (admin only).

#### `claim_winnings(user: Address, market_id: u64) -> i128`
Claim winnings from a resolved market. Returns payout amount.

#### `get_market(market_id: u64) -> Market`
Get market details.

#### `get_position(user: Address, market_id: u64) -> Position`
Get user's position in a market.

#### `get_all_markets(start: u64, limit: u64) -> Vec<Market>`
Get markets with pagination.

#### `get_price(market_id: u64, outcome: Outcome) -> i128`
Get current price for an outcome (in basis points).

## 🐛 Troubleshooting

### Contract Build Errors

```bash
# Update Rust
rustup update

# Clean and rebuild
cargo clean
soroban contract build
```

### Freighter Connection Issues

1. Ensure Freighter is installed and unlocked
2. Check you're on Testnet in Freighter settings
3. Refresh the page
4. Try disconnecting and reconnecting

### Transaction Failures

1. Check you have sufficient XLM for fees
2. Verify contract addresses in config
3. Ensure market is in correct state (Active for trading)
4. Check browser console for detailed errors

### Frontend Build Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear cache
npm run build -- --force
```

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Resources

- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Smart Contracts](https://soroban.stellar.org/)
- [Freighter Wallet](https://www.freighter.app/)
- [Cloudflare Pages](https://pages.cloudflare.com/)

## 💬 Support

- GitHub Issues: For bugs and feature requests
- Stellar Discord: For Stellar/Soroban questions
- Documentation: Check the `/docs` folder

## 🎯 Roadmap

- [ ] Automated oracle integration for resolution
- [ ] Multi-outcome markets (beyond YES/NO)
- [ ] Liquidity provider rewards
- [ ] Market categories and filtering
- [ ] Price charts and analytics
- [ ] Mobile app
- [ ] Mainnet deployment

---

Built with ❤️ on Stellar Blockchain
