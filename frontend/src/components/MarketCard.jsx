import { formatPercentage, formatAmount, getTimeRemaining } from '../utils/stellar'
import { MARKET_STATUS } from '../config/constants'

export default function MarketCard({ market, onSelect }) {
  // Guard clause for missing market
  if (!market) {
    return null
  }

  // Safely convert bigint to number
  const safeNumber = (value) => {
    if (typeof value === 'bigint') {
      return Number(value)
    }
    return value || 0
  }

  const yesShares = safeNumber(market.yesShares)
  const noShares = safeNumber(market.noShares)
  
  const yesPrice = yesShares && noShares
    ? (noShares * 10000) / (yesShares + noShares)
    : 5000
  
  const noPrice = 10000 - yesPrice
  
  const getStatusBadge = () => {
    const status = safeNumber(market.status)
    switch (status) {
      case MARKET_STATUS.ACTIVE:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-500/20 text-green-400">Active</span>
      case MARKET_STATUS.CLOSED:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-500/20 text-yellow-400">Closed</span>
      case MARKET_STATUS.RESOLVED:
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400">Resolved</span>
      default:
        return null
    }
  }

  return (
    <div 
      className="card hover:border-primary-500 cursor-pointer transition-all"
      onClick={() => onSelect(market.id)}
    >
      <div className="flex justify-between items-start gap-3 mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-white flex-1 break-words">{market.question}</h3>
        <div className="flex-shrink-0">
          {getStatusBadge()}
        </div>
      </div>
      
      <p className="text-slate-400 text-sm mb-4 line-clamp-2 break-words">{market.description}</p>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">YES</div>
          <div className="text-lg sm:text-xl font-bold text-success break-words">{formatPercentage(yesPrice)}</div>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">NO</div>
          <div className="text-lg sm:text-xl font-bold text-error break-words">{formatPercentage(noPrice)}</div>
        </div>
      </div>
      
      <div className="flex flex-wrap justify-between items-center gap-2 text-sm text-slate-400">
        <span className="truncate">Liquidity: {formatAmount(safeNumber(market.totalLiquidity))}</span>
        <span className="whitespace-nowrap">{getTimeRemaining(safeNumber(market.endTime))}</span>
      </div>
    </div>
  )
}
