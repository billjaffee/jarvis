import { useState, useEffect } from 'react'
import { Cloud, Sun, CloudRain, CloudSnow, ExternalLink } from 'lucide-react'

const LAT = 38.8339, LON = -104.8214
const WEATHER_URL = 'https://forecast.weather.gov/MapClick.php?CityName=Colorado+Springs&state=CO&site=PUB&textField1=38.8339&textField2=-104.8214'

function interpretCode(code) {
  if (code===0)   return { desc:'Clear sky',     icon:'sun'   }
  if (code<=2)    return { desc:'Partly cloudy', icon:'cloud' }
  if (code<=3)    return { desc:'Overcast',      icon:'cloud' }
  if (code<=49)   return { desc:'Foggy',         icon:'cloud' }
  if (code<=69)   return { desc:'Rain',          icon:'rain'  }
  if (code<=79)   return { desc:'Snow',          icon:'snow'  }
  if (code<=82)   return { desc:'Rain showers',  icon:'rain'  }
  if (code<=86)   return { desc:'Snow showers',  icon:'snow'  }
  if (code<=99)   return { desc:'Thunderstorm',  icon:'rain'  }
  return { desc:'Unknown', icon:'cloud' }
}

function WIcon({ type, size=28 }) {
  const p = { size, strokeWidth:1.5, color:'var(--accent-cyan)' }
  if (type==='sun')  return <Sun {...p}/>
  if (type==='rain') return <CloudRain {...p}/>
  if (type==='snow') return <CloudSnow {...p}/>
  return <Cloud {...p}/>
}

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function WeatherPanel({ onWeatherLoad }) {
  const [wx, setWx]         = useState(null)
  const [forecast, setFc]   = useState([])
  const [error, setError]   = useState(false)
  const [loading, setLoad]  = useState(true)

  useEffect(() => {
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,apparent_temperature,weathercode,windspeed_10m,relativehumidity_2m` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode` +
      `&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=America%2FDenver`
    )
      .then(r=>r.json())
      .then(data => {
        const c=data.current, d=data.daily
        const {desc,icon}=interpretCode(c.weathercode)
        const w = { temp:c.temperature_2m, feelsLike:c.apparent_temperature, description:desc, icon, wind:c.windspeed_10m, humidity:c.relativehumidity_2m, high:d.temperature_2m_max[0], low:d.temperature_2m_min[0], rainChance:d.precipitation_probability_max[0] }
        setWx(w); onWeatherLoad?.(w)
        const fc = d.time.slice(1,8).map((dateStr,i) => {
          const idx=i+1, day=new Date(dateStr+'T12:00:00').getDay()
          return { day:DAYS[day], high:Math.round(d.temperature_2m_max[idx]), low:Math.round(d.temperature_2m_min[idx]), rain:d.precipitation_probability_max[idx], icon:interpretCode(d.weathercode[idx]).icon }
        })
        setFc(fc); setLoad(false)
      })
      .catch(()=>{ setError(true); setLoad(false) })
  },[])

  return (
    <div className="hud-panel" style={{ height:'100%', display:'flex', flexDirection:'column' }}>
      <div className="panel-header">
        <div className="status-dot pulse"/>
        <span className="panel-title">Atmospheric</span>
        <a href={WEATHER_URL} target="_blank" rel="noopener noreferrer"
          style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:'0.35rem', color:'var(--text-muted)', textDecoration:'none', fontFamily:'Share Tech Mono,monospace', fontSize:'0.78rem', transition:'color 0.2s' }}
          onMouseEnter={e=>e.currentTarget.style.color='var(--accent-cyan)'}
          onMouseLeave={e=>e.currentTarget.style.color='var(--text-muted)'}>
          Colorado Springs <ExternalLink size={11}/>
        </a>
      </div>

      <div style={{ flex:1, padding:'0.9rem 1.1rem', display:'flex', flexDirection:'column', gap:'0.8rem', overflowY:'auto' }}>
        {loading && <div style={{ color:'var(--text-muted)', fontFamily:'Share Tech Mono,monospace', fontSize:'0.78rem' }}>Acquiring atmospheric data...</div>}
        {error   && <div style={{ color:'var(--accent-iron)', fontSize:'0.88rem' }}>Atmospheric feed unavailable.</div>}

        {wx && (
          <>
            {/* Current */}
            <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
              <WIcon type={wx.icon} size={44}/>
              <div>
                <div className="wx-temp" style={{ fontFamily:'Rajdhani,sans-serif', fontWeight:700, lineHeight:1, color:'var(--accent-bright)', textShadow:'0 0 20px rgba(64,224,255,0.3)' }}>
                  {Math.round(wx.temp)}°
                </div>
                <div className="wx-desc" style={{ color:'var(--text-secondary)', marginTop:3 }}>{wx.description}</div>
              </div>
            </div>

            {/* Details grid */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.4rem' }}>
              {[['Feels like',`${Math.round(wx.feelsLike)}°F`],['Hi / Lo',`${Math.round(wx.high)}° / ${Math.round(wx.low)}°`],['Wind',`${Math.round(wx.wind)} mph`],['Rain %',`${wx.rainChance}%`],['Humidity',`${wx.humidity}%`]].map(([label,val])=>(
                <div key={label} style={{ background:'rgba(0,0,0,0.25)', borderRadius:1, padding:'0.35rem 0.6rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span className="wx-label" style={{ color:'var(--text-muted)' }}>{label}</span>
                  <span className="wx-val"   style={{ fontFamily:'Share Tech Mono,monospace', color:'var(--text-secondary)' }}>{val}</span>
                </div>
              ))}
            </div>

            {/* 7-day forecast */}
            {forecast.length > 0 && (
              <div>
                <div className="wx-section" style={{ fontFamily:'Share Tech Mono,monospace', color:'var(--text-muted)', textTransform:'uppercase', marginBottom:'0.45rem' }}>7-Day Forecast</div>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                  {forecast.map(f=>(
                    <div key={f.day} style={{ display:'flex', alignItems:'center', gap:'0.7rem', padding:'0.3rem 0.5rem', background:'rgba(0,0,0,0.2)', borderRadius:1 }}>
                      <span className="wx-day" style={{ fontFamily:'Share Tech Mono,monospace', color:'var(--text-muted)', width:32, flexShrink:0 }}>{f.day}</span>
                      <WIcon type={f.icon} size={15}/>
                      <div style={{ flex:1, display:'flex', justifyContent:'flex-end', alignItems:'center', gap:'0.6rem' }}>
                        {f.rain>20 && <span style={{ fontSize:'0.76rem', color:'var(--accent-cyan)' }}>{f.rain}%</span>}
                        <span className="wx-hi" style={{ fontFamily:'Share Tech Mono,monospace', color:'var(--accent-bright)' }}>{f.high}°</span>
                        <span className="wx-day" style={{ fontFamily:'Share Tech Mono,monospace', color:'var(--text-muted)' }}>{f.low}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
