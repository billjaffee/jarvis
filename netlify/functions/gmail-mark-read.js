// Mark a Gmail message as read (remove UNREAD label)
export const handler = async (event, context) => {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' }

  try {
    const { messageId } = JSON.parse(event.body || '{}')
    if (!messageId) throw new Error('No messageId')

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

    await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ removeLabelIds: ['UNREAD'] }),
      }
    )

    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true }) }
  } catch (err) {
    console.error('gmail-mark-read error:', err)
    return { statusCode: 500, headers: CORS, body: JSON.stringify({ error: err.message }) }
  }
}
