import { useState, useEffect } from 'react'
import { Plane, Hotel, RefreshCw, Clock, Tag, ArrowRight } from 'lucide-react'

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
      if (Array.isArray(data)) { setTrips(data); setLive(true) }
    } catch { setTrips([]); setLive(false) }
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { fetchTravel() }, [])
  const handleRefresh = () => { setRefreshing(true); fetchTravel() }

  return (
    <div className="hud-panel" style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      <div className="panel-header">
        <div className={`status-dot ${live && trips.length > 0 ? 'pulse' : 'offline'}`} />
        <span className="panel-title">Upcoming Travel</span>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <span className="panel-badge">
            {loading ? 'Scanning itineraries...' : trips.length > 0 ? `${trips.length} trip${trips.length!==1?'s':''} found` : 'No itineraries found'}
          </span>
          <button onClick={handleRefresh} disabled={refreshing||loading}
            style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', padding:'0.1rem' }}>
            <RefreshCw size={12} style={{ animation:refreshing?'spin 1s linear infinite':'none' }} />
          </button>
        </div>
      </div>

      <div style={{ flex:1, display:'flex', alignItems:'stretch', overflowX:'auto', overflowY:'hidden', padding:'0.8rem 0.9rem', gap:'0.8rem', WebkitOverflowScrolling:'touch' }}>
        {loading && (
          <div style={{ color:'var(--text-muted)', fontFamily:'Share Tech Mono,monospace', fontSize:'0.78rem', alignSelf:'center' }}>
            Scanning inbox for confirmed flight itineraries...
          </div>
        )}

        {!loading && trips.length === 0 && (
          <div style={{ color:'var(--text-muted)', fontSize:'0.9rem', fontStyle:'italic', alignSelf:'center' }}>
            No confirmed flight itineraries found. Jarvis looks for booking confirmations with flight numbers, routes, and departure times.
          </div>
        )}

        {trips.map(trip => (
          <FlightCard key={trip.id} trip={trip} />
        ))}
      </div>
    </div>
  )
}

function FlightCard({ trip }) {
  const isHotel = trip.type === 'hotel'

  // Parse each leg from flight numbers
  const legs = trip.flightNums.length > 0 ? trip.flightNums : ['—']

  return (
    <div style={{
      background:'rgba(0,160,220,0.06)',
      border:'1px solid var(--border-dim)',
      borderRadius:3,
      minWidth:260, maxWidth:300,
      flexShrink:0,
      display:'flex', flexDirection:'column',
      overflow:'hidden',
      transition:'border-color 0.2s',
    }}
      onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-mid)'}
      onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border-dim)'}
    >
      {/* Card header — airline + type */}
      <div style={{ background:'rgba(0,0,0,0.25)', padding:'0.6rem 0.8rem', display:'flex', alignItems:'center', gap:'0.5rem', borderBottom:'1px solid var(--border-dim)' }}>
        {isHotel
          ? <Hotel size={14} style={{ color:'var(--accent-cyan)', flexShrink:0 }} />
          : <Plane  size={14} style={{ color:'var(--accent-cyan)', flexShrink:0 }} />
        }
        <span style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700, fontSize:'0.9rem', color:'var(--accent-cyan)', letterSpacing:'0.06em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {trip.airline || (isHotel ? 'Hotel Stay' : 'Flight')}
        </span>
        {trip.confirmation && (
          <span style={{ marginLeft:'auto', fontFamily:'Share Tech Mono,monospace', fontSize:'0.68rem', color:'var(--accent-green)', background:'rgba(0,232,152,0.08)', border:'1px solid rgba(0,232,152,0.2)', borderRadius:2, padding:'0.1rem 0.35rem', flexShrink:0 }}>
            {trip.confirmation}
          </span>
        )}
      </div>

      {/* Route — big and prominent */}
      {trip.route && (
        <div style={{ padding:'0.75rem 0.8rem 0.4rem', display:'flex', alignItems:'center', gap:'0.6rem' }}>
          {trip.route.split('→').map((code,i,arr) => (
            <span key={i} style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <span style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700, fontSize:'1.6rem', color:'var(--text-primary)', letterSpacing:'0.04em', lineHeight:1 }}>
                {code.trim()}
              </span>
              {i < arr.length-1 && <ArrowRight size={16} style={{ color:'var(--accent-cyan)', flexShrink:0 }} />}
            </span>
          ))}
        </div>
      )}

      {/* Flight numbers as chips */}
      {trip.flightNums.length > 0 && (
        <div style={{ padding:'0.3rem 0.8rem', display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
          {trip.flightNums.map(f => (
            <span key={f} style={{ fontFamily:'Share Tech Mono,monospace', fontSize:'0.8rem', background:'rgba(0,200,240,0.1)', border:'1px solid rgba(0,200,240,0.25)', borderRadius:2, padding:'0.15rem 0.5rem', color:'var(--accent-bright)', letterSpacing:'0.06em' }}>
              {f}
            </span>
          ))}
        </div>
      )}

      {/* Date + times */}
      <div style={{ padding:'0.4rem 0.8rem 0.3rem', display:'flex', flexDirection:'column', gap:'0.25rem' }}>
        {trip.departDate && (
          <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
            <Clock size={11} style={{ color:'var(--text-muted)', flexShrink:0 }} />
            <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:'0.8rem', color:'var(--text-secondary)' }}>
              {trip.departDate}
            </span>
          </div>
        )}
        {trip.times?.length > 0 && (
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', paddingLeft:'1.2rem' }}>
            {trip.times.slice(0,2).map((t,i,arr) => (
              <span key={i} style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:'0.82rem', color:'var(--accent-bright)' }}>{t}</span>
                {i < arr.length-1 && <ArrowRight size={11} style={{ color:'var(--text-muted)' }} />}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Source footer */}
      <div style={{ marginTop:'auto', padding:'0.4rem 0.8rem', borderTop:'1px solid var(--border-dim)', fontFamily:'Share Tech Mono,monospace', fontSize:'0.66rem', color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {trip.from}
      </div>
    </div>
  )
}
