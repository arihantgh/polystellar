import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock freighter-api
vi.mock('@stellar/freighter-api', () => ({
  isConnected: vi.fn(),
  getPublicKey: vi.fn(),
  requestAccess: vi.fn(),
}))

import { isConnected, getPublicKey, requestAccess } from '@stellar/freighter-api'
import { WalletProvider, useWallet } from '../../contexts/WalletContext'

function TestConsumer() {
  const { publicKey, isWalletConnected, isLoading, connect, disconnect } = useWallet()
  return (
    <div>
      <span data-testid="connected">{isWalletConnected ? 'connected' : 'disconnected'}</span>
      <span data-testid="loading">{isLoading ? 'loading' : 'ready'}</span>
      <span data-testid="pk">{publicKey || 'none'}</span>
      <button data-testid="connect-btn" onClick={connect}>Connect</button>
      <button data-testid="disconnect-btn" onClick={disconnect}>Disconnect</button>
    </div>
  )
}

function renderWithProvider() {
  return render(
    <WalletProvider>
      <TestConsumer />
    </WalletProvider>
  )
}

describe('WalletContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts disconnected with no public key', async () => {
    isConnected.mockResolvedValue(false)

    renderWithProvider()

    await waitFor(() => {
      expect(screen.getByTestId('connected').textContent).toBe('disconnected')
      expect(screen.getByTestId('pk').textContent).toBe('none')
    })
  })

  it('shows connected state when wallet is connected on mount', async () => {
    isConnected.mockResolvedValue(true)
    getPublicKey.mockResolvedValue('GABCDEF12345')

    renderWithProvider()

    await waitFor(() => {
      expect(screen.getByTestId('connected').textContent).toBe('connected')
      expect(screen.getByTestId('pk').textContent).toBe('GABCDEF12345')
    })
  })

  it('connects when connect button is clicked', async () => {
    isConnected.mockResolvedValue(false)
    requestAccess.mockResolvedValue(undefined)
    getPublicKey.mockResolvedValue('GNEWKEY67890')

    renderWithProvider()

    await waitFor(() => {
      expect(screen.getByTestId('connected').textContent).toBe('disconnected')
    })

    await userEvent.click(screen.getByTestId('connect-btn'))

    await waitFor(() => {
      expect(screen.getByTestId('connected').textContent).toBe('connected')
      expect(screen.getByTestId('pk').textContent).toBe('GNEWKEY67890')
    })
  })

  it('disconnects when disconnect button is clicked', async () => {
    isConnected.mockResolvedValue(true)
    getPublicKey.mockResolvedValue('GABCDEF12345')

    renderWithProvider()

    await waitFor(() => {
      expect(screen.getByTestId('connected').textContent).toBe('connected')
    })

    await userEvent.click(screen.getByTestId('disconnect-btn'))

    expect(screen.getByTestId('connected').textContent).toBe('disconnected')
    expect(screen.getByTestId('pk').textContent).toBe('none')
  })

  it('throws when useWallet is used outside provider', () => {
    expect(() => render(<TestConsumer />)).toThrow(
      'useWallet must be used within WalletProvider'
    )
  })
})
