import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Upload, Network, Map, Link2,
  Activity, TrendingUp, Smartphone, Shield, LogOut,
  AlertTriangle, Database
} from 'lucide-react'

const NAV = [
  { section: 'OVERVIEW' },
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { section: 'ANALYSIS' },
  { to: '/parser', icon: Upload, label: 'IPDR Parser', badge: null },
  { to: '/network', icon: Network, label: 'Network Graph' },
  { to: '/geolocation', icon: Map, label: 'Geolocation' },
  { section: 'INTELLIGENCE' },
  { to: '/cross-case', icon: Link2, label: 'Cross-Case Link' },
  { to: '/patterns', icon: Activity, label: 'Pattern Detection' },
  { to: '/predictive', icon: TrendingUp, label: 'Predictive AI' },
  { to: '/devices', icon: Smartphone, label: 'Device Intel' },
]

export default function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <div className="brand">IAP</div>
        <div className="sub">IPDR INTELLIGENCE PLATFORM</div>
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="status-dot online" />
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>SYSTEM ONLINE</span>
        </div>
      </div>

      <div style={{ flex: 1 }}>
        {NAV.map((item, i) => {
          if (item.section) return (
            <div key={i} className="sidebar-section-label">{item.section}</div>
          )
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon className="nav-icon" size={16} />
              {item.label}
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
