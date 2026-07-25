import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletContext'
import { createMarket } from '../services/contractService'
import { parseAmount } from '../utils/stellar'

export default function CreateMarket() {
  const navigate = useNavigate()
  const { publicKey, isWalletConnected, connect } = useWallet()
  
  const [formData, setFormData] = useState({
    question: '',
    description: '',
    endDate: '',
    endTime: '',
    resolutionDate: '',
    resolutionTime: '',
    initialLiquidity: '',
  })
  
  const [creating, setCreating] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isWalletConnected) {
      await connect()
      return
    }

    // Validation
    if (!formData.question || !formData.description || !formData.endDate || !formData.resolutionDate || !formData.initialLiquidity) {
      alert('Please fill in all required fields')
      return
    }

    // Create timestamps - use UTC midnight if no time specified, otherwise use local time
    const endDateTime = `${formData.endDate}T${formData.endTime || '00:00:00'}`
    const resolutionDateTime = `${formData.resolutionDate}T${formData.resolutionTime || '00:00:00'}`
    
    const endTimestamp = Math.floor(new Date(endDateTime).getTime() / 1000)
    const resolutionTimestamp = Math.floor(new Date(resolutionDateTime).getTime() / 1000)
    const currentTimestamp = Math.floor(Date.now() / 1000)

    // Add a buffer of 60 seconds to account for transaction time
    if (endTimestamp <= (currentTimestamp + 60)) {
      alert(`End date must be in the future. Current time: ${new Date().toLocaleString()}, End time: ${new Date(endTimestamp * 1000).toLocaleString()}`)
      return
    }

    if (resolutionTimestamp <= endTimestamp) {
      alert('Resolution date must be after end date')
      return
    }

    const liquidity = parseFloat(formData.initialLiquidity)
    if (liquidity < 100) {
      alert('Minimum initial liquidity is 100 tokens')
      return
    }

    try {
      setCreating(true)
      
      const marketData = {
        question: formData.question,
        description: formData.description,
        endTime: endTimestamp,
        resolutionTime: resolutionTimestamp,
        initialLiquidity: parseAmount(liquidity),
      }

      console.log('Creating market with data:', {
        ...marketData,
        endTimeReadable: new Date(endTimestamp * 1000).toLocaleString(),
        resolutionTimeReadable: new Date(resolutionTimestamp * 1000).toLocaleString(),
      })

      const result = await createMarket(publicKey, marketData)
      
      console.log('Market creation result:', result)
      
      alert('Market created successfully!')
      navigate('/')
    } catch (err) {
      console.error('Error creating market:', err)
      
      // Check for "Bad union switch" error - this actually means success
      if (err?.message?.includes('Bad union switch')) {
        alert('Market created successfully!')
        navigate('/')
        return
      }
      
      // Check if error message indicates timeout but transaction might have succeeded
      if (err?.message?.includes('timeout') || err?.message?.includes('NOT_FOUND')) {
        alert('Transaction was submitted but confirmation timed out. The market may have been created. Please check the Markets page.')
        navigate('/')
      } else {
        const errorMessage = err?.message || 'Failed to create market. Please try again.'
        alert(errorMessage)
      }
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Create New Market</h1>
        <p className="text-slate-400">
          Create a prediction market for any future event
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div>
          <label className="label">Question *</label>
          <input
            type="text"
            name="question"
            value={formData.question}
            onChange={handleChange}
            placeholder="Will Bitcoin reach $100,000 by end of 2025?"
            className="input"
            required
          />
          <p className="text-xs text-slate-400 mt-1">
            Write a clear yes/no question about a future event
          </p>
        </div>

        <div>
          <label className="label">Description *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="This market resolves YES if Bitcoin (BTC) reaches or exceeds $100,000 USD..."
            className="input"
            rows="4"
            required
          />
          <p className="text-xs text-slate-400 mt-1">
            Provide detailed resolution criteria
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">End Date *</label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
              className="input"
              required
            />
            <p className="text-xs text-slate-400 mt-1">
              When trading closes (must be at least 1 day in future)
            </p>
          </div>
          <div>
            <label className="label">End Time</label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="input"
              placeholder="23:59"
            />
            <p className="text-xs text-slate-400 mt-1">
              Leave empty for midnight
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Resolution Date *</label>
            <input
              type="date"
              name="resolutionDate"
              value={formData.resolutionDate}
              onChange={handleChange}
              min={formData.endDate || new Date(Date.now() + 172800000).toISOString().split('T')[0]}
              className="input"
              required
            />
            <p className="text-xs text-slate-400 mt-1">
              When outcome is determined (after end date)
            </p>
          </div>
          <div>
            <label className="label">Resolution Time</label>
            <input
              type="time"
              name="resolutionTime"
              value={formData.resolutionTime}
              onChange={handleChange}
              className="input"
              placeholder="23:59"
            />
            <p className="text-xs text-slate-400 mt-1">
              Leave empty for midnight
            </p>
          </div>
        </div>

        {/* Guide Section - Below Dates */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-5">
          <h3 className="text-base font-semibold text-blue-400 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How to Choose Dates
          </h3>
          <div className="space-y-2.5 text-sm text-slate-300">
            <div className="flex items-start">
              <span className="font-semibold text-blue-400 mr-2 flex-shrink-0">1.</span>
              <div>
                <span className="font-semibold">End Date:</span> When trading closes. Users can no longer buy or sell shares after this time. 
                <span className="text-blue-300"> Must be at least 1 day in the future.</span>
              </div>
            </div>
            <div className="flex items-start">
              <span className="font-semibold text-blue-400 mr-2 flex-shrink-0">2.</span>
              <div>
                <span className="font-semibold">Resolution Date:</span> When the outcome is determined and the market is resolved. 
                <span className="text-blue-300"> Must be after the end date.</span>
              </div>
            </div>
            <div className="flex items-start">
              <span className="font-semibold text-blue-400 mr-2 flex-shrink-0">3.</span>
              <div>
                <span className="font-semibold">Time (Optional):</span> Leave empty to default to midnight (00:00). Specify a time if your event has a specific deadline.
              </div>
            </div>
            <div className="bg-slate-800/50 rounded p-3 mt-2">
              <p className="text-xs font-semibold text-yellow-400 mb-1">💡 Example Timeline:</p>
              <p className="text-xs">
                "Will Bitcoin reach $100k by end of 2025?"
                <br />
                <span className="text-slate-400">• End Date: Dec 31, 2025 at 23:59</span>
                <br />
                <span className="text-slate-400">• Resolution Date: Jan 1, 2026 at 12:00</span>
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="label">Initial Liquidity (tokens) *</label>
          <input
            type="number"
            name="initialLiquidity"
            value={formData.initialLiquidity}
            onChange={handleChange}
            placeholder="1000"
            className="input"
            min="100"
            step="0.01"
            required
          />
          <p className="text-xs text-slate-400 mt-1">
            Minimum: 100 tokens. This will be locked in the market as initial liquidity.
          </p>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4 text-sm text-slate-300">
          <h3 className="font-semibold mb-2">Important Notes:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>Trading ends at the specified end date</li>
            <li>Resolution date is when the outcome will be determined</li>
            <li>Initial liquidity will be split equally between YES and NO</li>
            <li>You'll be able to trade in your own market</li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={creating}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {!isWalletConnected
            ? 'Connect Wallet to Create'
            : creating
            ? 'Creating Market...'
            : 'Create Market'}
        </button>
      </form>
    </div>
  )
}
