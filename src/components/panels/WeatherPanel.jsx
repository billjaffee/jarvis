import { useState, useEffect } from 'react'
import { Cloud, Sun, CloudRain, CloudSnow } from 'lucide-react'

const LAT = 38.8339
const LON = -104.8214

function interpretCode(code) {
  if (code === 0)   return { desc: 'Clear sky',     icon: 'sun' }
  if (code <= 2)    return { desc: 'Partly cloudy', icon: 'cloud' }
  if (code <= 3)    return { desc: 'Overcast',      icon: 'cloud' }
  if (code <= 49)   return { desc: 'Foggy',         icon: 'cloud' }
  if (code <= 69)   return { desc: 'Rain',          icon: 'rain' }
  if (code <= 79)   return { desc: 'Snow',          icon: 'snow' }
  if (code <= 82)   return { desc: 'Rain showers',  icon: 'rain' }
  if (code <= 86)   return { desc: 'Snow showers',  icon: 'snow' }
  if (code <= 99)   return { desc: 'Thunderstorm',  icon: 'rain' }
  return { desc: 'Unknown', icon: 'cloud' }
}

function WeatherIcon({ type, size = 28 }) {
  const props = { size, strokeWidth: 1.5, color: 'var(--accent-cyan)' }
  if (type === 'sun')  return <Sun {...props} />
  if (type === 'rain') return <CloudRain {...props} />
  if (type === 'snow') return <CloudSnow {...props} />
  return <Cloud {...props} />
}

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function WeatherPanel({ onWeatherLoad }) {
  const [weather, setWeather] = useState(null)
  const [forecast, setForecast] = useState([])
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,apparent_temperature,weathercode,windspeed_10m,relativehumidity_2m` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode` +
      `&temperature_unit=fahrenheit&windspeed_unit=mph&timezone=America%2FDenver`
    )
      .then(r => r.json())
      .then(data => {
        const c = data.current
        const d = data.daily
        const { desc, icon } = interpretCode(c.weathercode)
        const w = {
          temp: c.temperature_2m,
          feelsLike: c.apparent_temperature,
          description: desc,
          icon,
          wind: c.windspeed_10m,
          humidity: c.relativehumidity_2m,
          high: d.temperature_2m_max[0],
          low: d.temperature_2m_min[0],
          rainChance: d.precipitation_probability_max[0],
        }
        setWeather(w)
        onWeatherLoad?.(w)

        // Build 7-day forecast (skip today at index 0)
        const fc = d.time.slice(1, 8).map((dateStr, i) => {
          const idx = i + 1
          const day = new Date(dateStr + 'T12:00:00').getDay()
          return {
            day: DAYS[day],
            high: Math.round(d.temperature_2m_max[idx]),
            low:  Math.round(d.temperature_2m_min[idx]),
            rain: d.precipitation_probability_max[idx],
            icon: interpretCode(d.weathercode[idx]).icon,
          }
        })
        setForecast(fc)
        setLoading(false)
      })
      .catch(() => { setError(true); setLoading(false) })
  }, [])

  return (
    <div className="hud-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <div className="status-dot pulse" />
        <span className="panel-title">Atmospheric</span>
        <span className="panel-badge" style={{ marginLeft: 'auto' }}>Colorado Springs</span>
      </div>

      <div style={{ flex: 1, padding: '0.8rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem', overflowY: 'auto' }}>
        {loading && <div style={{ color: 'var(--text-muted)', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.65rem' }}>Acquiring atmospheric data...</div>}
        {error   && <div style={{ color: 'var(--accent-iron)', fontSize: '0.8rem' }}>Atmospheric feed unavailable.</div>}

        {weather && (
          <>
            {/* Current conditions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <WeatherIcon type={weather.icon} size={36} />
              <div>
                <div style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '2.4rem', lineHeight: 1, color: 'var(--accent-bright)', textShadow: '0 0 20px rgba(64,224,255,0.3)' }}>
                  {Math.round(weather.temp)}°
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>{weather.description}</div>
              </div>
            </div>

            {/* Details grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
              {[
                ['Feels like', `${Math.round(weather.feelsLike)}°F`],
                ['Hi / Lo',    `${Math.round(weather.high)}° / ${Math.round(weather.low)}°`],
                ['Wind',       `${Math.round(weather.wind)} mph`],
                ['Rain %',     `${weather.rainChance}%`],
                ['Humidity',   `${weather.humidity}%`],
              ].map(([label, val]) => (
                <div key={label} style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 1, padding: '0.3rem 0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{val}</span>
                </div>
              ))}
            </div>

            {/* 7-day forecast */}
            {forecast.length > 0 && (
              <div>
                <div style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  7-Day Forecast
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {forecast.map(f => (
                    <div key={f.day} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.25rem 0.4rem', background: 'rgba(0,0,0,0.2)', borderRadius: 1 }}>
                      <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.68rem', color: 'var(--text-muted)', width: 28, flexShrink: 0 }}>{f.day}</span>
                      <WeatherIcon type={f.icon} size={13} />
                      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem' }}>
                        {f.rain > 20 && <span style={{ fontSize: '0.62rem', color: 'var(--accent-cyan)' }}>{f.rain}%</span>}
                        <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.7rem', color: 'var(--accent-bright)' }}>{f.high}°</span>
                        <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.68rem', color: 'var(--text-muted)' }}>{f.low}°</span>
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
