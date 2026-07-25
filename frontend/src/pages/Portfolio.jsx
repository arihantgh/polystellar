import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { getAllMarkets, getPosition } from '../services/contractService'
import { formatAmount } from '../utils/stellar'
import { BLOCKED_MARKET_IDS } from '../config/constants'

export default function Portfolio() {
  const navigate = useNavigate()
  const { publicKey, isWalletConnected } = useWallet()
  
  const [positions, setPositions] = useState([])
  const [loading, setLoading] = useState(true)

  // Safely convert bigint to number
  const safeNumber = (value) => {
    if (typeof value === 'bigint') {
      return Number(value)
    }
    return value || 0
  }

  useEffect(() => {
    if (isWalletConnected && publicKey) {
      loadPortfolio()
    } else {
      setLoading(false)
    }
  }, [publicKey, isWalletConnected])

  const loadPortfolio = async () => {
    try {
      setLoading(true)
      
      // Get all markets (already filtered by getAllMarkets)
      const markets = await getAllMarkets(0, 100)
      console.log('Markets for portfolio:', markets)
      
      if (!markets || markets.length === 0) {
        setPositions([])
        return
      }
      
      // Get positions for each market (skip blocked markets)
      const positionsPromises = markets
        .filter(market => {
          const marketId = typeof market.id === 'bigint' ? Number(market.id) : market.id
          return !BLOCKED_MARKET_IDS.includes(marketId)
        })
        .map(async (market) => {
        try {
          const position = await getPosition(publicKey, market.id)
          if (safeNumber(position.yesShares) > 0 || safeNumber(position.noShares) > 0) {
            return {
              market,
              position,
            }
          }
        } catch (err) {
          // Position doesn't exist
          return null
        }
      })
      
      const results = await Promise.all(positionsPromises)
      const filteredPositions = results.filter(p => p !== null)
      console.log('Filtered positions:', filteredPositions)
      setPositions(filteredPositions)
    } catch (err) {
      console.error('Error loading portfolio:', err)
      setPositions([])
    } finally {
      setLoading(false)
    }
  }

  if (!isWalletConnected) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400 mb-4">Please connect your wallet to view your portfolio</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (positions.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400 mb-4">You don't have any positions yet</p>
        <button 
          onClick={() => navigate('/')} 
          className="btn-primary"
        >
          Browse Markets
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Your Portfolio</h1>
        <p className="text-slate-400">
          View and manage your positions across all markets
        </p>
      </div>

      <div className="space-y-4">
        {positions.map(({ market, position }) => (
          <div 
            key={market.id}
            className="card hover:border-primary-500 cursor-pointer transition-all"
            onClick={() => navigate(`/market/${market.id}`)}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {market.question}
                </h3>
                <p className="text-slate-400 text-sm">
                  Market #{market.id}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-green-500/20 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">YES Shares</div>
                <div className="text-lg font-bold text-success truncate">
                  {formatAmount(safeNumber(position.yesShares))}
                </div>
              </div>
              
              <div className="bg-red-500/20 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">NO Shares</div>
                <div className="text-lg font-bold text-error truncate">
                  {formatAmount(safeNumber(position.noShares))}
                </div>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Status</div>
                <div className="text-lg font-bold text-white">
                  {safeNumber(market.status) === 0 && 'Active'}
                  {safeNumber(market.status) === 1 && 'Closed'}
                  {safeNumber(market.status) === 2 && 'Resolved'}
                </div>
              </div>
              
              <div className="bg-slate-700/50 rounded-lg p-3">
                <div className="text-xs text-slate-400 mb-1">Total Liquidity</div>
                <div className="text-lg font-bold text-white truncate">
                  {formatAmount(safeNumber(market.totalLiquidity))}
                </div>
              </div>
            </div>

            {safeNumber(market.status) === 2 && (
              <div className="mt-4 bg-blue-500/20 border border-blue-500 rounded-lg p-3 text-sm text-blue-400">
                Market resolved: {safeNumber(market.resolvedOutcome) === 0 ? 'YES' : 'NO'}
                {((safeNumber(market.resolvedOutcome) === 0 && safeNumber(position.yesShares) > 0) ||
                  (safeNumber(market.resolvedOutcome) === 1 && safeNumber(position.noShares) > 0)) && (
                  <span className="ml-2 font-semibold">• Click to claim winnings</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
