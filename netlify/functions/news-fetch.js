export const handler = async (event, context) => {
  const CORS = { 'Access-Control-Allow-Origin':'*','Content-Type':'application/json' }

  const feeds = [
    { url:'https://gazette.com/search/?f=rss&t=article&c=news&l=50&s=start_time&sd=desc', source:'CS Gazette' },
    { url:'https://feeds.apnews.com/rss/topnews', source:'AP News' },
    { url:'https://feeds.a.dj.com/rss/RSSWorldNews.xml', source:'WSJ' },
    { url:'https://feeds.a.dj.com/rss/WSJcomUSBusiness.xml', source:'WSJ' },
  ]

  const articles = []

  for (const { url, source } of feeds) {
    try {
      const encoded = encodeURIComponent(url)
      const res = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encoded}&count=4`, {
        headers: { 'User-Agent':'Mozilla/5.0' }
      })
      const data = await res.json()
      if (data.status === 'ok' && data.items?.length) {
        for (const item of data.items.slice(0, 4)) {
          articles.push({
            id:     item.guid || item.link,
            title:  item.title?.replace(/&amp;/g,'&').replace(/&#39;/g,"'") || '',
            source,
            time:   timeAgo(item.pubDate),
            url:    item.link,
          })
        }
      }
    } catch {}
  }

  // If RSS2JSON failed for Gazette, try direct XML
  if (articles.filter(a=>a.source==='CS Gazette').length === 0) {
    try {
      const res = await fetch('https://gazette.com/search/?f=rss&t=article&c=news', { headers:{'User-Agent':'Mozilla/5.0'} })
      const xml  = await res.text()
      const items = parseRSS(xml, 'CS Gazette')
      articles.unshift(...items)
    } catch {}
  }

  // Dedupe and limit to 10
  const seen  = new Set()
  const final = []
  for (const a of articles) {
    if (!seen.has(a.title) && a.title) { seen.add(a.title); final.push(a) }
    if (final.length >= 10) break
  }

  if (final.length === 0) return { statusCode:500, headers:CORS, body:JSON.stringify({ error:'All feeds failed' }) }
  return { statusCode:200, headers:CORS, body:JSON.stringify(final) }
}

function parseRSS(xml, source) {
  const items = []
  for (const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)) {
    const c     = m[1]
    const title = c.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] || ''
    const link  = c.match(/<link>(.*?)<\/link>/)?.[1] || ''
    const date  = c.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
    if (title) items.push({ id:link, title:title.replace(/&amp;/g,'&'), source, time:timeAgo(date), url:link })
  }
  return items.slice(0,4)
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  return `${Math.floor(diff/86400)}d ago`
}
