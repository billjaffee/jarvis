import { useState, useEffect } from 'react'
import { Plane, Hotel, RefreshCw, MapPin, Calendar } from 'lucide-react'

export default function TravelPanel() {
  const [trips, setTrips]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [live, setLive]         = useState(false)

  const fetchTravel = async () => {
    try {
      const res = await fetch('/.netlify/functions/travel-fetch')
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      if (Array.isArray(data)) { setTrips(data); setLive(true) }
      else throw new Error('no data')
    } catch {
      setTrips([]); setLive(false)
    } finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { fetchTravel() }, [])
  const handleRefresh = () => { setRefreshing(true); fetchTravel() }

  return (
    <div className="hud-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <div className={`status-dot ${live && trips.length > 0 ? 'pulse' : 'offline'}`} />
        <span className="panel-title">Upcoming Travel</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="panel-badge">{live ? 'Scanned from inbox' : 'No data'}</span>
          <button onClick={handleRefresh} disabled={refreshing || loading}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '0.1rem' }}>
            <RefreshCw size={11} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', display: 'flex', alignItems: 'stretch', padding: '0.7rem 0.8rem', gap: '0.7rem' }}>
        {loading && <div style={{ color: 'var(--text-muted)', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.65rem', alignSelf: 'center' }}>Scanning inbox for travel...</div>}

        {!loading && trips.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontStyle: 'italic', alignSelf: 'center' }}>
            No upcoming travel found in your inbox.
          </div>
        )}

        {trips.map(trip => (
          <div key={trip.id} style={{
            background: 'rgba(0,160,220,0.08)',
            border: '1px solid var(--border-dim)',
            borderRadius: 2,
            padding: '0.6rem 0.8rem',
            minWidth: 220,
            maxWidth: 260,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {trip.type === 'hotel'
                ? <Hotel size={13} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
                : <Plane size={13} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
              }
              <span style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, fontSize: '0.78rem', color: 'var(--accent-cyan)', letterSpacing: '0.05em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {trip.subject}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{trip.date}</span>
              {trip.flight && (
                <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.65rem', color: 'var(--accent-green)', marginLeft: 'auto' }}>{trip.flight}</span>
              )}
            </div>

            {trip.route && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.7rem', color: 'var(--accent-bright)' }}>{trip.route}</span>
              </div>
            )}

            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {trip.snippet}
            </div>

            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              via {trip.from}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
