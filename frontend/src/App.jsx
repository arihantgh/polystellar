import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import MarketDetail from './pages/MarketDetail'
import CreateMarket from './pages/CreateMarket'
import Portfolio from './pages/Portfolio'
import TestnetUsers from './pages/TestnetUsers'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/market/:id" element={<MarketDetail />} />
        <Route path="/create" element={<CreateMarket />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/testnet-users" element={<TestnetUsers />} />
      </Routes>
    </Layout>
  )
}

export default App
