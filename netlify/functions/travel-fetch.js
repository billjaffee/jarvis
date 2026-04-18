// Scans non-primary Gmail tabs for ACTUAL flight itineraries only
// Filters out marketing/promotional emails aggressively
export const handler = async (event, context) => {
  const CORS = { 'Access-Control-Allow-Origin':'*','Content-Type':'application/json' }
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'},
      body: new URLSearchParams({ client_id:process.env.GOOGLE_CLIENT_ID, client_secret:process.env.GOOGLE_CLIENT_SECRET, refresh_token:process.env.GOOGLE_REFRESH_TOKEN, grant_type:'refresh_token' }),
    })
    const { access_token, error:tokenError } = await tokenRes.json()
    if (tokenError || !access_token) throw new Error(`Token error: ${tokenError}`)
    const auth = { Authorization:`Bearer ${access_token}` }

    // Only actual booking confirmations — very specific subject terms
    const query = [
      '-label:CATEGORY_PERSONAL', // skip primary tab
      'in:inbox',
      'newer_than:180d',
      '(',
        'subject:("your itinerary") OR',
        'subject:("booking confirmation") OR',
        'subject:("trip confirmation") OR',
        'subject:("flight confirmation") OR',
        'subject:("reservation confirmation") OR',
        'subject:("e-ticket") OR',
        'subject:("your trip to") OR',
        'subject:("your flight to") OR',
        'subject:("travel itinerary") OR',
        'subject:("your upcoming trip")',
      ')',
    ].join(' ')

    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=20&q=${encodeURIComponent(query)}`,
      { headers: auth }
    )
    const listData = await listRes.json()
    const messages = listData.messages || []

    const trips = []
    for (const { id } of messages.slice(0, 12)) {
      // Get full message body for better parsing
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
        { headers: auth }
      )
      const msg     = await msgRes.json()
      const headers = msg.payload?.headers || []
      const get     = name => headers.find(h => h.name === name)?.value || ''
      const subject = get('Subject')
      const from    = get('From')
      const date    = get('Date')
      const snippet = msg.snippet?.replace(/&#39;/g,"'").replace(/&amp;/g,'&') || ''

      // Aggressively filter out marketing emails
      const marketingKeywords = /\b(deal|sale|offer|discount|save|% off|limited time|last chance|flash sale|promo|coupon|miles bonus|earn miles|book now and save|prices from|starting at \$|from just)/i
      if (marketingKeywords.test(subject) || marketingKeywords.test(snippet)) continue

      // Must have itinerary-like content
      const itinerarySignals = /\b(confirmation|itinerary|departs?|arrives?|flight|boarding|gate|seat|record locator|booking ref|reservation|check.in)\b/i
      if (!itinerarySignals.test(snippet) && !itinerarySignals.test(subject)) continue

      // Extract flight numbers (AA1234, UA 456, DL1234, etc.)
      const flightNums = [...new Set([
        ...(snippet.match(/\b([A-Z]{2})\s*(\d{3,4})\b/g) || []),
        ...(subject.match(/\b([A-Z]{2})\s*(\d{3,4})\b/g) || []),
      ])].slice(0, 4)

      // Extract airport codes  
      const airportMatch = snippet.match(/\b([A-Z]{3})\s*(?:→|->|to|-)\s*([A-Z]{3})\b/) ||
                           snippet.match(/\bfrom\s+([A-Z]{3})\b.*?\bto\s+([A-Z]{3})\b/i)

      // Extract departure date/time
      const dateMatch = snippet.match(/\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)[,.\s]+(\w+ \d{1,2}(?:,?\s*\d{4})?)\b/i) ||
                        snippet.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2}(?:,?\s*\d{4})?\b/i)

      const timeMatch = snippet.match(/\b(\d{1,2}:\d{2}\s*(?:AM|PM))\b/gi)

      // Clean sender name
      const fromName = from.replace(/<[^>]+>/,'').replace(/"/g,'').trim() || from.split('@')[0]

      // Extract destination from subject
      const destMatch = subject.match(/(?:to|for)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i) ||
                        subject.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:trip|flight|itinerary)/i)

      trips.push({
        id, subject, from: fromName,
        date:       dateMatch?.[0] || new Date(date).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}),
        snippet:    snippet.slice(0, 150),
        flights:    flightNums,
        route:      airportMatch ? `${airportMatch[1]} → ${airportMatch[2]}` : null,
        times:      timeMatch ? timeMatch.slice(0,2) : [],
        destination: destMatch?.[1] || null,
        type:       /hotel|stay|check.in|resort/i.test(subject+snippet) ? 'hotel' : 'flight',
      })
    }

    return { statusCode:200, headers:CORS, body:JSON.stringify(trips) }
  } catch (err) {
    console.error('travel-fetch error:',err)
    return { statusCode:500, headers:CORS, body:JSON.stringify({ error:err.message }) }
  }
}
