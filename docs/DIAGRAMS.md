# 📊 PolyStellar System Diagrams

Visual representations of the PolyStellar architecture and workflows.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface Layer                      │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Browse     │  │    Trade     │  │   Portfolio  │          │
│  │   Markets    │  │   Shares     │  │   Manager    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│          │                 │                  │                  │
│          └─────────────────┴──────────────────┘                 │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Frontend Application                          │
│                         (React/Vite)                              │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Wallet     │  │   Contract   │  │   Stellar    │          │
│  │   Context    │  │   Service    │  │    Utils     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│          │                 │                  │                  │
│          └─────────────────┴──────────────────┘                 │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Freighter Wallet                               │
│                   (Browser Extension)                             │
│                                                                   │
│  • Key Management                                                │
│  • Transaction Signing                                           │
│  • Account Management                                            │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Stellar Network (Testnet)                      │
│                                                                   │
│  ┌──────────────────────────────────────────────────────┐       │
│  │           Horizon API (RPC Interface)                 │       │
│  └─────────────────────┬────────────────────────────────┘       │
│                        │                                         │
│  ┌─────────────────────▼────────────────────────────────┐       │
│  │          Soroban Smart Contracts                      │       │
│  │                                                        │       │
│  │  ┌──────────────────┐    ┌──────────────────┐       │       │
│  │  │   Prediction     │◄───┤ Token Contract   │       │       │
│  │  │   Market         │    │  (Wrapped XLM)   │       │       │
│  │  │   Contract       │    └──────────────────┘       │       │
│  │  │                  │                                │       │
│  │  │ • Markets        │                                │       │
│  │  │ • Positions      │                                │       │
│  │  │ • Trading Logic  │                                │       │
│  │  │ • Settlement     │                                │       │
│  │  └──────────────────┘                                │       │
│  └───────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow - Creating a Market

```
User                    Frontend                Freighter           Stellar
 │                         │                        │                  │
 │  Fill Market Form       │                        │                  │
 ├────────────────────────►│                        │                  │
 │                         │                        │                  │
 │                         │ Build Transaction      │                  │
 │                         │ (create_market)        │                  │
 │                         ├───────────────────────►│                  │
 │                         │                        │                  │
 │                         │  Show Confirmation     │                  │
 │◄────────────────────────┤                        │                  │
 │  Click Approve          │                        │                  │
 ├────────────────────────►│                        │                  │
 │                         │                        │ Sign Transaction │
 │                         │                        ├─────────────────►│
 │                         │                        │                  │
 │                         │  Signed Transaction    │                  │
 │                         │◄───────────────────────┤                  │
 │                         │                        │                  │
 │                         │  Submit Transaction    │                  │
 │                         ├───────────────────────────────────────────►│
 │                         │                        │                  │
 │                         │                        │  Execute Contract │
 │                         │                        │  Store Market     │
 │                         │                        │  Transfer Tokens  │
 │                         │                        │                  │
 │                         │  Transaction Result    │                  │
 │                         │◄───────────────────────────────────────────┤
 │                         │  (Market ID)           │                  │
 │                         │                        │                  │
 │  Success + Market ID    │                        │                  │
 │◄────────────────────────┤                        │                  │
 │                         │                        │                  │
```

## Data Flow - Trading Shares

```
User                    Frontend                Freighter           Contract
 │                         │                        │                  │
 │  Select Market          │                        │                  │
 ├────────────────────────►│                        │                  │
 │                         │                        │                  │
 │                         │  Load Market Data      │                  │
 │                         ├───────────────────────────────────────────►│
 │                         │                        │                  │
 │                         │  Market Details        │                  │
 │◄────────────────────────┤                        │                  │
 │                         │                        │                  │
 │  Enter Trade Details    │                        │                  │
 │  (YES, 100 tokens)      │                        │                  │
 ├────────────────────────►│                        │                  │
 │                         │                        │                  │
 │                         │ Build Transaction      │                  │
 │                         │ (buy_shares)           │                  │
 │                         ├───────────────────────►│                  │
 │                         │                        │                  │
 │  Approve Transaction    │                        │                  │
 ├────────────────────────►│                        │                  │
 │                         │                        │ Sign & Submit    │
 │                         │                        ├─────────────────►│
 │                         │                        │                  │
 │                         │                        │  Calculate Shares │
 │                         │                        │  Update Pools     │
 │                         │                        │  Update Position  │
 │                         │                        │  Transfer Tokens  │
 │                         │                        │                  │
 │                         │  Shares Received       │                  │
 │◄────────────────────────────────────────────────────────────────────┤
 │                         │                        │                  │
```

## Market State Machine

```
                    ┌──────────────────┐
                    │   Market Created  │
                    └────────┬──────────┘
                             │
                    create_market()
                    initial_liquidity → contract
                             │
                             ▼
                    ┌──────────────────┐
                    │      ACTIVE      │◄────┐
                    │                  │     │
                    │ Trading Allowed  │     │
                    │ Buy/Sell Shares  │     │
                    └────────┬──────────┘     │
                             │                │
                    time >= end_time          │
                             │                │
                             ▼                │
                    ┌──────────────────┐     │
                    │      CLOSED      │     │
                    │                  │     │
                    │  Awaiting        │     │
                    │  Resolution      │     │
                    └────────┬──────────┘     │
                             │                │
                    resolve_market()          │
                    (admin sets outcome)      │
                             │                │
                             ▼                │
                    ┌──────────────────┐     │
                    │     RESOLVED     │     │
                    │                  │     │
                    │  Winners Can     │     │
                    │  Claim Payouts   │     │
                    └──────────────────┘     │
                                              │
                    Note: Cannot go back ─────┘
```

## AMM Pricing Mechanism

```
Initial State:
┌────────────────────────────────┐
│  YES Pool: 1000 shares         │
│  NO Pool:  1000 shares         │
│  k = 1000 × 1000 = 1,000,000  │
│  Price YES: 50%                │
│  Price NO:  50%                │
└────────────────────────────────┘

User buys YES with 200 tokens:
┌────────────────────────────────┐
│  NO Pool increases:            │
│    1000 → 1200 (+200)         │
│                                │
│  YES Pool adjusts:             │
│    k / new_NO = 1,000,000/1200│
│    = 833 shares                │
│                                │
│  User receives:                │
│    1000 - 833 = 167 YES shares│
│                                │
│  New prices:                   │
│    YES: 59% (1200/2033)       │
│    NO:  41% (833/2033)        │
└────────────────────────────────┘

Constant product maintained:
833 × 1200 = 999,600 ≈ k
```

## Position Tracking

```
User Address: GXXXXX...

Markets:
┌──────────────────────────────────────────────┐
│  Market #1: "Will BTC reach 100k?"           │
│  ┌────────────────────────────────────────┐  │
│  │  YES Shares:  150                      │  │
│  │  NO Shares:   50                       │  │
│  │  Total Value: ~200 tokens              │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘

┌──────────────────────────────────────────────┐
│  Market #2: "Will it rain tomorrow?"         │
│  ┌────────────────────────────────────────┐  │
│  │  YES Shares:  0                        │  │
│  │  NO Shares:   200                      │  │
│  │  Total Value: ~200 tokens              │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘

Storage: DataKey::Position(User, MarketId)
```

## Settlement Flow

```
Market Resolves YES

Total Liquidity: 10,000 tokens
YES shares in pool: 400
NO shares in pool: 600

User A:
  YES shares: 100
  Payout = (100 / 400) × 10,000 = 2,500 tokens
  Profit = 2,500 - (cost basis)

User B:
  YES shares: 200
  Payout = (200 / 400) × 10,000 = 5,000 tokens
  Profit = 5,000 - (cost basis)

User C:
  NO shares: 150
  Payout = 0 tokens
  Loss = (cost basis)

┌────────────────────────────────┐
│  claim_winnings()              │
│                                │
│  1. Check resolved outcome     │
│  2. Get user's winning shares  │
│  3. Calculate payout           │
│  4. Transfer tokens to user    │
│  5. Clear user's shares        │
└────────────────────────────────┘
```

## Component Interaction

```
┌─────────────────────────────────────────────┐
│              React Components               │
├─────────────────────────────────────────────┤
│                                             │
│  Home.jsx                                   │
│    │                                        │
│    ├─► MarketCard.jsx (×N)                 │
│    │     │                                  │
│    │     └─► Click → Navigate              │
│    │                                        │
│  MarketDetail.jsx                           │
│    │                                        │
│    ├─► Load market data ────┐              │
│    ├─► Load user position ──┼──► Contract  │
│    ├─► Trade interface      │   Service    │
│    │     │                  │              │
│    │     ├─► Buy button ────┤              │
│    │     └─► Sell button ───┤              │
│    │                        │              │
│  CreateMarket.jsx           │              │
│    │                        │              │
│    └─► Submit form ─────────┤              │
│                             │              │
│  Portfolio.jsx              │              │
│    │                        │              │
│    ├─► Load all positions ─┤              │
│    └─► Display cards        │              │
│                             │              │
└─────────────────────────────┼──────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────┐
│           Contract Service Layer            │
├─────────────────────────────────────────────┤
│                                             │
│  • createMarket()                           │
│  • buyShares()                              │
│  • sellShares()                             │
│  • getMarket()                              │
│  • getPosition()                            │
│  • getAllMarkets()                          │
│  • claimWinnings()                          │
│                                             │
└─────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌──────────────────────────────────────────┐
│         Development Machine              │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  Rust Source Code                  │ │
│  │  contracts/src/*.rs                │ │
│  └─────────────┬──────────────────────┘ │
│                │                         │
│     cargo build --release                │
│     soroban contract optimize            │
│                │                         │
│                ▼                         │
│  ┌────────────────────────────────────┐ │
│  │  WASM Binary                       │ │
│  │  polystellar_contracts.wasm        │ │
│  └─────────────┬──────────────────────┘ │
│                │                         │
└────────────────┼──────────────────────────┘
                 │
                 │ soroban contract deploy
                 ▼
┌──────────────────────────────────────────┐
│         Stellar Testnet                  │
│                                          │
│  Contract ID: CXXXXX...                  │
│  Token ID: CXXXXX...                     │
│                                          │
│  Stored on blockchain ✓                  │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│         Development Machine              │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  React Source Code                 │ │
│  │  frontend/src/**/*.jsx             │ │
│  └─────────────┬──────────────────────┘ │
│                │                         │
│     npm run build                        │
│     (Vite + Tailwind)                    │
│                │                         │
│                ▼                         │
│  ┌────────────────────────────────────┐ │
│  │  Static Build                      │ │
│  │  frontend/dist/*                   │ │
│  └─────────────┬──────────────────────┘ │
│                │                         │
└────────────────┼──────────────────────────┘
                 │
                 │ wrangler pages deploy
                 ▼
┌──────────────────────────────────────────┐
│       Cloudflare Pages                   │
│                                          │
│  URL: polystellar.pages.dev              │
│  Global CDN Distribution                 │
│                                          │
│  Serves static files ✓                   │
└──────────────────────────────────────────┘
```

## Security Model

```
┌──────────────────────────────────────────┐
│            User's Browser                │
│                                          │
│  ┌────────────────────────────────────┐ │
│  │  PolyStellar Frontend              │ │
│  │  (No Private Keys)                 │ │
│  └────────┬───────────────────────────┘ │
│           │                              │
│           │ Request signature            │
│           ▼                              │
│  ┌────────────────────────────────────┐ │
│  │  Freighter Wallet                  │ │
│  │  • Stores private keys             │ │
│  │  • Signs transactions              │ │
│  │  • Never exposes keys              │ │
│  └────────┬───────────────────────────┘ │
│           │                              │
└───────────┼──────────────────────────────┘
            │
            │ Signed transaction
            ▼
┌──────────────────────────────────────────┐
│       Smart Contract Security            │
│                                          │
│  Authorization Checks:                   │
│  ✓ user.require_auth()                   │
│  ✓ admin verification                    │
│                                          │
│  Input Validation:                       │
│  ✓ Amount > 0                            │
│  ✓ Timestamps valid                      │
│  ✓ Market state checks                   │
│                                          │
│  State Protection:                       │
│  ✓ Atomic execution                      │
│  ✓ No reentrancy                         │
│  ✓ Overflow protection                   │
└──────────────────────────────────────────┘
```

---

These diagrams illustrate the complete PolyStellar system architecture, data flows, and security model. Use them as reference when understanding or extending the platform.
