import { useState, useEffect } from 'react'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { MOCK_NEWS } from '../../data/mockData'

export default function NewsPanel() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [live, setLive] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchNews = async () => {
    try {
      const res = await fetch('/.netlify/functions/news-fetch')
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        setArticles(data); setLive(true)
      } else throw new Error('empty')
    } catch {
      setArticles(MOCK_NEWS); setLive(false)
    } finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { fetchNews() }, [])
  const handleRefresh = () => { setRefreshing(true); fetchNews() }

  return (
    <div className="hud-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <div className={`status-dot ${live ? 'pulse' : 'offline'}`} />
        <span className="panel-title">Headlines</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {!live && <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.58rem', color: 'var(--text-muted)' }}>Mock</span>}
          <button onClick={handleRefresh} disabled={refreshing} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: '0.1rem' }}>
            <RefreshCw size={11} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && <div style={{ padding: '1rem', color: 'var(--text-muted)', fontFamily: 'Share Tech Mono, monospace', fontSize: '0.65rem' }}>Acquiring signal...</div>}

        {articles.map((article, i) => (
          <a key={article.id || i} href={article.url !== '#' ? article.url : undefined}
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'block', padding: '0.55rem 0.9rem', borderBottom: '1px solid var(--border-dim)', textDecoration: 'none', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,160,220,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
              <span style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: '0.6rem', color: 'var(--accent-blue)', flexShrink: 0, marginTop: '0.2rem', minWidth: 18 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.35, marginBottom: '0.2rem' }}>
                  {article.title}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', fontFamily: 'Share Tech Mono, monospace' }}>
                    {article.source} · {article.time}
                  </span>
                  {article.url !== '#' && <ExternalLink size={9} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
