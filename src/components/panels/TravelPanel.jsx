import { useState, useEffect } from 'react'
import { Plane, Hotel, RefreshCw, MapPin, Clock, Tag } from 'lucide-react'

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
          <span className="panel-badge">{loading ? 'Scanning...' : live ? `${trips.length} itinerar${trips.length===1?'y':'ies'} found` : 'Inbox scan'}</span>
          <button onClick={handleRefresh} disabled={refreshing||loading} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex', padding:'0.1rem' }}>
            <RefreshCw size={11} style={{ animation:refreshing?'spin 1s linear infinite':'none' }} />
          </button>
        </div>
      </div>

      <div style={{ flex:1, overflowX:'auto', overflowY:'hidden', display:'flex', alignItems:'stretch', padding:'0.7rem 0.8rem', gap:'0.75rem', WebkitOverflowScrolling:'touch' }}>
        {loading && (
          <div style={{ color:'var(--text-muted)', fontFamily:'Share Tech Mono,monospace', fontSize:'0.72rem', alignSelf:'center' }}>
            Scanning promotions & updates tabs for confirmed bookings...
          </div>
        )}

        {!loading && trips.length === 0 && (
          <div style={{ color:'var(--text-muted)', fontSize:'0.88rem', fontStyle:'italic', alignSelf:'center' }}>
            No confirmed trip itineraries found. Jarvis only shows booking confirmations — not promotional emails.
          </div>
        )}

        {trips.map(trip => (
          <div key={trip.id} style={{
            background:'rgba(0,160,220,0.07)',
            border:'1px solid var(--border-dim)',
            borderRadius:2, padding:'0.75rem 0.9rem',
            minWidth:240, maxWidth:290, flexShrink:0,
            display:'flex', flexDirection:'column', gap:'0.5rem',
            transition:'border-color 0.2s',
          }}
            onMouseEnter={e=>e.currentTarget.style.borderColor='var(--border-mid)'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border-dim)'}
          >
            {/* Header row */}
            <div style={{ display:'flex', alignItems:'center', gap:'0.45rem' }}>
              {trip.type==='hotel'
                ? <Hotel size={14} style={{ color:'var(--accent-cyan)', flexShrink:0 }} />
                : <Plane  size={14} style={{ color:'var(--accent-cyan)', flexShrink:0 }} />
              }
              <span style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700, fontSize:'0.88rem', color:'var(--accent-cyan)', letterSpacing:'0.05em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
                {trip.destination || (trip.route ? trip.route.split('→')[1]?.trim() : null) || trip.subject.slice(0,30)}
              </span>
            </div>

            {/* Route */}
            {trip.route && (
              <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                <MapPin size={11} style={{ color:'var(--text-muted)', flexShrink:0 }} />
                <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:'0.82rem', color:'var(--accent-bright)', letterSpacing:'0.04em' }}>
                  {trip.route}
                </span>
              </div>
            )}

            {/* Flight numbers */}
            {trip.flights?.length > 0 && (
              <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap', alignItems:'center' }}>
                <Tag size={10} style={{ color:'var(--text-muted)', flexShrink:0 }} />
                {trip.flights.map(f => (
                  <span key={f} style={{ fontFamily:'Share Tech Mono,monospace', fontSize:'0.76rem', background:'rgba(0,200,240,0.1)', border:'1px solid rgba(0,200,240,0.25)', borderRadius:2, padding:'0.1rem 0.4rem', color:'var(--accent-green)', letterSpacing:'0.05em' }}>
                    {f}
                  </span>
                ))}
              </div>
            )}

            {/* Date */}
            <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
              <Clock size={10} style={{ color:'var(--text-muted)', flexShrink:0 }} />
              <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:'0.78rem', color:'var(--text-secondary)' }}>
                {trip.date}
                {trip.times?.length > 0 && ` · ${trip.times.join(' → ')}`}
              </span>
            </div>

            {/* Snippet */}
            <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', lineHeight:1.4, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
              {trip.snippet}
            </div>

            {/* Source */}
            <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', fontFamily:'Share Tech Mono,monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', borderTop:'1px solid var(--border-dim)', paddingTop:'0.35rem', marginTop:'auto' }}>
              via {trip.from}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
