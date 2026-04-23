import { useState, useEffect } from 'react'
import { LogOut, RefreshCw, Zap, TrendingUp, TrendingDown, Sun, Moon, CheckCircle, Menu, X } from 'lucide-react'
import WeatherPanel  from './panels/WeatherPanel'
import CalendarPanel from './panels/CalendarPanel'
import GmailPanel    from './panels/GmailPanel'
import TasksPanel    from './panels/TasksPanel'
import NewsPanel     from './panels/NewsPanel'
import ChatPanel     from './panels/ChatPanel'
const ZONES=[{label:'NYC',tz:'America/New_York'},{label:'MPLS',tz:'America/Chicago'},{label:'LA',tz:'America/Los_Angeles'}]
export default function Dashboard({user,onLogout}){
const[weather,setWeather]=useState(null),[tasks,setTasks]=useState([]),[notes,setNotes]=useState(''),[liveEmails,setLiveEmails]=useState([]),[liveEvents,setLiveEvents]=useState([]),[tickers,setTickers]=useState([]),[time,setTime]=useState(new Date()),[lightMode,setLightMode]=useState(false),[menuOpen,setMenuOpen]=useState(false),[kateMsg,setKateMsg]=useState('')
useEffect(()=>{const t=setInterval(()=>setTime(new Date()),1000);return()=>clearInterval(t)},[])
useEffect(()=>{document.documentElement.setAttribute('data-theme',lightMode?'light':'dark')},[lightMode])
useEffect(()=>{const go=async()=>{try{const r=await fetch('/.netlify/functions/stock-fetch');if(r.ok)setTickers(await r.json())}catch{}};go();const t=setInterval(go,60000);return()=>clearInterval(t)},[])
const handleAcceptKate=async()=>{try{const res=await fetch('/.netlify/functions/calendar-accept',{method:'POST'});const data=await res.json();setKateMsg(data.count>0?`Accepted ${data.count}`:'No pending')}catch{setKateMsg('Error')}finally{setTimeout(()=>setKateMsg(''),3000)}}
const dashboardContext={weather,events:liveEvents,emails:liveEmails,tasks,notes,tickers}
const timeStr=time.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/Denver'})
const dateStr=time.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',timeZone:'America/Denver'})
const dateMobile=time.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',timeZone:'America/Denver'})
return(<div style={{display:'flex',flexDirection:'column',height:'100dvh',width:'100vw',maxWidth:'100vw',overflow:'hidden',background:'var(--bg-root)'}}>
<style>{`
[data-theme="light"]{--bg-root:#ddeef7;--bg-panel:#fff;--text-primary:#050f18;--text-secondary:#0a3050;--text-muted:#4a7a95;--accent-cyan:#0090c0;--accent-bright:#0078a8;--accent-green:#008855;--border-dim:rgba(0,110,160,0.22);--border-mid:rgba(0,140,190,0.4);--glow-sm:0 1px 6px rgba(0,0,0,0.09);}
[data-theme="light"] body{background:#ddeef7;}[data-theme="light"] body::after{display:none;}[data-theme="light"] .hud-panel{box-shadow:0 2px 12px rgba(0,0,0,0.09);}
@keyframes spin{to{transform:rotate(360deg)}}@keyframes dot-pulse{0%,100%{opacity:1}50%{opacity:.4}}
.mmenu{position:fixed;inset:0;z-index:9000;background:rgba(1,10,20,0.98);backdrop-filter:blur(20px);display:flex;flex-direction:column;padding-top:max(env(safe-area-inset-top,0px),16px);padding-bottom:max(env(safe-area-inset-bottom,24px),24px);overflow-y:auto;}
.mmb{background:transparent;border:0;border-bottom:1px solid var(--border-dim);color:var(--text-primary);font-family:'Rajdhani',sans-serif;font-size:1.3rem;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;padding:1.1rem 1.5rem;cursor:pointer;display:flex;align-items:center;gap:0.9rem;width:100%;text-align:left;-webkit-tap-highlight-color:transparent;}
.mmb:active{background:rgba(0,200,240,0.1);}
.dgrid{display:grid;gap:0.7rem;padding:0.7rem;grid-template-columns:repeat(12,1fr);grid-template-rows:minmax(460px,1fr) minmax(360px,1fr);grid-template-areas:"w w w c c c g g g g g g" "t t t t chat chat chat news news news news news";flex:1;overflow-y:auto;overflow-x:hidden;min-height:0;}
@media(max-width:1024px) and (min-width:601px){.dgrid{grid-template-columns:1fr 1fr!important;grid-template-rows:auto!important;grid-template-areas:"w c""g g""t chat""news news"!important;}.dgrid>div{min-height:320px;}}
@media(max-width:600px){
  body,#root{overflow-x:hidden!important;max-width:100vw!important;}
  .hud-panel{max-width:100%!important;}
  .dgrid{grid-template-columns:1fr!important;grid-template-rows:auto!important;grid-template-areas:"w""c""g""t""chat""news"!important;padding:0.5rem!important;gap:0.5rem!important;}
  .dgrid>div{min-height:280px;}
  .dsk{display:none!important;}.mbl{display:flex!important;}
}
.tkr::-webkit-scrollbar{display:none;}.tkr{-ms-overflow-style:none;scrollbar-width:none;}
`}</style>
{menuOpen&&(<div className="mmenu">
<div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'1rem 1.5rem',borderBottom:'1px solid var(--border-dim)'}}>
<span style={{fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:'1.4rem',letterSpacing:'0.25em',color:'var(--accent-bright)'}}>J.A.R.V.I.S.</span>
<button onClick={()=>setMenuOpen(false)} style={{background:'transparent',border:'none',cursor:'pointer',color:'var(--text-muted)',padding:'0.3rem',display:'flex'}}><X size={26}/></button>
</div>
<div style={{padding:'1.2rem 1.5rem',borderBottom:'1px solid var(--border-dim)'}}>
<div style={{fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:'2rem',color:'var(--accent-cyan)',lineHeight:1}}>{timeStr} <span style={{fontSize:'0.85rem',color:'var(--text-muted)'}}>MT</span></div>
<div style={{fontFamily:'Share Tech Mono,monospace',fontSize:'0.72rem',color:'var(--text-muted)',marginTop:4}}>{dateStr.toUpperCase()}</div>
<div style={{display:'flex',gap:'1.2rem',marginTop:'0.6rem'}}>
{ZONES.map(z=>(<div key={z.label} style={{display:'flex',flexDirection:'column',gap:2}}><span style={{fontFamily:'Share Tech Mono,monospace',fontSize:'0.6rem',color:'var(--text-muted)'}}>{z.label}</span><span style={{fontFamily:'Share Tech Mono,monospace',fontSize:'0.78rem',color:'var(--text-secondary)'}}>{time.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:z.tz})}</span></div>))}
</div></div>
<button className="mmb" onClick={()=>{handleAcceptKate();setMenuOpen(false)}}><CheckCircle size={22}/>{kateMsg||"Accept Kate's Invites"}</button>
<button className="mmb" onClick={()=>{setLightMode(l=>!l);setMenuOpen(false)}}>{lightMode?<Moon size={22}/>:<Sun size={22}/>}{lightMode?'Dark Mode':'Light Mode'}</button>
<button className="mmb" onClick={()=>{window.location.reload();setMenuOpen(false)}}><RefreshCw size={22}/>Refresh</button>
<button className="mmb" onClick={()=>{onLogout();setMenuOpen(false)}} style={{color:'#e05c20',marginTop:'auto'}}><LogOut size={22}/>Sign Out</button>
</div>)}
{tickers.length>0&&(<div className="tkr" style={{background:'rgba(0,0,0,0.6)',borderBottom:'1px solid var(--border-dim)',height:32,flexShrink:0,display:'flex',alignItems:'center',gap:'1.8rem',paddingLeft:'max(env(safe-area-inset-left,0.8rem),0.8rem)',paddingRight:'max(env(safe-area-inset-right,0.8rem),0.8rem)',overflowX:'auto',WebkitOverflowScrolling:'touch',justifyContent:'center'}}>
{tickers.map(t=>{const sym=t.symbol.startsWith('^')?t.symbol.replace('^','%5E'):t.symbol;return(<a key={t.symbol} href={`https://finance.yahoo.com/quote/${sym}`} target="_blank" rel="noopener noreferrer" style={{display:'flex',alignItems:'center',gap:'0.4rem',flexShrink:0,textDecoration:'none'}}><span style={{fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:'0.85rem',color:'var(--accent-cyan)'}}>{t.label}</span><span style={{fontFamily:'Share Tech Mono,monospace',fontSize:'0.82rem',color:'#fff'}}>{t.price?(t.symbol.startsWith('^')?Number(t.price).toLocaleString():`$${t.price}`):'—'}</span>{t.pct!==null&&(<span style={{fontFamily:'Share Tech Mono,monospace',fontSize:'0.75rem',color:t.up?'var(--accent-green)':'var(--accent-iron)',display:'flex',alignItems:'center',gap:1}}>{t.up?<TrendingUp size={9}/>:<TrendingDown size={9}/>}{t.up?'+':''}{t.pct}%</span>)}</a>)})}
</div>)}
<header style={{position:'relative',display:'flex',alignItems:'center',paddingTop:'env(safe-area-inset-top,0px)',paddingLeft:'max(env(safe-area-inset-left,1rem),1rem)',paddingRight:'max(env(safe-area-inset-right,1rem),1rem)',minHeight:60,borderBottom:'1px solid var(--border-dim)',background:'var(--bg-panel)',flexShrink:0,zIndex:10,overflow:'hidden'}}>
<div style={{display:'flex',alignItems:'center',gap:'0.45rem',flexShrink:0,zIndex:2}}><Zap size={18} style={{color:'var(--accent-bright)'}}/><span style={{fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:'1.3rem',letterSpacing:'0.22em',color:'var(--accent-bright)',whiteSpace:'nowrap'}}>J.A.R.V.I.S.</span></div>
<div style={{position:'absolute',left:0,right:0,top:'env(safe-area-inset-top,0px)',bottom:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',pointerEvents:'none',zIndex:1,padding:'0 180px'}}>
<div className="dsk" style={{textAlign:'center'}}><div style={{fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:'1.85rem',color:'var(--accent-cyan)',lineHeight:1}}>{timeStr} <span style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>MT</span></div><div style={{fontFamily:'Share Tech Mono,monospace',fontSize:'0.6rem',color:'var(--text-muted)',marginTop:2}}>{dateStr.toUpperCase()}</div><div style={{display:'flex',justifyContent:'center',gap:'1rem',marginTop:'0.2rem'}}>{ZONES.map(z=>(<div key={z.label} style={{display:'flex',gap:'0.25rem',alignItems:'center'}}><span style={{fontFamily:'Share Tech Mono,monospace',fontSize:'0.56rem',color:'var(--text-muted)'}}>{z.label}</span><span style={{fontFamily:'Share Tech Mono,monospace',fontSize:'0.62rem',color:'var(--text-secondary)'}}>{time.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:z.tz})}</span></div>))}</div></div>
<div style={{display:'none',textAlign:'center'}} className="mbl"><div style={{fontFamily:'Rajdhani,sans-serif',fontWeight:700,fontSize:'1.45rem',color:'var(--accent-cyan)',lineHeight:1}}>{timeStr} <span style={{fontSize:'0.68rem',color:'var(--text-muted)'}}>MT</span></div><div style={{fontFamily:'Share Tech Mono,monospace',fontSize:'0.56rem',color:'var(--text-muted)',marginTop:1}}>{dateMobile.toUpperCase()}</div></div>
</div>
<div className="dsk" style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:'0.6rem',flexShrink:0,zIndex:2}}>
<button onClick={handleAcceptKate} style={{background:'transparent',border:'1px solid var(--border-dim)',borderRadius:1,cursor:'pointer',padding:'0.28rem 0.55rem',display:'flex',alignItems:'center',gap:'0.25rem',color:'var(--text-muted)',fontFamily:'Rajdhani,sans-serif',fontSize:'0.72rem',fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',whiteSpace:'nowrap'}} onMouseEnter={e=>{e.currentTarget.style.color='var(--accent-green)';e.currentTarget.style.borderColor='var(--accent-green)'}} onMouseLeave={e=>{e.currentTarget.style.color='var(--text-muted)';e.currentTarget.style.borderColor='var(--border-dim)'}}><CheckCircle size={11}/>{kateMsg||'Kate Invites'}</button>
<button onClick={()=>setLightMode(l=>!l)} style={{background:'transparent',border:'1px solid var(--border-dim)',borderRadius:'50%',width:34,height:34,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-secondary)'}}>{lightMode?<Moon size={13}/>:<Sun size={13}/>}</button>
<button onClick={()=>window.location.reload()} className="btn btn-amber" style={{padding:'0.28rem 0.75rem',display:'flex',alignItems:'center',gap:'0.3rem',fontSize:'0.8rem'}}><RefreshCw size={11}/>Refresh</button>
<button onClick={onLogout} className="btn btn-ghost" style={{display:'flex',alignItems:'center',gap:'0.3rem'}}><LogOut size={11}/></button>
</div>
<button className="mbl" onClick={()=>setMenuOpen(true)} style={{marginLeft:'auto',background:'transparent',border:'1px solid var(--border-dim)',borderRadius:3,cursor:'pointer',padding:'0.4rem 0.45rem',display:'none',color:'var(--text-secondary)',alignItems:'center',justifyContent:'center',flexShrink:0,zIndex:2,WebkitTapHighlightColor:'transparent'}}><Menu size={20}/></button>
</header>
<div className="dgrid">
<div style={{gridArea:'w'}}><WeatherPanel onWeatherLoad={setWeather}/></div>
<div style={{gridArea:'c'}}><CalendarPanel onDataLoad={setLiveEvents}/></div>
<div style={{gridArea:'g'}}><GmailPanel onDataLoad={setLiveEmails}/></div>
<div style={{gridArea:'t'}}><TasksPanel onTasksChange={setTasks}/></div>
<div style={{gridArea:'chat'}}><ChatPanel dashboardContext={dashboardContext}/></div>
<div style={{gridArea:'news'}}><NewsPanel/></div>
</div>
</div>)
}
