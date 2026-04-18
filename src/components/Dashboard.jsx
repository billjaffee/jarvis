import { useState, useEffect } from 'react'
import { LogOut, RefreshCw, Zap, TrendingUp, TrendingDown, Sun, Moon, CheckCircle, Menu, X } from 'lucide-react'
import { useJarvisVoice, getGreeting } from '../hooks/useJarvisVoice'
import { MOCK_EMAILS, MOCK_EVENTS } from '../data/mockData'
import WeatherPanel from './panels/WeatherPanel'
import CalendarPanel from './panels/CalendarPanel'
import GmailPanel from './panels/GmailPanel'
import TasksPanel from './panels/TasksPanel'
import NotesPanel from './panels/NotesPanel'
import NewsPanel from './panels/NewsPanel'
import TravelPanel from './panels/TravelPanel'
import JarvisBar from './JarvisBar'
import VoiceOrb from './VoiceOrb'

const ZONES = [
  { label: 'NYC',  tz: 'America/New_York' },
  { label: 'MPLS', tz: 'America/Chicago' },
  { label: 'LA',   tz: 'America/Los_Angeles' },
]

export default function Dashboard({ user, onLogout }) {
  const firstName  = user?.user_metadata?.full_name?.split(' ')[0] || 'Mr. Jaffee'

  const [weather, setWeather]           = useState(null)
  const [tasks, setTasks]               = useState([])
  const [notes, setNotes]               = useState('')
  const [liveEmails, setLiveEmails]     = useState([])
  const [liveEvents, setLiveEvents]     = useState([])
  const [tickers, setTickers]           = useState([])
  const [time, setTime]                 = useState(new Date())
  const [greeted, setGreeted]           = useState(false)
  const [lightMode, setLightMode]       = useState(false)
  const [showOrb, setShowOrb]           = useState(false)
  const [menuOpen, setMenuOpen]         = useState(false)
  const [acceptingKate, setAcceptingKate] = useState(false)
  const [kateMsg, setKateMsg]           = useState('')

  const {
    speak, stopSpeaking, isSpeaking,
    startListening, stopListening, isListening,
    isThinking, lastTranscript, lastResponse,
    voiceReady, history, setContext,
  } = useJarvisVoice()

  // Clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Greeting
  useEffect(() => {
    if (!greeted && voiceReady) {
      const timer = setTimeout(() => { speak(getGreeting(firstName)); setGreeted(true) }, 900)
      return () => clearTimeout(timer)
    }
  }, [voiceReady, greeted, firstName, speak])

  // Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', lightMode ? 'light' : 'dark')
  }, [lightMode])

  // Orb visibility
  useEffect(() => {
    if (isListening || isSpeaking || isThinking) setShowOrb(true)
    else setTimeout(() => setShowOrb(false), 300)
  }, [isListening, isSpeaking, isThinking])

  // Keep AI context updated
  useEffect(() => {
    setContext({ weather, events: liveEvents, emails: liveEmails, tasks, notes, tickers })
  })

  // Stocks
  useEffect(() => {
    const go = async () => {
      try { const r = await fetch('/.netlify/functions/stock-fetch'); if (r.ok) setTickers(await r.json()) } catch {}
    }
    go()
    const t = setInterval(go, 60000)
    return () => clearInterval(t)
  }, [])

  const handleMicClick = () => {
    if (isListening) stopListening()
    else startListening()
  }

  const handleAcceptKate = async () => {
    setAcceptingKate(true)
    try {
      const res  = await fetch('/.netlify/functions/calendar-accept', { method: 'POST' })
      const data = await res.json()
      const msg  = data.count > 0 ? `Accepted ${data.count} invite${data.count > 1 ? 's' : ''} from Kate` : 'No pending invites from Kate'
      setKateMsg(msg)
      if (data.count > 0) speak(`Done. I've accepted ${data.count} calendar invite${data.count > 1 ? 's' : ''} from Kate.`)
    } catch { setKateMsg('Could not check invites') }
    finally { setAcceptingKate(false); setTimeout(() => setKateMsg(''), 4000) }
  }

  const timeStr = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Denver' })
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/Denver' })
  const hour    = parseInt(time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/Denver' }))
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Mic button (reused in desktop header + mobile menu)
  const MicBtn = ({ size = 40 }) => (
    <button onClick={handleMicClick} disabled={isSpeaking}
      title={isListening ? 'Listening... tap to stop' : 'Speak to Jarvis'}
      style={{ width:size, height:size, borderRadius:'50%', border:`2px solid ${isListening ? 'var(--accent-green)' : 'var(--accent-cyan)'}`, background: isListening ? 'rgba(0,232,152,0.15)' : 'rgba(0,200,240,0.1)', cursor: isSpeaking ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', color: isListening ? 'var(--accent-green)' : 'var(--accent-cyan)', transition:'all 0.25s', opacity: isSpeaking ? 0.4 : 1, animation: isListening ? 'mic-pulse-listening 1.2s ease-out infinite' : 'mic-pulse 2.5s ease-out infinite', flexShrink:0 }}>
      <svg width={size * 0.4} height={size * 0.4} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
    </button>
  )

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', background:'var(--bg-root)', overflow:'hidden' }}>

      <style>{`
        [data-theme="light"] { --bg-root:#e8f2f8; --bg-panel:#ffffff; --bg-panel-alt:#f0f7fb; --bg-hover:#e0eef6; --accent-blue:#0070aa; --accent-cyan:#0090c0; --accent-bright:#0078a8; --accent-green:#008855; --accent-green-dim:#006640; --text-primary:#0a1e2d; --text-secondary:#1a5070; --text-muted:#4a7a95; --border-dim:rgba(0,110,160,0.2); --border-mid:rgba(0,140,190,0.38); --glow-sm:0 1px 6px rgba(0,0,0,0.09); --glow-md:0 4px 18px rgba(0,0,0,0.13); --glow-green:0 0 8px rgba(0,136,85,0.3); }
        [data-theme="light"] body { background:#e8f2f8; }
        [data-theme="light"] body::before { background-image:linear-gradient(rgba(0,110,160,0.06) 1px,transparent 1px),linear-gradient(90deg,rgba(0,110,160,0.06) 1px,transparent 1px); background-size:44px 44px; }
        [data-theme="light"] body::after { display:none; }
        [data-theme="light"] .hud-panel { box-shadow:0 2px 12px rgba(0,0,0,0.08); }
        @keyframes mic-pulse { 0%{box-shadow:0 0 0 0 rgba(0,200,240,0.5)} 70%{box-shadow:0 0 0 14px rgba(0,200,240,0)} 100%{box-shadow:0 0 0 0 rgba(0,200,240,0)} }
        @keyframes mic-pulse-listening { 0%{box-shadow:0 0 0 0 rgba(0,232,152,0.6)} 70%{box-shadow:0 0 0 18px rgba(0,232,152,0)} 100%{box-shadow:0 0 0 0 rgba(0,232,152,0)} }
        @keyframes sonar { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(2.8);opacity:0} }
        @keyframes spin { to{transform:rotate(360deg)} }

        /* Mobile menu overlay */
        .mobile-menu { position:fixed; inset:0; z-index:8000; background:rgba(1,10,20,0.97); backdrop-filter:blur(16px); display:flex; flex-direction:column; padding:2rem; gap:1.2rem; }
        .mobile-menu-btn { background:transparent; border:1px solid var(--border-mid); border-radius:4px; color:var(--text-primary); font-family:'Rajdhani',sans-serif; font-size:1.1rem; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; padding:0.9rem 1.2rem; cursor:pointer; display:flex; align-items:center; gap:0.8rem; transition:all 0.2s; }
        .mobile-menu-btn:hover { background:rgba(0,200,240,0.1); border-color:var(--accent-cyan); color:var(--accent-cyan); }

        /* ── DESKTOP GRID ── */
        .dashboard-grid {
          display: grid; gap: 0.7rem;
          grid-template-columns: repeat(12, 1fr);
          grid-template-rows: minmax(200px,1fr) minmax(240px,1fr) minmax(110px,auto);
          grid-template-areas:
            "weather weather weather calendar calendar calendar gmail gmail gmail gmail gmail gmail"
            "tasks tasks tasks tasks notes notes notes news news news news news"
            "travel travel travel travel travel travel travel travel travel travel travel travel";
        }

        /* ── TABLET ── */
        @media (max-width: 1024px) and (min-width: 601px) {
          .dashboard-grid {
            grid-template-columns: 1fr 1fr !important;
            grid-template-rows: auto !important;
            grid-template-areas:
              "weather calendar"
              "gmail gmail"
              "tasks notes"
              "news news"
              "travel travel" !important;
          }
        }

        /* ── MOBILE ── */
        @media (max-width: 600px) {
          .dashboard-grid {
            grid-template-columns: 1fr !important;
            grid-template-rows: auto !important;
            grid-template-areas:
              "weather"
              "calendar"
              "gmail"
              "tasks"
              "notes"
              "news"
              "travel" !important;
          }
          .dashboard-grid > div { min-height: 280px; }
          .dashboard-grid > div:last-child { min-height: 140px; }
        }
      `}</style>

      {/* ── VOICE ORB ── */}
      {showOrb && (
        <VoiceOrb
          isListening={isListening} isSpeaking={isSpeaking}
          isThinking={isThinking} lastTranscript={lastTranscript}
          lastResponse={lastResponse} history={history}
          onClose={stopListening}
        />
      )}

      {/* ── MOBILE MENU ── */}
      {menuOpen && (
        <div className="mobile-menu">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
            <span style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700, fontSize:'1.3rem', letterSpacing:'0.25em', color:'var(--accent-bright)' }}>J.A.R.V.I.S.</span>
            <button onClick={() => setMenuOpen(false)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:'0.4rem' }}><X size={22} /></button>
          </div>
          <div style={{ borderBottom:'1px solid var(--border-dim)', marginBottom:'0.5rem' }} />

          <button className="mobile-menu-btn" onClick={() => { handleAcceptKate(); setMenuOpen(false) }}>
            <CheckCircle size={18} /> {acceptingKate ? 'Checking...' : kateMsg || 'Accept Kate\'s Invites'}
          </button>
          <button className="mobile-menu-btn" onClick={() => { setLightMode(l => !l); setMenuOpen(false) }}>
            {lightMode ? <Moon size={18} /> : <Sun size={18} />} {lightMode ? 'Dark Mode' : 'Light Mode'}
          </button>
          <button className="mobile-menu-btn" onClick={() => { speak('Refreshing all systems.'); setMenuOpen(false) }}>
            <RefreshCw size={18} /> Refresh
          </button>
          <button className="mobile-menu-btn" onClick={() => { onLogout(); setMenuOpen(false) }} style={{ color:'var(--accent-iron)', borderColor:'rgba(224,92,32,0.3)' }}>
            <LogOut size={18} /> Sign Out
          </button>

          <div style={{ marginTop:'auto', textAlign:'center' }}>
            <MicBtn size={64} />
            <div style={{ marginTop:'0.6rem', fontFamily:'Share Tech Mono,monospace', fontSize:'0.72rem', color:'var(--text-muted)', letterSpacing:'0.15em' }}>
              {isListening ? 'LISTENING...' : isThinking ? 'THINKING...' : 'TAP TO SPEAK'}
            </div>
          </div>
        </div>
      )}

      {/* ── TICKER BAR ── */}
      {tickers.length > 0 && (
        <div style={{ background:'rgba(0,0,0,0.5)', borderBottom:'1px solid var(--border-dim)', padding:'0 0.8rem', height:30, display:'flex', alignItems:'center', gap:'1.2rem', overflowX:'auto', flexShrink:0, WebkitOverflowScrolling:'touch' }}>
          {tickers.map(t => (
            <div key={t.symbol} style={{ display:'flex', alignItems:'center', gap:'0.4rem', flexShrink:0 }}>
              <span style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700, fontSize:'0.75rem', letterSpacing:'0.1em', color:'var(--accent-cyan)' }}>{t.label}</span>
              <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:'0.75rem', color:'var(--text-primary)' }}>
                {t.price ? (t.symbol.startsWith('^') ? Number(t.price).toLocaleString() : `$${t.price}`) : '—'}
              </span>
              {t.pct !== null && (
                <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:'0.68rem', color: t.up ? 'var(--accent-green)' : 'var(--accent-iron)', display:'flex', alignItems:'center', gap:2 }}>
                  {t.up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                  {t.up ? '+' : ''}{t.pct}%
                </span>
              )}
            </div>
          ))}
          <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:'0.62rem', color:'var(--text-muted)', marginLeft:'auto', flexShrink:0 }}>{timeStr} MT</span>
        </div>
      )}

      {/* ── DESKTOP HEADER ── */}
      <header style={{ display:'flex', alignItems:'center', padding:'0 1.2rem', height:58, borderBottom:'1px solid var(--border-dim)', background:'var(--bg-panel)', backdropFilter:'blur(8px)', flexShrink:0, gap:'1rem', zIndex:10 }}>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexShrink:0 }}>
          <Zap size={15} style={{ color:'var(--accent-bright)' }} />
          <span style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700, fontSize:'1.05rem', letterSpacing:'0.25em', color:'var(--accent-bright)', textShadow:'0 0 14px rgba(64,224,255,0.35)' }}>J.A.R.V.I.S.</span>
        </div>

        {/* Center: Big clock + world clocks (hidden on mobile) */}
        <div style={{ flex:1, textAlign:'center' }} className="hide-mobile">
          <div style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700, fontSize:'1.65rem', color:'var(--accent-cyan)', letterSpacing:'0.06em', lineHeight:1 }}>
            {timeStr} <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', letterSpacing:'0.1em' }}>MT</span>
          </div>
          <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:'0.6rem', color:'var(--text-muted)', letterSpacing:'0.08em', marginTop:2 }}>{dateStr.toUpperCase()}</div>
          <div style={{ display:'flex', justifyContent:'center', gap:'1.2rem', marginTop:'0.2rem' }}>
            {ZONES.map(z => (
              <div key={z.label} style={{ display:'flex', gap:'0.3rem', alignItems:'center' }}>
                <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:'0.6rem', color:'var(--text-muted)' }}>{z.label}</span>
                <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:'0.65rem', color:'var(--text-secondary)' }}>
                  {time.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true, timeZone:z.tz })}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: time only (centered) */}
        <div style={{ flex:1, textAlign:'center' }} className="mobile-only">
          <div style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700, fontSize:'1.5rem', color:'var(--accent-cyan)', lineHeight:1 }}>
            {timeStr} <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>MT</span>
          </div>
          <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:'0.58rem', color:'var(--text-muted)' }}>
            {time.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', timeZone:'America/Denver' }).toUpperCase()}
          </div>
        </div>

        {/* Desktop right controls */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.7rem', flexShrink:0 }} className="hide-mobile">
          <button onClick={handleAcceptKate} disabled={acceptingKate} title="Accept Kate's invites"
            style={{ background:'transparent', border:'1px solid var(--border-dim)', borderRadius:1, cursor:'pointer', padding:'0.3rem 0.6rem', display:'flex', alignItems:'center', gap:'0.3rem', color:'var(--text-muted)', fontFamily:'Rajdhani,sans-serif', fontSize:'0.7rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', transition:'all 0.2s', whiteSpace:'nowrap' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent-green)'; e.currentTarget.style.color='var(--accent-green)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border-dim)'; e.currentTarget.style.color='var(--text-muted)' }}>
            <CheckCircle size={11} />
            {kateMsg || 'Kate Invites'}
          </button>

          <MicBtn size={40} />

          <button onClick={() => setLightMode(l=>!l)} title={lightMode ? 'Dark mode' : 'Light mode'}
            style={{ background:'transparent', border:'1px solid var(--border-dim)', borderRadius:'50%', width:34, height:34, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)', transition:'all 0.2s', flexShrink:0 }}>
            {lightMode ? <Moon size={14} /> : <Sun size={14} />}
          </button>

          <button onClick={() => speak('Refreshing all systems.')} className="btn btn-amber"
            style={{ padding:'0.3rem 0.75rem', display:'flex', alignItems:'center', gap:'0.35rem' }}>
            <RefreshCw size={12} /> Refresh
          </button>

          <button onClick={onLogout} className="btn btn-ghost" style={{ display:'flex', alignItems:'center', gap:'0.3rem' }}>
            <LogOut size={12} />
          </button>
        </div>

        {/* Mobile: mic + hamburger */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', flexShrink:0 }} className="mobile-only">
          <MicBtn size={38} />
          <button onClick={() => setMenuOpen(true)}
            style={{ background:'transparent', border:'1px solid var(--border-dim)', borderRadius:2, cursor:'pointer', padding:'0.4rem', display:'flex', color:'var(--text-secondary)' }}>
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* ── GREETING STRIP ── */}
      <div style={{ background:'rgba(0,0,0,0.2)', borderBottom:'1px solid var(--border-dim)', padding:'0.45rem 1rem', display:'flex', alignItems:'center', gap:'0.6rem', flexShrink:0 }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background: isSpeaking ? 'var(--accent-green)' : 'var(--text-muted)', boxShadow: isSpeaking ? 'var(--glow-green)' : 'none', flexShrink:0, transition:'all 0.3s' }} />
        <div style={{ fontFamily:'Rajdhani,sans-serif', fontSize:'0.88rem', color: isSpeaking ? 'var(--accent-bright)' : 'var(--text-secondary)', letterSpacing:'0.04em', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', transition:'color 0.3s' }}>
          {`${greeting}, ${firstName}. Here's a look at what's on your radar. I'm here to assist.`}
        </div>
        {lastTranscript && (
          <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:'0.65rem', color:'var(--text-muted)', fontStyle:'italic', flexShrink:0, maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            "{lastTranscript}"
          </span>
        )}
      </div>

      {/* ── MAIN GRID ── */}
      <div className="dashboard-grid" style={{ flex:1, overflowY:'auto', padding:'0.7rem', WebkitOverflowScrolling:'touch' }}>
        <div style={{ gridArea:'weather'  }}><WeatherPanel onWeatherLoad={setWeather} /></div>
        <div style={{ gridArea:'calendar' }}><CalendarPanel onDataLoad={setLiveEvents} /></div>
        <div style={{ gridArea:'gmail'    }}><GmailPanel onDataLoad={setLiveEmails} /></div>
        <div style={{ gridArea:'tasks'    }}><TasksPanel onTasksChange={setTasks} /></div>
        <div style={{ gridArea:'notes'    }}><NotesPanel onNotesChange={setNotes} /></div>
        <div style={{ gridArea:'news'     }}><NewsPanel /></div>
        <div style={{ gridArea:'travel'   }}><TravelPanel /></div>
      </div>

      <JarvisBar isListening={isListening} isSpeaking={isSpeaking} lastTranscript={lastTranscript} onStopSpeaking={stopSpeaking} voiceReady={voiceReady} />
    </div>
  )
}
