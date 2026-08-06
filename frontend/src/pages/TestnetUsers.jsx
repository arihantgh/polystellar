import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TESTNET_USERS, { MARKET_NAMES } from '../config/testnetUsers'
import { getPosition, getMarket } from '../services/contractService'
import { formatAmount, shortenAddress } from '../utils/stellar'

export default function TestnetUsers() {
  const navigate = useNavigate()
  const [positions, setPositions] = useState({})  // key: "pubkey-marketId"
  const [markets, setMarkets] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load market info for active markets
      const marketIds = [...new Set(TESTNET_USERS.map(u => u.marketId))]
      const marketData = {}
      await Promise.all(marketIds.map(async (id) => {
        try {
          marketData[id] = await getMarket(id)
        } catch {}
      }))
      setMarkets(marketData)

      // Load positions — batch to avoid RPC overload
      const results = {}
      for (let i = 0; i < TESTNET_USERS.length; i += 10) {
        const batch = TESTNET_USERS.slice(i, i + 10)
        const promises = batch.map(async (user) => {
          try {
            const pos = await getPosition(user.publicKey, user.marketId)
            const key = `${user.publicKey}-${user.marketId}`
            return { key, position: pos }
          } catch {
            return null
          }
        })
        const batchResults = await Promise.all(promises)
        for (const r of batchResults) {
          if (r) results[r.key] = r.position
        }
      }

      setPositions(results)
    } catch (err) {
      console.error('Error loading user data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Group users by market and compute stats
  const usersByMarket = {}
  for (const user of TESTNET_USERS) {
    if (!usersByMarket[user.marketId]) usersByMarket[user.marketId] = []
    usersByMarket[user.marketId].push(user)
  }

  const verifiedCount = TESTNET_USERS.filter(u => {
    const pos = positions[`${u.publicKey}-${u.marketId}`]
    return pos && (pos.yesShares > 0 || pos.noShares > 0)
  }).length

  const yesCount = TESTNET_USERS.filter(u => {
    const pos = positions[`${u.publicKey}-${u.marketId}`]
    return pos && pos.yesShares > 0
  }).length

  const noCount = TESTNET_USERS.filter(u => {
    const pos = positions[`${u.publicKey}-${u.marketId}`]
    return pos && pos.noShares > 0
  }).length

  const totalVolume = TESTNET_USERS.reduce((sum, u) => {
    const pos = positions[`${u.publicKey}-${u.marketId}`]
    if (!pos) return sum
    return sum + Number(pos.yesShares) + Number(pos.noShares)
  }, 0)

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
          On-Chain Activity
        </h1>
        <p className="text-slate-400">
          {verifiedCount} unique traders have opened positions across prediction markets on testnet
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Traders</div>
          <div className="text-2xl font-bold text-white">{loading ? '...' : verifiedCount}</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Bullish (YES)</div>
          <div className="text-2xl font-bold text-success">{loading ? '...' : yesCount}</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Bearish (NO)</div>
          <div className="text-2xl font-bold text-error">{loading ? '...' : noCount}</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Volume</div>
          <div className="text-2xl font-bold text-white">{loading ? '...' : formatAmount(totalVolume)}</div>
        </div>
      </div>

      {/* Sentiment bar */}
      {!loading && verifiedCount > 0 && (
        <div className="mb-8 bg-slate-800 rounded-xl p-4 border border-slate-700">
          <div className="text-xs text-slate-500 uppercase tracking-wider mb-3">Trader Sentiment</div>
          <div className="w-full bg-slate-700 rounded-full h-5 overflow-hidden flex">
            <div
              className="bg-success transition-all duration-700"
              style={{ width: `${(yesCount / verifiedCount) * 100}%` }}
            />
            <div
              className="bg-error transition-all duration-700"
              style={{ width: `${(noCount / verifiedCount) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-xs">
            <span className="text-success">{yesCount} YES ({Math.round(yesCount / verifiedCount * 100)}%)</span>
            <span className="text-error">{noCount} NO ({Math.round(noCount / verifiedCount * 100)}%)</span>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <span className="ml-3 text-slate-400">Loading positions from chain...</span>
        </div>
      )}

      {/* Market sections */}
      {!loading && Object.entries(usersByMarket).map(([marketId, users]) => {
        const mId = Number(marketId)
        const marketInfo = markets[mId]
        const name = MARKET_NAMES[mId]
        const marketVerified = users.filter(u => {
          const pos = positions[`${u.publicKey}-${mId}`]
          return pos && (pos.yesShares > 0 || pos.noShares > 0)
        }).length

        // Sort: larger positions first
        const sortedUsers = [...users].sort((a, b) => {
          const posA = positions[`${a.publicKey}-${mId}`]
          const posB = positions[`${b.publicKey}-${mId}`]
          const totalA = posA ? Number(posA.yesShares) + Number(posA.noShares) : 0
          const totalB = posB ? Number(posB.yesShares) + Number(posB.noShares) : 0
          return totalB - totalA
        })

        return (
          <div key={mId} className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {name?.question || `Market #${mId}`}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {marketVerified} trader{marketVerified !== 1 ? 's' : ''} ·{' '}
                  {marketInfo
                    ? `${formatAmount(marketInfo.totalLiquidity)} XLM total liquidity`
                    : ''}
                </p>
              </div>
              <button
                onClick={() => navigate(`/market/${mId}`)}
                className="text-xs text-primary-400 hover:text-primary-300 transition-colors whitespace-nowrap"
              >
                View market →
              </button>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 uppercase tracking-wider border-b border-slate-700">
                    <th className="text-left py-3 px-4 font-medium">Address</th>
                    <th className="text-right py-3 px-4 font-medium">Position</th>
                    <th className="text-right py-3 px-4 font-medium">Shares</th>
                    <th className="text-right py-3 px-4 font-medium hidden sm:table-cell">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {sortedUsers.map((user, idx) => {
                    const pos = positions[`${user.publicKey}-${mId}`]
                    const yesShares = pos ? Number(pos.yesShares) : 0
                    const noShares = pos ? Number(pos.noShares) : 0
                    const outcome = yesShares > 0 ? 'YES' : noShares > 0 ? 'NO' : null
                    const shares = yesShares > 0 ? yesShares : noShares
                    const verified = yesShares > 0 || noShares > 0

                    return (
                      <tr
                        key={user.publicKey}
                        className={`hover:bg-slate-700/30 transition-colors ${!verified ? 'opacity-40' : ''}`}
                      >
                        <td className="py-2.5 px-4">
                          <a
                            href={`https://stellar.expert/explorer/testnet/account/${user.publicKey}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-400 hover:text-primary-300 font-mono text-xs"
                          >
                            {shortenAddress(user.publicKey, 8)}
                          </a>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {outcome ? (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                              outcome === 'YES'
                                ? 'bg-green-500/20 text-success'
                                : 'bg-red-500/20 text-error'
                            }`}>
                              {outcome}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-600">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-xs text-white">
                          {verified ? formatAmount(shares) : '—'}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-xs text-slate-400 hidden sm:table-cell">
                          {verified ? `${formatAmount(shares * 100 / (shares + 1))}¢` : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      })}

      {/* Footer */}
      <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-primary-600/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-3.5 h-3.5 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Verified On-Chain</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              All positions fetched live via <code className="text-primary-400">get_position()</code> on the
              Soroban smart contract. Each trader funded their own account, deposited XLM, and
              independently bought shares through the AMM.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
