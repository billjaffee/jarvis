import { useState, useEffect } from 'react'
import { LogOut, RefreshCw, Zap, TrendingUp, TrendingDown, Sun, Moon, CheckCircle, Menu, X } from 'lucide-react'
import { MOCK_EMAILS, MOCK_EVENTS } from '../data/mockData'
import WeatherPanel  from './panels/WeatherPanel'
import CalendarPanel from './panels/CalendarPanel'
import GmailPanel    from './panels/GmailPanel'
import TasksPanel    from './panels/TasksPanel'
import NotesPanel    from './panels/NotesPanel'
import NewsPanel     from './panels/NewsPanel'
import TravelPanel   from './panels/TravelPanel'
import ChatPanel     from './panels/ChatPanel'
import JarvisBar     from './JarvisBar'

const ZONES = [
  { label:'NYC',  tz:'America/New_York'    },
  { label:'MPLS', tz:'America/Chicago'     },
  { label:'LA',   tz:'America/Los_Angeles' },
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
  const [lightMode, setLightMode]     = useState(false)
  const [menuOpen, setMenuOpen]       = useState(false)
  const [kateMsg, setKateMsg]         = useState('')

  useEffect(() => { const t=setInterval(()=>setTime(new Date()),1000); return ()=>clearInterval(t) },[])
  useEffect(() => { document.documentElement.setAttribute('data-theme',lightMode?'light':'dark') },[lightMode])
  useEffect(() => {
    const go=async()=>{ try{ const r=await fetch('/.netlify/functions/stock-fetch'); if(r.ok) setTickers(await r.json()) }catch{} }
    go(); const t=setInterval(go,60000); return ()=>clearInterval(t)
  },[])

  const handleAcceptKate = async () => {
    try {
      const res=await fetch('/.netlify/functions/calendar-accept',{method:'POST'})
      const data=await res.json()
      setKateMsg(data.count>0?`Accepted ${data.count} invite${data.count!==1?'s':''}` : 'No pending invites')
    } catch { setKateMsg('Could not check') }
    finally { setTimeout(()=>setKateMsg(''),4000) }
  }

  // Context passed to ChatPanel
  const dashboardContext = { weather, events:liveEvents, emails:liveEmails, tasks, notes, tickers }

  const timeStr  = time.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/Denver'})
  const dateStr  = time.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',timeZone:'America/Denver'})
  const hour     = parseInt(time.toLocaleTimeString('en-US',{hour:'numeric',hour12:false,timeZone:'America/Denver'}))

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100dvh', maxWidth:'100vw', overflow:'hidden', background:'var(--bg-root)', position:'relative' }}>

      <style>{`
        [data-theme="light"] { --bg-root:#ddeef7; --bg-panel:#ffffff; --text-primary:#050f18; --text-secondary:#0a3050; --text-muted:#4a7a95; --accent-cyan:#0090c0; --accent-bright:#0078a8; --accent-green:#008855; --accent-green-dim:#006640; --border-dim:rgba(0,110,160,0.22); --border-mid:rgba(0,140,190,0.4); --glow-sm:0 1px 6px rgba(0,0,0,0.09); --glow-green:0 0 8px rgba(0,136,85,0.3); }
        [data-theme="light"] body { background:#ddeef7; }
        [data-theme="light"] body::after { display:none; }
        [data-theme="light"] .hud-panel { box-shadow:0 2px 12px rgba(0,0,0,0.09); }
        [data-theme="light"] .panel-header { background:rgba(0,120,180,0.07); }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes dot-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.85)} }

        /* Mobile menu */
        .mobile-menu { position:fixed; inset:0; z-index:8500; background:rgba(1,10,20,0.97); backdrop-filter:blur(16px); display:flex; flex-direction:column; padding:max(env(safe-area-inset-top,1.5rem),1.5rem) 1.5rem max(env(safe-area-inset-bottom,1.5rem),1.5rem); gap:1rem; overflow-y:auto; }
        .mmb { background:transparent; border:1px solid var(--border-mid); border-radius:4px; color:var(--text-primary); font-family:'Rajdhani',sans-serif; font-size:1.2rem; font-weight:600; letter-spacing:0.1em; text-transform:uppercase; padding:1rem 1.2rem; cursor:pointer; display:flex; align-items:center; gap:0.8rem; transition:all 0.2s; }
        .mmb:active { background:rgba(0,200,240,0.12); }

        /* Desktop grid */
        .dash-grid {
          display:grid; gap:0.7rem;
          grid-template-columns:repeat(12,1fr);
          grid-template-rows:minmax(460px,1fr) minmax(340px,1fr) minmax(160px,auto);
          grid-template-areas:
            "w w w c c c g g g g g g"
            "t t t t chat chat chat news news news news news"
            "tr tr tr tr tr tr tr tr tr tr tr tr";
        }
        @media (max-width:1024px) and (min-width:601px) {
          .dash-grid { grid-template-columns:1fr 1fr !important; grid-template-rows:auto !important; grid-template-areas:"w c" "g g" "t chat" "news news" "tr tr" !important; }
        }
        @media (max-width:600px) {
          .dash-grid { grid-template-columns:1fr !important; grid-template-rows:auto !important; grid-template-areas:"w""c""g""t""chat""news""tr" !important; }
          .dash-grid > div { min-height:300px; }
          .dash-grid > div:last-child { min-height:160px; }
        }
      `}</style>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="mobile-menu">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700, fontSize:'1.5rem', letterSpacing:'0.25em', color:'var(--accent-bright)' }}>MENU</span>
            <button onClick={()=>setMenuOpen(false)} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:'0.5rem', display:'flex' }}><X size={24}/></button>
          </div>
          <div style={{ borderBottom:'1px solid var(--border-dim)', margin:'0.3rem 0' }}/>
          <button className="mmb" onClick={()=>{handleAcceptKate();setMenuOpen(false)}}><CheckCircle size={20}/>{kateMsg||"Accept Kate's Invites"}</button>
          <button className="mmb" onClick={()=>{setLightMode(l=>!l);setMenuOpen(false)}}>{lightMode?<Moon size={20}/>:<Sun size={20}/>}{lightMode?'Dark Mode':'Light Mode'}</button>
          <button className="mmb" onClick={()=>{window.location.reload();setMenuOpen(false)}}><RefreshCw size={20}/>Refresh</button>
          <button className="mmb" onClick={()=>{onLogout();setMenuOpen(false)}} style={{ color:'#e05c20', borderColor:'rgba(224,92,32,0.3)', marginTop:'auto' }}><LogOut size={20}/>Sign Out</button>
        </div>
      )}

      {/* TICKER BAR — centered with Yahoo Finance links */}
      {tickers.length > 0 && (
        <div style={{ background:'rgba(0,0,0,0.55)', borderBottom:'1px solid var(--border-dim)', height:36, display:'flex', alignItems:'center', justifyContent:'center', gap:'2.5rem', padding:'0 1rem', overflowX:'auto', flexShrink:0 }}>
          {tickers.map(t => {
            const sym = t.symbol.startsWith('^') ? t.symbol.replace('^','%5E') : t.symbol
            return (
              <a key={t.symbol} href={`https://finance.yahoo.com/quote/${sym}`} target="_blank" rel="noopener noreferrer"
                style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexShrink:0, textDecoration:'none', transition:'opacity 0.2s' }}
                onMouseEnter={e=>e.currentTarget.style.opacity='0.7'}
                onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                <span style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700, fontSize:'0.92rem', letterSpacing:'0.1em', color:'var(--accent-cyan)' }}>{t.label}</span>
                <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:'0.9rem', color:'#fff' }}>{t.price?(t.symbol.startsWith('^')?Number(t.price).toLocaleString():`$${t.price}`):'—'}</span>
                {t.pct!==null && (
                  <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:'0.82rem', color:t.up?'var(--accent-green)':'var(--accent-iron)', display:'flex', alignItems:'center', gap:2 }}>
                    {t.up?<TrendingUp size={11}/>:<TrendingDown size={11}/>}{t.up?'+':''}{t.pct}%
                  </span>
                )}
              </a>
            )
          })}
        </div>
      )}

      {/* HEADER */}
      <header style={{
        display:'flex', alignItems:'center',
        paddingTop:'env(safe-area-inset-top,0px)',
        paddingLeft:'max(env(safe-area-inset-left,1.4rem),1.4rem)',
        paddingRight:'max(env(safe-area-inset-right,1.4rem),1.4rem)',
        paddingBottom:0,
        minHeight:62,
        borderBottom:'1px solid var(--border-dim)',
        background:'var(--bg-panel)',
        flexShrink:0, gap:'1rem', zIndex:10,
      }}>

        {/* Logo — LARGER */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.55rem', flexShrink:0 }}>
          <Zap size={22} style={{ color:'var(--accent-bright)' }}/>
          <span style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700, fontSize:'1.5rem', letterSpacing:'0.25em', color:'var(--accent-bright)', textShadow:'0 0 16px rgba(64,224,255,0.4)', whiteSpace:'nowrap' }}>
            J.A.R.V.I.S.
          </span>
        </div>

        {/* CENTER — clock + world clocks */}
        <div style={{ flex:1, textAlign:'center', minWidth:0 }}>
          <div className="hide-mobile">
            <div style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700, fontSize:'1.9rem', color:'var(--accent-cyan)', letterSpacing:'0.06em', lineHeight:1 }}>
              {timeStr} <span style={{ fontSize:'0.8rem', color:'var(--text-muted)', letterSpacing:'0.1em' }}>MT</span>
            </div>
            <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:'0.62rem', color:'var(--text-muted)', letterSpacing:'0.08em', marginTop:3 }}>{dateStr.toUpperCase()}</div>
            <div style={{ display:'flex', justifyContent:'center', gap:'1.2rem', marginTop:'0.2rem' }}>
              {ZONES.map(z => (
                <div key={z.label} style={{ display:'flex', gap:'0.3rem', alignItems:'center' }}>
                  <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:'0.6rem', color:'var(--text-muted)' }}>{z.label}</span>
                  <span style={{ fontFamily:'Share Tech Mono,monospace', fontSize:'0.65rem', color:'var(--text-secondary)' }}>
                    {time.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:z.tz})}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* Mobile compact clock */}
          <div className="mobile-only" style={{ display:'none' }}>
            <div style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700, fontSize:'1.6rem', color:'var(--accent-cyan)', lineHeight:1 }}>
              {timeStr} <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>MT</span>
            </div>
            <div style={{ fontFamily:'Share Tech Mono,monospace', fontSize:'0.58rem', color:'var(--text-muted)' }}>
              {time.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',timeZone:'America/Denver'}).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Desktop right controls */}
        <div className="hide-mobile" style={{ display:'flex', alignItems:'center', gap:'0.7rem', flexShrink:0 }}>
          <button onClick={handleAcceptKate}
            style={{ background:'transparent', border:'1px solid var(--border-dim)', borderRadius:1, cursor:'pointer', padding:'0.32rem 0.65rem', display:'flex', alignItems:'center', gap:'0.3rem', color:'var(--text-muted)', fontFamily:'Rajdhani,sans-serif', fontSize:'0.75rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', whiteSpace:'nowrap', transition:'all 0.2s' }}
            onMouseEnter={e=>{e.currentTarget.style.color='var(--accent-green)';e.currentTarget.style.borderColor='var(--accent-green)'}}
            onMouseLeave={e=>{e.currentTarget.style.color='var(--text-muted)';e.currentTarget.style.borderColor='var(--border-dim)'}}>
            <CheckCircle size={12}/>{kateMsg||'Kate Invites'}
          </button>
          <button onClick={()=>setLightMode(l=>!l)}
            style={{ background:'transparent', border:'1px solid var(--border-dim)', borderRadius:'50%', width:36, height:36, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)', flexShrink:0, transition:'all 0.2s' }}>
            {lightMode?<Moon size={14}/>:<Sun size={14}/>}
          </button>
          <button onClick={()=>window.location.reload()} className="btn btn-amber"
            style={{ padding:'0.32rem 0.8rem', display:'flex', alignItems:'center', gap:'0.35rem' }}>
            <RefreshCw size={12}/>Refresh
          </button>
          <button onClick={onLogout} className="btn btn-ghost" style={{ display:'flex', alignItems:'center', gap:'0.3rem' }}>
            <LogOut size={12}/>
          </button>
        </div>

        {/* Mobile hamburger */}
        <div className="mobile-only" style={{ display:'flex', alignItems:'center', flexShrink:0 }}>
          <button onClick={()=>setMenuOpen(true)}
            style={{ background:'transparent', border:'1px solid var(--border-dim)', borderRadius:2, cursor:'pointer', padding:'0.42rem', display:'flex', color:'var(--text-secondary)' }}>
            <Menu size={20}/>
          </button>
        </div>
      </header>

      {/* MAIN GRID — NO greeting strip */}
      <div className="dash-grid" style={{ flex:1, overflowY:'auto', overflowX:'hidden', padding:'0.7rem', WebkitOverflowScrolling:'touch', minHeight:0 }}>
        <div style={{ gridArea:'w'    }}><WeatherPanel  onWeatherLoad={setWeather}/></div>
        <div style={{ gridArea:'c'    }}><CalendarPanel onDataLoad={setLiveEvents}/></div>
        <div style={{ gridArea:'g'    }}><GmailPanel    onDataLoad={setLiveEmails}/></div>
        <div style={{ gridArea:'t'    }}><TasksPanel    onTasksChange={setTasks}/></div>
        <div style={{ gridArea:'chat' }}><ChatPanel     dashboardContext={dashboardContext}/></div>
        <div style={{ gridArea:'news' }}><NewsPanel/></div>
        <div style={{ gridArea:'tr'   }}><TravelPanel/></div>
      </div>

      {/* Bottom status bar — no mic */}
      <JarvisBar sendMessage={null} voiceReady={false} isListening={false} isSpeaking={false} isThinking={false} lastTranscript="" onStopSpeaking={()=>{}}/>
    </div>
  )
}
