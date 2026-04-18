// Scans Gmail for flight/travel info and extracts itinerary data
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

    // Search for travel-related emails in the next 60 days
    const query = 'subject:(flight OR itinerary OR "boarding pass" OR reservation OR "travel confirmation" OR airline OR hotel) newer_than:1d'
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=${encodeURIComponent(query)}`,
      { headers: auth }
    )
    const listData = await listRes.json()
    const messages = listData.messages || []

    const trips = []
    for (const { id } of messages.slice(0, 8)) {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: auth }
      )
      const msg = await msgRes.json()
      const headers = msg.payload?.headers || []
      const get = name => headers.find(h => h.name === name)?.value || ''
      const subject = get('Subject')
      const from    = get('From')
      const date    = get('Date')
      const snippet = msg.snippet || ''

      // Extract flight numbers
      const flightMatch = snippet.match(/\b([A-Z]{2}\d{3,4}|[A-Z]{3}\d{3,4})\b/)
      // Extract dates
      const dateMatch = snippet.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s+\d{1,2}(?:,?\s+\d{4})?\b/i)
      // Extract airports/cities
      const airportMatch = snippet.match(/\b([A-Z]{3})\s*(?:→|->|to)\s*([A-Z]{3})\b/) ||
                           snippet.match(/from\s+(\w[\w\s]+?)\s+to\s+(\w[\w\s]+?)(?:\s|,|\.)/i)
      // Detect type
      const isHotel  = /hotel|stay|check.in|check.out/i.test(subject + snippet)
      const isFlight = /flight|airline|boarding|depart|arrival/i.test(subject + snippet)
      const type     = isHotel ? 'hotel' : isFlight ? 'flight' : 'travel'

      trips.push({
        id,
        subject,
        from: from.split('<')[0].trim().replace(/"/g, ''),
        date: dateMatch?.[0] || new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        snippet: snippet.slice(0, 120),
        flight:  flightMatch?.[1] || null,
        route:   airportMatch ? `${airportMatch[1]} → ${airportMatch[2]}` : null,
        type,
      })
    }

    return { statusCode: 200, headers: CORS, body: JSON.stringify(trips) }
  } catch (err) {
    console.error('travel-fetch error:', err)
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) }
  }
}
