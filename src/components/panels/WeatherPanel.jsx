import { useState, useEffect } from 'react'
import { Cloud, Sun, CloudRain, CloudSnow, Wind, Thermometer, Eye } from 'lucide-react'

const LAT = 38.8339
const LON = -104.8214

// WMO weather code → description + icon
function interpretCode(code) {
  if (code === 0)        return { desc: 'Clear sky',        icon: 'sun' }
  if (code <= 2)         return { desc: 'Partly cloudy',    icon: 'cloud' }
  if (code <= 3)         return { desc: 'Overcast',         icon: 'cloud' }
  if (code <= 49)        return { desc: 'Foggy',            icon: 'cloud' }
  if (code <= 59)        return { desc: 'Drizzle',          icon: 'rain' }
  if (code <= 69)        return { desc: 'Rain',             icon: 'rain' }
  if (code <= 79)        return { desc: 'Snow',             icon: 'snow' }
  if (code <= 82)        return { desc: 'Rain showers',     icon: 'rain' }
  if (code <= 86)        return { desc: 'Snow showers',     icon: 'snow' }
  if (code <= 99)        return { desc: 'Thunderstorm',     icon: 'rain' }
  return { desc: 'Unknown', icon: 'cloud' }
}

function WeatherIcon({ type, size = 28 }) {
  const props = { size, strokeWidth: 1.5, color: 'var(--accent-bright)' }
  if (type === 'sun')   return <Sun {...props} />
  if (type === 'rain')  return <CloudRain {...props} />
  if (type === 'snow')  return <CloudSnow {...props} />
  return <Cloud {...props} />
}

export default function WeatherPanel({ onWeatherLoad }) {
  const [weather, setWeather] = useState(null)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      `&current=temperature_2m,apparent_temperature,weathercode,windspeed_10m,relativehumidity_2m,visibility` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
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
          visibility: c.visibility,
          high: d.temperature_2m_max[0],
          low: d.temperature_2m_min[0],
          rainChance: d.precipitation_probability_max[0],
        }
        setWeather(w)
        onWeatherLoad?.(w)
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

      <div style={{ flex: 1, padding: '0.9rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
        {loading && (
          <div style={{ color: 'var(--text-muted)', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.65rem' }}>
            Acquiring atmospheric data...
          </div>
        )}

        {error && (
          <div style={{ color: 'var(--accent-iron)', fontSize: '0.75rem' }}>
            Atmospheric feed unavailable.
          </div>
        )}

        {weather && (
          <>
            {/* Main temp */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <WeatherIcon type={weather.icon} size={36} />
              <div>
                <div style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  fontWeight: 700,
                  fontSize: '2.2rem',
                  lineHeight: 1,
                  color: 'var(--accent-bright)',
                  textShadow: '0 0 20px rgba(245,173,40,0.3)',
                }}>
                  {Math.round(weather.temp)}°
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                  {weather.description}
                </div>
              </div>
            </div>

            {/* Feels like + hi/lo */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.4rem',
            }}>
              {[
                ['Feels like', `${Math.round(weather.feelsLike)}°F`],
                ['Hi / Lo', `${Math.round(weather.high)}° / ${Math.round(weather.low)}°`],
                ['Wind', `${Math.round(weather.wind)} mph`],
                ['Rain %', `${weather.rainChance}%`],
                ['Humidity', `${weather.humidity}%`],
              ].map(([label, val]) => (
                <div key={label} style={{
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: 1,
                  padding: '0.3rem 0.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{label}</span>
                  <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.68rem', color: 'var(--text-secondary)' }}>{val}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
