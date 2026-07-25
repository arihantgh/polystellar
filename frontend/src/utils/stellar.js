import * as StellarSdk from '@stellar/stellar-sdk'
import { signTransaction } from '@stellar/freighter-api'
import { CONTRACT_ID, HORIZON_URL, SOROBAN_RPC_URL, NETWORK_PASSPHRASE } from '../config/constants'

const server = new StellarSdk.Horizon.Server(HORIZON_URL)
const sorobanServer = new StellarSdk.SorobanRpc.Server(SOROBAN_RPC_URL)

/**
 * Build and submit a transaction to invoke a contract method
 */
export async function invokeContract(publicKey, method, params = []) {
  try {
    // Load account
    const account = await server.loadAccount(publicKey)
    
    // Create contract instance
    const contract = new StellarSdk.Contract(CONTRACT_ID)
    
    // Build operation
    const operation = contract.call(method, ...params)
    
    // Build transaction
    let transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(180)
      .build()
    
    // Simulate transaction to get auth and resource fees
    const simulateResponse = await sorobanServer.simulateTransaction(transaction)
    
    if (StellarSdk.SorobanRpc.Api.isSimulationError(simulateResponse)) {
      throw new Error(`Simulation failed: ${simulateResponse.error}`)
    }
    
    // Prepare the transaction with simulation results
    transaction = StellarSdk.SorobanRpc.assembleTransaction(
      transaction,
      simulateResponse
    ).build()
    
    // Sign with Freighter
    const xdr = transaction.toXDR()
    const signedXdr = await signTransaction(xdr, {
      network: 'TESTNET',
      networkPassphrase: NETWORK_PASSPHRASE,
    })
    
    // Parse signed transaction
    const signedTx = StellarSdk.TransactionBuilder.fromXDR(
      signedXdr,
      NETWORK_PASSPHRASE
    )
    
    // Submit transaction to Soroban RPC
    const result = await sorobanServer.sendTransaction(signedTx)
    
    console.log('Transaction submitted:', result)
    
    if (result.status === 'ERROR') {
      throw new Error(`Transaction failed: ${result.errorResultXdr || 'Unknown error'}`)
    }
    
    // Wait for transaction to be included in a ledger
    if (result.status === 'PENDING' || result.status === 'DUPLICATE') {
      let getResponse = await sorobanServer.getTransaction(result.hash)
      
      // Poll for transaction result (max 60 seconds)
      let attempts = 0
      while (getResponse.status === 'NOT_FOUND' && attempts < 60) {
        console.log(`Polling attempt ${attempts + 1}/60...`)
        await new Promise(resolve => setTimeout(resolve, 1000))
        getResponse = await sorobanServer.getTransaction(result.hash)
        attempts++
      }
      
      console.log('Transaction result:', getResponse.status)
      
      if (getResponse.status === 'SUCCESS') {
        return getResponse
      } else if (getResponse.status === 'FAILED') {
        throw new Error(`Transaction failed: ${getResponse.resultXdr || 'Check contract conditions'}`)
      } else if (getResponse.status === 'NOT_FOUND') {
        throw new Error(`Transaction timeout - not confirmed within 60 seconds`)
      } else {
        throw new Error(`Unexpected transaction status: ${getResponse.status}`)
      }
    }
    
    // If status is already SUCCESS (shouldn't happen but handle it)
    if (result.status === 'SUCCESS') {
      return result
    }
    
    // Unknown status
    throw new Error(`Unexpected send result status: ${result.status}`)
  } catch (error) {
    console.error('Error invoking contract:', error)
    throw error
  }
}

/**
 * Read contract data without submitting a transaction
 */
export async function simulateContract(method, params = []) {
  try {
    const contract = new StellarSdk.Contract(CONTRACT_ID)
    const operation = contract.call(method, ...params)
    
    // Create a temporary transaction for simulation
    const account = new StellarSdk.Account(
      'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF',
      '0'
    )
    
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(operation)
      .setTimeout(180)
      .build()
    
    const response = await sorobanServer.simulateTransaction(transaction)
    
    if (StellarSdk.SorobanRpc.Api.isSimulationSuccess(response)) {
      return response.result.retval
    } else {
      console.error('Simulation error:', response)
      throw new Error(response.error || 'Simulation failed')
    }
  } catch (error) {
    console.error('Error simulating contract:', error)
    throw error
  }
}

/**
 * Convert Stellar value to human-readable format
 */
export function formatAmount(amount, decimals = 7) {
  return (Number(amount) / Math.pow(10, decimals)).toFixed(2)
}

/**
 * Convert human-readable amount to Stellar value
 */
export function parseAmount(amount, decimals = 7) {
  return Math.floor(Number(amount) * Math.pow(10, decimals))
}

/**
 * Shorten address for display
 */
export function shortenAddress(address, chars = 4) {
  if (!address) return ''
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

/**
 * Format date
 */
export function formatDate(timestamp) {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Calculate time remaining
 */
export function getTimeRemaining(endTime) {
  const now = Math.floor(Date.now() / 1000)
  const remaining = endTime - now
  
  if (remaining <= 0) return 'Ended'
  
  const days = Math.floor(remaining / 86400)
  const hours = Math.floor((remaining % 86400) / 3600)
  const minutes = Math.floor((remaining % 3600) / 60)
  
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

/**
 * Format percentage
 */
export function formatPercentage(value) {
  return `${(value / 100).toFixed(1)}%`
}
