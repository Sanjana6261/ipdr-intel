import { useState } from 'react'
import { Link2, Search, AlertTriangle, CheckCircle, Clock, Users } from 'lucide-react'
import { casesAPI } from '../api/client'
import toast from 'react-hot-toast'

const MATCH_COLORS = { Direct: 'badge-critical', Indirect: 'badge-high', Network: 'badge-medium' }

export default function CrossCasePage() {
  const [phones, setPhones] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)

  const search = async () => {
    const nums = phones.split('\n').map(p => p.trim()).filter(Boolean)
    if (!nums.length) { toast.error('Enter at least one phone number'); return }
    setLoading(true)
    try {
      const res = await casesAPI.linkSearch(nums)
      setResults(res.data)
    } catch { toast.error('Search failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title"><Link2 size={22} style={{ color: 'var(--accent-purple)' }} />Cross-Case Linking</h1>
        <p className="page-description">Check if subjects have appeared in previous investigations</p>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '340px 1fr', marginBottom: 20 }}>
        {/* Input */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}><Search size={14} />Search Numbers</div>
          <div className="form-group">
            <label className="form-label">PHONE NUMBERS (one per line)</label>
            <textarea
              id="crosscase-input"
              className="form-textarea"
              style={{ height: 160, resize: 'vertical' }}
              placeholder={`+919876543210\n9123456789\n08765432109`}
              value={phones}
              onChange={e => setPhones(e.target.value)}
            />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
            Supports: +91 format, 0-prefix, 10-digit. Fuzzy matching enabled.
          </div>
          <button className="btn btn-primary w-full" onClick={search} disabled={loading} id="crosscase-search-btn">
            {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} />Searching...</> : <><Search size={14} />Search Database</>}
          </button>

          {results && (
            <div style={{ marginTop: 16, padding: 12, background: 'var(--bg-secondary)', borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>SEARCH SUMMARY</div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Orbitron', color: 'var(--accent-red)' }}>{results.linked_cases?.length || 0}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Cases Linked</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Orbitron', color: 'var(--accent-amber)' }}>{results.confidence || 0}%</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Confidence</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div>
          {results?.is_repeat_offender && (
            <div className="alert-banner critical" style={{ marginBottom: 16 }}>
              <AlertTriangle size={18} />
              🚨 REPEAT OFFENDER DETECTED — Subject has appeared in {results.linked_cases.length} previous case(s)
            </div>
          )}
          {results?.is_known_associate && !results?.is_repeat_offender && (
            <div className="alert-banner warning" style={{ marginBottom: 16 }}>
              <Users size={18} />
              ⚠ KNOWN ASSOCIATE — Subject is a contact in {results.linked_cases.length} previous investigation(s)
            </div>
          )}

          {results ? (
            results.linked_cases?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {results.linked_cases.map((c, i) => (
                  <div key={i} className="card" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontFamily: 'JetBrains Mono', fontSize: 14, fontWeight: 700, color: 'var(--accent-blue)' }}>{c.case_number}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{c.title}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <span className={`badge ${MATCH_COLORS[c.match_type] || 'badge-gray'}`}>{c.match_type}</span>
                        <span className="badge badge-blue">{c.confidence}% match</span>
                      </div>
                    </div>

                    <div className="confidence-row" style={{ marginBottom: 8 }}>
                      <span className="confidence-label">Match Confidence</span>
                      <div className="confidence-bar">
                        <div className="confidence-fill" style={{ width: `${c.confidence}%` }} />
                      </div>
                      <span className="confidence-pct">{c.confidence}%</span>
                    </div>

                    <div className="grid-3" style={{ marginTop: 10, fontSize: 12 }}>
                      <div>
                        <div style={{ color: 'var(--text-muted)' }}>Case Date</div>
                        <div style={{ fontFamily: 'JetBrains Mono', color: 'var(--text-primary)', marginTop: 2 }}>{c.case_date}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)' }}>Matched As</div>
                        <div style={{ color: c.matched_as === 'A-Party' ? 'var(--accent-red)' : 'var(--accent-amber)', marginTop: 2, fontWeight: 600 }}>{c.matched_as}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-muted)' }}>Status</div>
                        <div style={{ color: 'var(--text-primary)', marginTop: 2 }}>{c.status}</div>
                      </div>
                    </div>

                    {c.common_associates?.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>COMMON ASSOCIATES</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {c.common_associates.map(a => (
                            <span key={a} className="badge badge-gray font-mono">{a}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="card">
                <div className="empty-state">
                  <CheckCircle className="empty-state-icon" style={{ color: 'var(--accent-green)' }} />
                  <div className="empty-state-title" style={{ color: 'var(--accent-green)' }}>No Prior Cases Found</div>
                  <div className="empty-state-sub">Subject has no record in the criminal database</div>
                </div>
              </div>
            )
          ) : (
            <div className="card">
              <div className="empty-state">
                <Link2 className="empty-state-icon" />
                <div className="empty-state-title">Enter phone numbers to search</div>
                <div className="empty-state-sub">System will check against all previous case records</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Timeline */}
      {results?.timeline?.length > 0 && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: 14 }}><Clock size={14} />Investigation Timeline</div>
          <div className="timeline">
            {results.timeline.map((t, i) => (
              <div key={i} className={`timeline-item ${t.severity === 'critical' ? 'red' : t.severity === 'high' ? 'amber' : ''}`}>
                <div className="timeline-time">{t.date}</div>
                <div className="timeline-text">{t.event}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>Case: {t.case_number}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
