import { useEffect, useRef, useState } from 'react'
import { Network, ZoomIn, ZoomOut, Maximize2, Download, Filter, Info, Users, ChevronDown } from 'lucide-react'
import cytoscape from 'cytoscape'
import fcose from 'cytoscape-fcose'
import { networkAPI } from '../api/client'
import { useCaseStore } from '../store/caseStore'
import toast from 'react-hot-toast'

cytoscape.use(fcose)

const COMMUNITY_COLORS = ['#00d4ff', '#7c3aed', '#f59e0b', '#10b981', '#ef4444', '#f97316', '#06b6d4', '#8b5cf6']

const RISK_COLOR = { low: '#10b981', medium: '#f59e0b', high: '#f97316', critical: '#ef4444' }

export default function NetworkGraphPage() {
  const cyRef = useRef(null)
  const cyInstance = useRef(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [subjectId, setSubjectId] = useState('S001')
  const [depth, setDepth] = useState(1)
  const [filterType, setFilterType] = useState('all')
  const [timeOfDay, setTimeOfDay] = useState('all')
  const [maxDuration, setMaxDuration] = useState('all')
  const { parseStats } = useCaseStore()

  const loadGraph = async () => {
    setLoading(true)
    try {
      const params = { depth }
      if (timeOfDay !== 'all') params.time_of_day = timeOfDay
      if (maxDuration !== 'all') params.max_duration_mins = maxDuration
      const res = await networkAPI.getGraph(subjectId, params)
      renderGraph(res.data)
    } catch {
      toast.error('Failed to load graph')
    } finally {
      setLoading(false)
    }
  }

  const renderGraph = (data) => {
    if (cyInstance.current) cyInstance.current.destroy()

    const elements = [
      ...data.nodes.map(n => ({
        data: {
          id: n.id,
          label: n.label,
          role: n.role,
          risk: n.risk,
          community: n.community,
          degree: n.degree,
          betweenness: n.betweenness,
          callCount: n.call_count,
          ...n
        }
      })),
      ...data.edges.map(e => ({
        data: {
          id: `e-${e.source}-${e.target}`,
          source: e.source,
          target: e.target,
          weight: e.weight,
          type: e.type,
          frequency: e.frequency,
        }
      }))
    ]

    cyInstance.current = cytoscape({
      container: cyRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': (ele) => COMMUNITY_COLORS[ele.data('community') % COMMUNITY_COLORS.length] || '#00d4ff',
            'width': (ele) => Math.max(24, Math.min(60, 20 + ele.data('degree') * 3)),
            'height': (ele) => Math.max(24, Math.min(60, 20 + ele.data('degree') * 3)),
            'label': 'data(label)',
            'font-size': 9,
            'font-family': 'JetBrains Mono',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'color': '#94a3b8',
            'text-margin-y': 4,
            'border-width': (ele) => ele.data('risk') === 'critical' ? 3 : ele.data('risk') === 'high' ? 2 : 1,
            'border-color': (ele) => RISK_COLOR[ele.data('risk')] || '#1e293b',
            'border-style': (ele) => ele.data('role') === 'subject' ? 'solid' : 'solid',
          }
        },
        {
          selector: 'node[role="subject"]',
          style: {
            'background-color': '#ef4444',
            'border-width': 3,
            'border-color': '#ff6b6b',
            'font-weight': 700,
            'font-size': 11,
          }
        },
        {
          selector: 'edge',
          style: {
            'width': (ele) => Math.max(1, Math.min(6, ele.data('frequency') / 5)),
            'line-color': (ele) => ele.data('type') === 'voice' ? '#00d4ff' : ele.data('type') === 'data' ? '#7c3aed' : '#475569',
            'target-arrow-color': (ele) => ele.data('type') === 'voice' ? '#00d4ff' : '#475569',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'opacity': 0.6,
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#ffffff',
            'border-width': 3,
            'box-shadow': '0 0 15px #00d4ff',
          }
        }
      ],
      layout: { name: 'fcose', quality: 'proof', randomize: true, animate: true, animationDuration: 800 },
      wheelSensitivity: 0.3,
    })

    cyInstance.current.on('tap', 'node', (e) => {
      setSelectedNode(e.target.data())
    })

    cyInstance.current.on('tap', (e) => {
      if (e.target === cyInstance.current) setSelectedNode(null)
    })
  }

  useEffect(() => {
    loadGraph()
    return () => { cyInstance.current?.destroy() }
  }, [])

  const exportPNG = () => {
    if (!cyInstance.current) return
    const png = cyInstance.current.png({ scale: 2, full: true, bg: '#0c1225' })
    const a = document.createElement('a')
    a.href = png; a.download = `network_${subjectId}.png`; a.click()
  }

  const zoomIn = () => cyInstance.current?.zoom({ level: cyInstance.current.zoom() * 1.2 })
  const zoomOut = () => cyInstance.current?.zoom({ level: cyInstance.current.zoom() * 0.8 })
  const fit = () => cyInstance.current?.fit(undefined, 20)

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title"><Network size={22} style={{ color: 'var(--accent-blue)' }} />Network Graph</h1>
        <p className="page-description">Social Network Analysis — communication relationships and community detection</p>
      </div>

      {/* Controls */}
      <div className="card" style={{ marginBottom: 16, padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label className="form-label" style={{ margin: 0, whiteSpace: 'nowrap' }}>Subject ID</label>
            <input id="network-subject-id" className="form-input" style={{ width: 100 }} value={subjectId} onChange={e => setSubjectId(e.target.value)} placeholder="S001" />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label className="form-label" style={{ margin: 0 }}>Depth</label>
            {[1, 2, 3].map(d => (
              <button key={d} className={`btn btn-sm ${depth === d ? 'btn-primary' : 'btn-outline'}`} onClick={() => setDepth(d)}>L{d}</button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', borderLeft: '1px solid var(--border)', paddingLeft: 12 }}>
            <Filter size={14} style={{ color: 'var(--text-muted)' }} />
            <select className="form-select" style={{ width: 110, padding: '4px 8px', fontSize: 12 }} value={timeOfDay} onChange={e => setTimeOfDay(e.target.value)}>
              <option value="all">Any Time</option>
              <option value="day">Day (6 AM - 10 PM)</option>
              <option value="night">Night (10 PM - 6 AM)</option>
            </select>
            <select className="form-select" style={{ width: 110, padding: '4px 8px', fontSize: 12 }} value={maxDuration} onChange={e => setMaxDuration(e.target.value)}>
              <option value="all">Any Duration</option>
              <option value="1">Under 1 min</option>
              <option value="2">Under 2 mins</option>
              <option value="5">Under 5 mins</option>
            </select>
          </div>
          <button className="btn btn-primary btn-sm" style={{ marginLeft: 8 }} onClick={loadGraph} disabled={loading} id="load-graph-btn">
            {loading ? <><span className="spinner" style={{ width: 12, height: 12 }} />Loading...</> : <><Network size={13} />Load Graph</>}
          </button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button className="btn btn-outline btn-sm" onClick={zoomIn} title="Zoom In"><ZoomIn size={13} /></button>
            <button className="btn btn-outline btn-sm" onClick={zoomOut} title="Zoom Out"><ZoomOut size={13} /></button>
            <button className="btn btn-outline btn-sm" onClick={fit} title="Fit All"><Maximize2 size={13} /></button>
            <button className="btn btn-outline btn-sm" onClick={exportPNG} title="Export PNG"><Download size={13} />PNG</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        {/* Graph */}
        <div style={{ flex: 1, position: 'relative' }}>
          <div id="cy-network" ref={cyRef} className="cy-container" />
          {loading && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div className="spinner" style={{ width: 32, height: 32, margin: '0 auto 12px' }} />
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Building network graph...</div>
              </div>
            </div>
          )}
          {/* Legend */}
          <div style={{ position: 'absolute', bottom: 12, left: 12, background: 'rgba(11,18,37,0.9)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 11 }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600 }}>LEGEND</div>
            {[
              { color: '#ef4444', label: 'Subject (A-Party)' },
              { color: '#00d4ff', label: 'Voice calls' },
              { color: '#7c3aed', label: 'Data connections' },
              { color: '#475569', label: 'SMS' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color }} />
                <span style={{ color: 'var(--text-secondary)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedNode && (
          <div className="card slide-in" style={{ width: 280, flexShrink: 0, alignSelf: 'flex-start', maxHeight: 600, overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div className="card-title"><Info size={14} />Node Details</div>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedNode(null)}>✕</button>
            </div>

            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--accent-blue)', marginBottom: 4 }}>{selectedNode.label}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <span className={`badge ${selectedNode.risk === 'critical' ? 'badge-critical' : selectedNode.risk === 'high' ? 'badge-high' : 'badge-medium'}`}>
                  {selectedNode.risk?.toUpperCase() || 'UNKNOWN'} RISK
                </span>
                {selectedNode.role === 'subject' && <span className="badge badge-critical">A-PARTY</span>}
              </div>
            </div>

            {[
              { label: 'Degree Centrality', value: selectedNode.degree },
              { label: 'Betweenness', value: selectedNode.betweenness?.toFixed ? selectedNode.betweenness.toFixed(3) : selectedNode.betweenness },
              { label: 'Total Calls', value: selectedNode.callCount || selectedNode.call_count },
              { label: 'Community', value: `Group ${selectedNode.community}` },
              { label: 'Role', value: selectedNode.node_role || 'Contact' },
              { label: 'Operator', value: selectedNode.operator || 'Unknown' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{row.label}</span>
                <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: 'var(--text-primary)', fontWeight: 600 }}>{row.value ?? '—'}</span>
              </div>
            ))}

            <button className="btn btn-outline btn-sm w-full" style={{ marginTop: 14 }} onClick={() => toast('Expanding node...')}>
              Expand Network →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
