import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, AlertTriangle, Activity, Network, Map,
  Link2, TrendingUp, Smartphone, Upload, ArrowRight,
  Shield, Zap, Clock
} from 'lucide-react'
import { casesAPI, patternsAPI } from '../api/client'
import { useCaseStore } from '../store/caseStore'

const MOCK_METRICS = [
  { label: 'Active Subjects', value: '47', change: '+3 today', dir: 'up', color: 'blue', icon: Users },
  { label: 'Critical Alerts', value: '12', change: '4 new', dir: 'up', color: 'red', icon: AlertTriangle },
  { label: 'Patterns Detected', value: '238', change: '+18 this week', dir: 'up', color: 'amber', icon: Activity },
  { label: 'Cases Linked', value: '9', change: '2 this month', dir: 'up', color: 'purple', icon: Link2 },
  { label: 'Records Parsed', value: '2.4M', change: '50K today', dir: 'up', color: 'green', icon: Upload },
]

const RECENT_ALERTS = [
  { type: 'critical', msg: 'REPEAT OFFENDER: +91-9876543210 matches Case #CR-2024-0892', time: '2 min ago' },
  { type: 'warning', msg: 'Flash call pattern detected for Subject ID #4423 — 47 calls <10s', time: '8 min ago' },
  { type: 'warning', msg: 'SIM Swap Alert: IMEI 356789012345678 — new number activated', time: '15 min ago' },
  { type: 'critical', msg: 'Night activity spike: Subject #0091 — 23 calls between 02:00-04:00', time: '1 hr ago' },
  { type: 'info', msg: 'New case #CR-2026-0047 added: Cyber fraud investigation', time: '2 hr ago' },
]

const QUICK_ACTIONS = [
  { label: 'Upload IPDR', icon: Upload, to: '/parser', color: 'var(--accent-blue)' },
  { label: 'View Network', icon: Network, to: '/network', color: 'var(--accent-purple)' },
  { label: 'Heatmap', icon: Map, to: '/geolocation', color: 'var(--accent-green)' },
  { label: 'Predict', icon: TrendingUp, to: '/predictive', color: 'var(--accent-amber)' },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const parseStats = useCaseStore(s => s.parseStats)

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title">
          <Shield size={22} style={{ color: 'var(--accent-blue)' }} />
          Intelligence Overview
        </h1>
        <p className="page-description">Real-time investigation summary and system status</p>
      </div>

      {/* Metrics */}
      <div className="grid-5 mb-6">
        {MOCK_METRICS.map((m) => (
          <div key={m.label} className={`metric-card ${m.color}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div className="metric-label">{m.label}</div>
                <div className={`metric-value text-${m.color === 'blue' ? 'blue' : m.color === 'red' ? 'red' : m.color === 'amber' ? 'amber' : m.color === 'green' ? 'green' : ''}`}>
                  {parseStats && m.label === 'Records Parsed' ? (parseStats.total_records / 1000).toFixed(0) + 'K' : m.value}
                </div>
              </div>
              <m.icon size={20} style={{ opacity: 0.4 }} />
            </div>
            <div className={`metric-change ${m.dir}`}>↑ {m.change}</div>
          </div>
        ))}
      </div>

      <div className="grid-2 mb-4" style={{ gridTemplateColumns: '2fr 1fr' }}>
        {/* Recent Alerts */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <AlertTriangle size={16} style={{ color: 'var(--accent-red)' }} />
              Live Alert Feed
            </div>
            <span className="status-dot alert" />
          </div>
          <div className="timeline">
            {RECENT_ALERTS.map((a, i) => (
              <div key={i} className={`timeline-item ${a.type === 'critical' ? 'red' : a.type === 'warning' ? 'amber' : ''}`}>
                <div className="timeline-time">{a.time}</div>
                <div className="timeline-text">{a.msg}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <Zap size={16} style={{ color: 'var(--accent-amber)' }} />
              Quick Actions
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                className="btn btn-outline w-full"
                style={{ justifyContent: 'flex-start', gap: 10 }}
                onClick={() => navigate(a.to)}
                id={`quick-${a.label.toLowerCase().replace(' ', '-')}`}
              >
                <a.icon size={15} style={{ color: a.color }} />
                {a.label}
                <ArrowRight size={13} style={{ marginLeft: 'auto', opacity: 0.4 }} />
              </button>
            ))}
          </div>

          <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>SYSTEM STATUS</div>
            {[
              { name: 'Parser Engine', ok: true },
              { name: 'Graph Engine', ok: true },
              { name: 'Pattern AI', ok: true },
              { name: 'Geo Service', ok: true },
            ].map(s => (
              <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{s.name}</span>
                <span style={{ color: s.ok ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: 10 }}>
                  {s.ok ? '● ONLINE' : '● OFFLINE'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Repeat offender banner */}
      <div className="alert-banner critical" style={{ marginBottom: 16 }}>
        <AlertTriangle size={16} />
        ⚠ CRITICAL: 3 subjects flagged as REPEAT OFFENDERS match active cases. Immediate review required.
        <button className="btn btn-outline btn-sm" style={{ marginLeft: 'auto' }} onClick={() => navigate('/cross-case')}>
          Review →
        </button>
      </div>

      {/* Summary row */}
      <div className="grid-3">
        {[
          { label: 'Top Risk Subject', value: '+91-9876543210', sub: 'Risk Score: 94/100', color: 'red' },
          { label: 'Most Active Case', value: 'CR-2026-0033', sub: 'Drug trafficking · 12 subjects', color: 'amber' },
          { label: 'Next Prediction', value: 'Contact in ~2hr', sub: 'Subject #4423 → likely +91-8821...', color: 'blue' },
        ].map(s => (
          <div key={s.label} className={`card metric-card ${s.color}`}>
            <div className="metric-label">{s.label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', margin: '8px 0 4px', fontFamily: 'JetBrains Mono' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
