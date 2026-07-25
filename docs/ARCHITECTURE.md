# PolyStellar Architecture

## System Overview

PolyStellar is a decentralized prediction market platform built on the Stellar blockchain using Soroban smart contracts. The system allows users to create, trade, and settle prediction markets on future real-world outcomes.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                       │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Web UI    │  │   Freighter  │  │  Contract Service │   │
│  │  (Pages)    │◄─┤   Wallet     │◄─┤   Integration     │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              │ JSON-RPC / Horizon API
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                    Stellar Testnet                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Soroban Smart Contracts                       │   │
│  │  ┌────────────────┐         ┌─────────────────┐     │   │
│  │  │ Prediction     │◄────────┤  Token Contract │     │   │
│  │  │ Market Contract│         │   (Wrapped XLM) │     │   │
│  │  └────────────────┘         └─────────────────┘     │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

## Component Details

### 1. Smart Contracts (Soroban/Rust)

#### Prediction Market Contract

**Purpose**: Core business logic for prediction markets

**Key Components**:
- Market management (create, close, resolve)
- Trading engine (buy/sell shares)
- Position tracking
- Settlement and payouts

**Storage Structure**:
```rust
DataKey::Admin              -> Address (admin address)
DataKey::TokenAddress       -> Address (token contract)
DataKey::MarketCount        -> u64 (total markets)
DataKey::Market(id)         -> Market (market data)
DataKey::Position(user, id) -> Position (user positions)
```

**State Machine**:
```
┌─────────┐   end_time    ┌────────┐  resolution  ┌──────────┐
│ Active  ├──────────────►│ Closed ├─────────────►│ Resolved │
└─────────┘               └────────┘              └──────────┘
    │                                                    │
    └─── trading allowed ───┘                           └─── claims allowed ───┘
```

#### Automated Market Maker (AMM)

**Pricing Algorithm**: Constant Product Market Maker (CPMM)

```
Invariant: x * y = k

Where:
- x = YES shares in pool
- y = NO shares in pool
- k = constant product

Price(YES) = y / (x + y)
Price(NO) = x / (x + y)
```

**Buy Calculation**:
```rust
// User buys YES shares with amount of tokens
new_no_shares = no_shares + amount
new_yes_shares = (yes_shares * no_shares) / new_no_shares
shares_received = yes_shares - new_yes_shares
```

**Sell Calculation**:
```rust
// User sells YES shares
new_yes_shares = yes_shares + shares
new_no_shares = (yes_shares * no_shares) / new_yes_shares
tokens_returned = no_shares - new_no_shares
```

### 2. Frontend Architecture

#### Technology Stack
- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **React Router**: Client-side routing
- **TailwindCSS**: Styling
- **Stellar SDK**: Blockchain interaction
- **Freighter API**: Wallet connection

#### Component Hierarchy

```
App
├── Layout
│   ├── Navigation
│   └── Footer
└── Routes
    ├── Home
    │   └── MarketCard[]
    ├── MarketDetail
    │   ├── PriceDisplay
    │   ├── TradePanel
    │   └── PositionInfo
    ├── CreateMarket
    │   └── MarketForm
    └── Portfolio
        └── PositionCard[]
```

#### State Management

**Contexts**:
- `WalletContext`: Manages wallet connection and public key

**Component State**:
- Local state for forms and UI interactions
- React Query or similar could be added for data caching

#### Data Flow

```
User Action
    │
    ▼
React Component
    │
    ▼
Contract Service
    │
    ├─► Build Transaction (Stellar SDK)
    │
    ├─► Sign Transaction (Freighter)
    │
    └─► Submit Transaction (Horizon)
        │
        ▼
    Smart Contract Execution
        │
        ▼
    Update UI (refresh data)
```

### 3. Blockchain Integration

#### Transaction Flow

```
1. User initiates action (e.g., buy shares)
2. Frontend builds transaction with parameters
3. Freighter signs transaction with user's keys
4. Transaction submitted to Stellar Testnet
5. Smart contract executes
6. Result returned to frontend
7. UI updates with new data
```

#### Network Configuration

**Testnet**:
- RPC: https://soroban-testnet.stellar.org:443
- Horizon: https://horizon-testnet.stellar.org
- Passphrase: "Test SDF Network ; September 2015"

#### Contract Invocation

```javascript
// Example: Buy shares
const operation = contract.call(
  'buy_shares',
  Address.fromString(publicKey).toScVal(),
  nativeToScVal(marketId, { type: 'u64' }),
  nativeToScVal(outcome, { type: 'u32' }),
  nativeToScVal(amount, { type: 'i128' })
)
```

### 4. Deployment Architecture

#### Smart Contracts
```
Source Code (Rust)
    │
    ▼
Compile to WASM
    │
    ▼
Deploy to Stellar Testnet
    │
    ▼
Get Contract ID
    │
    ▼
Initialize Contract
```

#### Frontend
```
React Source
    │
    ▼
Vite Build (optimize)
    │
    ▼
Static Assets (dist/)
    │
    ▼
Cloudflare Pages
    │
    ▼
Global CDN Distribution
```

## Data Models

### Market

```rust
struct Market {
    id: u64,                        // Unique identifier
    creator: Address,               // Market creator
    question: String,               // Market question
    description: String,            // Resolution criteria
    end_time: u64,                  // Trading deadline (unix timestamp)
    resolution_time: u64,           // Resolution deadline
    status: MarketStatus,           // Active, Closed, or Resolved
    resolved_outcome: Option<Outcome>, // YES or NO (if resolved)
    yes_shares: i128,               // YES shares in pool
    no_shares: i128,                // NO shares in pool
    total_liquidity: i128,          // Total tokens locked
}
```

### Position

```rust
struct Position {
    user: Address,      // User's address
    market_id: u64,     // Market identifier
    yes_shares: i128,   // User's YES shares
    no_shares: i128,    // User's NO shares
}
```

### Outcome

```rust
enum Outcome {
    Yes = 0,
    No = 1,
}
```

### MarketStatus

```rust
enum MarketStatus {
    Active = 0,     // Trading allowed
    Closed = 1,     // Trading ended, awaiting resolution
    Resolved = 2,   // Outcome determined, claims available
}
```

## Security Model

### Smart Contract Security

**Authorization**:
- All state-changing functions require caller authentication
- Admin-only functions check against stored admin address
- Position updates restricted to position owner

**Input Validation**:
- Timestamp validation (end_time > now, resolution_time > end_time)
- Amount validation (positive values, minimum liquidity)
- State validation (can only trade in Active markets)

**Overflow Protection**:
- Rust's built-in overflow checks in release mode
- I128 type for token amounts prevents overflow

**Reentrancy Protection**:
- Stellar's atomic execution model prevents reentrancy
- State changes before external calls

### Frontend Security

**Non-Custodial**:
- No private keys stored or transmitted
- All signing done through Freighter wallet
- User maintains full control of funds

**Transaction Verification**:
- Users review and approve each transaction
- Clear display of transaction effects
- Network confirmation before UI update

**Input Sanitization**:
- Form validation before contract calls
- Amount parsing and formatting
- Address validation

## Scalability Considerations

### Current Limitations

**Smart Contract**:
- Gas limits on complex operations
- Storage costs increase with market count
- Pagination needed for market lists

**Frontend**:
- Load time increases with market count
- Real-time price updates require polling

### Optimization Strategies

**Implemented**:
- Pagination for market listings
- Efficient data structures in contract
- Optimized WASM build with LTO

**Future Improvements**:
- Indexer service for fast queries
- WebSocket for real-time updates
- IPFS for market metadata
- Caching layer (Redis)

## Testing Strategy

### Unit Tests
- Contract logic tests in Rust
- Edge case validation
- Math precision tests

### Integration Tests
- End-to-end transaction flows
- Multi-user scenarios
- Time-based state transitions

### Manual Testing
- UI/UX testing
- Wallet integration testing
- Cross-browser compatibility

## Monitoring and Analytics

### Key Metrics

**On-Chain**:
- Total markets created
- Trading volume per market
- Total value locked (TVL)
- Active users

**Frontend**:
- Page load times
- Transaction success rate
- Wallet connection rate
- User engagement

### Logging

**Smart Contract**:
- Events emitted for state changes
- Error logging for debugging

**Frontend**:
- Console logging for development
- Error tracking (Sentry, etc.)
- Analytics (Google Analytics, etc.)

## Future Architecture Improvements

### Phase 2: Enhanced Features
- Multi-outcome markets (3+ options)
- Liquidity provider rewards
- Market categories and tags
- Advanced search and filtering

### Phase 3: Scalability
- Layer 2 scaling solution
- State channels for high-frequency trading
- Decentralized oracle integration
- Cross-chain bridges

### Phase 4: Governance
- DAO for platform governance
- Community market resolution
- Fee distribution to token holders
- Protocol upgrades via voting

---

This architecture provides a solid foundation for a decentralized prediction market while maintaining security, usability, and scalability.
