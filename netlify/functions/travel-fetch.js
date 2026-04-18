// Scans Gmail non-primary tabs (Promotions, Updates, Social) for travel info
export const handler = async (event, context) => {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id:     process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
        grant_type:    'refresh_token',
      }),
    })
    const { access_token, error: tokenError } = await tokenRes.json()
    if (tokenError || !access_token) throw new Error(`Token error: ${tokenError}`)
    const auth = { Authorization: `Bearer ${access_token}` }

    // Search across ALL inbox tabs EXCEPT primary (CATEGORY_PERSONAL)
    // This hits Promotions, Updates, Social, Forums where travel emails land
    const query = [
      'in:inbox',
      '-label:CATEGORY_PERSONAL',
      'newer_than:90d',
      '(',
        'subject:(flight OR itinerary OR "boarding pass" OR reservation OR',
        '"travel confirmation" OR airline OR hotel OR "check-in" OR',
        '"your trip" OR "booking confirmation" OR "e-ticket" OR departure OR arrival)',
        'OR from:(united.com OR delta.com OR aa.com OR southwest.com OR',
        'alaskaair.com OR jetblue.com OR spirit.com OR frontier.com OR',
        'booking.com OR expedia.com OR hotels.com OR airbnb.com OR',
        'marriott.com OR hilton.com OR hyatt.com OR ihg.com OR',
        'tripadvisor.com OR kayak.com OR priceline.com OR hotwire.com)',
      ')',
    ].join(' ')

    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=25&q=${encodeURIComponent(query)}`,
      { headers: auth }
    )
    const listData = await listRes.json()
    const messages = listData.messages || []

    const trips = []
    for (const { id } of messages.slice(0, 10)) {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata` +
        `&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: auth }
      )
      const msg     = await msgRes.json()
      const headers = msg.payload?.headers || []
      const get     = name => headers.find(h => h.name === name)?.value || ''
      const subject = get('Subject')
      const from    = get('From')
      const date    = get('Date')
      const snippet = msg.snippet || ''

      const flightMatch  = snippet.match(/\b([A-Z]{2}\d{3,4})\b/)
      const dateMatch    = snippet.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s+\d{1,2}(?:,?\s+\d{4})?\b/i)
      const airportMatch = snippet.match(/\b([A-Z]{3})\s*(?:→|->|to|-)\s*([A-Z]{3})\b/)
      const isHotel      = /hotel|stay|check.in|check.out|resort|inn/i.test(subject + snippet)
      const isFlight     = /flight|airline|boarding|depart|arrival|e-ticket/i.test(subject + snippet)
      const type         = isHotel ? 'hotel' : isFlight ? 'flight' : 'travel'

      // Clean up sender name
      const fromName = from.replace(/<[^>]+>/, '').replace(/"/g, '').trim() ||
        from.split('@')[0]

      trips.push({
        id, subject, from: fromName, type,
        date: dateMatch?.[0] || new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        snippet: snippet.replace(/&#39;/g, "'").replace(/&amp;/g, '&').slice(0, 130),
        flight:  flightMatch?.[1] || null,
        route:   airportMatch ? `${airportMatch[1]} → ${airportMatch[2]}` : null,
      })
    }

    return { statusCode: 200, headers: CORS, body: JSON.stringify(trips) }
  } catch (err) {
    console.error('travel-fetch error:', err)
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) }
  }
}
