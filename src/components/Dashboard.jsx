import { useState, useEffect, useRef, useCallback } from 'react'
import { LogOut, RefreshCw, Zap } from 'lucide-react'
import { useJarvisVoice, getGreeting } from '../hooks/useJarvisVoice'

import WeatherPanel from './panels/WeatherPanel'
import CalendarPanel from './panels/CalendarPanel'
import GmailPanel from './panels/GmailPanel'
import TasksPanel from './panels/TasksPanel'
import NotesPanel from './panels/NotesPanel'
import NewsPanel from './panels/NewsPanel'
import JarvisBar from './JarvisBar'

export default function Dashboard({ user, onLogout }) {
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Mr. Jaffee'
  const displayName = user?.user_metadata?.full_name || 'Bill Jaffee'

  const [weather, setWeather] = useState(null)
  const [tasks, setTasks] = useState([])
  const [notes, setNotes] = useState('')
  const [liveEmails, setLiveEmails] = useState([])
  const [liveEvents, setLiveEvents] = useState([])
  const [greeted, setGreeted] = useState(false)
  const [time, setTime] = useState(new Date())
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const { speak, stopSpeaking, isSpeaking, startListening, stopListening, isListening, lastTranscript, voiceReady } = useJarvisVoice()

  // Clock
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  // Greeting on mount — slight delay so voices load
  useEffect(() => {
    if (!greeted && voiceReady) {
      const greeting = getGreeting(firstName)
      const timer = setTimeout(() => {
        speak(greeting)
        setGreeted(true)
      }, 900)
      return () => clearTimeout(timer)
    }
  }, [voiceReady, greeted, firstName, speak])

  // Build command context
  const commandContext = {
    weather,
    events: liveEvents,
    emailCount: liveEmails.filter(e => e.unread).length,
    flaggedCount: liveEmails.filter(e => e.flagged).length,
    tasks,
    notes,
    addTask: (text) => {
      window.__jarvisAddTask?.(text)
    },
  }

  const handleMicClick = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening(commandContext)
    }
  }

  const handleRefresh = () => {
    setLastRefresh(new Date())
    speak('Refreshing all systems, ' + firstName + '. Stand by.')
    // In Phase 2 this triggers API re-fetches
    setTimeout(() => speak('Refresh complete.'), 2000)
  }

  const timeStr = time.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-root)',
      overflow: 'hidden',
    }}>

      {/* ── TOP HEADER ── */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0 1.2rem',
        height: 56,
        borderBottom: '1px solid var(--border-dim)',
        background: 'rgba(10,9,6,0.9)',
        backdropFilter: 'blur(8px)',
        flexShrink: 0,
        gap: '1rem',
        position: 'relative',
        zIndex: 10,
      }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 'max-content' }}>
          <Zap size={16} style={{ color: 'var(--accent-bright)' }} />
          <span style={{
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 700,
            fontSize: '1.05rem',
            letterSpacing: '0.28em',
            color: 'var(--accent-bright)',
            textShadow: '0 0 12px rgba(245,173,40,0.35)',
          }}>
            J.A.R.V.I.S.
          </span>
          <span style={{
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: '0.52rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.15em',
            display: 'none',  // shown on md+
          }}
            className="hidden sm:inline"
          >
            v1.0 · PHASE 1
          </span>
        </div>

        {/* Center: Date/Time */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
            fontFamily: 'Rajdhani, sans-serif',
            fontWeight: 600,
            fontSize: '1.15rem',
            color: 'var(--accent-amber)',
            letterSpacing: '0.08em',
            lineHeight: 1,
          }}>
            {timeStr}
          </div>
          <div style={{
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: '0.55rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.1em',
            marginTop: 2,
          }}>
            {dateStr.toUpperCase()}
          </div>
        </div>

        {/* Right: User + Refresh + Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', minWidth: 'max-content' }}>
          <span style={{
            fontFamily: 'Barlow Condensed, sans-serif',
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            display: 'none',
          }}
            className="hidden sm:inline"
          >
            {displayName}
          </span>

          <button
            onClick={handleRefresh}
            disabled={isSpeaking}
            className="btn btn-amber"
            style={{ padding: '0.3rem 0.7rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            title="Refresh all panels"
          >
            <RefreshCw size={12} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={onLogout}
            className="btn btn-ghost"
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            title="Log out"
          >
            <LogOut size={12} />
          </button>
        </div>
      </header>

      {/* ── JARVIS GREETING STRIP ── */}
      <div style={{
        background: 'rgba(0,0,0,0.25)',
        borderBottom: '1px solid var(--border-dim)',
        padding: '0.5rem 1.2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        flexShrink: 0,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: isSpeaking ? 'var(--accent-bright)' : 'var(--text-muted)',
          boxShadow: isSpeaking ? '0 0 8px var(--accent-amber)' : 'none',
          flexShrink: 0,
          transition: 'all 0.3s',
        }} />
        <div style={{
          fontFamily: 'Rajdhani, sans-serif',
          fontSize: '0.75rem',
          color: isSpeaking ? 'var(--accent-bright)' : 'var(--text-muted)',
          letterSpacing: '0.04em',
          fontStyle: isSpeaking ? 'normal' : 'italic',
          transition: 'color 0.3s',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {isSpeaking
            ? getGreeting(firstName)
            : `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, ${firstName}. All systems nominal. Click the mic below or say something.`
          }
        </div>
        <span style={{
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: '0.55rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.1em',
          flexShrink: 0,
        }}>
          {lastRefresh.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '0.8rem',
        display: 'grid',
        gap: '0.8rem',
        // Desktop: 3 columns top row, 3 columns bottom row
        gridTemplateColumns: 'repeat(12, 1fr)',
        gridTemplateRows: 'minmax(220px, 1fr) minmax(260px, 1fr)',
        gridTemplateAreas: `
          "weather weather weather calendar calendar calendar calendar calendar tasks tasks tasks tasks"
          "gmail gmail gmail gmail notes notes notes news news news news news"
        `,
      }}
        className="dashboard-grid"
      >
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
                "weather"
                "calendar"
                "gmail"
                "tasks"
                "notes"
                "news" !important;
            }
          }
        `}</style>

        <div style={{ gridArea: 'weather' }}>
          <WeatherPanel onWeatherLoad={setWeather} />
        </div>

        <div style={{ gridArea: 'calendar' }}>
          <CalendarPanel onDataLoad={setLiveEvents} />
        </div>

        <div style={{ gridArea: 'tasks' }}>
          <TasksPanel onTasksChange={setTasks} />
        </div>

        <div style={{ gridArea: 'gmail' }}>
          <GmailPanel onDataLoad={setLiveEmails} />
        </div>

        <div style={{ gridArea: 'notes' }}>
          <NotesPanel onNotesChange={setNotes} />
        </div>

        <div style={{ gridArea: 'news' }}>
          <NewsPanel />
        </div>
      </div>

      {/* ── JARVIS BAR (bottom) ── */}
      <JarvisBar
        isListening={isListening}
        isSpeaking={isSpeaking}
        lastTranscript={lastTranscript}
        onMicClick={handleMicClick}
        onStopSpeaking={stopSpeaking}
        voiceReady={voiceReady}
      />
    </div>
  )
}
