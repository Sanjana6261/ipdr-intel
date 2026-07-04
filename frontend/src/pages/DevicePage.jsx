import { useState } from 'react'
import { Smartphone, AlertTriangle, Clock, MapPin, RefreshCw } from 'lucide-react'
import { deviceAPI } from '../api/client'
import toast from 'react-hot-toast'

export default function DevicePage() {
  const [imei, setImei] = useState('')
  const [subjectId, setSubjectId] = useState('S001')
  const [searchMode, setSearchMode] = useState('imei')
  const [loading, setLoading] = useState(false)
  const [device, setDevice] = useState(null)

  const search = async () => {
    setLoading(true)
    try {
      const res = searchMode === 'imei'
        ? await deviceAPI.getDevice(imei)
        : await deviceAPI.getSubjectDevices(subjectId)
      setDevice(searchMode === 'imei' ? res.data : res.data.devices?.[0])
      if (!res.data || (searchMode !== 'imei' && !res.data.devices?.length)) {
        toast.error('No device found')
      }
    } catch { toast.error('Device lookup failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title"><Smartphone size={22} style={{ color: 'var(--accent-cyan)' }} />Device Intelligence</h1>
        <p className="page-description">IMEI-based device tracking, SIM change detection, multi-user analysis</p>
      </div>

      {/* Search */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 16px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className={`btn btn-sm ${searchMode === 'imei' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setSearchMode('imei')}>By IMEI</button>
            <button className={`btn btn-sm ${searchMode === 'subject' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setSearchMode('subject')}>By Subject</button>
          </div>
          {searchMode === 'imei' ? (
            <input id="device-imei-input" className="form-input" style={{ width: 180 }} value={imei} onChange={e => setImei(e.target.value)} placeholder="356789012345678" />
          ) : (
            <input id="device-subject-id" className="form-input" style={{ width: 100 }} value={subjectId} onChange={e => setSubjectId(e.target.value)} placeholder="S001" />
          )}
          <button className="btn btn-primary btn-sm" onClick={search} disabled={loading} id="device-search-btn">
            {loading ? <><span className="spinner" style={{ width: 12, height: 12 }} />Looking up...</> : <><Smartphone size={13} />Lookup Device</>}
          </button>
        </div>
      </div>

      {device ? (
        <>
          {device.sim_swap_alert && (
            <div className="alert-banner critical" style={{ marginBottom: 16 }}>
              <AlertTriangle size={16} />
              🚨 SIM SWAP DETECTED — IMEI {device.imei} used {device.sim_history?.length} different SIM cards
            </div>
          )}

          <div className="grid-2" style={{ marginBottom: 20 }}>
            {/* Device Profile */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 14 }}><Smartphone size={14} />Device Profile</div>
              {[
                { label: 'IMEI', value: device.imei, mono: true, highlight: true },
                { label: 'Device Model', value: device.model || 'Unknown' },
                { label: 'Manufacturer', value: device.manufacturer || 'Unknown' },
                { label: 'TAC Code', value: device.tac || '—', mono: true },
                { label: 'First Seen', value: device.first_seen },
                { label: 'Last Seen', value: device.last_seen },
                { label: 'Total SIM Cards Used', value: device.sim_history?.length || 1, highlight: device.sim_history?.length > 1 },
                { label: 'Active Numbers', value: device.active_numbers?.length || 0 },
                { label: 'Status', value: device.status || 'Active' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{row.label}</span>
                  <span style={{ fontSize: 13, fontFamily: row.mono ? 'JetBrains Mono' : 'inherit', color: row.highlight ? 'var(--accent-blue)' : 'var(--text-primary)', fontWeight: row.highlight ? 700 : 500 }}>{row.value}</span>
                </div>
              ))}
            </div>

            {/* Active Numbers */}
            <div className="card">
              <div className="card-title" style={{ marginBottom: 14 }}>Associated Phone Numbers ({device.active_numbers?.length || 0})</div>
              {device.active_numbers?.map((n, i) => (
                <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: 'JetBrains Mono', fontSize: 13, color: n.active ? 'var(--accent-blue)' : 'var(--text-secondary)' }}>{n.number}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{n.operator} · {n.first_used} → {n.last_used}</div>
                  </div>
                  <span className={`badge ${n.active ? 'badge-blue' : 'badge-gray'}`}>{n.active ? 'ACTIVE' : 'INACTIVE'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SIM History Timeline */}
          {device.sim_history?.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <div className="card-title" style={{ marginBottom: 14 }}><Clock size={14} />SIM Swap Timeline</div>
              <div className="timeline">
                {device.sim_history.map((s, i) => (
                  <div key={i} className={`timeline-item ${i === 0 ? 'red' : ''}`}>
                    <div className="timeline-time">{s.date}</div>
                    <div className="timeline-text">
                      {i === 0 ? '🔴 ' : ''}SIM activated: <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--accent-blue)' }}>{s.number}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      IMSI: {s.imsi || 'N/A'} · Operator: {s.operator}
                      {s.reason && ` · Reason: ${s.reason}`}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location Summary */}
          {device.location_summary && (
            <div className="card">
              <div className="card-title" style={{ marginBottom: 14 }}><MapPin size={14} />Device Location Summary</div>
              <div className="grid-3">
                {device.location_summary.map((l, i) => (
                  <div key={i} style={{ padding: 12, background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{l.city}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                      Visits: <b style={{ color: 'var(--text-primary)' }}>{l.visits}</b> · Days: {l.unique_days}
                    </div>
                    <div className="progress-bar" style={{ marginTop: 8 }}>
                      <div className="progress-fill" style={{ width: `${l.percentage}%` }} />
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{l.percentage}% of time</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : !loading && (
        <div className="card">
          <div className="empty-state">
            <Smartphone className="empty-state-icon" />
            <div className="empty-state-title">No device selected</div>
            <div className="empty-state-sub">Search by IMEI or Subject ID to view device intelligence</div>
          </div>
        </div>
      )}
    </div>
  )
}
