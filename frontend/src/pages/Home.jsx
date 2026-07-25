import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MarketCard from '../components/MarketCard'
import { getAllMarkets } from '../services/contractService'
import { BLOCKED_MARKET_IDS } from '../config/constants'

export default function Home() {
  const [markets, setMarkets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadMarkets()
  }, [])

  const loadMarkets = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getAllMarkets(0, 20)
      console.log('Loaded markets:', data)
      // Extra filter to ensure blocked markets don't show (handle BigInt)
      const filteredData = (data || []).filter(market => {
        const marketId = typeof market.id === 'bigint' ? Number(market.id) : market.id
        return !BLOCKED_MARKET_IDS.includes(marketId)
      })
      console.log('Filtered markets:', filteredData)
      setMarkets(filteredData)
    } catch (err) {
      console.error('Error loading markets:', err)
      setError(`Failed to load markets: ${err.message || 'Please try again.'}`)
    } finally {
      setLoading(false)
    }
  }

  const handleMarketSelect = (marketId) => {
    navigate(`/market/${marketId}`)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={loadMarkets} className="btn-primary">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Prediction Markets</h1>
        <p className="text-slate-400">
          Trade on the outcome of future events with tokenized contracts on Stellar
        </p>
      </div>

      {markets.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-400 mb-4">No markets available yet</p>
          <button 
            onClick={() => navigate('/create')} 
            className="btn-primary"
          >
            Create First Market
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {markets.map((market) => (
            <MarketCard
              key={market.id}
              market={market}
              onSelect={handleMarketSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}
