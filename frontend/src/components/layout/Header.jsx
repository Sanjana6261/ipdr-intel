import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Search, Bell, ChevronDown, Zap } from 'lucide-react'
import { useCaseStore } from '../../store/caseStore'
import { parserAPI } from '../../api/client'
import toast from 'react-hot-toast'

const ROUTE_LABELS = {
  '/': 'Dashboard',
  '/parser': 'IPDR Parser',
  '/network': 'Network Graph',
  '/geolocation': 'Geolocation Heatmap',
  '/cross-case': 'Cross-Case Linking',
  '/patterns': 'Pattern Detection',
  '/predictive': 'Predictive Analytics',
  '/devices': 'Device Intelligence',
}

export default function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const setParsedData = useCaseStore(s => s.setParsedData)
  const parseStats = useCaseStore(s => s.parseStats)

  const title = ROUTE_LABELS[location.pathname] || 'IPDR Platform'

  const loadDemo = async () => {
    setLoading(true)
    try {
      const res = await parserAPI.loadDemo()
      setParsedData(res.data.records, res.data.stats)
      toast.success(`Demo data loaded: ${res.data.stats.total_records.toLocaleString()} records`)
      navigate('/parser')
    } catch {
      toast.error('Failed to load demo data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <header className="app-header">
      <div>
        <div className="header-title">{title}</div>
        {parseStats && (
          <div className="header-subtitle">
            {parseStats.total_records?.toLocaleString()} records · {parseStats.subjects} subjects
          </div>
        )}
      </div>

      <div className="header-spacer" />

      <div className="header-search">
        <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        <input
          id="global-search"
          placeholder="Search number, IMEI, case..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <button
        className="btn btn-primary btn-sm"
        onClick={loadDemo}
        disabled={loading}
        id="load-demo-btn"
        title="Load synthetic demo data for presentation"
      >
        <Zap size={13} />
        {loading ? 'Loading...' : 'Load Demo'}
      </button>

      <div style={{ position: 'relative' }}>
        <button 
          className="btn btn-ghost btn-sm" 
          style={{ position: 'relative' }}
          onClick={() => setShowNotifs(!showNotifs)}
        >
          <Bell size={16} />
          <span style={{
            position: 'absolute', top: 4, right: 4,
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent-red)',
            border: '1px solid var(--bg-secondary)'
          }} />
        </button>

        {showNotifs && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: 320,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--glass-shadow)',
            zIndex: 100,
            backdropFilter: 'blur(16px)',
            overflow: 'hidden'
          }} className="fade-in">
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Notifications
              <span className="badge badge-critical">2 New</span>
            </div>
            
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', background: 'rgba(239,68,68,0.05)' }} className="hover:bg-card-hover">
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-red)', marginBottom: 4 }}>🚨 SIM Swap Alert</div>
                <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>Subject S001 device detected with new IMSI ending in 8923.</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Just now</div>
              </div>
              
              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-amber)', marginBottom: 4 }}>⚠️ Flash Calls Detected</div>
                <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>High frequency of short duration calls detected on number +9188...</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>10 mins ago</div>
              </div>

              <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-blue)', marginBottom: 4 }}>ℹ️ Data Processing Complete</div>
                <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>50,000 records successfully parsed and indexed for analysis.</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>1 hr ago</div>
              </div>
            </div>

            <div style={{ padding: '10px', textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer', background: 'rgba(0,0,0,0.2)' }}>
              Mark all as read
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
