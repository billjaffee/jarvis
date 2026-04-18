import { useState, useEffect, useRef } from 'react'
import { VolumeX, ChevronRight, Send, MessageSquare, X } from 'lucide-react'

export default function JarvisBar({
  isListening, isSpeaking, isThinking,
  lastTranscript, onStopSpeaking, voiceReady, sendMessage
}) {
  const [time, setTime]           = useState(new Date())
  const [textOpen, setTextOpen]   = useState(false)
  const [input, setInput]         = useState('')
  const [sending, setSending]     = useState(false)
  const inputRef                  = useRef(null)

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (textOpen) setTimeout(() => inputRef.current?.focus(), 100)
  }, [textOpen])

  const statusMsg = isListening ? 'LISTENING' : isThinking ? 'THINKING' : isSpeaking ? 'SPEAKING' : 'STANDBY'
  const statusColor = isListening ? '#00e898' : isThinking ? '#f0a820' : isSpeaking ? '#40e0ff' : 'var(--text-muted)'

  const handleSend = async () => {
    const text = input.trim()
    if (!text || sending || !sendMessage) return
    setSending(true)
    setInput('')
    try { await sendMessage(text) } finally { setSending(false) }
  }

  const timeStr = time.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, timeZone: 'America/Denver'
  })

  return (
    <div style={{
      background: 'rgba(1,10,20,0.97)',
      borderTop: '1px solid var(--border-dim)',
      flexShrink: 0,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }} className="jarvis-bottom-bar">

      {/* Text input panel — slides open above bar */}
      {textOpen && (
        <div style={{
          padding: '0.6rem 0.8rem',
          borderBottom: '1px solid var(--border-dim)',
          display: 'flex', gap: '0.5rem', alignItems: 'center',
          background: 'rgba(0,0,0,0.4)',
          animation: 'slideUp 0.2s ease',
        }}>
          <style>{`@keyframes slideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }`}</style>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder="Type a message to Jarvis..."
            disabled={sending || isThinking}
            style={{
              flex: 1,
              background: 'rgba(0,160,220,0.08)',
              border: '1px solid var(--border-mid)',
              borderRadius: 2,
              color: 'var(--text-primary)',
              fontFamily: 'Barlow Condensed, sans-serif',
              fontSize: '1rem',
              padding: '0.5rem 0.8rem',
              outline: 'none',
              WebkitAppearance: 'none',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending || isThinking}
            style={{
              background: input.trim() ? 'rgba(0,200,240,0.15)' : 'transparent',
              border: '1px solid var(--border-mid)',
              borderRadius: 2,
              cursor: input.trim() ? 'pointer' : 'not-allowed',
              padding: '0.5rem',
              display: 'flex', alignItems: 'center',
              color: 'var(--accent-cyan)',
              opacity: (!input.trim() || sending) ? 0.4 : 1,
              transition: 'all 0.2s',
            }}
          >
            <Send size={16} />
          </button>
          <button
            onClick={() => { setTextOpen(false); setInput('') }}
            style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:'0.3rem', display:'flex' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main bar */}
      <div style={{
        display: 'flex', alignItems: 'center',
        gap: '0.8rem', padding: '0 0.9rem',
        height: 46,
      }}>
        {/* Status indicator */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', minWidth: 110, flexShrink: 0 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%',
            background: statusColor,
            boxShadow: (isListening || isSpeaking || isThinking) ? `0 0 8px ${statusColor}` : 'none',
            transition: 'all 0.3s', flexShrink: 0,
          }} />
          <span style={{
            fontFamily: 'Share Tech Mono, monospace', fontSize: '0.65rem',
            color: statusColor, letterSpacing: '0.12em', transition: 'color 0.3s',
          }}>
            {statusMsg}
          </span>
        </div>

        {/* Center — transcript or hint */}
        <div style={{ flex:1, overflow:'hidden', display:'flex', alignItems:'center' }}>
          {lastTranscript && !textOpen ? (
            <div style={{
              fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.85rem',
              color: 'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis',
              whiteSpace: 'nowrap', fontStyle: 'italic',
            }}>
              <ChevronRight size={11} style={{ display:'inline', verticalAlign:'middle', marginRight:3 }} />
              "{lastTranscript}"
            </div>
          ) : !textOpen ? (
            <div style={{
              fontFamily: 'Rajdhani, sans-serif', fontSize: '0.7rem',
              color: 'var(--text-muted)', letterSpacing: '0.15em', textTransform: 'uppercase',
            }}>
              {voiceReady ? 'Mic or keyboard · "Wake up, daddy\'s home"' : 'Loading voice engine...'}
            </div>
          ) : null}
        </div>

        {/* Right controls */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexShrink:0 }}>
          <span style={{
            fontFamily: 'Share Tech Mono, monospace', fontSize: '0.65rem',
            color: 'var(--text-muted)', letterSpacing: '0.06em',
          }}>{timeStr} MT</span>

          {/* Stop speaking */}
          {isSpeaking && (
            <button onClick={onStopSpeaking} title="Stop"
              style={{ background:'transparent', border:'1px solid var(--border-dim)', borderRadius:1, cursor:'pointer', padding:'0.28rem', display:'flex', color:'var(--accent-cyan)' }}>
              <VolumeX size={13} />
            </button>
          )}

          {/* Type to Jarvis toggle */}
          <button
            onClick={() => setTextOpen(o => !o)}
            title="Type to Jarvis"
            style={{
              background: textOpen ? 'rgba(0,200,240,0.12)' : 'transparent',
              border: `1px solid ${textOpen ? 'var(--border-mid)' : 'var(--border-dim)'}`,
              borderRadius: 1, cursor: 'pointer', padding: '0.28rem 0.5rem',
              display: 'flex', alignItems: 'center', gap: '0.3rem',
              color: textOpen ? 'var(--accent-cyan)' : 'var(--text-muted)',
              transition: 'all 0.2s',
            }}
          >
            <MessageSquare size={13} />
            <span style={{ fontFamily:'Rajdhani,sans-serif', fontSize:'0.65rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase' }}>
              Type
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
