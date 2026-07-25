# PolyStellar API Documentation

Complete reference for interacting with PolyStellar smart contracts.

## Contract Address

**Testnet**: `YOUR_CONTRACT_ID` (update after deployment)

**Token Contract**: `YOUR_TOKEN_ID` (update after deployment)

## Data Types

### Outcome

```rust
enum Outcome {
    Yes = 0,
    No = 1,
}
```

Represents the two possible outcomes for a binary prediction market.

### MarketStatus

```rust
enum MarketStatus {
    Active = 0,      // Market is open for trading
    Closed = 1,      // Trading ended, awaiting resolution
    Resolved = 2,    // Market resolved, claims available
}
```

### Market

```rust
struct Market {
    id: u64,
    creator: Address,
    question: String,
    description: String,
    end_time: u64,
    resolution_time: u64,
    status: MarketStatus,
    resolved_outcome: Option<Outcome>,
    yes_shares: i128,
    no_shares: i128,
    total_liquidity: i128,
}
```

| Field | Type | Description |
|-------|------|-------------|
| `id` | u64 | Unique market identifier |
| `creator` | Address | Address of market creator |
| `question` | String | Market question |
| `description` | String | Detailed resolution criteria |
| `end_time` | u64 | Unix timestamp when trading ends |
| `resolution_time` | u64 | Unix timestamp when market can be resolved |
| `status` | MarketStatus | Current market status |
| `resolved_outcome` | Option<Outcome> | Winning outcome (if resolved) |
| `yes_shares` | i128 | YES shares in liquidity pool |
| `no_shares` | i128 | NO shares in liquidity pool |
| `total_liquidity` | i128 | Total tokens locked in market |

### Position

```rust
struct Position {
    user: Address,
    market_id: u64,
    yes_shares: i128,
    no_shares: i128,
}
```

| Field | Type | Description |
|-------|------|-------------|
| `user` | Address | User's address |
| `market_id` | u64 | Market identifier |
| `yes_shares` | i128 | User's YES shares |
| `no_shares` | i128 | User's NO shares |

## Contract Methods

### initialize

Initialize the contract with admin and token addresses.

**Signature**:
```rust
fn initialize(env: Env, admin: Address, token: Address)
```

**Parameters**:
- `admin`: Address - Admin address for market resolution
- `token`: Address - Token contract address for trading

**Authorization**: None (can only be called once)

**Example**:
```bash
soroban contract invoke \
  --id $CONTRACT_ID \
  --source deployer \
  --network testnet \
  -- initialize \
  --admin GXXXXX... \
  --token CXXXXX...
```

**JavaScript**:
```javascript
import * as StellarSdk from '@stellar/stellar-sdk'

const contract = new StellarSdk.Contract(CONTRACT_ID)
const operation = contract.call(
  'initialize',
  StellarSdk.Address.fromString(adminAddress).toScVal(),
  StellarSdk.Address.fromString(tokenAddress).toScVal()
)
```

**Returns**: void

**Errors**:
- Already initialized

---

### create_market

Create a new prediction market.

**Signature**:
```rust
fn create_market(
    env: Env,
    creator: Address,
    question: String,
    description: String,
    end_time: u64,
    resolution_time: u64,
    initial_liquidity: i128,
) -> u64
```

**Parameters**:
- `creator`: Address - Market creator address
- `question`: String - Market question (max 256 chars)
- `description`: String - Resolution criteria
- `end_time`: u64 - Unix timestamp when trading ends
- `resolution_time`: u64 - Unix timestamp for resolution
- `initial_liquidity`: i128 - Initial liquidity (min 100 tokens)

**Authorization**: Requires `creator` signature

**Example**:
```bash
soroban contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network testnet \
  -- create_market \
  --creator GXXXXX... \
  --question "Will BTC reach 100k?" \
  --description "Resolves YES if Bitcoin reaches $100k" \
  --end-time 1735689600 \
  --resolution-time 1735776000 \
  --initial-liquidity 10000000000
```

**JavaScript**:
```javascript
const params = [
  StellarSdk.Address.fromString(creator).toScVal(),
  StellarSdk.nativeToScVal(question, { type: 'string' }),
  StellarSdk.nativeToScVal(description, { type: 'string' }),
  StellarSdk.nativeToScVal(endTime, { type: 'u64' }),
  StellarSdk.nativeToScVal(resolutionTime, { type: 'u64' }),
  StellarSdk.nativeToScVal(initialLiquidity, { type: 'i128' }),
]

const result = await invokeContract(publicKey, 'create_market', params)
```

**Returns**: u64 - Market ID

**Errors**:
- Invalid timestamps (end_time <= now or resolution_time <= end_time)
- Insufficient initial liquidity (< 100 tokens)
- Insufficient balance for initial liquidity

---

### buy_shares

Purchase YES or NO shares in a market.

**Signature**:
```rust
fn buy_shares(
    env: Env,
    user: Address,
    market_id: u64,
    outcome: Outcome,
    amount: i128,
) -> i128
```

**Parameters**:
- `user`: Address - Buyer's address
- `market_id`: u64 - Market identifier
- `outcome`: Outcome - YES (0) or NO (1)
- `amount`: i128 - Amount of tokens to spend

**Authorization**: Requires `user` signature

**Price Calculation**:
Using constant product formula:
```
shares_received = current_shares - (k / (other_shares + amount))
where k = yes_shares * no_shares
```

**Example**:
```bash
soroban contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network testnet \
  -- buy_shares \
  --user GXXXXX... \
  --market-id 1 \
  --outcome '{"Yes": []}' \
  --amount 1000000000
```

**JavaScript**:
```javascript
import { OUTCOME } from './config/constants'

const shares = await buyShares(
  publicKey,
  marketId,
  'YES',
  parseAmount(100) // 100 tokens
)
console.log(`Received ${formatAmount(shares)} shares`)
```

**Returns**: i128 - Number of shares received

**Errors**:
- Market not found
- Market not active
- Market has ended
- Amount <= 0
- Insufficient liquidity
- Insufficient token balance

---

### sell_shares

Sell YES or NO shares in a market.

**Signature**:
```rust
fn sell_shares(
    env: Env,
    user: Address,
    market_id: u64,
    outcome: Outcome,
    shares: i128,
) -> i128
```

**Parameters**:
- `user`: Address - Seller's address
- `market_id`: u64 - Market identifier
- `outcome`: Outcome - YES (0) or NO (1)
- `shares`: i128 - Number of shares to sell

**Authorization**: Requires `user` signature

**Example**:
```bash
soroban contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network testnet \
  -- sell_shares \
  --user GXXXXX... \
  --market-id 1 \
  --outcome '{"No": []}' \
  --shares 500000000
```

**JavaScript**:
```javascript
const tokens = await sellShares(
  publicKey,
  marketId,
  'NO',
  parseAmount(50) // 50 shares
)
console.log(`Received ${formatAmount(tokens)} tokens`)
```

**Returns**: i128 - Amount of tokens received

**Errors**:
- Market not found
- Market not active
- No position found
- Insufficient shares
- Shares <= 0

---

### resolve_market

Resolve a market with the final outcome (admin only).

**Signature**:
```rust
fn resolve_market(
    env: Env,
    admin: Address,
    market_id: u64,
    outcome: Outcome,
)
```

**Parameters**:
- `admin`: Address - Admin address
- `market_id`: u64 - Market identifier
- `outcome`: Outcome - Winning outcome (YES or NO)

**Authorization**: Requires `admin` signature and admin verification

**Example**:
```bash
soroban contract invoke \
  --id $CONTRACT_ID \
  --source admin \
  --network testnet \
  -- resolve_market \
  --admin GXXXXX... \
  --market-id 1 \
  --outcome '{"Yes": []}'
```

**JavaScript**:
```javascript
await resolveMarket(adminAddress, marketId, OUTCOME.YES)
```

**Returns**: void

**Errors**:
- Unauthorized (not admin)
- Market not found
- Market already resolved
- Too early to resolve (current_time < resolution_time)

---

### claim_winnings

Claim winnings from a resolved market.

**Signature**:
```rust
fn claim_winnings(
    env: Env,
    user: Address,
    market_id: u64,
) -> i128
```

**Parameters**:
- `user`: Address - Claimer's address
- `market_id`: u64 - Market identifier

**Authorization**: Requires `user` signature

**Payout Calculation**:
```
payout = (winning_shares / total_winning_shares) * total_liquidity
```

**Example**:
```bash
soroban contract invoke \
  --id $CONTRACT_ID \
  --source alice \
  --network testnet \
  -- claim_winnings \
  --user GXXXXX... \
  --market-id 1
```

**JavaScript**:
```javascript
const payout = await claimWinnings(publicKey, marketId)
console.log(`Claimed ${formatAmount(payout)} tokens`)
```

**Returns**: i128 - Payout amount

**Errors**:
- Market not found
- Market not resolved
- No position found
- No winning shares

---

### get_market

Get market information.

**Signature**:
```rust
fn get_market(env: Env, market_id: u64) -> Market
```

**Parameters**:
- `market_id`: u64 - Market identifier

**Authorization**: None (read-only)

**Example**:
```bash
soroban contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_market \
  --market-id 1
```

**JavaScript**:
```javascript
const market = await getMarket(1)
console.log(market.question)
console.log(`Status: ${market.status}`)
```

**Returns**: Market struct

**Errors**:
- Market not found

---

### get_position

Get user's position in a market.

**Signature**:
```rust
fn get_position(
    env: Env,
    user: Address,
    market_id: u64,
) -> Position
```

**Parameters**:
- `user`: Address - User's address
- `market_id`: u64 - Market identifier

**Authorization**: None (read-only)

**Example**:
```bash
soroban contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_position \
  --user GXXXXX... \
  --market-id 1
```

**JavaScript**:
```javascript
const position = await getPosition(publicKey, marketId)
console.log(`YES: ${formatAmount(position.yesShares)}`)
console.log(`NO: ${formatAmount(position.noShares)}`)
```

**Returns**: Position struct (returns zero position if none exists)

**Errors**: None

---

### get_market_count

Get total number of markets created.

**Signature**:
```rust
fn get_market_count(env: Env) -> u64
```

**Parameters**: None

**Authorization**: None (read-only)

**Example**:
```bash
soroban contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_market_count
```

**JavaScript**:
```javascript
const count = await getMarketCount()
console.log(`Total markets: ${count}`)
```

**Returns**: u64 - Total market count

**Errors**: None

---

### get_all_markets

Get markets with pagination.

**Signature**:
```rust
fn get_all_markets(
    env: Env,
    start: u64,
    limit: u64,
) -> Vec<Market>
```

**Parameters**:
- `start`: u64 - Starting index (0-based)
- `limit`: u64 - Maximum markets to return

**Authorization**: None (read-only)

**Example**:
```bash
soroban contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_all_markets \
  --start 0 \
  --limit 10
```

**JavaScript**:
```javascript
const markets = await getAllMarkets(0, 20)
markets.forEach(market => {
  console.log(`${market.id}: ${market.question}`)
})
```

**Returns**: Vec<Market> - Array of markets

**Errors**: None (returns empty array if no markets)

---

### get_price

Get current price for an outcome in basis points.

**Signature**:
```rust
fn get_price(
    env: Env,
    market_id: u64,
    outcome: Outcome,
) -> i128
```

**Parameters**:
- `market_id`: u64 - Market identifier
- `outcome`: Outcome - YES (0) or NO (1)

**Authorization**: None (read-only)

**Price Calculation**:
```
Price(YES) = (no_shares / (yes_shares + no_shares)) * 10000
Price(NO) = (yes_shares / (yes_shares + no_shares)) * 10000
```

**Example**:
```bash
soroban contract invoke \
  --id $CONTRACT_ID \
  --network testnet \
  -- get_price \
  --market-id 1 \
  --outcome '{"Yes": []}'
```

**JavaScript**:
```javascript
const price = await getPrice(marketId, 'YES')
console.log(`YES price: ${(price / 100).toFixed(1)}%`)
```

**Returns**: i128 - Price in basis points (10000 = 100%)

**Errors**:
- Market not found

---

## Error Codes

| Error | Description |
|-------|-------------|
| Already initialized | Contract has already been initialized |
| Unauthorized | Caller is not authorized for this action |
| Market not found | Market with given ID doesn't exist |
| Invalid timestamps | Timestamps are invalid or in the past |
| Insufficient initial liquidity | Initial liquidity below minimum (100 tokens) |
| Market not active | Market is closed or resolved |
| Market has ended | Trading period has ended |
| Amount must be positive | Trade amount must be > 0 |
| Insufficient liquidity | Not enough liquidity for trade |
| No position found | User has no position in market |
| Insufficient shares | User doesn't have enough shares to sell |
| Market already resolved | Market has already been resolved |
| Too early to resolve | Resolution time hasn't been reached |
| Market not resolved | Market hasn't been resolved yet |
| No winning shares | User has no shares in winning outcome |

## Rate Limits

**Stellar Testnet**:
- No hard rate limits
- Recommended: < 100 requests/second per IP
- Transaction rate: Limited by account sequence

**Best Practices**:
- Cache read-only data
- Batch read operations
- Use pagination for large datasets
- Implement exponential backoff for retries

## Token Precision

All token amounts use 7 decimal places (stroop precision):

```
1 XLM = 10,000,000 stroops = 10^7
```

**JavaScript helpers**:
```javascript
// Convert to stroops
function parseAmount(amount) {
  return Math.floor(amount * 10_000_000)
}

// Convert from stroops
function formatAmount(stroops) {
  return (stroops / 10_000_000).toFixed(2)
}
```

## Examples

### Complete Market Lifecycle

```javascript
// 1. Create market
const marketId = await createMarket(publicKey, {
  question: "Will it rain tomorrow?",
  description: "Resolves YES if it rains in NYC",
  endTime: Math.floor(Date.now() / 1000) + 86400,
  resolutionTime: Math.floor(Date.now() / 1000) + 172800,
  initialLiquidity: parseAmount(1000)
})

// 2. Buy YES shares
const shares = await buyShares(
  publicKey,
  marketId,
  'YES',
  parseAmount(100)
)

// 3. Check position
const position = await getPosition(publicKey, marketId)

// 4. Sell some shares
const tokens = await sellShares(
  publicKey,
  marketId,
  'YES',
  parseAmount(50)
)

// 5. Admin resolves market
await resolveMarket(adminKey, marketId, OUTCOME.YES)

// 6. Claim winnings
const payout = await claimWinnings(publicKey, marketId)
```

## Support

- GitHub Issues: Report bugs and request features
- Discord: Join Stellar developer community
- Documentation: Check `/docs` folder

---

Last Updated: 2025-11-02
