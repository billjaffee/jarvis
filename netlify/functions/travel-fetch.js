// Scans Gmail for actual flight itineraries and parses them into structured trips
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

    // Very specific subjects — actual confirmations only, not promos
    const query = 'in:inbox newer_than:365d (' +
      'subject:"your itinerary" OR ' +
      'subject:"flight itinerary" OR ' +
      'subject:"travel itinerary" OR ' +
      'subject:"booking confirmed" OR ' +
      'subject:"reservation confirmed" OR ' +
      'subject:"your trip to" OR ' +
      'subject:"your flight" OR ' +
      'subject:"e-ticket receipt" OR ' +
      'subject:"trip confirmation" OR ' +
      'subject:"flight confirmation"' +
    ')'

    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=30&q=${encodeURIComponent(query)}`,
      { headers: auth }
    )
    const listData = await listRes.json()
    const messages = listData.messages || []

    const trips = []

    for (const { id } of messages.slice(0, 15)) {
      // Get full plaintext body for parsing
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`,
        { headers: auth }
      )
      const msg     = await msgRes.json()
      const headers = msg.payload?.headers || []
      const get     = name => headers.find(h => h.name === name)?.value || ''

      const subject = get('Subject')
      const from    = get('From')
      const dateRaw = get('Date')
      const snippet = msg.snippet?.replace(/&#39;/g,"'").replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>') || ''

      // Skip obvious marketing
      if (/\b(deal|sale|offer|discount|save|% off|promo|last chance|flash|earn miles|book now)\b/i.test(subject)) continue

      // Extract plain text body for richer parsing
      let bodyText = snippet
      try {
        const extractText = (part) => {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            return atob(part.body.data.replace(/-/g,'+').replace(/_/g,'/'))
          }
          if (part.parts) return part.parts.map(extractText).join(' ')
          return ''
        }
        const extracted = extractText(msg.payload)
        if (extracted.length > 50) bodyText = extracted.slice(0, 2000)
      } catch {}

      const fullText = `${subject} ${bodyText}`

      // === PARSE FLIGHT DETAILS ===

      // Flight numbers: UA1234, AA 123, DL 1234, WN2345
      const flightNums = [...new Set(
        (fullText.match(/\b(AA|UA|DL|WN|AS|B6|F9|NK|G4|HA|VX|SY|OO|9E|MQ|OH|YV|ZW)\s*(\d{1,4})\b/gi) || [])
        .map(f => f.replace(/\s+/,'').toUpperCase())
      )].slice(0, 6)

      // Airport codes — 3 capital letters, common patterns
      const airports = [...new Set(
        (fullText.match(/\b([A-Z]{3})\b(?=\s*(?:→|->|to|-|\()|\s+(?:airport|intl|international))/g) || [])
        .concat(fullText.match(/(?:from|departs?|departing)\s+([A-Z]{3})\b/gi)?.map(m=>m.match(/([A-Z]{3})/)?.[1])||[])
        .concat(fullText.match(/(?:to|arrives?|arriving)\s+([A-Z]{3})\b/gi)?.map(m=>m.match(/([A-Z]{3})/)?.[1])||[])
        .filter(Boolean)
      )]

      // Route: look for "ORD → DEN" or "Chicago to Denver" style
      const routeMatch = fullText.match(/\b([A-Z]{3})\s*(?:→|->|–|-)\s*([A-Z]{3})\b/)
      let route = routeMatch ? `${routeMatch[1]} → ${routeMatch[2]}` : null
      if (!route && airports.length >= 2) route = `${airports[0]} → ${airports[1]}`

      // Departure date — look for full date strings
      const datePatterns = [
        /\b(Mon|Tue|Wed|Thu|Fri|Sat|Sun)[,.\s]+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})(?:,?\s*(\d{4}))?\b/gi,
        /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2})(?:,?\s*(\d{4}))?\b/gi,
      ]
      let departDate = null
      for (const pat of datePatterns) {
        const m = pat.exec(fullText)
        if (m) { departDate = m[0].trim(); break }
      }
      if (!departDate) {
        // fallback to email received date
        departDate = new Date(dateRaw).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})
      }

      // Departure times
      const times = (fullText.match(/\b(\d{1,2}:\d{2}\s*(?:AM|PM))\b/gi) || [])
        .slice(0,4)
        .filter((t,i,arr)=>arr.indexOf(t)===i) // unique

      // Airline name from sender
      const airlineNames = {
        'united':'United Airlines','delta':'Delta Air Lines','american':'American Airlines',
        'southwest':'Southwest','alaska':'Alaska Airlines','jetblue':'JetBlue',
        'frontier':'Frontier','spirit':'Spirit','allegiant':'Allegiant',
      }
      let airline = null
      const fromLower = from.toLowerCase()
      for (const [key,name] of Object.entries(airlineNames)) {
        if (fromLower.includes(key) || subject.toLowerCase().includes(key)) { airline=name; break }
      }

      // Confirmation/record locator
      const confirmMatch = fullText.match(/(?:confirmation|record locator|booking ref|reservation)[\s:#]*([A-Z0-9]{5,8})\b/i)
      const confirmation = confirmMatch?.[1] || null

      // Only include if we found at least one meaningful signal
      const hasFlightData = flightNums.length > 0 || route || (times.length > 0 && departDate)
      if (!hasFlightData) continue

      trips.push({
        id, subject, airline,
        from:   from.replace(/<[^>]+>/,'').replace(/"/g,'').trim(),
        departDate, times, route, flightNums, confirmation,
        type: /hotel|stay|check.in|resort|inn/i.test(subject+snippet) ? 'hotel' : 'flight',
      })
    }

    // Sort by departure date (soonest first) — best effort
    trips.sort((a,b) => new Date(a.departDate) - new Date(b.departDate))

    return { statusCode:200, headers:CORS, body:JSON.stringify(trips) }
  } catch (err) {
    console.error('travel-fetch error:',err)
    return { statusCode:500, headers:CORS, body:JSON.stringify({ error:err.message }) }
  }
}
