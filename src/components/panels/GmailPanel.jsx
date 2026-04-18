import { useState, useEffect } from 'react'
import { Flag, RefreshCw, Trash2 } from 'lucide-react'
import { MOCK_EMAILS } from '../../data/mockData'

export default function GmailPanel({ onDataLoad }) {
  const [emails, setEmails] = useState([])
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(false)
  const [selected, setSelected] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const fetchEmails = async () => {
    try {
      const res = await fetch('/.netlify/functions/gmail-fetch')
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setEmails(data); setLive(true); onDataLoad?.(data)
      } else throw new Error('empty')
    } catch {
      setEmails(MOCK_EMAILS); setLive(false); onDataLoad?.(MOCK_EMAILS)
    } finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { fetchEmails() }, [])

  const handleRefresh = () => { setRefreshing(true); fetchEmails() }

  const handleDelete = async (e, email) => {
    e.stopPropagation()
    if (!live) { setEmails(prev => prev.filter(em => em.id !== email.id)); return }
    setDeleting(email.id)
    try {
      await fetch('/.netlify/functions/gmail-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: email.id }),
      })
      setEmails(prev => prev.filter(em => em.id !== email.id))
      if (selected === email.id) setSelected(null)
    } catch (err) {
      console.error('Delete failed:', err)
    } finally { setDeleting(null) }
  }

  const unread  = emails.filter(e => e.unread).length
  const flagged = emails.filter(e => e.flagged).length

  return (
    <div className="hud-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <div className={`status-dot ${live ? 'pulse' : 'offline'}`} />
        <span className="panel-title">Inbox</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.7rem', alignItems: 'center' }}>
          {unread > 0 && (
            <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.62rem', background: 'rgba(0,200,240,0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(0,200,240,0.3)', borderRadius: 1, padding: '0.1rem 0.4rem' }}>
              {unread} UNREAD
            </span>
          )}
          {flagged > 0 && (
            <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.62rem', background: 'rgba(224,92,32,0.15)', color: 'var(--accent-iron)', border: '1px solid rgba(224,92,32,0.3)', borderRadius: 1, padding: '0.1rem 0.4rem', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Flag size={8} /> {flagged}
            </span>
          )}
          <button onClick={handleRefresh} disabled={refreshing || loading} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '0.1rem' }}>
            <RefreshCw size={12} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && <div style={{ padding: '1rem', color: 'var(--text-muted)', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.65rem' }}>Accessing inbox...</div>}

        {emails.map(email => {
          const isSelected = selected === email.id
          const isDeleting = deleting === email.id
          return (
            <div key={email.id}
              onClick={() => setSelected(isSelected ? null : email.id)}
              style={{ padding: '0.55rem 0.9rem', borderBottom: '1px solid var(--border-dim)', cursor: 'pointer', background: isSelected ? 'rgba(0,160,220,0.08)' : email.unread ? 'rgba(0,160,220,0.04)' : 'transparent', transition: 'background 0.15s', opacity: isDeleting ? 0.4 : 1, position: 'relative' }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(0,160,220,0.06)' }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = email.unread ? 'rgba(0,160,220,0.04)' : 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: email.unread ? 'var(--accent-green)' : 'transparent', flexShrink: 0, marginTop: '0.45rem' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: email.unread ? 600 : 400, color: email.unread ? 'var(--text-primary)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                      {email.from}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                      {email.flagged && <Flag size={10} style={{ color: 'var(--accent-iron)' }} />}
                      <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.62rem', color: 'var(--text-muted)' }}>{email.time}</span>
                      <button
                        onClick={e => handleDelete(e, email)}
                        disabled={isDeleting}
                        title="Move to trash"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.1rem', display: 'flex', opacity: isDeleting ? 0.4 : 1, transition: 'color 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-iron)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: email.unread ? 'var(--text-secondary)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.1rem' }}>
                    {email.subject}
                  </div>
                  {isSelected && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.76rem', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--border-dim)', paddingTop: '0.35rem', lineHeight: 1.5 }}>
                      {email.preview}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ padding: '0.4rem 0.9rem', borderTop: '1px solid var(--border-dim)', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.58rem', color: live ? 'var(--accent-green-dim)' : 'var(--text-muted)', letterSpacing: '0.08em' }}>
        {live ? '● Live · bill.jaffee@gmail.com' : '○ Mock data — check env vars'}
      </div>
    </div>
  )
}
