import { useState, useEffect } from 'react'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { MOCK_NEWS } from '../../data/mockData'

// AP News RSS via rss2json (free, no key for personal use)
const RSS_URL = 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Frss.ap.org%2Farticle%2Ftopnews'

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NewsPanel() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [usingMock, setUsingMock] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchNews = async () => {
    try {
      const res = await fetch(RSS_URL)
      const data = await res.json()
      if (data.status === 'ok' && data.items?.length) {
        setArticles(data.items.slice(0, 8).map(item => ({
          id: item.guid,
          title: item.title,
          source: 'AP News',
          time: timeAgo(item.pubDate),
          url: item.link,
        })))
        setUsingMock(false)
      } else {
        throw new Error('Bad response')
      }
    } catch {
      setArticles(MOCK_NEWS)
      setUsingMock(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { fetchNews() }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchNews()
  }

  return (
    <div className="hud-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <div className={`status-dot ${usingMock ? 'offline' : 'pulse'}`} />
        <span className="panel-title">Headlines</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {usingMock && (
            <span style={{
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: '0.55rem',
              color: 'var(--text-muted)',
            }}>
              Mock
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              padding: '0.1rem',
            }}
          >
            <RefreshCw
              size={11}
              style={{
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
              }}
            />
          </button>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && (
          <div style={{
            padding: '1rem',
            color: 'var(--text-muted)',
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: '0.65rem',
          }}>
            Acquiring signal...
          </div>
        )}

        {articles.map((article, i) => (
          <a
            key={article.id || i}
            href={article.url !== '#' ? article.url : undefined}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              padding: '0.55rem 0.9rem',
              borderBottom: '1px solid var(--border-dim)',
              textDecoration: 'none',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(185,122,8,0.06)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'flex-start' }}>
              <span style={{
                fontFamily: 'Share Tech Mono, monospace',
                fontSize: '0.55rem',
                color: 'var(--accent-gold)',
                flexShrink: 0,
                marginTop: '0.2rem',
                minWidth: 16,
              }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-primary)',
                  lineHeight: 1.35,
                  marginBottom: '0.2rem',
                }}>
                  {article.title}
                </div>
                <div style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'center',
                }}>
                  <span style={{
                    fontSize: '0.6rem',
                    color: 'var(--text-muted)',
                    fontFamily: 'Share Tech Mono, monospace',
                  }}>
                    {article.source} · {article.time}
                  </span>
                  {article.url !== '#' && (
                    <ExternalLink size={9} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  )}
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
