import { useState, useEffect } from 'react'
import { LogOut, RefreshCw, Zap, TrendingUp, TrendingDown, Sun, Moon, CheckCircle, Menu, X } from 'lucide-react'
import { useJarvisVoice, getGreeting } from '../hooks/useJarvisVoice'
import WeatherPanel  from './panels/WeatherPanel'
import CalendarPanel from './panels/CalendarPanel'
import GmailPanel    from './panels/GmailPanel'
import TasksPanel    from './panels/TasksPanel'
import NotesPanel    from './panels/NotesPanel'
import NewsPanel     from './panels/NewsPanel'
import TravelPanel   from './panels/TravelPanel'
import JarvisBar     from './JarvisBar'
import VoiceOrb      from './VoiceOrb'

const ZONES = [
  { label: 'NYC',  tz: 'America/New_York' },
  { label: 'MPLS', tz: 'America/Chicago' },
  { label: 'LA',   tz: 'America/Los_Angeles' },
]

export default function Dashboard({ user, onLogout }) {
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'sir'

  const [weather, setWeather]         = useState(null)
  const [tasks, setTasks]             = useState([])
  const [notes, setNotes]             = useState('')
  const [liveEmails, setLiveEmails]   = useState([])
  const [liveEvents, setLiveEvents]   = useState([])
  const [tickers, setTickers]         = useState([])
  const [time, setTime]               = useState(new Date())
  const [greeted, setGreeted]         = useState(false)
  const [lightMode, setLightMode]     = useState(false)
  const [showOrb, setShowOrb]         = useState(false)
  const [menuOpen, setMenuOpen]       = useState(false)
  const [kateMsg, setKateMsg]         = useState('')

  const {
    speak, stopSpeaking, isSpeaking,
    startListening, stopListening, isListening,
    isThinking, lastTranscript, lastResponse,
    voiceReady, history, setContext, sendMessage,
  } = useJarvisVoice()

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t) }, [])

  useEffect(() => {
    if (!greeted && voiceReady) {
      const timer = setTimeout(() => { speak(getGreeting(firstName)); setGreeted(true) }, 900)
      return () => clearTimeout(timer)
    }
  }, [voiceReady, greeted, firstName, speak])

  useEffect(() => { document.documentElement.setAttribute('data-theme', lightMode ? 'light' : 'dark') }, [lightMode])

  useEffect(() => {
    if (isListening || isSpeaking || isThinking) setShowOrb(true)
    else setTimeout(() => setShowOrb(false), 400)
  }, [isListening, isSpeaking, isThinking])

  // Keep AI context current
  useEffect(() => {
    setContext({ weather, events: liveEvents, emails: liveEmails, tasks, notes, tickers })
  })

  // Stock ticker
  useEffect(() => {
    const go = async () => {
      try { const r = await fetch('/.netlify/functions/stock-fetch'); if (r.ok) setTickers(await r.json()) } catch {}
    }
    go(); const t = setInterval(go, 60000); return () => clearInterval(t)
  }, [])

  const handleMicClick = () => { if (isListening) stopListening(); else startListening() }

  const handleAcceptKate = async () => {
    try {
      const res  = await fetch('/.netlify/functions/calendar-accept', { method: 'POST' })
      const data = await res.json()
      const msg  = data.count > 0 ? `Accepted ${data.count} invite${data.count !== 1 ? 's' : ''} from Kate` : 'No pending invites'
      setKateMsg(msg)
      if (data.count > 0) speak(`Done, sir. I've accepted ${data.count} calendar invite${data.count !== 1 ? 's' : ''} from Kate.`)
    } catch { setKateMsg('Could not check') }
    finally { setTimeout(() => setKateMsg(''), 4000) }
  }

  const timeStr  = time.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', timeZone:'America/Denver' })
  const dateStr  = time.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', timeZone:'America/Denver' })
  const hour     = parseInt(time.toLocaleTimeString('en-US', { hour:'numeric', hour12:false, timeZone:'America/Denver' }))
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const MicBtn = ({ size = 40 }) => (
    <button onClick={handleMicClick} disabled={isSpeaking}
      style={{ width:size, height:size, borderRadius:'50%', border:`2px solid ${isListening ? 'var(--accent-green)' : 'var(--accent-cyan)'}`, background:isListening ? 'rgba(0,232,152,0.15)' : 'rgba(0,200,240,0.1)', cursor:isSpeaking ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:isListening ? 'var(--accent-green)' : 'var(--accent-cyan)', opacity:isSpeaking ? 0.4 : 1, animation:isListening ? 'mic-pulse-listening 1.2s ease-out infinite' : 'mic-pulse 2.5s ease-out infinite', flexShrink:0, transition:'all 0.25s' }}>
      <svg width={size*0.4} height={size*0.4} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
    </button>
  )

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100dvh', maxWidth:'100vw', overflow:'hidden', background:'var(--bg-root)', position:'relative' }}>

      <style>{`
        /* Light mode */
        [data-theme="light"] { --bg-root:#e8f2f8; --bg-panel:#ffffff; --text-primary:#0a1e2d; --text-secondary:#1a5070; --text-muted:#4a7a95; --accent-cyan:#0090c0; --accent-bright:#0078a8; --accent-green:#008855; --accent-green-dim:#006640; --border-dim:rgba(0,110,160,0.2); --border-mid:rgba(0,140,190,0.38); --glow-sm:0 1px 6px rgba(0,0,0,0.09); --glow-green:0 0 8px rgba(0,136,85,0.3); }
        [data-theme="light"] body { background:#e8f2f8; }
        [data-theme="light"] body::after { display:none; }
        [data-theme="light"] .hud-panel { box-shadow:0 2px 12px rgba(0,0,0,0.08); }
        [data-theme="light"] .panel-header { background:rgba(0,120,180,0.06); }

        @keyframes mic-pulse           { 0%{box-shadow:0 0 0 0 rgba(0,200,240,0.5)} 70%{box-shadow:0 0 0 14px rgba(0,200,240,0)} 100%{box-shadow:0 0 0 0 rgba(0,200,240,0)} }
        @keyframes mic-pulse-listening { 0%{box-shadow:0 0 0 0 rgba(0,232,152,0.6)} 70%{box-shadow:0 0 0 18px rgba(0,232,152,0)} 100%{box-shadow:0 0 0 0 rgba(0,232,152,0)} }
        @keyframes sonar { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(2.8);opacity:0} }
        @keyframes spin  { to{transform:rotate(360deg)} }

        /* Mobile menu */
        .mobile-menu { position:fixed; inset:0; z-index:8500; background:rgba(1,10,20,0.97); backdrop-filter:blur(16px); display:flex; flex-direction:column; padding:max(env(safe-area-inset-top,1.5rem),1.5rem) 1.5rem max(env(safe-area-inset-bottom,1.5rem),1.5rem); gap:1rem; overflow-y:auto; }
        .mmb { background:transparent; border:1px solid var(--border-mid); border-radius:4px; color:var(--text-primary); font-family:'Rajdhani',sans-serif; font-size:1.15rem; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; padding:1rem 1.2rem; cursor:pointer; display:flex; align-items:center; gap:0.8rem; transition:all 0.2s; -webkit-tap-highlight-color:transparent; }
        .mmb:active { background:rgba(0,200,240,0.12); }

        /* Dashboard grid */
        .dash-grid {
          display:grid; gap:0.65rem;
          grid-template-columns:repeat(12,1fr);
          grid-template-rows:minmax(380px,1fr) minmax(300px,1fr) minmax(130px,auto);
          grid-template-areas:
            "w w w c c c g g g g g g"
            "t t t t n n n news news news news news"
            "tr tr tr tr tr tr tr tr tr tr tr tr";
        }
        @media (max-width:1024px) and (min-width:601px) {
          .dash-grid {
            grid-template-columns:1fr 1fr !important;
            grid-template-rows:auto !important;
            grid-template-areas:"w c" "g g" "t n" "news news" "tr tr" !important;
          }
        }
        @media (max-width:600px) {
          .dash-grid {
            grid-template-columns:1fr !important;
            grid-template-rows:auto !important;
            grid-template-areas:"w" "c" "g" "t" "n" "news" "tr" !important;
          }
          .dash-grid > div { min-height:300px; }
          .dash-grid > div:last-child { min-height:140px; }
        }
      `}</style>

      {/* VOICE ORB */}
      {showOrb && <VoiceOrb isListening={isListening} isSpeaking={isSpeaking} isThinking={isThinking} lastTranscript={lastTranscript} lastResponse={lastResponse} history={history} onClose={stopListening} />}

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="mobile-menu">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700, fontSize:'1.4rem', letterSpacing:'0.25em', color:'var(--accent-bright)' }}>MENU</span>
            <button onClick={() => setMenuOpen(false)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:'0.5rem', display:'flex' }}><X size={24} /></button>
          </div>
          <div style={{ borderBottom:'1px solid var(--border-dim)', margin:'0.3rem 0' }} />

          {/* Big mic in menu */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', padding:'1rem 0' }}>
            <MicBtn size={72} />
            <div style={{ marginTop:'0.6rem', fontFamily:'Share Tech Mono,monospace', fontSize:'0.75rem', color:'var(--text-muted)', letterSpacing:'0.15em' }}>
              {isListening ? 'LISTENING...' : isThinking ? 'THINKING...' : 'TAP TO SPEAK'}
            </div>
          </div>

          <div style={{ borderBottom:'1px solid var(--border-dim)', margin:'0.3rem 0' }} />
          <button className="mmb" onClick={() => { handleAcceptKate(); setMenuOpen(false) }}><CheckCircle size={20} />{kateMsg || "Accept Kate's Invites"}</button>
          <button className="mmb" onClick={() => { setLightMode(l=>!l); setMenuOpen(false) }}>{lightMode ? <Moon size={20}/> : <Sun size={20}/>}{lightMode ? 'Dark Mode' : 'Light Mode'}</button>
          <button className="mmb" onClick={() => { speak("Refreshing all systems, sir."); setMenuOpen(false) }}><RefreshCw size={20}/>Refresh</button>
          <button className="mmb" onClick={() => { onLogout(); setMenuOpen(false) }} style={{ color:'#e05c20', borderColor:'rgba(224,92,32,0.3)', marginTop:'auto' }}><LogOut size={20}/>Sign Out</button>
        </div>
      )}

      {/* TICKER BAR */}
      {tickers.length > 0 && (
        <div style={{ background:'rgba(0,0,0,0.5)', borderBottom:'1px solid var(--border-dim)', height:28, display:'flex', alignItems:'center', gap:'1.2rem', paddingLeft:`max(env(safe-area-inset-left,0.8rem),0.8rem)`, paddingRight:'0.8rem', overflowX:'auto', flexShrink:0, WebkitOverflowScrolling:'touch', msOverflowStyle:'none', scrollbarWidth:'none' }}>
          {tickers.map(t => (
            <div key={t.symbol} style={{ display:'flex', alignItems:'center', gap:'0.35rem', flexShrink:0 }}>
              <span style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700, fontSize:'0.72rem', letterSpacing:'0.1em', color:'var(--accent-cyan)' }}>{t.label}</span>
              <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:'0.72rem', color:'var(--text-primary)' }}>{t.price ? (t.symbol.startsWith('^') ? Number(t.price).toLocaleString() : `$${t.price}`) : '—'}</span>
              {t.pct !== null && <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:'0.65rem', color:t.up ? 'var(--accent-green)' : 'var(--accent-iron)', display:'flex', alignItems:'center', gap:1 }}>{t.up ? <TrendingUp size={9}/> : <TrendingDown size={9}/>}{t.up?'+':''}{t.pct}%</span>}
            </div>
          ))}
        </div>
      )}

      {/* HEADER — safe-area top padding for Dynamic Island / notch */}
      <header style={{
        display:'flex', alignItems:'center',
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingLeft: `max(env(safe-area-inset-left,1.2rem),1.2rem)`,
        paddingRight: `max(env(safe-area-inset-right,1.2rem),1.2rem)`,
        paddingBottom: 0,
        minHeight: 56,
        borderBottom:'1px solid var(--border-dim)',
        background:'var(--bg-panel)',
        flexShrink:0, gap:'0.8rem', zIndex:10,
      }}>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', flexShrink:0 }}>
          <Zap size={14} style={{ color:'var(--accent-bright)' }} />
          <span style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700, fontSize:'1rem', letterSpacing:'0.25em', color:'var(--accent-bright)', textShadow:'0 0 12px rgba(64,224,255,0.35)', whiteSpace:'nowrap' }}>J.A.R.V.I.S.</span>
        </div>

        {/* Center */}
        <div style={{ flex:1, textAlign:'center', minWidth:0 }}>
          {/* Desktop: full clock + world clocks */}
          <div className="hide-mobile">
            <div style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700, fontSize:'1.6rem', color:'var(--accent-cyan)', letterSpacing:'0.06em', lineHeight:1 }}>
              {timeStr} <span style={{ fontSize:'0.7rem', color:'var(--text-muted)', letterSpacing:'0.1em' }}>MT</span>
            </div>
            <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:'0.58rem', color:'var(--text-muted)', letterSpacing:'0.08em', marginTop:2 }}>{dateStr.toUpperCase()}</div>
            <div style={{ display:'flex', justifyContent:'center', gap:'1rem', marginTop:'0.2rem' }}>
              {ZONES.map(z => (
                <div key={z.label} style={{ display:'flex', gap:'0.3rem', alignItems:'center' }}>
                  <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:'0.58rem', color:'var(--text-muted)' }}>{z.label}</span>
                  <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:'0.62rem', color:'var(--text-secondary)' }}>
                    {time.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true, timeZone:z.tz })}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* Mobile: compact clock */}
          <div className="mobile-only" style={{ display:'none' }}>
            <div style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700, fontSize:'1.45rem', color:'var(--accent-cyan)', lineHeight:1 }}>
              {timeStr} <span style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>MT</span>
            </div>
            <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:'0.56rem', color:'var(--text-muted)', letterSpacing:'0.06em' }}>
              {time.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',timeZone:'America/Denver'}).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Desktop right controls */}
        <div className="hide-mobile" style={{ display:'flex', alignItems:'center', gap:'0.65rem', flexShrink:0 }}>
          <button onClick={handleAcceptKate} style={{ background:'transparent', border:'1px solid var(--border-dim)', borderRadius:1, cursor:'pointer', padding:'0.28rem 0.55rem', display:'flex', alignItems:'center', gap:'0.3rem', color:'var(--text-muted)', fontFamily:'Rajdhani,sans-serif', fontSize:'0.68rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', whiteSpace:'nowrap', transition:'all 0.2s' }}
            onMouseEnter={e=>{e.currentTarget.style.color='var(--accent-green)';e.currentTarget.style.borderColor='var(--accent-green)'}}
            onMouseLeave={e=>{e.currentTarget.style.color='var(--text-muted)';e.currentTarget.style.borderColor='var(--border-dim)'}}>
            <CheckCircle size={11}/>{kateMsg||'Kate Invites'}
          </button>
          <MicBtn size={38}/>
          <button onClick={()=>setLightMode(l=>!l)} style={{ background:'transparent', border:'1px solid var(--border-dim)', borderRadius:'50%', width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)', flexShrink:0 }}>
            {lightMode?<Moon size={13}/>:<Sun size={13}/>}
          </button>
          <button onClick={()=>speak('Refreshing all systems, sir.')} className="btn btn-amber" style={{ padding:'0.28rem 0.7rem', display:'flex', alignItems:'center', gap:'0.3rem' }}>
            <RefreshCw size={11}/>Refresh
          </button>
          <button onClick={onLogout} className="btn btn-ghost" style={{ display:'flex', alignItems:'center', gap:'0.3rem' }}><LogOut size={11}/></button>
        </div>

        {/* Mobile controls: mic + hamburger */}
        <div className="mobile-only" style={{ display:'flex', alignItems:'center', gap:'0.55rem', flexShrink:0 }}>
          <MicBtn size={36}/>
          <button onClick={()=>setMenuOpen(true)} style={{ background:'transparent', border:'1px solid var(--border-dim)', borderRadius:2, cursor:'pointer', padding:'0.38rem', display:'flex', color:'var(--text-secondary)', WebkitTapHighlightColor:'transparent' }}>
            <Menu size={19}/>
          </button>
        </div>
      </header>

      {/* GREETING STRIP */}
      <div style={{ background:'rgba(0,0,0,0.2)', borderBottom:'1px solid var(--border-dim)', padding:'0.4rem max(env(safe-area-inset-left,1rem),1rem)', display:'flex', alignItems:'center', gap:'0.6rem', flexShrink:0 }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:isSpeaking?'var(--accent-green)':'var(--text-muted)', boxShadow:isSpeaking?'var(--glow-green)':'none', flexShrink:0, transition:'all 0.3s' }}/>
        <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:'0.88rem', color:isSpeaking?'var(--accent-bright)':'var(--text-secondary)', letterSpacing:'0.04em', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', transition:'color 0.3s' }}>
          {`${greeting}, ${firstName}. Here's a look at what's on your radar. I'm here to assist.`}
        </div>
      </div>

      {/* MAIN GRID — scrollable area */}
      <div className="dash-grid" style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'0.65rem max(env(safe-area-inset-right,0.65rem),0.65rem) 0.65rem max(env(safe-area-inset-left,0.65rem),0.65rem)', WebkitOverflowScrolling:'touch', minHeight:0 }}>
        <div style={{ gridArea:'w'    }}><WeatherPanel  onWeatherLoad={setWeather} /></div>
        <div style={{ gridArea:'c'    }}><CalendarPanel onDataLoad={setLiveEvents} /></div>
        <div style={{ gridArea:'g'    }}><GmailPanel    onDataLoad={setLiveEmails} /></div>
        <div style={{ gridArea:'t'    }}><TasksPanel    onTasksChange={setTasks}   /></div>
        <div style={{ gridArea:'n'    }}><NotesPanel    onNotesChange={setNotes}   /></div>
        <div style={{ gridArea:'news' }}><NewsPanel /></div>
        <div style={{ gridArea:'tr'   }}><TravelPanel /></div>
      </div>

      {/* JARVIS BAR — safe area bottom */}
      <JarvisBar
        isListening={isListening} isSpeaking={isSpeaking} isThinking={isThinking}
        lastTranscript={lastTranscript} onStopSpeaking={stopSpeaking}
        voiceReady={voiceReady} sendMessage={sendMessage}
      />
    </div>
  )
}
