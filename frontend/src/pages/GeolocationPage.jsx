import { useEffect, useRef, useState } from 'react'
import { Map, Play, Pause, Download, Layers } from 'lucide-react'
import { geoAPI } from '../api/client'
import toast from 'react-hot-toast'

import * as L from 'leaflet'
import 'leaflet.heat'

const HOTSPOT_TYPES = { home: '#10b981', work: '#00d4ff', frequent: '#f59e0b', suspicious: '#ef4444' }

export default function GeolocationPage() {
  const mapRef = useRef(null)
  const mapInstance = useRef(null)
  const heatLayer = useRef(null)
  const pathLayer = useRef(null)
  const markersLayer = useRef(null)
  const [loading, setLoading] = useState(false)
  const [subjectId, setSubjectId] = useState('S001')
  const [viewMode, setViewMode] = useState('heatmap')
  const [hotspots, setHotspots] = useState([])
  const [pathPoints, setPathPoints] = useState([])
  const [animIdx, setAnimIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const animRef = useRef(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  useEffect(() => {
    if (!mapInstance.current && mapRef.current) {
      mapInstance.current = L.map(mapRef.current, {
        center: [20.5937, 78.9629],
        zoom: 5,
        zoomControl: true,
      })
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(mapInstance.current)
    }
    return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null } }
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const params = {}
      if (dateFrom) params.from = dateFrom
      if (dateTo) params.to = dateTo

      const [heatRes, hotRes, pathRes] = await Promise.all([
        geoAPI.getHeatmap(subjectId, params),
        geoAPI.getHotspots(subjectId),
        geoAPI.getPath(subjectId, params),
      ])

      // Clear old layers
      heatLayer.current && mapInstance.current.removeLayer(heatLayer.current)
      pathLayer.current && mapInstance.current.removeLayer(pathLayer.current)
      markersLayer.current && mapInstance.current.removeLayer(markersLayer.current)

      // Heatmap
      const pts = heatRes.data.points.map(p => [p.lat, p.lon, p.weight])
      heatLayer.current = L.heatLayer(pts, { radius: 25, blur: 20, maxZoom: 12, gradient: { 0.2: 'blue', 0.5: '#7c3aed', 0.8: '#f59e0b', 1.0: '#ef4444' } }).addTo(mapInstance.current)

      // Hotspots
      setHotspots(hotRes.data.hotspots)
      markersLayer.current = L.layerGroup()
      hotRes.data.hotspots.forEach(h => {
        const color = HOTSPOT_TYPES[h.type] || '#00d4ff'
        L.circleMarker([h.lat, h.lon], { radius: 10, color, fillColor: color, fillOpacity: 0.5, weight: 2 })
          .bindPopup(`<b>${h.label}</b><br>Visits: ${h.visits}<br>Dwell: ${h.dwell_hours}h<br>Type: ${h.type}`)
          .addTo(markersLayer.current)
      })
      markersLayer.current.addTo(mapInstance.current)

      // Path
      setPathPoints(pathRes.data.path)
      if (pathRes.data.path.length > 1) {
        const coords = pathRes.data.path.map(p => [p.lat, p.lon])
        pathLayer.current = L.polyline(coords, { color: '#00d4ff', weight: 2, opacity: 0.5, dashArray: '4 4' }).addTo(mapInstance.current)
      }

      if (heatRes.data.points.length > 0) {
        const { lat, lon } = heatRes.data.points[0]
        mapInstance.current.setView([lat, lon], 10)
      }
      toast.success(`Loaded ${pts.length.toLocaleString()} location points`)
    } catch { toast.error('Failed to load geo data') }
    finally { setLoading(false) }
  }

  // Path animation
  useEffect(() => {
    if (playing && pathPoints.length > 0) {
      animRef.current = setInterval(() => {
        setAnimIdx(i => {
          if (i >= pathPoints.length - 1) { setPlaying(false); return 0 }
          const pt = pathPoints[i]
          mapInstance.current?.setView([pt.lat, pt.lon], 12, { animate: true })
          return i + 1
        })
      }, 500)
    } else {
      clearInterval(animRef.current)
    }
    return () => clearInterval(animRef.current)
  }, [playing, pathPoints])

  const exportGeoJSON = () => {
    const fc = { type: 'FeatureCollection', features: hotspots.map(h => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [h.lon, h.lat] }, properties: h })) }
    const blob = new Blob([JSON.stringify(fc, null, 2)], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'hotspots.geojson'; a.click()
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title"><Map size={22} style={{ color: 'var(--accent-green)' }} />Geolocation Heatmap</h1>
        <p className="page-description">Suspect movement patterns, hotspot identification, and path animation</p>
      </div>

      {/* Controls */}
      <div className="card" style={{ marginBottom: 16, padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label className="form-label" style={{ margin: 0 }}>Subject</label>
            <input id="geo-subject-id" className="form-input" style={{ width: 90 }} value={subjectId} onChange={e => setSubjectId(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label className="form-label" style={{ margin: 0 }}>From</label>
            <input id="geo-date-from" className="form-input" style={{ width: 130 }} type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <label className="form-label" style={{ margin: 0 }}>To</label>
            <input id="geo-date-to" className="form-input" style={{ width: 130 }} type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-sm" onClick={loadData} disabled={loading} id="load-geo-btn">
            {loading ? <><span className="spinner" style={{ width: 12, height: 12 }} />Loading...</> : <><Map size={13} />Load Map</>}
          </button>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button className="btn btn-outline btn-sm" onClick={() => setPlaying(p => !p)} disabled={pathPoints.length === 0} id="animate-path-btn">
              {playing ? <><Pause size={13} />Stop</> : <><Play size={13} />Animate Path</>}
            </button>
            <button className="btn btn-outline btn-sm" onClick={exportGeoJSON} disabled={hotspots.length === 0}><Download size={13} />GeoJSON</button>
          </div>
        </div>
        {playing && (
          <div style={{ marginTop: 10 }}>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${(animIdx / pathPoints.length) * 100}%` }} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Step {animIdx}/{pathPoints.length} · {pathPoints[animIdx]?.timestamp || ''}
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div id="geo-map" ref={mapRef} className="map-container" style={{ height: 520 }} />
        </div>

        {/* Hotspots panel */}
        <div className="card" style={{ width: 260, flexShrink: 0, alignSelf: 'flex-start', maxHeight: 520, overflowY: 'auto' }}>
          <div className="card-title" style={{ marginBottom: 14 }}><Layers size={14} />Hotspots ({hotspots.length})</div>
          {hotspots.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <Map className="empty-state-icon" />
              <div className="empty-state-sub">Load map to see hotspots</div>
            </div>
          ) : hotspots.map((h, i) => (
            <div key={i} style={{ marginBottom: 10, padding: 10, background: 'var(--bg-secondary)', borderRadius: 8, border: `1px solid ${HOTSPOT_TYPES[h.type] || 'var(--border)'}30` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{h.label}</div>
                <span className={`badge ${h.type === 'suspicious' ? 'badge-critical' : h.type === 'frequent' ? 'badge-high' : 'badge-blue'}`}>{h.type}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                Visits: <b style={{ color: 'var(--text-primary)' }}>{h.visits}</b> · Dwell: <b style={{ color: 'var(--accent-amber)' }}>{h.dwell_hours}h</b>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', marginTop: 2 }}>
                {h.lat.toFixed(4)}, {h.lon.toFixed(4)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
