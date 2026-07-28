import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MarketCard from '../../components/MarketCard'

const activeMarket = {
  id: 2,
  question: 'Will BTC reach $100k?',
  description: 'Resolves YES if Bitcoin reaches $100,000',
  status: 0,
  yesShares: 500_0000000n,
  noShares: 500_0000000n,
  totalLiquidity: 1000_0000000n,
  endTime: Math.floor(Date.now() / 1000) + 86400 * 30,
}

const resolvedMarket = {
  id: 3,
  question: 'Will ETH reach $5k?',
  description: 'Resolves YES if Ethereum reaches $5,000',
  status: 2,
  yesShares: 300_0000000n,
  noShares: 700_0000000n,
  totalLiquidity: 1000_0000000n,
  endTime: Math.floor(Date.now() / 1000) - 86400,
}

describe('MarketCard', () => {
  it('renders null when no market prop', () => {
    const { container } = render(<MarketCard market={null} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders the question', () => {
    render(<MarketCard market={activeMarket} />)
    expect(screen.getByText('Will BTC reach $100k?')).toBeInTheDocument()
  })

  it('renders the description', () => {
    render(<MarketCard market={activeMarket} />)
    expect(
      screen.getByText('Resolves YES if Bitcoin reaches $100,000')
    ).toBeInTheDocument()
  })

  it('shows Active badge for active markets', () => {
    render(<MarketCard market={activeMarket} />)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('shows Resolved badge for resolved markets', () => {
    render(<MarketCard market={resolvedMarket} />)
    expect(screen.getByText('Resolved')).toBeInTheDocument()
  })

  it('shows YES and NO prices', () => {
    render(<MarketCard market={activeMarket} />)
    const prices = screen.getAllByText('50.0%')
    expect(prices).toHaveLength(2)
  })

  it('calls onSelect with market id on click', () => {
    const onSelect = vi.fn()
    render(<MarketCard market={activeMarket} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('Will BTC reach $100k?'))
    expect(onSelect).toHaveBeenCalledWith(2)
  })

  it('shows liquidity amount', () => {
    render(<MarketCard market={activeMarket} />)
    expect(screen.getByText(/Liquidity:/)).toBeInTheDocument()
  })

  it('shows time remaining', () => {
    render(<MarketCard market={activeMarket} />)
    expect(screen.getByText(/\d+d \d+h/)).toBeInTheDocument()
  })

  it('shows "Ended" for past markets', () => {
    render(<MarketCard market={resolvedMarket} />)
    expect(screen.getByText('Ended')).toBeInTheDocument()
  })
})
