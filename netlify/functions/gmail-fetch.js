// Gmail API — Primary inbox, no category filter so self-sent emails appear
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

    // INBOX only — no category filter so self-sent + all primary emails appear
    const listRes = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&labelIds=INBOX',
      { headers: auth }
    )
    const listData = await listRes.json()
    const messages = listData.messages || []

    const emails = await Promise.all(
      messages.map(async ({ id }) => {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}` +
          `?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
          { headers: auth }
        )
        const msg     = await msgRes.json()
        const headers = msg.payload?.headers || []
        const get     = name => headers.find(h => h.name === name)?.value || ''
        const fromRaw = get('From')
        const fromName = fromRaw.includes('<')
          ? fromRaw.split('<')[0].trim().replace(/^"|"$/g, '')
          : fromRaw.split('@')[0]
        return {
          id, from: fromName || fromRaw, fromEmail: fromRaw,
          subject:  get('Subject') || '(no subject)',
          preview:  msg.snippet?.replace(/&#39;/g,"'").replace(/&amp;/g,'&') || '',
          time:     formatTime(get('Date')),
          unread:   msg.labelIds?.includes('UNREAD') ?? false,
          flagged:  msg.labelIds?.includes('STARRED') ?? false,
        }
      })
    )
    return { statusCode: 200, headers: CORS, body: JSON.stringify(emails) }
  } catch (err) {
    console.error('gmail-fetch error:', err)
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) }
  }
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const d   = new Date(dateStr)
  const now = new Date()
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
