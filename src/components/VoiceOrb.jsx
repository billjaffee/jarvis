import { useEffect, useRef, useState } from 'react'

export default function VoiceOrb({ isListening, isSpeaking, isThinking, lastTranscript, lastResponse, history, onClose }) {
  const [amplitude, setAmplitude] = useState(0)
  const [speakPhase, setSpeakPhase] = useState(0)
  const analyserRef = useRef(null)
  const animRef     = useRef(null)
  const streamRef   = useRef(null)

  // Real mic amplitude when listening
  useEffect(() => {
    if (!isListening) { setAmplitude(0); return }
    const start = async () => {
      try {
        const stream   = await navigator.mediaDevices.getUserMedia({ audio: true })
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
          animRef.current = requestAnimationFrame(tick)
        }
        tick()
      } catch {}
    }
    start()
    return () => {
      cancelAnimationFrame(animRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [isListening])

  // Simulated amplitude when speaking
  useEffect(() => {
    if (!isSpeaking) { setSpeakPhase(0); return }
    let t = 0
    const iv = setInterval(() => {
      t += 0.18
      setSpeakPhase(Math.abs(Math.sin(t)) * 0.65 + Math.random() * 0.3)
    }, 80)
    return () => clearInterval(iv)
  }, [isSpeaking])

  const level   = isListening ? amplitude : isSpeaking ? speakPhase : isThinking ? 0.2 : 0
  const orbSize = 160 + level * 100
  const color   = isListening ? '#00e898' : isThinking ? '#f0a820' : '#40e0ff'
  const glow    = isListening ? 'rgba(0,232,152' : isThinking ? 'rgba(240,168,32' : 'rgba(64,224,255'
  const label   = isListening ? 'Listening...' : isThinking ? 'Thinking...' : isSpeaking ? 'Speaking...' : 'Processing...'

  // Show last few conversation exchanges
  const recentHistory = history.slice(-4)

  return (
    <div
      onClick={isListening ? onClose : undefined}
      style={{ position:'fixed', inset:0, zIndex:9000, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'rgba(1,10,20,0.94)', backdropFilter:'blur(14px)', cursor: isListening ? 'pointer' : 'default', animation:'orbFadeIn 0.25s ease' }}
    >
      <style>{`
        @keyframes orbFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes orbSpin   { to{transform:rotate(360deg)} }
        @keyframes orbThink  { 0%,100%{transform:rotate(0deg) scale(1)} 50%{transform:rotate(180deg) scale(1.05)} }
        @keyframes waveBar   { from{transform:scaleY(0.3);opacity:0.4} to{transform:scaleY(1.8);opacity:1} }
      `}</style>

      {/* Rings */}
      {[orbSize+60, orbSize+110, orbSize+165].map((size, i) => (
        <div key={i} style={{ position:'absolute', width:size, height:size, borderRadius:'50%', border:`1px solid ${glow},${0.12 - i*0.03})`, transition:'width 0.15s, height 0.15s', pointerEvents:'none' }} />
      ))}

      {/* Spinning arc */}
      <div style={{ position:'absolute', width:orbSize+16, height:orbSize+16, borderRadius:'50%', border:'2px solid transparent', borderTopColor:color, borderRightColor:`${glow},0.25)`, animation: isThinking ? 'orbThink 2s ease-in-out infinite' : 'orbSpin 3s linear infinite', transition:'width 0.12s, height 0.12s', pointerEvents:'none' }} />

      {/* Main orb */}
      <div style={{ width:orbSize, height:orbSize, borderRadius:'50%', background:`radial-gradient(circle at 38% 32%, ${glow},${0.22+level*0.18}), ${glow},${0.06+level*0.08}))`, border:`2px solid ${glow},${0.45+level*0.4})`, boxShadow:`0 0 ${35+level*55}px ${glow},${0.35+level*0.25}), 0 0 ${70+level*90}px ${glow},0.12)`, display:'flex', alignItems:'center', justifyContent:'center', transition:'width 0.1s, height 0.1s, box-shadow 0.1s', flexDirection:'column', gap:'0.4rem' }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
      </div>

      {/* Status label */}
      <div style={{ marginTop:28, fontFamily:'Rajdhani, sans-serif', fontWeight:600, fontSize:'1rem', letterSpacing:'0.3em', textTransform:'uppercase', color, textShadow:`0 0 16px ${glow},0.6)` }}>
        {label}
      </div>

      {/* Wave bars */}
      <div style={{ display:'flex', gap:4, marginTop:14, height:28, alignItems:'center' }}>
        {[...Array(14)].map((_, i) => (
          <div key={i} style={{ width:3, background:color, borderRadius:2, opacity: 0.4 + level * 0.6, animation:`waveBar ${0.4+Math.random()*0.5}s ease-in-out infinite alternate`, animationDelay:`${i*0.06}s`, height:`${5 + level*22*Math.abs(Math.sin(i*0.8))}px`, transition:'height 0.1s' }} />
        ))}
      </div>

      {/* Conversation transcript */}
      {recentHistory.length > 0 && (
        <div style={{ marginTop:28, width:'90%', maxWidth:560, display:'flex', flexDirection:'column', gap:'0.6rem', maxHeight:200, overflowY:'auto' }}>
          {recentHistory.map((msg, i) => (
            <div key={i} style={{ display:'flex', gap:'0.6rem', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                background: msg.role === 'user' ? 'rgba(0,200,240,0.12)' : 'rgba(0,0,0,0.35)',
                border: `1px solid ${msg.role === 'user' ? 'rgba(0,200,240,0.25)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: 4, padding:'0.4rem 0.7rem', maxWidth:'80%',
                fontFamily: msg.role === 'user' ? 'Barlow Condensed, sans-serif' : 'Barlow Condensed, sans-serif',
                fontSize:'0.82rem', color: msg.role === 'user' ? '#a0d8f0' : '#c8e8f8', lineHeight:1.45,
              }}>
                {msg.content}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Current transcript */}
      {isListening && lastTranscript && (
        <div style={{ marginTop:12, fontFamily:'Barlow Condensed, sans-serif', fontSize:'0.88rem', color:'rgba(0,232,152,0.7)', fontStyle:'italic' }}>
          "{lastTranscript}"
        </div>
      )}

      {isListening && (
        <div style={{ marginTop:18, fontFamily:'Share Tech Mono, monospace', fontSize:'0.68rem', color:'rgba(0,232,152,0.5)', letterSpacing:'0.15em' }}>
          tap to cancel
        </div>
      )}
    </div>
  )
}
