import { useState, useEffect } from 'react'

export default function Login({ onLogin }) {
  const [lines, setLines] = useState([])
  const [showBtn, setShowBtn] = useState(false)

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
      if (i < bootLines.length) { setLines(prev => [...prev, bootLines[i]]); i++ }
      else { clearInterval(interval); setTimeout(() => setShowBtn(true), 500) }
    }, 260)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#010a14', padding: '2rem', position: 'relative', overflow: 'hidden' }}>

      {/* Grid overlay */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(0,160,220,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,160,220,0.04) 1px, transparent 1px)', backgroundSize: '44px 44px', pointerEvents: 'none' }} />

      {/* Radial glow */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,160,220,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Rings */}
      {[200, 300, 400].map((size, i) => (
        <div key={i} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: size, height: size, borderRadius: '50%', border: `1px solid rgba(0,200,240,${0.12 - i * 0.03})`, pointerEvents: 'none', animation: `breathe ${3 + i}s ease-in-out infinite alternate` }} />
      ))}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Share+Tech+Mono&family=Barlow+Condensed:wght@400;500&display=swap');
        @keyframes breathe { 0%,100% { opacity:0.5; transform:translate(-50%,-50%) scale(1); } 50% { opacity:1; transform:translate(-50%,-50%) scale(1.03); } }
        @keyframes fade-up { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fade-in { from { opacity:0; } to { opacity:1; } }
        @keyframes dot-pulse { 0%,100% { opacity:1; } 50% { opacity:0.2; } }
      `}</style>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem', position: 'relative', zIndex: 1 }}>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: 'clamp(2rem, 6vw, 3.5rem)', letterSpacing: '0.35em', color: '#40e0ff', textShadow: '0 0 20px rgba(64,224,255,0.5), 0 0 60px rgba(0,160,220,0.2)', marginBottom: '0.3rem' }}>
          J.A.R.V.I.S.
        </div>
        <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.6rem', color: '#2a5570', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
          Just A Rather Very Intelligent System
        </div>
      </div>

      {/* Boot terminal */}
      <div style={{ width: '100%', maxWidth: 480, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,200,240,0.2)', borderRadius: 2, padding: '1.2rem 1.4rem', marginBottom: '1.5rem', minHeight: 160, position: 'relative', zIndex: 1 }}>
        {lines.map((line, i) => (
          <div key={i} style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.72rem', color: i === lines.length - 1 ? '#00c8f0' : '#2a5570', marginBottom: '0.3rem', animation: 'fade-in 0.2s ease' }}>
            <span style={{ color: '#0088cc', marginRight: '0.5rem' }}>{'>'}</span>{line}
          </div>
        ))}
        <span style={{ display: 'inline-block', width: 8, height: 14, background: '#0088cc', marginLeft: 2, animation: 'dot-pulse 1s step-end infinite', verticalAlign: 'bottom' }} />
      </div>

      {/* Auth button */}
      {showBtn && (
        <div style={{ textAlign: 'center', position: 'relative', zIndex: 1, animation: 'fade-up 0.5s ease' }}>
          <button onClick={onLogin} style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.25em', textTransform: 'uppercase', padding: '0.75rem 2.5rem', background: 'transparent', border: '1px solid #0088cc', color: '#40e0ff', cursor: 'pointer', borderRadius: 1, transition: 'all 0.2s' }}
            onMouseEnter={e => { e.target.style.background = 'rgba(0,160,220,0.15)'; e.target.style.boxShadow = '0 0 20px rgba(64,224,255,0.3)' }}
            onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.boxShadow = 'none' }}
          >
            Authorize Access
          </button>
          <div style={{ marginTop: '0.8rem', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.6rem', color: '#2a5570', letterSpacing: '0.1em' }}>
            SECURE · NETLIFY IDENTITY · INVITE ONLY
          </div>
        </div>
      )}
    </div>
  )
}
