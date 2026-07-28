import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../utils/stellar', () => ({
  invokeContract: vi.fn(),
  simulateContract: vi.fn(),
}))

vi.mock('@stellar/stellar-sdk', () => ({
  Address: {
    fromString: () => ({ toScVal: () => ({ type: 'address', value: 'mock' }) }),
  },
  nativeToScVal: (value, opts) => ({ type: opts?.type || 'i128', value }),
  scValToNative: (scVal) => {
    if (scVal && typeof scVal === 'object' && 'type' in scVal) {
      return scVal.value
    }
    return scVal
  },
}))

import {
  createMarket,
  buyShares,
  sellShares,
  claimWinnings,
  getMarket,
  getPosition,
  getAllMarkets,
  getMarketCount,
  getPrice,
} from '../../services/contractService'
import { invokeContract, simulateContract } from '../../utils/stellar'

const mockPublicKey = 'GBJXKX7B5O4N5P7YF4J6YXJ6XJ6XJ6XJ6XJ6XJ6XJ6XJ6XJ6XJ6XJ6'

describe('contractService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createMarket', () => {
    it('calls invokeContract with CREATE_MARKET', async () => {
      invokeContract.mockResolvedValueOnce({ status: 'SUCCESS' })
      const result = await createMarket(mockPublicKey, {
        question: 'Test?',
        description: 'Test market',
        endTime: 2000000000,
        resolutionTime: 2000000100,
        initialLiquidity: 100_0000000,
      })
      expect(invokeContract).toHaveBeenCalledOnce()
    })
  })

  describe('buyShares', () => {
    it('calls invokeContract for YES', async () => {
      invokeContract.mockResolvedValueOnce({ status: 'SUCCESS' })
      await buyShares(mockPublicKey, 1, 'YES', 100_0000000)
      expect(invokeContract).toHaveBeenCalledOnce()
    })

    it('calls invokeContract for NO', async () => {
      invokeContract.mockResolvedValueOnce({ status: 'SUCCESS' })
      await buyShares(mockPublicKey, 1, 'NO', 100_0000000)
      expect(invokeContract).toHaveBeenCalledOnce()
    })
  })

  describe('sellShares', () => {
    it('calls invokeContract with SELL_SHARES', async () => {
      invokeContract.mockResolvedValueOnce({ status: 'SUCCESS' })
      await sellShares(mockPublicKey, 1, 'YES', 500_0000000)
      expect(invokeContract).toHaveBeenCalledOnce()
    })
  })

  describe('claimWinnings', () => {
    it('calls invokeContract with CLAIM_WINNINGS', async () => {
      invokeContract.mockResolvedValueOnce({ status: 'SUCCESS' })
      await claimWinnings(mockPublicKey, 1)
      expect(invokeContract).toHaveBeenCalledOnce()
    })
  })

  describe('read methods', () => {
    it('getMarket calls simulateContract', async () => {
      simulateContract.mockRejectedValueOnce(new Error('simulation called'))
      await expect(getMarket(1)).rejects.toThrow('simulation called')
      expect(simulateContract).toHaveBeenCalledOnce()
    })

    it('getPosition calls simulateContract', async () => {
      simulateContract.mockRejectedValueOnce(new Error('simulation called'))
      await expect(getPosition(mockPublicKey, 1)).rejects.toThrow('simulation called')
      expect(simulateContract).toHaveBeenCalledOnce()
    })

    it('getAllMarkets returns empty array on error', async () => {
      simulateContract.mockRejectedValueOnce(new Error('Network error'))
      const result = await getAllMarkets(0, 10)
      expect(result).toEqual([])
    })

    it('getMarketCount calls simulateContract', async () => {
      simulateContract.mockResolvedValueOnce({ type: 'u64', value: 5 })
      const result = await getMarketCount()
      expect(simulateContract).toHaveBeenCalledOnce()
      expect(result).toBe(5)
    })

    it('getPrice calls simulateContract for YES', async () => {
      simulateContract.mockResolvedValueOnce({ type: 'i128', value: 5000 })
      const result = await getPrice(1, 'YES')
      expect(simulateContract).toHaveBeenCalledOnce()
      expect(result).toBe(5000)
    })

    it('getPrice calls simulateContract for NO', async () => {
      simulateContract.mockResolvedValueOnce({ type: 'i128', value: 5000 })
      const result = await getPrice(1, 'NO')
      expect(simulateContract).toHaveBeenCalledOnce()
    })
  })
})
