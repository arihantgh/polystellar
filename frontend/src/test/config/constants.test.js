import { describe, it, expect } from 'vitest'
import {
  NETWORK_PASSPHRASE,
  HORIZON_URL,
  SOROBAN_RPC_URL,
  CONTRACT_ID,
  OUTCOME,
  MARKET_STATUS,
  CONTRACT_METHODS,
  MARKETS_PER_PAGE,
  BLOCKED_MARKET_IDS,
} from '../../config/constants'

describe('Network config', () => {
  it('uses testnet passphrase', () => {
    expect(NETWORK_PASSPHRASE).toBe('Test SDF Network ; September 2015')
  })

  it('has valid URLs', () => {
    expect(HORIZON_URL).toMatch(/^https:\/\//)
    expect(SOROBAN_RPC_URL).toMatch(/^https:\/\//)
  })

  it('has a contract ID', () => {
    expect(CONTRACT_ID).toBeTruthy()
    expect(CONTRACT_ID.length).toBeGreaterThan(20)
  })
})

describe('OUTCOME enum', () => {
  it('YES is 0', () => {
    expect(OUTCOME.YES).toBe(0)
  })

  it('NO is 1', () => {
    expect(OUTCOME.NO).toBe(1)
  })
})

describe('MARKET_STATUS enum', () => {
  it('ACTIVE is 0', () => {
    expect(MARKET_STATUS.ACTIVE).toBe(0)
  })

  it('CLOSED is 1', () => {
    expect(MARKET_STATUS.CLOSED).toBe(1)
  })

  it('RESOLVED is 2', () => {
    expect(MARKET_STATUS.RESOLVED).toBe(2)
  })
})

describe('CONTRACT_METHODS', () => {
  it('has all 11 methods defined', () => {
    const methods = Object.values(CONTRACT_METHODS)
    expect(methods).toHaveLength(11)
  })

  it('includes core methods', () => {
    expect(CONTRACT_METHODS.CREATE_MARKET).toBe('create_market')
    expect(CONTRACT_METHODS.BUY_SHARES).toBe('buy_shares')
    expect(CONTRACT_METHODS.SELL_SHARES).toBe('sell_shares')
    expect(CONTRACT_METHODS.CLAIM_WINNINGS).toBe('claim_winnings')
    expect(CONTRACT_METHODS.RESOLVE_MARKET).toBe('resolve_market')
  })
})

describe('UI config', () => {
  it('has markets per page set', () => {
    expect(MARKETS_PER_PAGE).toBe(10)
  })

  it('blocks market ID 1', () => {
    expect(BLOCKED_MARKET_IDS).toContain(1)
  })
})
