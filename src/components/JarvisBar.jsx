import { useState, useEffect } from 'react'
import { Mic, MicOff, Volume2, VolumeX, ChevronRight } from 'lucide-react'

export default function JarvisBar({
  isListening,
  isSpeaking,
  lastTranscript,
  onMicClick,
  onStopSpeaking,
  voiceReady,
}) {
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

  const timeStr = time.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  })

  return (
    <div style={{
      background: 'rgba(10,9,6,0.95)',
      borderTop: '1px solid rgba(185,122,8,0.25)',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      padding: '0 1rem',
      height: 52,
      flexShrink: 0,
      position: 'relative',
      backdropFilter: 'blur(8px)',
    }}>
      {/* Left: Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 130 }}>
        <div style={{
          width: 7, height: 7, borderRadius: '50%',
          background: isListening ? '#4ade80' : isSpeaking ? '#f5ad28' : '#4a3c28',
          boxShadow: isListening ? '0 0 8px #4ade80' : isSpeaking ? '0 0 8px #f5ad28' : 'none',
          transition: 'all 0.3s',
          flexShrink: 0,
        }} />
        <span style={{
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: '0.6rem',
          color: isListening ? '#4ade80' : isSpeaking ? '#f5ad28' : '#4a3c28',
          letterSpacing: '0.15em',
          transition: 'color 0.3s',
        }}>
          {statusMsg}
        </span>
      </div>

      {/* Center: Transcript / Waveform / Prompt */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        overflow: 'hidden',
        justifyContent: 'center',
      }}>
        {isListening && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{
                width: 3,
                background: '#4ade80',
                borderRadius: 2,
                animation: `waveBar ${0.5 + Math.random() * 0.6}s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.07}s`,
                height: `${8 + Math.random() * 14}px`,
              }} />
            ))}
            <style>{`
              @keyframes waveBar {
                from { transform: scaleY(0.4); opacity: 0.5; }
                to   { transform: scaleY(1.6); opacity: 1; }
              }
            `}</style>
          </div>
        )}

        {!isListening && lastTranscript && (
          <div style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontSize: '0.8rem',
            color: '#9a8060',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontStyle: 'italic',
          }}>
            <ChevronRight size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            "{lastTranscript}"
          </div>
        )}

        {!isListening && !lastTranscript && (
          <div style={{
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '0.65rem',
            color: '#4a3c28',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
          }}>
            {voiceReady ? 'Press mic to speak · Try "Jarvis, what\'s the weather?"' : 'Loading voice engine...'}
          </div>
        )}
      </div>

      {/* Right: Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 130, justifyContent: 'flex-end' }}>
        {/* Clock */}
        <span style={{
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: '0.7rem',
          color: '#4a3c28',
          letterSpacing: '0.08em',
          display: 'none', // hidden on very small screens, shown on md+
        }}
          className="hidden md:block"
        >
          {timeStr}
        </span>

        {/* Stop speaking */}
        {isSpeaking && (
          <button
            onClick={onStopSpeaking}
            title="Stop speaking"
            style={{
              background: 'transparent',
              border: '1px solid rgba(245,173,40,0.3)',
              borderRadius: 1,
              cursor: 'pointer',
              padding: '0.3rem',
              display: 'flex',
              color: '#d98f14',
            }}
          >
            <VolumeX size={14} />
          </button>
        )}

        {/* Mic button */}
        <button
          onClick={onMicClick}
          disabled={isSpeaking}
          title={isListening ? 'Listening...' : 'Speak to Jarvis'}
          style={{
            background: isListening
              ? 'rgba(74,222,128,0.12)'
              : 'transparent',
            border: `1px solid ${isListening ? 'rgba(74,222,128,0.5)' : 'rgba(185,122,8,0.4)'}`,
            borderRadius: 1,
            cursor: isSpeaking ? 'not-allowed' : 'pointer',
            padding: '0.35rem 0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: isListening ? '#4ade80' : '#d98f14',
            transition: 'all 0.2s',
            opacity: isSpeaking ? 0.4 : 1,
            position: 'relative',
          }}
        >
          {/* Sonar ring when listening */}
          {isListening && (
            <div style={{
              position: 'absolute',
              inset: -1,
              borderRadius: 1,
              border: '1px solid rgba(74,222,128,0.5)',
              animation: 'sonar 1.4s ease-out infinite',
              pointerEvents: 'none',
            }} />
          )}
          {isListening ? <Mic size={14} /> : <Mic size={14} />}
          <span style={{
            fontFamily: 'Rajdhani, sans-serif',
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}>
            {isListening ? 'Listening' : 'Speak'}
          </span>
        </button>
      </div>
    </div>
  )
}
