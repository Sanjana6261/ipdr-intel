import { useState } from 'react'
import { TrendingUp, User, Map, Activity, Shield, Info } from 'lucide-react'
import { predictiveAPI } from '../api/client'
import toast from 'react-hot-toast'

export default function PredictivePage() {
  const [subjectId, setSubjectId] = useState('S001')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)

  const predict = async () => {
    setLoading(true)
    try {
      const res = await predictiveAPI.predict(subjectId)
      setData(res.data)
    } catch { toast.error('Prediction failed') }
    finally { setLoading(false) }
  }

  const TrendBadge = ({ trend }) => (
    <span style={{ fontSize: 12, color: trend === 'Increasing' ? 'var(--accent-red)' : trend === 'Decreasing' ? 'var(--accent-green)' : 'var(--accent-amber)', fontWeight: 600 }}>
      {trend === 'Increasing' ? '↑' : trend === 'Decreasing' ? '↓' : '→'} {trend}
    </span>
  )

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title"><TrendingUp size={22} style={{ color: 'var(--accent-purple)' }} />Predictive Analytics</h1>
        <p className="page-description">ML-powered behavior prediction and proactive alerting</p>
      </div>

      <div className="card" style={{ marginBottom: 20, padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label className="form-label" style={{ margin: 0 }}>Subject ID</label>
          <input id="predict-subject-id" className="form-input" style={{ width: 100 }} value={subjectId} onChange={e => setSubjectId(e.target.value)} />
          <button className="btn btn-primary btn-sm" onClick={predict} disabled={loading} id="run-prediction-btn">
            {loading ? <><span className="spinner" style={{ width: 12, height: 12 }} />Predicting...</> : <><TrendingUp size={13} />Run Prediction</>}
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Risk Score */}
          <div className="grid-4" style={{ marginBottom: 20 }}>
            <div className="metric-card red" style={{ gridColumn: 'span 1' }}>
              <div className="metric-label">Threat Level</div>
              <div className="metric-value" style={{ color: data.risk_score > 75 ? 'var(--accent-red)' : data.risk_score > 50 ? 'var(--accent-amber)' : 'var(--accent-green)' }}>
                {data.risk_score}/100
              </div>
              <div className="progress-bar" style={{ marginTop: 8 }}>
                <div className="progress-fill" style={{ width: `${data.risk_score}%`, background: data.risk_score > 75 ? 'var(--accent-red)' : 'var(--accent-amber)' }} />
              </div>
              <div style={{ marginTop: 6 }}><TrendBadge trend={data.risk_trend} /></div>
            </div>
            <div className="metric-card amber">
              <div className="metric-label">Model Accuracy</div>
              <div className="metric-value text-amber">{data.model_accuracy}%</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Historical</div>
            </div>
            <div className="metric-card blue">
              <div className="metric-label">Predictions Made</div>
              <div className="metric-value text-blue">{data.total_predictions}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>This session</div>
            </div>
            <div className="metric-card purple">
              <div className="metric-label">Watch List</div>
              <div className="metric-value" style={{ color: 'var(--accent-purple)' }}>{data.watch_list?.length || 0}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>Auto-generated</div>
            </div>
          </div>

          <div className="grid-2" style={{ marginBottom: 20 }}>
            {/* Next Contact */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 14 }}><User size={14} style={{ color: 'var(--accent-blue)' }} />Next Contact Prediction</div>
              {data.next_contacts?.map((c, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'JetBrains Mono', color: 'var(--text-primary)' }}>{c.number}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{c.expected_time} · {c.relationship}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: i === 0 ? 'var(--accent-blue)' : 'var(--text-secondary)', fontFamily: 'Orbitron' }}>{c.confidence}%</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>confidence</div>
                  </div>
                </div>
              ))}
              {data.next_contacts?.[0] && (
                <div className="alert-banner warning" style={{ marginTop: 14, fontSize: 12 }}>
                  <TrendingUp size={14} />
                  Likely to contact {data.next_contacts[0].number} within {data.next_contacts[0].expected_hours || 24} hours
                </div>
              )}
            </div>

            {/* Next Location */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 14 }}><Map size={14} style={{ color: 'var(--accent-green)' }} />Location Prediction</div>
              {data.next_locations?.map((l, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{l.location}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      Expected: {l.time_of_day} · Visits: {l.historical_visits}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-green)', fontFamily: 'Orbitron' }}>{l.probability}%</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>probability</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Prediction */}
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title" style={{ marginBottom: 14 }}><Activity size={14} style={{ color: 'var(--accent-amber)' }} />Activity Predictions</div>
            <div className="grid-3">
              {data.activity_predictions?.map((a, i) => (
                <div key={i} style={{ padding: 14, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>{a.activity}</div>
                  <div className="confidence-row" style={{ margin: 0 }}>
                    <div className="confidence-bar">
                      <div className="confidence-fill" style={{ width: `${a.probability}%` }} />
                    </div>
                    <span className="confidence-pct">{a.probability}%</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{a.reasoning}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature Importance (Explainable AI) */}
          {data.feature_importance && (
            <div className="card">
              <div className="card-title" style={{ marginBottom: 14 }}>
                <Info size={14} style={{ color: 'var(--accent-cyan)' }} />
                Why This Prediction? (Explainable AI)
              </div>
              {data.feature_importance.map((f, i) => (
                <div key={i} className="confidence-row">
                  <span className="confidence-label">{f.feature}</span>
                  <div className="confidence-bar">
                    <div className="confidence-fill" style={{ width: `${f.importance * 100}%`, background: `hsl(${200 - f.importance * 100}, 80%, 60%)` }} />
                  </div>
                  <span className="confidence-pct">{(f.importance * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          )}

          {/* Watch List */}
          {data.watch_list?.length > 0 && (
            <div className="card" style={{ marginTop: 20 }}>
              <div className="card-title" style={{ marginBottom: 14 }}><Shield size={14} style={{ color: 'var(--accent-red)' }} />Auto-Generated Watch List</div>
              <div className="grid-3">
                {data.watch_list.map((w, i) => (
                  <div key={i} style={{ padding: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8 }}>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: 'var(--accent-red)', fontWeight: 600 }}>{w.number}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{w.reason}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>Priority: <b style={{ color: w.priority === 'HIGH' ? 'var(--accent-red)' : 'var(--accent-amber)' }}>{w.priority}</b></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!data && !loading && (
        <div className="card">
          <div className="empty-state">
            <TrendingUp className="empty-state-icon" />
            <div className="empty-state-title">No predictions generated</div>
            <div className="empty-state-sub">Enter a subject ID to run ML prediction models</div>
          </div>
        </div>
      )}
    </div>
  )
}
