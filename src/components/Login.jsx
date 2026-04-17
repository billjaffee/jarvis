import { useState, useEffect } from 'react'

export default function Login({ onLogin }) {
  const [booted, setBooted] = useState(false)
  const [showBtn, setShowBtn] = useState(false)
  const [lines, setLines] = useState([])

  const bootLines = [
    'J.A.R.V.I.S. v1.0 — Personal Command Intelligence',
    'Initializing subsystems...',
    'Loading user preference matrix...',
    'Security protocols: ACTIVE',
    'Netlify Identity: CONNECTED',
    'Awaiting authorization...',
  ]

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      if (i < bootLines.length) {
        setLines(prev => [...prev, bootLines[i]])
        i++
      } else {
        clearInterval(interval)
        setTimeout(() => setBooted(true), 300)
        setTimeout(() => setShowBtn(true), 700)
      }
    }, 260)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0906',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Radial glow behind center */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600, height: 600,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(185,122,8,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Arc reactor rings */}
      {[200, 280, 360].map((size, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: size, height: size,
          borderRadius: '50%',
          border: `1px solid rgba(185,122,8,${0.12 - i * 0.03})`,
          pointerEvents: 'none',
          animation: `breathe ${3 + i}s ease-in-out infinite alternate`,
        }} />
      ))}

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem', position: 'relative', zIndex: 1 }}>
        <div style={{
          fontFamily: 'Rajdhani, sans-serif',
          fontWeight: 700,
          fontSize: 'clamp(2rem, 6vw, 3.5rem)',
          letterSpacing: '0.35em',
          color: '#f5ad28',
          textShadow: '0 0 20px rgba(245,173,40,0.4), 0 0 60px rgba(245,173,40,0.12)',
          marginBottom: '0.3rem',
        }}>
          J.A.R.V.I.S.
        </div>
        <div style={{
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: '0.6rem',
          color: '#4a3c28',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
        }}>
          Just A Rather Very Intelligent System
        </div>
      </div>

      {/* Boot terminal */}
      <div style={{
        width: '100%',
        maxWidth: 480,
        background: 'rgba(0,0,0,0.4)',
        border: '1px solid rgba(185,122,8,0.2)',
        borderRadius: 2,
        padding: '1.2rem 1.4rem',
        marginBottom: '1.5rem',
        minHeight: 160,
        position: 'relative',
        zIndex: 1,
      }}>
        {lines.map((line, i) => (
          <div key={i} style={{
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: '0.72rem',
            color: i === lines.length - 1 ? '#d98f14' : '#5a4a35',
            marginBottom: '0.3rem',
            animation: 'fade-in 0.2s ease',
          }}>
            <span style={{ color: '#c8830a', marginRight: '0.5rem' }}>{'>'}</span>
            {line}
          </div>
        ))}
        {/* Blinking cursor */}
        <span style={{
          display: 'inline-block',
          width: 8, height: 14,
          background: '#c8830a',
          marginLeft: 2,
          animation: 'dot-pulse 1s step-end infinite',
          verticalAlign: 'bottom',
        }} />
      </div>

      {/* Auth button */}
      {showBtn && (
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, animation: 'fade-up 0.5s ease' }}>
          <button
            onClick={onLogin}
            className="btn btn-amber"
            style={{ padding: '0.7rem 2.5rem', fontSize: '0.8rem', letterSpacing: '0.25em' }}
          >
            Authorize Access
          </button>
          <div style={{
            marginTop: '0.8rem',
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: '0.6rem',
            color: '#4a3c28',
            letterSpacing: '0.1em',
          }}>
            SECURE · NETLIFY IDENTITY · INVITE ONLY
          </div>
        </div>
      )}
    </div>
  )
}
