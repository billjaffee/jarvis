import { useState, useEffect } from 'react'
import { Plane, Hotel, RefreshCw, Clock, ArrowRight } from 'lucide-react'

export default function TravelPanel() {
  const [trips, setTrips]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [live, setLive]             = useState(false)

  const fetchTravel = async () => {
    try {
      const res = await fetch('/.netlify/functions/travel-fetch')
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      if (Array.isArray(data)) {
        // Filter out past trips — keep future + today
        const now = new Date()
        now.setHours(0,0,0,0)
        const future = data.filter(t => {
          if (!t.departDate) return true
          const d = new Date(t.departDate)
          return isNaN(d.getTime()) || d >= now
        })
        setTrips(future)
        setLive(true)
      }
    } catch { setTrips([]); setLive(false) }
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { fetchTravel() }, [])
  const handleRefresh = () => { setRefreshing(true); fetchTravel() }

  return (
    <div className="hud-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <div className={`status-dot ${live && trips.length > 0 ? 'pulse' : 'offline'}`} />
        <span className="panel-title">Upcoming Travel</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="panel-badge">
            {loading ? 'Scanning...' : trips.length > 0 ? `${trips.length} trip${trips.length !== 1 ? 's' : ''} ahead` : 'No upcoming trips'}
          </span>
          <button onClick={handleRefresh} disabled={refreshing || loading}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '0.1rem' }}>
            <RefreshCw size={12} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      {/* Horizontal scroll of cards */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'stretch', overflowX: 'auto', overflowY: 'hidden', padding: '0.9rem 1rem', gap: '0.9rem', WebkitOverflowScrolling: 'touch' }}>
        {loading && (
          <div style={{ color: 'var(--text-muted)', fontFamily: 'Share Tech Mono,monospace', fontSize: '0.85rem', alignSelf: 'center' }}>
            Scanning inbox for confirmed flight itineraries...
          </div>
        )}
        {!loading && trips.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: '1rem', fontStyle: 'italic', alignSelf: 'center' }}>
            No upcoming confirmed trips found. Jarvis looks for booking confirmations with flight numbers and departure details.
          </div>
        )}
        {trips.map(trip => <FlightCard key={trip.id} trip={trip} />)}
      </div>
    </div>
  )
}

function FlightCard({ trip }) {
  const isHotel = trip.type === 'hotel'
  const [legs, origin, dest] = trip.route
    ? [null, ...trip.route.split('→').map(s => s.trim())]
    : [null, null, null]

  return (
    <div style={{
      background: 'rgba(0,160,220,0.07)',
      border: '1px solid var(--border-dim)',
      borderRadius: 4,
      minWidth: 280, maxWidth: 320,
      flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-mid)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-dim)'}
    >
      {/* Card header */}
      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.65rem 0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderBottom: '1px solid var(--border-dim)' }}>
        {isHotel ? <Hotel size={15} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} /> : <Plane size={15} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />}
        <span style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '1rem', color: 'var(--accent-cyan)', letterSpacing: '0.06em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {trip.airline || (isHotel ? 'Hotel Stay' : 'Flight')}
        </span>
        {trip.confirmation && (
          <span style={{ marginLeft: 'auto', fontFamily: 'Share Tech Mono,monospace', fontSize: '0.75rem', color: 'var(--accent-green)', background: 'rgba(0,232,152,0.08)', border: '1px solid rgba(0,232,152,0.25)', borderRadius: 2, padding: '0.12rem 0.4rem', flexShrink: 0 }}>
            {trip.confirmation}
          </span>
        )}
      </div>

      {/* Large route display */}
      {trip.route && (
        <div style={{ padding: '0.8rem 0.9rem 0.4rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '2rem', color: 'white', letterSpacing: '0.04em', lineHeight: 1 }}>{origin}</span>
          <ArrowRight size={18} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
          <span style={{ fontFamily: 'Rajdhani,sans-serif', fontWeight: 700, fontSize: '2rem', color: 'white', letterSpacing: '0.04em', lineHeight: 1 }}>{dest}</span>
        </div>
      )}

      {/* Flight numbers */}
      {trip.flightNums?.length > 0 && (
        <div style={{ padding: '0.3rem 0.9rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {trip.flightNums.map(f => (
            <span key={f} style={{ fontFamily: 'Share Tech Mono,monospace', fontSize: '0.88rem', background: 'rgba(0,200,240,0.1)', border: '1px solid rgba(0,200,240,0.3)', borderRadius: 2, padding: '0.15rem 0.5rem', color: 'var(--accent-bright)', letterSpacing: '0.06em' }}>
              {f}
            </span>
          ))}
        </div>
      )}

      {/* Date + times */}
      <div style={{ padding: '0.45rem 0.9rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {trip.departDate && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Clock size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <span style={{ fontFamily: 'Share Tech Mono,monospace', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              {trip.departDate}
            </span>
          </div>
        )}
        {trip.times?.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '1.4rem' }}>
            {trip.times.slice(0,2).map((t, i, arr) => (
              <span key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontFamily: 'Share Tech Mono,monospace', fontSize: '0.9rem', color: 'var(--accent-bright)' }}>{t}</span>
                {i < arr.length - 1 && <ArrowRight size={11} style={{ color: 'var(--text-muted)' }} />}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: 'auto', padding: '0.45rem 0.9rem', borderTop: '1px solid var(--border-dim)', fontFamily: 'Share Tech Mono,monospace', fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {trip.from}
      </div>
    </div>
  )
}
