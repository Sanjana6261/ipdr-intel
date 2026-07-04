import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Eye, EyeOff, Lock, User } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { authAPI } from '../api/client'
import toast from 'react-hot-toast'

const DEMO_USERS = [
  { label: 'Admin', username: 'admin', role: 'Senior Investigator', badge: 'IPS-001' },
  { label: 'Analyst', username: 'analyst', role: 'Intelligence Analyst', badge: 'CIA-042' },
  { label: 'Viewer', username: 'viewer', role: 'Field Officer', badge: 'FO-099' },
]

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const login = useAuthStore(s => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) { toast.error('Enter credentials'); return }
    setLoading(true)
    try {
      const res = await authAPI.login({ username, password })
      login(res.data.user, res.data.access_token)
      toast.success(`Welcome, ${res.data.user.name}`)
      navigate('/')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (u) => { setUsername(u.username); setPassword('demo1234') }

  return (
    <div className="login-page">
      <div className="login-card scan-line">
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(124,58,237,0.2))',
            border: '1px solid rgba(0,212,255,0.3)',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(0,212,255,0.15)'
          }}>
            <Shield size={28} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div style={{ fontFamily: 'Orbitron', fontSize: 18, fontWeight: 900, color: 'var(--accent-blue)', letterSpacing: 3 }}>
            IAP
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 2, marginTop: 4 }}>
            IPDR INTELLIGENCE & ANALYTICS PLATFORM
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
            AUTHORIZED PERSONNEL ONLY
          </div>
        </div>

        {/* Quick login */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, textAlign: 'center' }}>
            DEMO ACCOUNTS
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {DEMO_USERS.map(u => (
              <button
                key={u.username}
                className="btn btn-outline btn-sm"
                style={{ flex: 1, fontSize: 11 }}
                onClick={() => quickLogin(u)}
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">USERNAME / BADGE ID</label>
            <div style={{ position: 'relative' }}>
              <User size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="login-username"
                className="form-input"
                style={{ paddingLeft: 32 }}
                placeholder="Enter username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">PASSWORD</label>
            <div style={{ position: 'relative' }}>
              <Lock size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="login-password"
                className="form-input"
                style={{ paddingLeft: 32, paddingRight: 36 }}
                type={showPwd ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 16, padding: '8px', background: 'rgba(245,158,11,0.06)', borderRadius: 6, border: '1px solid rgba(245,158,11,0.15)' }}>
            💡 Demo: username = <span className="mono" style={{ color: 'var(--accent-amber)' }}>admin</span>, password = <span className="mono" style={{ color: 'var(--accent-amber)' }}>demo1234</span>
          </div>

          <button
            type="submit"
            id="login-submit"
            className="btn btn-primary w-full btn-lg"
            disabled={loading}
          >
            {loading ? (
              <><span className="spinner" style={{ width: 16, height: 16 }} /> Authenticating...</>
            ) : (
              <><Shield size={16} /> ACCESS SYSTEM</>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 10, color: 'var(--text-muted)' }}>
          🔒 All access is monitored and logged. Unauthorized use is prohibited.
        </div>
      </div>
    </div>
  )
}
