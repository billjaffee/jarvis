// Scans Gmail for calendar invites from Kate Jaffee and auto-accepts them
export const handler = async (event, context) => {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' }

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

    // Find pending calendar events where Kate is organizer
    const now      = new Date().toISOString()
    const sixMonths = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()

    const calRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
      `?timeMin=${now}&timeMax=${sixMonths}&maxResults=50&singleEvents=true`,
      { headers: auth }
    )
    const calData = await calRes.json()
    const events  = calData.items || []

    // Find events organized by Kate where self status is needsAction
    const pending = events.filter(ev => {
      const organizer   = ev.organizer?.email || ''
      const isKate      = organizer.includes('jaffee.katherine') || organizer.includes('kate')
      const selfAttendee = ev.attendees?.find(a => a.self)
      const needsAction = selfAttendee?.responseStatus === 'needsAction'
      return isKate && needsAction
    })

    // Accept each pending event
    const accepted = []
    for (const ev of pending) {
      const updatedAttendees = (ev.attendees || []).map(a =>
        a.self ? { ...a, responseStatus: 'accepted' } : a
      )
      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${ev.id}`,
        {
          method: 'PATCH',
          headers: { ...auth, 'Content-Type': 'application/json' },
          body: JSON.stringify({ attendees: updatedAttendees }),
        }
      )
      accepted.push({ id: ev.id, title: ev.summary, date: ev.start?.dateTime || ev.start?.date })
    }

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ accepted, count: accepted.length }) }
  } catch (err) {
    console.error('calendar-accept error:', err)
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) }
  }
}
