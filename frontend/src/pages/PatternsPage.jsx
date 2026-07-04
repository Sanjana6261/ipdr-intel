import { useState } from 'react'
import { Activity, AlertTriangle, TrendingUp, Clock, Zap, RefreshCw } from 'lucide-react'
import { patternsAPI } from '../api/client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'
import toast from 'react-hot-toast'

const RISK_CONFIG = {
  critical: { color: 'var(--accent-red)', cls: 'badge-critical', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
  high:     { color: 'var(--accent-amber)', cls: 'badge-high', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
  medium:   { color: 'var(--accent-purple)', cls: 'badge-medium', bg: 'rgba(124,58,237,0.08)', border: 'rgba(124,58,237,0.2)' },
  low:      { color: 'var(--accent-green)', cls: 'badge-low', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)' },
}

const PATTERN_ICONS = {
  flash_calls: Zap,
  late_night: Clock,
  burst: Activity,
  default: TrendingUp,
}

const chartStyle = { fontSize: 11, fill: '#94a3b8' }

export default function PatternsPage() {
  const [subjectId, setSubjectId] = useState('S001')
  const [loading, setLoading] = useState(false)
  const [patterns, setPatterns] = useState(null)
  const [activeTab, setActiveTab] = useState('all')

  const detect = async () => {
    setLoading(true)
    try {
      const res = await patternsAPI.detect(subjectId)
      setPatterns(res.data)
      toast.success(`Detected ${res.data.patterns.length} patterns`)
    } catch { toast.error('Pattern detection failed') }
    finally { setLoading(false) }
  }

  const filtered = patterns?.patterns?.filter(p => activeTab === 'all' || p.risk === activeTab) || []

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title"><Activity size={22} style={{ color: 'var(--accent-amber)' }} />Temporal Pattern Detection</h1>
        <p className="page-description">AI-powered detection of suspicious communication patterns</p>
      </div>

      {/* Controls */}
      <div className="card" style={{ marginBottom: 20, padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label className="form-label" style={{ margin: 0 }}>Subject ID</label>
          <input id="patterns-subject-id" className="form-input" style={{ width: 100 }} value={subjectId} onChange={e => setSubjectId(e.target.value)} />
          <button className="btn btn-primary btn-sm" onClick={detect} disabled={loading} id="detect-patterns-btn">
            {loading ? <><span className="spinner" style={{ width: 12, height: 12 }} />Analyzing...</> : <><Activity size={13} />Detect Patterns</>}
          </button>
          {patterns && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
              {['all', 'critical', 'high', 'medium', 'low'].map(r => (
                <button key={r} className={`btn btn-sm ${activeTab === r ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab(r)} style={{ textTransform: 'capitalize' }}>
                  {r === 'all' ? `All (${patterns.patterns.length})` : `${r} (${patterns.patterns.filter(p => p.risk === r).length})`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {patterns && (
        <>
          {/* Risk Score */}
          <div className="grid-4" style={{ marginBottom: 20 }}>
            <div className="metric-card red">
              <div className="metric-label">Overall Risk Score</div>
              <div className="metric-value text-red">{patterns.risk_score}/100</div>
              <div className="progress-bar" style={{ marginTop: 8 }}>
                <div className="progress-fill" style={{ width: `${patterns.risk_score}%`, background: 'linear-gradient(90deg, var(--accent-amber), var(--accent-red))' }} />
              </div>
            </div>
            {[
              { label: 'Critical', value: patterns.patterns.filter(p => p.risk === 'critical').length, color: 'red' },
              { label: 'High Risk', value: patterns.patterns.filter(p => p.risk === 'high').length, color: 'amber' },
              { label: 'Total Detected', value: patterns.patterns.length, color: 'blue' },
            ].map(m => (
              <div key={m.label} className={`metric-card ${m.color}`}>
                <div className="metric-label">{m.label}</div>
                <div className={`metric-value text-${m.color === 'blue' ? 'blue' : m.color === 'red' ? 'red' : 'amber'}`}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Charts */}
          {patterns.hourly_distribution && (
            <div className="grid-2" style={{ marginBottom: 20 }}>
              <div className="card">
                <div className="card-title" style={{ marginBottom: 14 }}><Clock size={14} />Hourly Call Distribution</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={patterns.hourly_distribution}>
                    <XAxis dataKey="hour" tick={chartStyle} />
                    <YAxis tick={chartStyle} />
                    <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="count" fill="var(--accent-blue)" radius={[2, 2, 0, 0]}
                      label={false}
                      isAnimationActive
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card">
                <div className="card-title" style={{ marginBottom: 14 }}><TrendingUp size={14} />Daily Activity Trend</div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={patterns.daily_trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" tick={chartStyle} />
                    <YAxis tick={chartStyle} />
                    <Tooltip contentStyle={{ background: '#111827', border: '1px solid #1e293b', borderRadius: 8, fontSize: 12 }} />
                    <Line type="monotone" dataKey="count" stroke="var(--accent-purple)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Pattern Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map((p, i) => {
              const cfg = RISK_CONFIG[p.risk] || RISK_CONFIG.low
              const Icon = PATTERN_ICONS[p.type] || PATTERN_ICONS.default
              return (
                <div key={i} className="card" style={{ background: cfg.bg, borderColor: cfg.border, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: `${cfg.color}20`, border: `1px solid ${cfg.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={16} style={{ color: cfg.color }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{p.description}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <span className={`badge ${cfg.cls}`}>{p.risk.toUpperCase()}</span>
                      <span className="badge badge-blue">{p.confidence}%</span>
                    </div>
                  </div>

                  <div className="confidence-row" style={{ marginTop: 12, marginBottom: 0 }}>
                    <span className="confidence-label">Pattern Confidence</span>
                    <div className="confidence-bar">
                      <div className="confidence-fill" style={{ width: `${p.confidence}%`, background: `linear-gradient(90deg, ${cfg.color}80, ${cfg.color})` }} />
                    </div>
                    <span className="confidence-pct">{p.confidence}%</span>
                  </div>

                  {p.evidence && (
                    <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text-muted)', padding: '8px 10px', background: 'rgba(0,0,0,0.2)', borderRadius: 6 }}>
                      <b style={{ color: 'var(--text-secondary)' }}>Evidence: </b>{p.evidence}
                    </div>
                  )}

                  {p.detected_at && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>
                      <Clock size={10} style={{ display: 'inline', marginRight: 4 }} />Detected: {p.detected_at}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {!patterns && !loading && (
        <div className="card">
          <div className="empty-state">
            <Activity className="empty-state-icon" />
            <div className="empty-state-title">No analysis run yet</div>
            <div className="empty-state-sub">Enter a subject ID and click Detect Patterns</div>
          </div>
        </div>
      )}
    </div>
  )
}
