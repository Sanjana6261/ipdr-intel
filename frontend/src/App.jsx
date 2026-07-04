import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AppShell from './components/layout/AppShell'
import DashboardPage from './pages/DashboardPage'
import ParserPage from './pages/ParserPage'
import NetworkGraphPage from './pages/NetworkGraphPage'
import GeolocationPage from './pages/GeolocationPage'
import CrossCasePage from './pages/CrossCasePage'
import PatternsPage from './pages/PatternsPage'
import PredictivePage from './pages/PredictivePage'
import DevicePage from './pages/DevicePage'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#111827',
            color: '#e2e8f0',
            border: '1px solid #1e293b',
            fontSize: '13px',
          },
        }}
      />
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<DashboardPage />} />
          <Route path="parser" element={<ParserPage />} />
          <Route path="network" element={<NetworkGraphPage />} />
          <Route path="geolocation" element={<GeolocationPage />} />
          <Route path="cross-case" element={<CrossCasePage />} />
          <Route path="patterns" element={<PatternsPage />} />
          <Route path="predictive" element={<PredictivePage />} />
          <Route path="devices" element={<DevicePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
