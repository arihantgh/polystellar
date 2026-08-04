// Stellar Testnet Configuration
export const NETWORK_PASSPHRASE = 'Test SDF Network ; September 2015'
export const HORIZON_URL = 'https://horizon-testnet.stellar.org'
export const SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org'

// Contract addresses (update these after deploying your contracts)
export const CONTRACT_ID = 'CBQB45AJAICDPNQ27ZF2RWNV45GYXK7LHTT473NWXN2NNRYVJXRAUQTC'
export const TOKEN_ID = 'CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC'

// Contract methods
export const CONTRACT_METHODS = {
  INITIALIZE: 'initialize',
  CREATE_MARKET: 'create_market',
  BUY_SHARES: 'buy_shares',
  SELL_SHARES: 'sell_shares',
  RESOLVE_MARKET: 'resolve_market',
  CLAIM_WINNINGS: 'claim_winnings',
  GET_MARKET: 'get_market',
  GET_POSITION: 'get_position',
  GET_MARKET_COUNT: 'get_market_count',
  GET_ALL_MARKETS: 'get_all_markets',
  GET_PRICE: 'get_price',
}

// Market outcomes
export const OUTCOME = {
  YES: 0,
  NO: 1,
}

// Market status
export const MARKET_STATUS = {
  ACTIVE: 0,
  CLOSED: 1,
  RESOLVED: 2,
}

// Token decimals (Stellar default)
export const TOKEN_DECIMALS = 7

// UI Configuration
export const MARKETS_PER_PAGE = 10
export const MIN_LIQUIDITY = 100 * Math.pow(10, TOKEN_DECIMALS)

// Blocked market IDs (markets to hide from UI, e.g. test data)
export const BLOCKED_MARKET_IDS = [] // Add market IDs to hide here
