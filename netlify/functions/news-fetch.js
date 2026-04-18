// Server-side AP News RSS proxy — avoids CORS issues
export const handler = async (event, context) => {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }

  try {
    const res = await fetch(
      'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Frsshub.app%2Fap%2Ftopnews&count=8',
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    const data = await res.json()

    if (data.status !== 'ok' || !data.items?.length) {
      // Fallback: try AP directly
      const res2 = await fetch(
        'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Ffeeds.feedburner.com%2FAP-TopHeadlines&count=8',
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      )
      const data2 = await res2.json()
      if (data2.status === 'ok' && data2.items?.length) {
        return { statusCode: 200, headers: CORS, body: JSON.stringify(formatItems(data2.items)) }
      }
      throw new Error('No RSS data')
    }

    return { statusCode: 200, headers: CORS, body: JSON.stringify(formatItems(data.items)) }
  } catch (err) {
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) }
  }
}

function formatItems(items) {
  return items.slice(0, 8).map(item => ({
    id:     item.guid || item.link,
    title:  item.title,
    source: 'AP News',
    time:   timeAgo(item.pubDate),
    url:    item.link,
  }))
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}
