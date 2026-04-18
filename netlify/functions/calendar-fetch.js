// Google Calendar API proxy — Mountain Time fix
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

    const now      = new Date().toISOString()
    const twoWeeks = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

    const calRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
      `?timeMin=${now}&timeMax=${twoWeeks}&maxResults=15&singleEvents=true&orderBy=startTime&timeZone=America/Denver`,
      { headers: { Authorization: `Bearer ${access_token}` } }
    )
    const data = await calRes.json()

    const todayMDT = new Date().toLocaleDateString('en-US', { timeZone: 'America/Denver' })
    const COLORS = ['blue', 'cyan', 'green']

    const events = (data.items || []).map((item, i) => {
      const startRaw = item.start?.dateTime || item.start?.date || ''
      const endRaw   = item.end?.dateTime   || item.end?.date   || ''
      const isAllDay = !item.start?.dateTime

      // Convert to Mountain Time for display
      const startDate = new Date(startRaw)
      const startMDT  = startDate.toLocaleDateString('en-US', { timeZone: 'America/Denver' })
      const isToday   = startMDT === todayMDT

      const formatT = d => d.toLocaleTimeString('en-US', {
        timeZone: 'America/Denver',
        hour: 'numeric', minute: '2-digit'
      })
      const formatD = d => d.toLocaleDateString('en-US', {
        timeZone: 'America/Denver',
        weekday: 'short', month: 'short', day: 'numeric'
      })

      return {
        id:       item.id,
        title:    item.summary || 'Untitled',
        time:     isAllDay
          ? (isToday ? 'All day' : formatD(startDate))
          : (isToday ? formatT(startDate) : `${formatD(startDate)} ${formatT(startDate)}`),
        endTime:  endRaw && !isAllDay ? formatT(new Date(endRaw)) : '',
        location: item.location || '',
        today:    isToday,
        color:    COLORS[i % COLORS.length],
      }
    })

    return { statusCode: 200, headers: CORS, body: JSON.stringify(events) }
  } catch (err) {
    console.error('calendar-fetch error:', err)
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) }
  }
}
