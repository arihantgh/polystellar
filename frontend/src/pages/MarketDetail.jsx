import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { getMarket, getPosition, buyShares, sellShares, claimWinnings } from '../services/contractService'
import { formatAmount, formatPercentage, formatDate, parseAmount } from '../utils/stellar'
import { MARKET_STATUS, BLOCKED_MARKET_IDS } from '../config/constants'

export default function MarketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { publicKey, isWalletConnected, connect } = useWallet()
  
  const [market, setMarket] = useState(null)
  const [position, setPosition] = useState(null)
  const [loading, setLoading] = useState(true)
  const [trading, setTrading] = useState(false)
  const [selectedOutcome, setSelectedOutcome] = useState('YES')
  const [tradeType, setTradeType] = useState('buy')
  const [amount, setAmount] = useState('')

  // Safely convert bigint to number
  const safeNumber = (value) => {
    if (typeof value === 'bigint') {
      return Number(value)
    }
    return value || 0
  }

  useEffect(() => {
    // Check if market is blocked
    if (BLOCKED_MARKET_IDS.includes(parseInt(id))) {
      navigate('/')
      return
    }
    loadMarketData()
  }, [id, publicKey])

  const loadMarketData = async () => {
    try {
      setLoading(true)
      const marketData = await getMarket(parseInt(id))
      setMarket(marketData)
      
      if (publicKey) {
        const positionData = await getPosition(publicKey, parseInt(id))
        setPosition(positionData)
      }
    } catch (err) {
      console.error('Error loading market:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTrade = async () => {
    if (!isWalletConnected) {
      await connect()
      return
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount')
      return
    }

    try {
      setTrading(true)
      const parsedAmount = parseAmount(amount)

      if (tradeType === 'buy') {
        await buyShares(publicKey, parseInt(id), selectedOutcome, parsedAmount)
      } else {
        await sellShares(publicKey, parseInt(id), selectedOutcome, parsedAmount)
      }

      alert('Trade successful!')
      setAmount('')
      await loadMarketData()
    } catch (err) {
      console.error('Trade error:', err)
      
      // Check for "Bad union switch" error - this actually means success
      if (err?.message?.includes('Bad union switch')) {
        alert('Trade successful!')
        setAmount('')
        await loadMarketData()
        return
      }
      
      const errorMessage = err?.message || 'Trade failed. Please try again.'
      alert(errorMessage)
    } finally {
      setTrading(false)
    }
  }

  const handleClaimWinnings = async () => {
    if (!isWalletConnected) {
      await connect()
      return
    }

    try {
      setTrading(true)
      await claimWinnings(publicKey, parseInt(id))
      alert('Winnings claimed successfully!')
      await loadMarketData()
    } catch (err) {
      console.error('Claim error:', err)
      
      // Check for "Bad union switch" error - this actually means success
      if (err?.message?.includes('Bad union switch')) {
        alert('Winnings claimed successfully!')
        await loadMarketData()
        return
      }
      
      alert('Failed to claim winnings. Please try again.')
    } finally {
      setTrading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!market) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">Market not found</p>
      </div>
    )
  }

  const yesShares = safeNumber(market.yesShares)
  const noShares = safeNumber(market.noShares)
  
  const yesPrice = yesShares && noShares
    ? (noShares * 10000) / (yesShares + noShares)
    : 5000
  
  const noPrice = 10000 - yesPrice

  const canTrade = safeNumber(market.status) === MARKET_STATUS.ACTIVE
  const canClaim = safeNumber(market.status) === MARKET_STATUS.RESOLVED && position && (
    (safeNumber(market.resolvedOutcome) === 0 && safeNumber(position.yesShares) > 0) ||
    (safeNumber(market.resolvedOutcome) === 1 && safeNumber(position.noShares) > 0)
  )

  return (
    <div className="max-w-4xl mx-auto">
      <div className="card mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 break-words">{market.question}</h1>
        <p className="text-slate-300 mb-6 break-words">{market.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div>
            <div className="text-sm text-slate-400 mb-1">Status</div>
            <div className="text-white font-semibold">
              {safeNumber(market.status) === MARKET_STATUS.ACTIVE && 'Active'}
              {safeNumber(market.status) === MARKET_STATUS.CLOSED && 'Closed'}
              {safeNumber(market.status) === MARKET_STATUS.RESOLVED && 'Resolved'}
            </div>
          </div>
          <div>
            <div className="text-sm text-slate-400 mb-1">Total Liquidity</div>
            <div className="text-white font-semibold truncate">{formatAmount(safeNumber(market.totalLiquidity))}</div>
          </div>
          <div>
            <div className="text-sm text-slate-400 mb-1">End Time</div>
            <div className="text-white font-semibold text-xs md:text-base truncate">{formatDate(safeNumber(market.endTime))}</div>
          </div>
          <div>
            <div className="text-sm text-slate-400 mb-1">Resolution Time</div>
            <div className="text-white font-semibold text-xs md:text-base truncate">{formatDate(safeNumber(market.resolutionTime))}</div>
          </div>
        </div>

        {safeNumber(market.status) === MARKET_STATUS.RESOLVED && (
          <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4 mb-6">
            <div className="text-blue-400 font-semibold">
              Resolved: {safeNumber(market.resolvedOutcome) === 0 ? 'YES' : 'NO'}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Current Prices</h2>
          <div className="space-y-4">
            <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">YES</div>
              <div className="text-2xl sm:text-3xl font-bold text-success">{formatPercentage(yesPrice)}</div>
            </div>
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
              <div className="text-sm text-slate-400 mb-1">NO</div>
              <div className="text-2xl sm:text-3xl font-bold text-error">{formatPercentage(noPrice)}</div>
            </div>
          </div>
        </div>

        {position && (
          <div className="card">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Your Position</h2>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-slate-400 mb-1">YES Shares</div>
                <div className="text-lg sm:text-xl font-bold text-white">{formatAmount(safeNumber(position.yesShares))}</div>
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-1">NO Shares</div>
                <div className="text-lg sm:text-xl font-bold text-white">{formatAmount(safeNumber(position.noShares))}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Trade</h2>

        {canClaim ? (
          <button
            onClick={handleClaimWinnings}
            disabled={trading}
            className="btn-primary w-full"
          >
            {trading ? 'Claiming...' : 'Claim Winnings'}
          </button>
        ) : canTrade ? (
          <div className="space-y-4">
            <div className="flex space-x-4">
              <button
                onClick={() => setTradeType('buy')}
                className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                  tradeType === 'buy'
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setTradeType('sell')}
                className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                  tradeType === 'sell'
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Sell
              </button>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setSelectedOutcome('YES')}
                className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                  selectedOutcome === 'YES'
                    ? 'bg-success text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                YES
              </button>
              <button
                onClick={() => setSelectedOutcome('NO')}
                className={`flex-1 py-2 rounded-lg font-semibold transition-colors ${
                  selectedOutcome === 'NO'
                    ? 'bg-error text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                NO
              </button>
            </div>

            <div>
              <label className="label">Amount (tokens)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="input"
                min="0"
                step="0.01"
              />
            </div>

            <button
              onClick={handleTrade}
              disabled={trading || !amount}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap overflow-hidden text-ellipsis"
            >
              {!isWalletConnected
                ? 'Connect Wallet'
                : trading
                ? 'Processing...'
                : `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${selectedOutcome}`}
            </button>
          </div>
        ) : (
          <div className="text-center text-slate-400">
            {safeNumber(market.status) === MARKET_STATUS.CLOSED
              ? 'Market is closed for trading'
              : 'Market has been resolved'}
          </div>
        )}
      </div>
    </div>
  )
}
