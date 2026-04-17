import { useState, useEffect } from 'react'
import netlifyIdentity from 'netlify-identity-widget'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

netlifyIdentity.init()

export default function App() {
  const [user, setUser] = useState(netlifyIdentity.currentUser())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    netlifyIdentity.on('init', u => {
      setUser(u)
      setLoading(false)
    })
    netlifyIdentity.on('login', u => {
      setUser(u)
      netlifyIdentity.close()
    })
    netlifyIdentity.on('logout', () => setUser(null))
    netlifyIdentity.on('error', () => setLoading(false))

    // Safety fallback
    const timeout = setTimeout(() => setLoading(false), 3000)
    return () => {
      clearTimeout(timeout)
      netlifyIdentity.off('login')
      netlifyIdentity.off('logout')
      netlifyIdentity.off('init')
    }
  }, [])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0906',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ fontFamily: 'Rajdhani, sans-serif', color: '#d98f14', letterSpacing: '0.3em', fontSize: '0.8rem' }}>
          INITIALIZING SYSTEMS
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width: 6, height: 6, borderRadius: '50%',
              background: '#c8830a',
              animation: `dot-pulse 1.2s ease-in-out ${i * 0.2}s infinite`
            }} />
          ))}
        </div>
      </div>
    )
  }

  if (!user) return <Login onLogin={() => netlifyIdentity.open('login')} />
  return <Dashboard user={user} onLogout={() => netlifyIdentity.logout()} />
}
