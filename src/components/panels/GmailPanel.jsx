import { useState, useEffect } from 'react'
import { Flag, RefreshCw, Trash2, Reply, Send, X } from 'lucide-react'
import { MOCK_EMAILS } from '../../data/mockData'

export default function GmailPanel({ onDataLoad }) {
  const [emails, setEmails]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [live, setLive]         = useState(false)
  const [selected, setSelected] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [replying, setReplying] = useState(null)
  const [replyBody, setReplyBody] = useState('')
  const [sending, setSending]   = useState(false)
  const [sentMsg, setSentMsg]   = useState('')

  const fetchEmails = async () => {
    try {
      const res = await fetch('/.netlify/functions/gmail-fetch')
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setEmails(data.slice(0, 10)); setLive(true); onDataLoad?.(data)
      } else throw new Error('empty')
    } catch {
      setEmails(MOCK_EMAILS.slice(0, 10)); setLive(false); onDataLoad?.(MOCK_EMAILS)
    } finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { fetchEmails() }, [])
  const handleRefresh = () => { setRefreshing(true); fetchEmails() }

  // Click email — expand, mark read locally + in Gmail
  const handleSelect = async (email) => {
    const alreadySelected = selected === email.id
    setSelected(alreadySelected ? null : email.id)
    if (alreadySelected) return
    setReplying(null)

    // If unread, mark read immediately in UI then API
    if (email.unread) {
      setEmails(prev => prev.map(e => e.id === email.id ? { ...e, unread: false } : e))
      if (live) {
        try {
          await fetch('/.netlify/functions/gmail-mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageId: email.id }),
          })
        } catch { /* silent fail */ }
      }
    }
  }

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
    } catch {}
    finally { setDeleting(null) }
  }

  const handleReply = (e, email) => {
    e.stopPropagation()
    setReplying(email); setReplyBody(''); setSelected(email.id)
  }

  const handleSendReply = async () => {
    if (!replying || !replyBody.trim()) return
    setSending(true)
    try {
      await fetch('/.netlify/functions/gmail-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: replying.id, to: replying.fromEmail, subject: replying.subject, body: replyBody }),
      })
      setSentMsg('Reply sent.')
      setReplying(null); setReplyBody('')
      setTimeout(() => setSentMsg(''), 3000)
    } catch {
      setSentMsg('Send failed.'); setTimeout(() => setSentMsg(''), 3000)
    } finally { setSending(false) }
  }

  const unread  = emails.filter(e => e.unread).length
  const flagged = emails.filter(e => e.flagged).length

  return (
    <div className="hud-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <div className={`status-dot ${live ? 'pulse' : 'offline'}`} />
        <span className="panel-title">Inbox</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          {sentMsg && <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.76rem', color: 'var(--accent-green)' }}>{sentMsg}</span>}
          {unread > 0 && (
            <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.74rem', background: 'rgba(0,200,240,0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(0,200,240,0.3)', borderRadius: 1, padding: '0.15rem 0.5rem' }}>
              {unread} UNREAD
            </span>
          )}
          {flagged > 0 && (
            <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.74rem', background: 'rgba(224,92,32,0.15)', color: '#e05c20', border: '1px solid rgba(224,92,32,0.3)', borderRadius: 1, padding: '0.15rem 0.5rem', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Flag size={9} />{flagged}
            </span>
          )}
          <button onClick={handleRefresh} disabled={refreshing || loading}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '0.1rem' }}>
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && (
          <div style={{ padding: '1rem', color: 'var(--text-muted)', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.78rem' }}>
            Accessing inbox...
          </div>
        )}

        {emails.map(email => {
          const isSelected = selected === email.id
          const isReplying = replying?.id === email.id
          return (
            <div key={email.id}
              onClick={() => handleSelect(email)}
              style={{
                padding: '0.65rem 1rem',
                borderBottom: '1px solid var(--border-dim)',
                cursor: 'pointer',
                background: isSelected
                  ? 'rgba(0,160,220,0.09)'
                  : email.unread ? 'rgba(0,160,220,0.04)' : 'transparent',
                transition: 'background 0.15s',
                opacity: deleting === email.id ? 0.4 : 1,
              }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(0,160,220,0.06)' }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = email.unread ? 'rgba(0,160,220,0.04)' : 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.55rem' }}>
                {/* Unread dot */}
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: email.unread ? 'var(--accent-green)' : 'transparent', flexShrink: 0, marginTop: '0.45rem', transition: 'background 0.3s' }} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="email-from" style={{ fontWeight: email.unread ? 700 : 400, color: email.unread ? 'var(--text-primary)' : 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontSize: '0.95rem' }}>
                      {email.from}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                      {email.flagged && <Flag size={11} style={{ color: '#e05c20' }} />}
                      <span className="email-time" style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.74rem', color: 'var(--text-muted)' }}>{email.time}</span>
                      <button onClick={e => handleReply(e, email)} title="Reply"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.1rem', display: 'flex' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent-cyan)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                        <Reply size={13} />
                      </button>
                      <button onClick={e => handleDelete(e, email)} title="Trash"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.1rem', display: 'flex' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#e05c20'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="email-subject" style={{ color: email.unread ? 'var(--text-secondary)' : 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.15rem', fontSize: '0.88rem' }}>
                    {email.subject}
                  </div>

                  {isSelected && !isReplying && (
                    <div className="email-preview" style={{ marginTop: '0.5rem', fontSize: '0.86rem', color: 'var(--text-secondary)', borderTop: '1px solid var(--border-dim)', paddingTop: '0.45rem', lineHeight: 1.55 }}>
                      {email.preview}
                    </div>
                  )}

                  {isReplying && (
                    <div onClick={e => e.stopPropagation()} style={{ marginTop: '0.5rem', borderTop: '1px solid var(--border-dim)', paddingTop: '0.5rem' }}>
                      <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.74rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        To: {email.fromEmail}
                      </div>
                      <textarea
                        value={replyBody}
                        onChange={e => setReplyBody(e.target.value)}
                        placeholder="Write your reply..."
                        autoFocus rows={4}
                        style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-dim)', borderRadius: 1, color: 'var(--text-primary)', fontFamily: 'Barlow Condensed, sans-serif', fontSize: '1rem', padding: '0.45rem 0.7rem', outline: 'none', resize: 'vertical', lineHeight: 1.5 }}
                      />
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.45rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setReplying(null); setReplyBody('') }} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <X size={12} /> Cancel
                        </button>
                        <button onClick={handleSendReply} disabled={sending || !replyBody.trim()} className="btn btn-amber" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Send size={12} /> {sending ? 'Sending...' : 'Send'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="panel-footer" style={{ padding: '0.45rem 1rem', borderTop: '1px solid var(--border-dim)', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.72rem', color: live ? 'var(--accent-green-dim)' : 'var(--text-muted)', letterSpacing: '0.08em' }}>
        {live ? '● Live · Primary · bill.jaffee@gmail.com' : '○ Mock data'}
      </div>
    </div>
  )
}
