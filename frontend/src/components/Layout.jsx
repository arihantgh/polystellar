import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { shortenAddress } from '../utils/stellar'

export default function Layout({ children }) {
  const { publicKey, isWalletConnected, connect, disconnect } = useWallet()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleWalletAction = async () => {
    if (isWalletConnected) {
      disconnect()
    } else {
      try {
        await connect()
      } catch (error) {
        alert('Failed to connect wallet. Please install Freighter extension.')
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Navigation */}
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xl">P</span>
                </div>
                <span className="text-white font-bold text-xl whitespace-nowrap">PolyStellar</span>
              </Link>
              
              <div className="hidden md:flex space-x-4">
                <Link to="/" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap">
                  Markets
                </Link>
                <Link to="/portfolio" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap">
                  Portfolio
                </Link>
                <Link to="/create" className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap">
                  Create Market
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleWalletAction}
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 md:px-6 rounded-lg transition-colors duration-200 whitespace-nowrap text-sm md:text-base"
              >
                {isWalletConnected ? shortenAddress(publicKey) : 'Connect Wallet'}
              </button>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden text-slate-300 hover:text-white p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
          
          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 space-y-2">
              <Link 
                to="/" 
                className="block text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Markets
              </Link>
              <Link 
                to="/portfolio" 
                className="block text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Portfolio
              </Link>
              <Link 
                to="/create" 
                className="block text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Create Market
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
