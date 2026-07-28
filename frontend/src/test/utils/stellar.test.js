import { describe, it, expect } from 'vitest'
import {
  formatAmount,
  parseAmount,
  shortenAddress,
  formatDate,
  getTimeRemaining,
  formatPercentage,
} from '../../utils/stellar'

describe('formatAmount', () => {
  it('formats with 7 decimal default', () => {
    expect(formatAmount(100_0000000)).toBe('100.00')
  })

  it('formats small amounts correctly', () => {
    expect(formatAmount(1_0000000)).toBe('1.00')
  })

  it('handles zero', () => {
    expect(formatAmount(0)).toBe('0.00')
  })

  it('uses custom decimals', () => {
    expect(formatAmount(100_0000, 4)).toBe('100.00')
  })
})

describe('parseAmount', () => {
  it('converts human amount to Stellar value', () => {
    expect(parseAmount('100')).toBe(100_0000000)
  })

  it('handles decimal input', () => {
    expect(parseAmount('1.5')).toBe(1_5000000)
  })

  it('handles zero', () => {
    expect(parseAmount('0')).toBe(0)
  })
})

describe('shortenAddress', () => {
  it('shortens a long address', () => {
    const addr = 'GABCDEF12345abcdef67890ghijklmnopqrstuvwxyz'
    const result = shortenAddress(addr)
    expect(result).toBe('GABC...wxyz')
  })

  it('returns empty string for falsy input', () => {
    expect(shortenAddress('')).toBe('')
    expect(shortenAddress(null)).toBe('')
    expect(shortenAddress(undefined)).toBe('')
  })

  it('uses custom character count', () => {
    const addr = 'GABCDEF12345abcdef67890ghijklmnopqrstuvwxyz'
    expect(shortenAddress(addr, 6)).toBe('GABCDE...uvwxyz')
  })
})

describe('formatDate', () => {
  it('formats a unix timestamp', () => {
    const result = formatDate(1700000000)
    expect(result).toBeTruthy()
    expect(typeof result).toBe('string')
  })
})

describe('getTimeRemaining', () => {
  it('returns "Ended" for past timestamps', () => {
    expect(getTimeRemaining(0)).toBe('Ended')
  })

  it('returns days and hours for far future', () => {
    const farFuture = Math.floor(Date.now() / 1000) + 100000
    const result = getTimeRemaining(farFuture)
    expect(result).toMatch(/\d+d \d+h/)
  })

  it('returns hours and minutes for near future', () => {
    const nearFuture = Math.floor(Date.now() / 1000) + 7200
    const result = getTimeRemaining(nearFuture)
    expect(result).toMatch(/\d+h \d+m/)
  })

  it('returns minutes only for short times', () => {
    const shortFuture = Math.floor(Date.now() / 1000) + 300
    const result = getTimeRemaining(shortFuture)
    expect(result).toMatch(/\d+m/)
  })
})

describe('formatPercentage', () => {
  it('formats basis points as percentage string', () => {
    expect(formatPercentage(5000)).toBe('50.0%')
  })

  it('handles 100%', () => {
    expect(formatPercentage(10000)).toBe('100.0%')
  })

  it('handles 0%', () => {
    expect(formatPercentage(0)).toBe('0.0%')
  })
})
