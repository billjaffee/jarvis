export const handler = async (event, context) => {
  const CORS = { 'Access-Control-Allow-Origin':'*', 'Content-Type':'application/json' }
  const key  = process.env.NEWSAPI_KEY

  if (!key) {
    return {
      statusCode: 200, headers: CORS,
      body: JSON.stringify([
        { id:'setup', title:'Add NEWSAPI_KEY to Netlify env vars to enable live headlines', source:'Setup Required', time:'', url:'https://newsapi.org/register' },
      ])
    }
  }

  try {
    const res = await fetch(
      `https://newsapi.org/v2/top-headlines?country=us&pageSize=10&apiKey=${key}`,
      { headers: { 'User-Agent': 'JarvisDashboard/1.0' } }
    )
    const data = await res.json()
    if (data.status !== 'ok') throw new Error(data.message || 'API error')

    const articles = (data.articles || [])
      .filter(a => a.title && a.title !== '[Removed]')
      .slice(0, 10)
      .map((a, i) => ({
        id:     a.url || String(i),
        title:  a.title.replace(/\s*-\s*[^-]+$/, '').trim(),
        source: a.source?.name || 'News',
        time:   timeAgo(a.publishedAt),
        url:    a.url || '',
      }))

    return { statusCode: 200, headers: CORS, body: JSON.stringify(articles) }
  } catch (err) {
    console.error('news-fetch error:', err)
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) }
  }
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  return `${Math.floor(diff/86400)}d ago`
}
