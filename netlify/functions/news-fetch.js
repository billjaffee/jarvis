// Server-side AP News RSS proxy
export const handler = async (event, context) => {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }

  // Try multiple AP/news RSS feeds in order
  const feeds = [
    'https://feeds.apnews.com/rss/topnews',
    'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
    'https://feeds.bbci.co.uk/news/rss.xml',
  ]

  for (const feedUrl of feeds) {
    try {
      const encoded = encodeURIComponent(feedUrl)
      const res = await fetch(
        `https://api.rss2json.com/v1/api.json?rss_url=${encoded}&count=10`,
        { headers: { 'User-Agent': 'Mozilla/5.0' } }
      )
      const data = await res.json()
      if (data.status === 'ok' && data.items?.length) {
        return {
          statusCode: 200,
          headers: CORS,
          body: JSON.stringify(formatItems(data.items, data.feed?.title || 'AP News')),
        }
      }
    } catch { continue }
  }

  // Final fallback: parse RSS XML directly
  try {
    const res = await fetch('https://feeds.apnews.com/rss/topnews', {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/rss+xml, application/xml' }
    })
    const xml = await res.text()
    const items = parseRSS(xml)
    if (items.length) {
      return { statusCode: 200, headers: CORS, body: JSON.stringify(items) }
    }
  } catch {}

  return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: 'All feeds failed' }) }
}

function formatItems(items, source) {
  return items.slice(0, 10).map(item => ({
    id:     item.guid || item.link,
    title:  item.title?.replace(/&amp;/g, '&').replace(/&#39;/g, "'") || '',
    source: source,
    time:   timeAgo(item.pubDate),
    url:    item.link,
  }))
}

function parseRSS(xml) {
  const items = []
  const itemMatches = xml.matchAll(/<item>([\s\S]*?)<\/item>/g)
  for (const match of itemMatches) {
    const content = match[1]
    const title   = content.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] || ''
    const link    = content.match(/<link>(.*?)<\/link>/)?.[1] || ''
    const pubDate = content.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
    if (title) items.push({ id: link, title: title.replace(/&amp;/g, '&'), source: 'AP News', time: timeAgo(pubDate), url: link })
  }
  return items.slice(0, 10)
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}
