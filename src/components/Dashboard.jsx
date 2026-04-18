import { useState, useEffect, useCallback } from 'react'
import { LogOut, RefreshCw, Zap, TrendingUp, TrendingDown, Sun, Moon } from 'lucide-react'
import { useJarvisVoice, getGreeting } from '../hooks/useJarvisVoice'
import { MOCK_EMAILS, MOCK_EVENTS } from '../data/mockData'
import WeatherPanel from './panels/WeatherPanel'
import CalendarPanel from './panels/CalendarPanel'
import GmailPanel from './panels/GmailPanel'
import TasksPanel from './panels/TasksPanel'
import NotesPanel from './panels/NotesPanel'
import NewsPanel from './panels/NewsPanel'
import JarvisBar from './JarvisBar'

export default function Dashboard({ user, onLogout }) {
  const firstName   = user?.user_metadata?.full_name?.split(' ')[0] || 'Mr. Jaffee'
  const displayName = user?.user_metadata?.full_name || 'Bill Jaffee'

  const [weather, setWeather]         = useState(null)
  const [tasks, setTasks]             = useState([])
  const [notes, setNotes]             = useState('')
  const [liveEmails, setLiveEmails]   = useState([])
  const [liveEvents, setLiveEvents]   = useState([])
  const [tickers, setTickers]         = useState([])
  const [time, setTime]               = useState(new Date())
  const [greeted, setGreeted]         = useState(false)
  const [lightMode, setLightMode]     = useState(false)

  const { speak, stopSpeaking, isSpeaking, startListening, stopListening, isListening, lastTranscript, voiceReady } = useJarvisVoice()

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

  // Theme toggle — apply to root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', lightMode ? 'light' : 'dark')
  }, [lightMode])

  // Stocks
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const res = await fetch('/.netlify/functions/stock-fetch')
        if (res.ok) { const data = await res.json(); setTickers(data) }
      } catch {}
    }
    fetchStocks()
    const interval = setInterval(fetchStocks, 60000)
    return () => clearInterval(interval)
  }, [])

  const commandContext = {
    weather, events: liveEvents,
    emailCount:  liveEmails.filter(e => e.unread).length,
    flaggedCount: liveEmails.filter(e => e.flagged).length,
    tasks, notes,
    addTask: (text) => window.__jarvisAddTask?.(text),
  }

  const handleMicClick = () => {
    if (isListening) stopListening()
    else startListening(commandContext)
  }

  const handleRefresh = () => {
    speak('Refreshing all systems, ' + firstName + '. Stand by.')
    setTimeout(() => speak('Refresh complete.'), 2000)
  }

  const timeStr = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Denver' })
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/Denver' })
  const hour = parseInt(time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: false, timeZone: 'America/Denver' }))
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-root)', overflow: 'hidden' }}>

      <style>{`
        /* ── LIGHT MODE OVERRIDES ── */
        [data-theme="light"] {
          --bg-root:        #eef4f8;
          --bg-panel:       #ffffff;
          --bg-panel-alt:   #f5f9fc;
          --bg-hover:       #e8f2f8;
          --accent-blue:    #0070aa;
          --accent-cyan:    #0095cc;
          --accent-bright:  #0080bb;
          --accent-green:   #00966a;
          --accent-green-dim:#007a55;
          --text-primary:   #0d2233;
          --text-secondary: #2a5570;
          --text-muted:     #7aaabb;
          --border-dim:     rgba(0, 120, 180, 0.18);
          --border-mid:     rgba(0, 150, 200, 0.35);
          --border-bright:  rgba(0, 120, 180, 0.6);
          --glow-sm:        0 1px 4px rgba(0,0,0,0.08);
          --glow-md:        0 4px 16px rgba(0,0,0,0.12);
          --glow-btn:       0 2px 8px rgba(0,120,180,0.25);
          --glow-green:     0 0 8px rgba(0,150,106,0.3);
        }
        [data-theme="light"] body { background: #eef4f8; }
        [data-theme="light"] body::before { background-image: linear-gradient(rgba(0,120,180,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,120,180,0.05) 1px, transparent 1px); background-size: 44px 44px; }
        [data-theme="light"] body::after { display: none; }
        [data-theme="light"] .hud-panel { box-shadow: 0 2px 12px rgba(0,0,0,0.08); }

        /* ── MIC PULSE ANIMATION ── */
        @keyframes mic-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(0,200,240,0.5); }
          70%  { box-shadow: 0 0 0 14px rgba(0,200,240,0); }
          100% { box-shadow: 0 0 0 0 rgba(0,200,240,0); }
        }
        @keyframes mic-pulse-listening {
          0%   { box-shadow: 0 0 0 0 rgba(0,232,152,0.6); }
          70%  { box-shadow: 0 0 0 18px rgba(0,232,152,0); }
          100% { box-shadow: 0 0 0 0 rgba(0,232,152,0); }
        }
        @keyframes sonar {
          0%   { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── TICKER BAR ── */}
      {tickers.length > 0 && (
        <div style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid var(--border-dim)', padding: '0 1rem', height: 30, display: 'flex', alignItems: 'center', gap: '2rem', overflowX: 'auto', flexShrink: 0 }}>
          {tickers.map(t => (
            <div key={t.symbol} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.1em', color: 'var(--accent-cyan)' }}>{t.label}</span>
              <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.7rem', color: 'var(--text-primary)' }}>
                {t.price ? (t.symbol.startsWith('^') ? Number(t.price).toLocaleString() : `$${t.price}`) : '—'}
              </span>
              {t.pct !== null && (
                <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.62rem', color: t.up ? 'var(--accent-green)' : '#e05c20', display: 'flex', alignItems: 'center', gap: 2 }}>
                  {t.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {t.up ? '+' : ''}{t.pct}%
                </span>
              )}
            </div>
          ))}
          <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.55rem', color: 'var(--text-muted)', marginLeft: 'auto', flexShrink: 0 }}>{timeStr} MT</span>
        </div>
      )}

      {/* ── HEADER ── */}
      <header style={{ display: 'flex', alignItems: 'center', padding: '0 1.2rem', height: 54, borderBottom: '1px solid var(--border-dim)', background: 'var(--bg-panel)', backdropFilter: 'blur(8px)', flexShrink: 0, gap: '1rem', zIndex: 10 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 'max-content' }}>
          <Zap size={16} style={{ color: 'var(--accent-bright)' }} />
          <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.28em', color: 'var(--accent-bright)', textShadow: '0 0 14px rgba(64,224,255,0.35)' }}>
            J.A.R.V.I.S.
          </span>
        </div>

        {/* Center: Date/Time */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '1.2rem', color: 'var(--accent-cyan)', letterSpacing: '0.08em', lineHeight: 1 }}>{timeStr}</div>
          <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginTop: 2 }}>{dateStr.toUpperCase()}</div>
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', minWidth: 'max-content' }}>

          {/* ── CIRCULAR PULSING MIC ── */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button
              onClick={handleMicClick}
              disabled={isSpeaking}
              title={isListening ? 'Listening... click to stop' : 'Speak to Jarvis'}
              style={{
                width: 40, height: 40,
                borderRadius: '50%',
                border: `2px solid ${isListening ? 'var(--accent-green)' : 'var(--accent-cyan)'}`,
                background: isListening
                  ? 'rgba(0,232,152,0.15)'
                  : 'rgba(0,200,240,0.1)',
                cursor: isSpeaking ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isListening ? 'var(--accent-green)' : 'var(--accent-cyan)',
                transition: 'all 0.25s',
                opacity: isSpeaking ? 0.4 : 1,
                animation: isListening
                  ? 'mic-pulse-listening 1.2s ease-out infinite'
                  : 'mic-pulse 2.5s ease-out infinite',
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
          </div>

          {/* Theme toggle */}
          <button
            onClick={() => setLightMode(l => !l)}
            title={lightMode ? 'Switch to dark mode' : 'Switch to light mode'}
            style={{ background: 'transparent', border: '1px solid var(--border-dim)', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', transition: 'all 0.2s', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-mid)'; e.currentTarget.style.color = 'var(--accent-cyan)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-dim)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            {lightMode ? <Moon size={14} /> : <Sun size={14} />}
          </button>

          {/* Refresh */}
          <button onClick={handleRefresh} disabled={isSpeaking} className="btn btn-amber"
            style={{ padding: '0.3rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <RefreshCw size={12} />
            <span>Refresh</span>
          </button>

          {/* Logout */}
          <button onClick={onLogout} className="btn btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }} title="Log out">
            <LogOut size={12} />
          </button>
        </div>
      </header>

      {/* ── GREETING STRIP ── */}
      <div style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid var(--border-dim)', padding: '0.45rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: isSpeaking ? 'var(--accent-green)' : 'var(--text-muted)', boxShadow: isSpeaking ? 'var(--glow-green)' : 'none', flexShrink: 0, transition: 'all 0.3s' }} />
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.82rem', color: isSpeaking ? 'var(--accent-bright)' : 'var(--text-secondary)', letterSpacing: '0.04em', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.3s' }}>
          {`${greeting}, ${firstName}. Here's a look at what's on your radar. I'm here to assist.`}
        </div>
        {lastTranscript && (
          <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.62rem', color: 'var(--text-muted)', fontStyle: 'italic', flexShrink: 0 }}>"{lastTranscript}"</span>
        )}
      </div>

      {/* ── MAIN GRID ── */}
      {/* Tasks and Email SWAPPED vs previous version */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0.8rem', display: 'grid', gap: '0.8rem',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gridTemplateRows: 'minmax(220px, 1fr) minmax(260px, 1fr)',
        gridTemplateAreas: `
          "weather weather weather calendar calendar calendar calendar calendar gmail gmail gmail gmail"
          "tasks tasks tasks tasks notes notes notes news news news news news"
        `,
      }} className="dashboard-grid">
        <style>{`
          .dashboard-grid > div { min-height: 0; }
          @media (max-width: 900px) {
            .dashboard-grid {
              grid-template-columns: 1fr 1fr !important;
              grid-template-rows: auto !important;
              grid-template-areas:
                "weather calendar"
                "gmail gmail"
                "tasks tasks"
                "notes news" !important;
            }
          }
          @media (max-width: 600px) {
            .dashboard-grid {
              grid-template-columns: 1fr !important;
              grid-template-areas: "weather" "calendar" "gmail" "tasks" "notes" "news" !important;
            }
          }
        `}</style>

        <div style={{ gridArea: 'weather'  }}><WeatherPanel onWeatherLoad={setWeather} /></div>
        <div style={{ gridArea: 'calendar' }}><CalendarPanel onDataLoad={setLiveEvents} /></div>
        <div style={{ gridArea: 'gmail'    }}><GmailPanel onDataLoad={setLiveEmails} /></div>
        <div style={{ gridArea: 'tasks'    }}><TasksPanel onTasksChange={setTasks} /></div>
        <div style={{ gridArea: 'notes'    }}><NotesPanel onNotesChange={setNotes} /></div>
        <div style={{ gridArea: 'news'     }}><NewsPanel /></div>
      </div>

      {/* ── STATUS BAR ── */}
      <JarvisBar
        isListening={isListening}
        isSpeaking={isSpeaking}
        lastTranscript={lastTranscript}
        onStopSpeaking={stopSpeaking}
        voiceReady={voiceReady}
      />
    </div>
  )
}
