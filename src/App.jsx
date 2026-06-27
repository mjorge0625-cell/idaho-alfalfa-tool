import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { FarmProvider } from './context/FarmContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import FarmSetup from './pages/FarmSetup'
import YieldCalculator from './pages/YieldCalculator'
import WaterStrategy from './pages/WaterStrategy'
import RevenueQuality from './pages/RevenueQuality'
import CuttingTiming from './pages/CuttingTiming'
import FarmDashboard from './pages/FarmDashboard'
import MachineryCost from './pages/MachineryCost'
import InputCosts from './pages/InputCosts'
import DroughtHistory from './pages/DroughtHistory'
import QuickCheck from './pages/QuickCheck'
import FeedbackWidget from './components/FeedbackWidget'

export default function App() {
  return (
    <FarmProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/"           element={<Home />} />
          <Route path="/farm-setup" element={<FarmSetup />} />
          <Route path="/yield"      element={<YieldCalculator />} />
          <Route path="/water"      element={<WaterStrategy />} />
          <Route path="/revenue"    element={<RevenueQuality />} />
          <Route path="/cutting"    element={<CuttingTiming />} />
          <Route path="/dashboard"  element={<FarmDashboard />} />
          <Route path="/machinery"  element={<MachineryCost />} />
          <Route path="/costs"      element={<InputCosts />} />
          <Route path="/drought-history" element={<DroughtHistory />} />
          <Route path="/quick"          element={<QuickCheck />} />
        </Routes>
        <Footer />
        <FeedbackWidget />
      </BrowserRouter>
    </FarmProvider>
  )
}
