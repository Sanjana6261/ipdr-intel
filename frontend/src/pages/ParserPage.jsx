import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, CheckCircle, AlertCircle, ChevronRight, Database } from 'lucide-react'
import { parserAPI } from '../api/client'
import { useCaseStore } from '../store/caseStore'
import toast from 'react-hot-toast'

const SUPPORTED_FORMATS = ['CSV', 'JSON', 'TXT', 'XLSX']

export default function ParserPage() {
  const [file, setFile] = useState(null)
  const [progress, setProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const { parsedRecords, parseStats, setParsedData } = useCaseStore()
  const [previewPage, setPreviewPage] = useState(0)
  const PAGE_SIZE = 20

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) setFile(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
  })

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    setProgress(0)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await parserAPI.upload(fd, setProgress)
      setParsedData(res.data.records, res.data.stats)
      toast.success(`Parsed ${res.data.stats.total_records.toLocaleString()} records successfully`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Parse failed')
    } finally {
      setUploading(false)
    }
  }

  const handleLoadDemo = async () => {
    setUploading(true)
    try {
      const res = await parserAPI.loadDemo()
      setParsedData(res.data.records, res.data.stats)
      toast.success(`Demo loaded: ${res.data.stats.total_records.toLocaleString()} records`)
    } catch { toast.error('Demo load failed') }
    finally { setUploading(false) }
  }

  const pageRecords = parsedRecords ? parsedRecords.slice(previewPage * PAGE_SIZE, (previewPage + 1) * PAGE_SIZE) : []
  const totalPages = parsedRecords ? Math.ceil(parsedRecords.length / PAGE_SIZE) : 0

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1 className="page-title"><Upload size={22} style={{ color: 'var(--accent-blue)' }} />IPDR Parser</h1>
        <p className="page-description">Upload and parse Internet Protocol Detail Records from telecom operators</p>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: '1fr 320px', marginBottom: 20 }}>
        {/* Upload */}
        <div className="card">
          <div className="card-header">
            <div className="card-title"><FileText size={16} />Upload IPDR File</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {SUPPORTED_FORMATS.map(f => (
                <span key={f} className="badge badge-gray">{f}</span>
              ))}
            </div>
          </div>

          <div {...getRootProps()} className={`upload-zone ${isDragActive ? 'active' : ''}`}>
            <input {...getInputProps()} id="ipdr-file-input" />
            <Upload className="upload-icon" />
            <div className="upload-title">
              {file ? file.name : isDragActive ? 'Drop here...' : 'Drag & drop IPDR file'}
            </div>
            <div className="upload-sub">
              {file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : 'or click to browse · CSV, JSON, TXT supported'}
            </div>
          </div>

          {uploading && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>
                <span>Processing...</span><span>{progress}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button className="btn btn-primary" onClick={handleUpload} disabled={!file || uploading} id="parse-upload-btn">
              {uploading ? <><span className="spinner" style={{ width: 14, height: 14 }} />Parsing...</> : <><Upload size={14} />Parse File</>}
            </button>
            <button className="btn btn-outline" onClick={handleLoadDemo} disabled={uploading} id="parser-demo-btn">
              <Database size={14} />Load Demo Data
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}><CheckCircle size={16} />Parse Summary</div>
          {parseStats ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Total Records', value: parseStats.total_records?.toLocaleString(), color: 'blue' },
                { label: 'Subjects (A-Party)', value: parseStats.subjects, color: 'blue' },
                { label: 'Contacts (B-Party)', value: parseStats.contacts, color: 'blue' },
                { label: 'Cell Towers', value: parseStats.towers, color: 'green' },
                { label: 'Date Range', value: parseStats.date_range, color: 'amber' },
                { label: 'Formats Detected', value: parseStats.format, color: 'blue' },
                { label: 'Errors/Skipped', value: parseStats.errors || 0, color: parseStats.errors > 0 ? 'red' : 'green' },
                { label: 'IMEI Records', value: parseStats.imei_records?.toLocaleString() || 0, color: 'purple' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{row.label}</span>
                  <span className={`font-mono text-${row.color} font-bold`} style={{ fontSize: 13 }}>{row.value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '30px 0' }}>
              <AlertCircle className="empty-state-icon" />
              <div className="empty-state-title">No data parsed yet</div>
              <div className="empty-state-sub">Upload a file or load demo data</div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Table */}
      {parsedRecords && parsedRecords.length > 0 && (
        <div className="card p-0">
          <div className="card-header" style={{ padding: '14px 16px' }}>
            <div className="card-title"><FileText size={16} />Record Preview</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="text-sm text-muted">{parsedRecords.length.toLocaleString()} records</span>
              <span className="badge badge-blue">Parsed</span>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>A-Party</th>
                  <th>B-Party</th>
                  <th>Type</th>
                  <th>Start Time</th>
                  <th>Duration (s)</th>
                  <th>IMEI</th>
                  <th>Cell Tower</th>
                  <th>Data (MB)</th>
                </tr>
              </thead>
              <tbody>
                {pageRecords.map((r, i) => (
                  <tr key={i}>
                    <td className="text-muted">{previewPage * PAGE_SIZE + i + 1}</td>
                    <td className="mono text-blue">{r.a_party}</td>
                    <td className="mono">{r.b_party}</td>
                    <td><span className={`badge ${r.call_type === 'voice' ? 'badge-blue' : r.call_type === 'data' ? 'badge-medium' : 'badge-gray'}`}>{r.call_type}</span></td>
                    <td className="mono text-muted" style={{ fontSize: 11 }}>{r.start_time}</td>
                    <td className="mono">{r.duration ?? '—'}</td>
                    <td className="mono text-muted" style={{ fontSize: 11 }}>{r.imei || '—'}</td>
                    <td className="mono text-muted" style={{ fontSize: 11 }}>{r.cell_tower_id || '—'}</td>
                    <td className="mono">{r.data_usage_mb?.toFixed(2) ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '10px 16px', borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-ghost btn-sm" disabled={previewPage === 0} onClick={() => setPreviewPage(p => p - 1)}>← Prev</button>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', alignSelf: 'center' }}>Page {previewPage + 1} / {totalPages}</span>
            <button className="btn btn-ghost btn-sm" disabled={previewPage >= totalPages - 1} onClick={() => setPreviewPage(p => p + 1)}>Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}
