import { useState, useEffect } from 'react'
import { MapPin, RefreshCw } from 'lucide-react'
import { MOCK_EVENTS } from '../../data/mockData'

const COLOR_MAP = {
  amber: { bg: 'rgba(217,143,20,0.15)', border: 'rgba(217,143,20,0.4)', dot: '#d98f14' },
  iron:  { bg: 'rgba(196,77,24,0.15)',  border: 'rgba(196,77,24,0.4)',  dot: '#c44d18' },
  gold:  { bg: 'rgba(184,122,8,0.15)',  border: 'rgba(184,122,8,0.4)',  dot: '#b87a08' },
}

export default function CalendarPanel({ onDataLoad }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchEvents = async () => {
    try {
      const res = await fetch('/.netlify/functions/calendar-fetch')
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      if (Array.isArray(data) && data.length >= 0) {
        setEvents(data)
        setLive(true)
        onDataLoad?.(data)
      } else {
        throw new Error('bad data')
      }
    } catch {
      setEvents(MOCK_EVENTS)
      setLive(false)
      onDataLoad?.(MOCK_EVENTS)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchEvents() }, [])

  const handleRefresh = () => { setRefreshing(true); fetchEvents() }

  const today    = events.filter(e => e.today)
  const upcoming = events.filter(e => !e.today)
  const displayed = showAll ? upcoming : upcoming.slice(0, 3)

  return (
    <div className="hud-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <div className={`status-dot ${live ? 'pulse' : 'offline'}`} />
        <span className="panel-title">Calendar</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="panel-badge">{live ? 'Live' : 'Mock'}</span>
          <button onClick={handleRefresh} disabled={refreshing || loading}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '0.1rem' }}>
            <RefreshCw size={11} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0.6rem 0.8rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {loading && (
          <div style={{ color: 'var(--text-muted)', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.65rem' }}>
            Syncing calendar...
          </div>
        )}

        {!loading && today.length > 0 && (
          <div style={{ marginBottom: '0.4rem' }}>
            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.58rem', color: 'var(--accent-gold)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.4rem', paddingLeft: '0.2rem' }}>
              Today
            </div>
            {today.map(event => <EventRow key={event.id} event={event} />)}
          </div>
        )}

        {!loading && today.length === 0 && (
          <div style={{ padding: '0.8rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
            Schedule clear today.
          </div>
        )}

        {!loading && upcoming.length > 0 && (
          <div>
            <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.4rem', paddingLeft: '0.2rem' }}>
              Upcoming
            </div>
            {displayed.map(event => <EventRow key={event.id} event={event} dim />)}
            {upcoming.length > 3 && !showAll && (
              <button onClick={() => setShowAll(true)} className="btn btn-ghost" style={{ marginTop: '0.3rem', width: '100%' }}>
                +{upcoming.length - 3} more
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: '0.4rem 0.9rem', borderTop: '1px solid var(--border-dim)', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.55rem', color: live ? 'var(--accent-gold)' : 'var(--text-muted)', letterSpacing: '0.08em' }}>
        {live ? '● Live · Primary calendar' : '○ Mock data — check env vars'}
      </div>
    </div>
  )
}

function EventRow({ event, dim }) {
  const colors = COLOR_MAP[event.color] || COLOR_MAP.amber
  return (
    <div style={{
      display: 'flex', gap: '0.6rem', padding: '0.5rem 0.6rem',
      background: dim ? 'transparent' : colors.bg,
      border: `1px solid ${dim ? 'var(--border-dim)' : colors.border}`,
      borderRadius: 1, marginBottom: '0.3rem', opacity: dim ? 0.65 : 1, transition: 'opacity 0.2s',
    }}>
      <div style={{ width: 2, background: colors.dot, borderRadius: 1, flexShrink: 0, alignSelf: 'stretch', minHeight: 36 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 500, color: dim ? 'var(--text-secondary)' : 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {event.title}
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.2rem', alignItems: 'center' }}>
          <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.62rem', color: dim ? 'var(--text-muted)' : colors.dot }}>
            {event.time}
          </span>
          {event.location && (
            <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <MapPin size={9} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 2 }} />
              {event.location}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
