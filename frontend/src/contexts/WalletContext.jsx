import { createContext, useContext, useState, useEffect } from 'react'
import { isConnected, getPublicKey, requestAccess } from '@stellar/freighter-api'

const WalletContext = createContext()

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider')
  }
  return context
}

export function WalletProvider({ children }) {
  const [publicKey, setPublicKey] = useState(null)
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkConnection()
  }, [])

  const checkConnection = async () => {
    try {
      const connected = await isConnected()
      if (connected) {
        const key = await getPublicKey()
        setPublicKey(key)
        setIsWalletConnected(true)
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const connect = async () => {
    try {
      setIsLoading(true)
      await requestAccess()
      const key = await getPublicKey()
      setPublicKey(key)
      setIsWalletConnected(true)
      return key
    } catch (error) {
      console.error('Error connecting wallet:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const disconnect = () => {
    setPublicKey(null)
    setIsWalletConnected(false)
  }

  const value = {
    publicKey,
    isWalletConnected,
    isLoading,
    connect,
    disconnect,
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}
