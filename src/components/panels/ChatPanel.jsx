import { useState, useRef, useEffect } from 'react'
import { Send, Trash2, Bot } from 'lucide-react'

export default function ChatPanel({ dashboardContext }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Good evening, sir. All systems are operational. What can I do for you?", ts: new Date() }
  ])
  const [input, setInput]     = useState('')
  const [thinking, setThink]  = useState(false)
  const bottomRef             = useRef(null)
  const inputRef              = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const send = async () => {
    const text = input.trim()
    if (!text || thinking) return
    setInput('')

    const userMsg = { role: 'user', content: text, ts: new Date() }
    setMessages(prev => [...prev, userMsg])
    setThink(true)

    try {
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/.netlify/functions/jarvis-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history,
          dashboardContext: { ...dashboardContext, time: new Date().toISOString() },
        }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.speech || "Apologies, sir — something went sideways.", ts: new Date() }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "My uplink is having a moment, sir. Try again.", ts: new Date() }])
    } finally {
      setThink(false)
      inputRef.current?.focus()
    }
  }

  const fmt = ts => ts.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <div className="hud-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <div className="status-dot pulse" />
        <span className="panel-title">Jarvis Chat</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="panel-badge">Claude Haiku · AI</span>
          <button onClick={() => setMessages([{ role:'assistant', content:"Cleared. What can I do for you, sir?", ts:new Date() }])}
            title="Clear chat"
            style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', padding:'0.1rem', transition:'color 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.color='var(--accent-iron)'}
            onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>
            <Trash2 size={13}/>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.8rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', gap: '0.2rem' }}>
            <div style={{
              maxWidth: '88%',
              background: m.role === 'user' ? 'rgba(0,160,220,0.15)' : 'rgba(0,0,0,0.3)',
              border: `1px solid ${m.role === 'user' ? 'rgba(0,200,240,0.3)' : 'var(--border-dim)'}`,
              borderRadius: m.role === 'user' ? '8px 8px 2px 8px' : '8px 8px 8px 2px',
              padding: '0.55rem 0.85rem',
              color: 'var(--text-primary)',
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '1.02rem',
              lineHeight: 1.5,
            }}>
              {m.content}
            </div>
            <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              {m.role === 'assistant' ? 'JARVIS' : 'You'} · {fmt(m.ts)}
            </span>
          </div>
        ))}

        {thinking && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-dim)', borderRadius: '8px 8px 8px 2px', padding: '0.55rem 0.85rem', display: 'flex', gap: '5px', alignItems: 'center' }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent-cyan)', animation: 'dot-pulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '0.6rem 0.8rem', borderTop: '1px solid var(--border-dim)', display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder='Ask Jarvis anything... "What\'s on my calendar?" "Reply to Kate..."'
          disabled={thinking}
          style={{
            flex: 1,
            background: 'rgba(0,160,220,0.06)',
            border: '1px solid var(--border-dim)',
            borderRadius: 4,
            color: 'var(--text-primary)',
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: '1.05rem',
            padding: '0.55rem 0.9rem',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent-cyan)'}
          onBlur={e => e.target.style.borderColor = 'var(--border-dim)'}
        />
        <button onClick={send} disabled={!input.trim() || thinking}
          style={{ background: input.trim() && !thinking ? 'rgba(0,200,240,0.15)' : 'transparent', border: '1px solid var(--border-mid)', borderRadius: 4, cursor: input.trim() && !thinking ? 'pointer' : 'not-allowed', padding: '0.55rem 0.8rem', display: 'flex', alignItems: 'center', color: 'var(--accent-cyan)', opacity: (!input.trim() || thinking) ? 0.4 : 1, transition: 'all 0.2s' }}>
          <Send size={17} />
        </button>
      </div>
    </div>
  )
}
