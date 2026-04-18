import { useState, useEffect } from 'react'
import { VolumeX, ChevronRight } from 'lucide-react'

export default function JarvisBar({ isListening, isSpeaking, lastTranscript, onStopSpeaking, voiceReady, hideMic }) {
  const [time, setTime] = useState(new Date())
  const [statusMsg, setStatusMsg] = useState('STANDBY')

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (isListening) setStatusMsg('LISTENING')
    else if (isSpeaking) setStatusMsg('TRANSMITTING')
    else setStatusMsg('STANDBY')
  }, [isListening, isSpeaking])

  const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'America/Denver' })

  return (
    <div style={{ background: 'rgba(1,10,20,0.95)', borderTop: '1px solid var(--border-dim)', display: 'flex', alignItems: 'center', gap: '1rem', padding: '0 1rem', height: 44, flexShrink: 0, backdropFilter: 'blur(8px)' }}>

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 130 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: isListening ? '#00e898' : isSpeaking ? '#40e0ff' : '#2a5570', boxShadow: isListening ? '0 0 8px #00e898' : isSpeaking ? '0 0 8px #40e0ff' : 'none', transition: 'all 0.3s', flexShrink: 0 }} />
        <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.62rem', color: isListening ? '#00e898' : isSpeaking ? '#40e0ff' : '#2a5570', letterSpacing: '0.15em', transition: 'color 0.3s' }}>
          {statusMsg}
        </span>
      </div>

      {/* Center */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', justifyContent: 'center' }}>
        {isListening && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{ width: 3, background: '#00e898', borderRadius: 2, animation: `waveBar ${0.5 + Math.random() * 0.6}s ease-in-out infinite alternate`, animationDelay: `${i * 0.07}s`, height: `${8 + Math.random() * 14}px` }} />
            ))}
            <style>{`@keyframes waveBar { from { transform: scaleY(0.4); opacity: 0.5; } to { transform: scaleY(1.6); opacity: 1; } }`}</style>
          </div>
        )}
        {!isListening && lastTranscript && (
          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: '0.82rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontStyle: 'italic' }}>
            <ChevronRight size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            "{lastTranscript}"
          </div>
        )}
        {!isListening && !lastTranscript && (
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            {voiceReady ? 'Use the Speak button above · or try "What\'s the weather?"' : 'Loading voice engine...'}
          </div>
        )}
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 130, justifyContent: 'flex-end' }}>
        <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.08em' }}>{timeStr} MT</span>
        {isSpeaking && (
          <button onClick={onStopSpeaking} title="Stop speaking" style={{ background: 'transparent', border: '1px solid var(--border-dim)', borderRadius: 1, cursor: 'pointer', padding: '0.3rem', display: 'flex', color: 'var(--accent-cyan)' }}>
            <VolumeX size={13} />
          </button>
        )}
      </div>
    </div>
  )
}
