import * as StellarSdk from '@stellar/stellar-sdk'
import { CONTRACT_METHODS, OUTCOME, BLOCKED_MARKET_IDS } from '../config/constants'
import { invokeContract, simulateContract } from '../utils/stellar'

/**
 * Create a new prediction market
 */
export async function createMarket(publicKey, marketData) {
  const params = [
    StellarSdk.Address.fromString(publicKey).toScVal(),
    StellarSdk.nativeToScVal(marketData.question, { type: 'string' }),
    StellarSdk.nativeToScVal(marketData.description, { type: 'string' }),
    StellarSdk.nativeToScVal(marketData.endTime, { type: 'u64' }),
    StellarSdk.nativeToScVal(marketData.resolutionTime, { type: 'u64' }),
    StellarSdk.nativeToScVal(marketData.initialLiquidity, { type: 'i128' }),
  ]
  
  return await invokeContract(publicKey, CONTRACT_METHODS.CREATE_MARKET, params)
}

/**
 * Buy shares in a market
 */
export async function buyShares(publicKey, marketId, outcome, amount) {
  const outcomeValue = outcome === 'YES' ? OUTCOME.YES : OUTCOME.NO
  
  const params = [
    StellarSdk.Address.fromString(publicKey).toScVal(),
    StellarSdk.nativeToScVal(marketId, { type: 'u64' }),
    StellarSdk.nativeToScVal(outcomeValue, { type: 'u32' }),
    StellarSdk.nativeToScVal(amount, { type: 'i128' }),
  ]
  
  return await invokeContract(publicKey, CONTRACT_METHODS.BUY_SHARES, params)
}

/**
 * Sell shares in a market
 */
export async function sellShares(publicKey, marketId, outcome, shares) {
  const outcomeValue = outcome === 'YES' ? OUTCOME.YES : OUTCOME.NO
  
  const params = [
    StellarSdk.Address.fromString(publicKey).toScVal(),
    StellarSdk.nativeToScVal(marketId, { type: 'u64' }),
    StellarSdk.nativeToScVal(outcomeValue, { type: 'u32' }),
    StellarSdk.nativeToScVal(shares, { type: 'i128' }),
  ]
  
  return await invokeContract(publicKey, CONTRACT_METHODS.SELL_SHARES, params)
}

/**
 * Claim winnings from a resolved market
 */
export async function claimWinnings(publicKey, marketId) {
  const params = [
    StellarSdk.Address.fromString(publicKey).toScVal(),
    StellarSdk.nativeToScVal(marketId, { type: 'u64' }),
  ]
  
  return await invokeContract(publicKey, CONTRACT_METHODS.CLAIM_WINNINGS, params)
}

/**
 * Resolve a market (admin only — typically called via CLI, exposed here for completeness)
 */
export async function resolveMarket(publicKey, marketId, outcome) {
  const outcomeValue = outcome === 'YES' ? OUTCOME.YES : OUTCOME.NO

  const params = [
    StellarSdk.Address.fromString(publicKey).toScVal(),
    StellarSdk.nativeToScVal(marketId, { type: 'u64' }),
    StellarSdk.nativeToScVal(outcomeValue, { type: 'u32' }),
  ]

  return await invokeContract(publicKey, CONTRACT_METHODS.RESOLVE_MARKET, params)
}

/**
 * Get market details
 */
export async function getMarket(marketId) {
  const params = [
    StellarSdk.nativeToScVal(marketId, { type: 'u64' }),
  ]
  
  const result = await simulateContract(CONTRACT_METHODS.GET_MARKET, params)
  return parseMarket(result)
}

/**
 * Get user position in a market
 */
export async function getPosition(publicKey, marketId) {
  const params = [
    StellarSdk.Address.fromString(publicKey).toScVal(),
    StellarSdk.nativeToScVal(marketId, { type: 'u64' }),
  ]
  
  const result = await simulateContract(CONTRACT_METHODS.GET_POSITION, params)
  return parsePosition(result)
}

/**
 * Get all markets with pagination
 */
export async function getAllMarkets(start = 0, limit = 10) {
  try {
    const params = [
      StellarSdk.nativeToScVal(start, { type: 'u64' }),
      StellarSdk.nativeToScVal(limit, { type: 'u64' }),
    ]
    
    const result = await simulateContract(CONTRACT_METHODS.GET_ALL_MARKETS, params)
    const marketsArray = StellarSdk.scValToNative(result)
    
    if (!Array.isArray(marketsArray)) {
      return []
    }
    
    // Map and filter out blocked markets
    const markets = marketsArray.map(market => ({
      id: market.id,
      creator: market.creator,
      question: market.question,
      description: market.description,
      endTime: market.end_time,
      resolutionTime: market.resolution_time,
      status: market.status,
      resolvedOutcome: market.resolved_outcome,
      yesShares: market.yes_shares,
      noShares: market.no_shares,
      totalLiquidity: market.total_liquidity,
    }))
    
    // Filter out blocked market IDs (handle BigInt comparison)
    const filtered = markets.filter(market => {
      const marketId = typeof market.id === 'bigint' ? Number(market.id) : market.id
      const isBlocked = BLOCKED_MARKET_IDS.includes(marketId)
      console.log(`Market ${marketId}: ${isBlocked ? 'BLOCKED' : 'allowed'}`)
      return !isBlocked
    })
    
    console.log(`Filtered ${markets.length - filtered.length} blocked markets`)
    return filtered
  } catch (error) {
    console.error('Error in getAllMarkets:', error)
    return []
  }
}

/**
 * Get market count
 */
export async function getMarketCount() {
  const result = await simulateContract(CONTRACT_METHODS.GET_MARKET_COUNT, [])
  return StellarSdk.scValToNative(result)
}

/**
 * Get current price for an outcome
 */
export async function getPrice(marketId, outcome) {
  const outcomeValue = outcome === 'YES' ? OUTCOME.YES : OUTCOME.NO
  
  const params = [
    StellarSdk.nativeToScVal(marketId, { type: 'u64' }),
    StellarSdk.nativeToScVal(outcomeValue, { type: 'u32' }),
  ]
  
  const result = await simulateContract(CONTRACT_METHODS.GET_PRICE, params)
  return StellarSdk.scValToNative(result)
}

/**
 * Parse market data from contract response
 */
function parseMarket(scVal) {
  const market = StellarSdk.scValToNative(scVal)
  return {
    id: market.id,
    creator: market.creator,
    question: market.question,
    description: market.description,
    endTime: market.end_time,
    resolutionTime: market.resolution_time,
    status: market.status,
    resolvedOutcome: market.resolved_outcome,
    yesShares: market.yes_shares,
    noShares: market.no_shares,
    totalLiquidity: market.total_liquidity,
  }
}

/**
 * Parse position data from contract response
 */
function parsePosition(scVal) {
  const position = StellarSdk.scValToNative(scVal)
  return {
    user: position.user,
    marketId: position.market_id,
    yesShares: position.yes_shares,
    noShares: position.no_shares,
  }
}
