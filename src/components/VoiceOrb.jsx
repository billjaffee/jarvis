import { useEffect, useRef, useState } from 'react'

export default function VoiceOrb({ isListening, isSpeaking, onClose }) {
  const [amplitude, setAmplitude] = useState(0)
  const analyserRef  = useRef(null)
  const animFrameRef = useRef(null)
  const streamRef    = useRef(null)

  // Connect to mic when listening for real amplitude data
  useEffect(() => {
    if (!isListening) { setAmplitude(0); return }

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream
        const ctx      = new AudioContext()
        const source   = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)
        analyserRef.current = analyser

        const tick = () => {
          const data = new Uint8Array(analyser.frequencyBinCount)
          analyser.getByteFrequencyData(data)
          const avg = data.reduce((a, b) => a + b, 0) / data.length
          setAmplitude(avg / 128)
          animFrameRef.current = requestAnimationFrame(tick)
        }
        tick()
      } catch { /* mic not available */ }
    }
    start()

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
      analyserRef.current = null
    }
  }, [isListening])

  // Simulate amplitude when speaking (TTS can't be analyzed directly)
  const [speakPhase, setSpeakPhase] = useState(0)
  useEffect(() => {
    if (!isSpeaking) { setSpeakPhase(0); return }
    let t = 0
    const interval = setInterval(() => {
      t += 0.15
      setSpeakPhase(Math.abs(Math.sin(t)) * 0.7 + Math.random() * 0.3)
    }, 80)
    return () => clearInterval(interval)
  }, [isSpeaking])

  const level = isListening ? amplitude : isSpeaking ? speakPhase : 0
  const orbSize = 180 + level * 120
  const ring1   = orbSize + 40 + level * 60
  const ring2   = orbSize + 80 + level * 100
  const ring3   = orbSize + 130 + level * 140

  const label = isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : 'Processing...'
  const color  = isListening ? '#00e898' : '#40e0ff'
  const glow   = isListening ? 'rgba(0,232,152' : 'rgba(64,224,255'

  return (
    <div
      onClick={isListening ? onClose : undefined}
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(1,10,20,0.92)',
        backdropFilter: 'blur(12px)',
        cursor: isListening ? 'pointer' : 'default',
        animation: 'orbFadeIn 0.3s ease',
      }}
    >
      <style>{`
        @keyframes orbFadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes orbSpin { to { transform: rotate(360deg); } }
        @keyframes orbPulse { 0%,100% { opacity:0.15; } 50% { opacity:0.35; } }
      `}</style>

      {/* Outer ripple rings */}
      {[ring3, ring2, ring1].map((size, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: size, height: size,
          borderRadius: '50%',
          border: `1px solid ${glow},${0.08 + i * 0.06})`,
          transition: 'width 0.12s ease, height 0.12s ease',
          pointerEvents: 'none',
        }} />
      ))}

      {/* Spinning arc */}
      <div style={{
        position: 'absolute',
        width: orbSize + 20, height: orbSize + 20,
        borderRadius: '50%',
        border: `2px solid transparent`,
        borderTopColor: color,
        borderRightColor: `${glow},0.3)`,
        animation: 'orbSpin 3s linear infinite',
        transition: 'width 0.12s ease, height 0.12s ease',
        pointerEvents: 'none',
      }} />

      {/* Main orb */}
      <div style={{
        width: orbSize, height: orbSize,
        borderRadius: '50%',
        background: `radial-gradient(circle at 40% 35%, ${glow},${0.25 + level * 0.2}), ${glow},${0.08 + level * 0.1}))`,
        border: `2px solid ${glow},${0.5 + level * 0.4})`,
        boxShadow: `0 0 ${40 + level * 60}px ${glow},${0.4 + level * 0.3}), 0 0 ${80 + level * 100}px ${glow},0.15)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: '0.5rem',
        transition: 'width 0.1s ease, height 0.1s ease, box-shadow 0.1s ease',
        position: 'relative',
      }}>
        {/* Mic icon */}
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      </div>

      {/* Label */}
      <div style={{ marginTop: 32, fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '1.1rem', letterSpacing: '0.3em', textTransform: 'uppercase', color, textShadow: `0 0 16px ${glow},0.6)` }}>
        {label}
      </div>

      {/* Wave bars */}
      <div style={{ display: 'flex', gap: 5, marginTop: 16, height: 32, alignItems: 'center' }}>
        {[...Array(12)].map((_, i) => {
          const h = 4 + level * 28 * Math.abs(Math.sin(i * 0.7 + Date.now() / 200))
          return (
            <div key={i} style={{
              width: 4, height: Math.max(4, h),
              borderRadius: 2,
              background: color,
              opacity: 0.5 + level * 0.5,
              transition: 'height 0.08s ease',
            }} />
          )
        })}
      </div>

      {isListening && (
        <div style={{ marginTop: 20, fontFamily: 'Share Tech Mono, monospace', fontSize: '0.72rem', color: 'rgba(0,232,152,0.6)', letterSpacing: '0.15em' }}>
          tap anywhere to cancel
        </div>
      )}
    </div>
  )
}
