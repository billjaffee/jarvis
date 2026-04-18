import { useState, useEffect, useCallback } from 'react'
import { LogOut, RefreshCw, Zap, Mic, MicOff, TrendingUp, TrendingDown } from 'lucide-react'
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
  const firstName  = user?.user_metadata?.full_name?.split(' ')[0] || 'Mr. Jaffee'
  const displayName = user?.user_metadata?.full_name || 'Bill Jaffee'

  const [weather, setWeather]       = useState(null)
  const [tasks, setTasks]           = useState([])
  const [notes, setNotes]           = useState('')
  const [liveEmails, setLiveEmails] = useState([])
  const [liveEvents, setLiveEvents] = useState([])
  const [tickers, setTickers]       = useState([])
  const [time, setTime]             = useState(new Date())
  const [greeted, setGreeted]       = useState(false)

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

  // Stocks
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const res = await fetch('/.netlify/functions/stock-fetch')
        if (res.ok) { const data = await res.json(); setTickers(data) }
      } catch {}
    }
    fetchStocks()
    const interval = setInterval(fetchStocks, 60000) // refresh every minute
    return () => clearInterval(interval)
  }, [])

  const commandContext = {
    weather, events: liveEvents,
    emailCount: liveEmails.filter(e => e.unread).length,
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

      {/* ── TICKER BAR ── */}
      {tickers.length > 0 && (
        <div style={{ background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid var(--border-dim)', padding: '0 1rem', height: 32, display: 'flex', alignItems: 'center', gap: '2rem', overflowX: 'auto', flexShrink: 0 }}>
          {tickers.map(t => (
            <div key={t.symbol} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
              <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.1em', color: 'var(--accent-cyan)' }}>{t.label}</span>
              <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.72rem', color: 'var(--text-primary)' }}>
                {t.price ? (t.symbol.startsWith('^') ? Number(t.price).toLocaleString() : `$${t.price}`) : '—'}
              </span>
              {t.pct !== null && (
                <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.65rem', color: t.up ? 'var(--accent-green)' : 'var(--accent-iron)', display: 'flex', alignItems: 'center', gap: 2 }}>
                  {t.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {t.up ? '+' : ''}{t.pct}%
                </span>
              )}
            </div>
          ))}
          <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.55rem', color: 'var(--text-muted)', marginLeft: 'auto', flexShrink: 0 }}>
            {timeStr} MT
          </span>
        </div>
      )}

      {/* ── HEADER ── */}
      <header style={{ display: 'flex', alignItems: 'center', padding: '0 1.2rem', height: 52, borderBottom: '1px solid var(--border-dim)', background: 'rgba(1,10,20,0.9)', backdropFilter: 'blur(8px)', flexShrink: 0, gap: '1rem', position: 'relative', zIndex: 10 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 'max-content' }}>
          <Zap size={16} style={{ color: 'var(--accent-bright)' }} />
          <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.28em', color: 'var(--accent-bright)', textShadow: '0 0 14px rgba(64,224,255,0.4)' }}>
            J.A.R.V.I.S.
          </span>
        </div>

        {/* Center: Date/Time */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '1.2rem', color: 'var(--accent-cyan)', letterSpacing: '0.08em', lineHeight: 1 }}>
            {timeStr}
          </div>
          <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginTop: 2 }}>
            {dateStr.toUpperCase()}
          </div>
        </div>

        {/* Right: Mic + Refresh + User + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', minWidth: 'max-content' }}>

          {/* MIC BUTTON — moved to header */}
          <button
            onClick={handleMicClick}
            disabled={isSpeaking}
            title={isListening ? 'Listening...' : 'Speak to Jarvis'}
            style={{
              background: isListening ? 'rgba(0,232,152,0.12)' : 'transparent',
              border: `1px solid ${isListening ? 'rgba(0,232,152,0.5)' : 'var(--border-dim)'}`,
              borderRadius: 1, cursor: isSpeaking ? 'not-allowed' : 'pointer',
              padding: '0.3rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem',
              color: isListening ? 'var(--accent-green)' : 'var(--accent-cyan)',
              transition: 'all 0.2s', opacity: isSpeaking ? 0.4 : 1, position: 'relative',
            }}
          >
            {isListening && (
              <div style={{ position: 'absolute', inset: -1, borderRadius: 1, border: '1px solid rgba(0,232,152,0.5)', animation: 'sonar 1.4s ease-out infinite', pointerEvents: 'none' }} />
            )}
            <Mic size={13} />
            <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.68rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {isListening ? 'Listening' : 'Speak'}
            </span>
          </button>

          <button onClick={handleRefresh} disabled={isSpeaking} className="btn btn-amber"
            style={{ padding: '0.3rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <RefreshCw size={12} />
            <span>Refresh</span>
          </button>

          <button onClick={onLogout} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }} title="Log out">
            <LogOut size={12} />
          </button>
        </div>
      </header>

      {/* ── GREETING STRIP ── */}
      <div style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border-dim)', padding: '0.45rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.6rem', flexShrink: 0 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: isSpeaking ? 'var(--accent-green)' : 'var(--text-muted)', boxShadow: isSpeaking ? 'var(--glow-green)' : 'none', flexShrink: 0, transition: 'all 0.3s' }} />
        <div style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '0.8rem', color: isSpeaking ? 'var(--accent-bright)' : 'var(--text-secondary)', letterSpacing: '0.04em', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', transition: 'color 0.3s' }}>
          {`${greeting}, ${firstName}. Here's a look at what's on your radar. I'm here to assist.`}
        </div>
        {lastTranscript && (
          <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.6rem', color: 'var(--text-muted)', fontStyle: 'italic', flexShrink: 0 }}>
            "{lastTranscript}"
          </span>
        )}
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0.8rem', display: 'grid', gap: '0.8rem',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gridTemplateRows: 'minmax(220px, 1fr) minmax(260px, 1fr)',
        gridTemplateAreas: `
          "weather weather weather calendar calendar calendar calendar calendar tasks tasks tasks tasks"
          "gmail gmail gmail gmail notes notes notes news news news news news"
        `,
      }} className="dashboard-grid">
        <style>{`
          @media (max-width: 900px) {
            .dashboard-grid {
              grid-template-columns: 1fr 1fr !important;
              grid-template-rows: auto !important;
              grid-template-areas:
                "weather calendar"
                "tasks tasks"
                "gmail gmail"
                "notes news" !important;
            }
          }
          @media (max-width: 600px) {
            .dashboard-grid {
              grid-template-columns: 1fr !important;
              grid-template-areas:
                "weather" "calendar" "gmail" "tasks" "notes" "news" !important;
            }
          }
          @keyframes sonar {
            0%   { transform: scale(1); opacity: 0.7; }
            100% { transform: scale(2.8); opacity: 0; }
          }
        `}</style>

        <div style={{ gridArea: 'weather'  }}><WeatherPanel onWeatherLoad={setWeather} /></div>
        <div style={{ gridArea: 'calendar' }}><CalendarPanel onDataLoad={setLiveEvents} /></div>
        <div style={{ gridArea: 'tasks'    }}><TasksPanel onTasksChange={setTasks} /></div>
        <div style={{ gridArea: 'gmail'    }}><GmailPanel onDataLoad={setLiveEmails} /></div>
        <div style={{ gridArea: 'notes'    }}><NotesPanel onNotesChange={setNotes} /></div>
        <div style={{ gridArea: 'news'     }}><NewsPanel /></div>
      </div>

      {/* ── JARVIS STATUS BAR (bottom — no mic, just status) ── */}
      <JarvisBar
        isListening={isListening}
        isSpeaking={isSpeaking}
        lastTranscript={lastTranscript}
        onMicClick={handleMicClick}
        onStopSpeaking={stopSpeaking}
        voiceReady={voiceReady}
        hideMic={true}
      />
    </div>
  )
}
