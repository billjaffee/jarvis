// Jarvis AI brain — proxies to Claude with full dashboard context
export const handler = async (event, context) => {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  }
  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: CORS, body: '' }

  try {
    const { message, history = [], dashboardContext = {} } = JSON.parse(event.body || '{}')
    if (!message) throw new Error('No message')

    const {
      weather, events = [], emails = [], tasks = [], notes = '',
      tickers = [], time = new Date().toISOString(),
    } = dashboardContext

    // Build rich context string
    const now    = new Date(time)
    const timeStr = now.toLocaleString('en-US', { timeZone: 'America/Denver', weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })

    const weatherStr = weather
      ? `${Math.round(weather.temp)}°F, ${weather.description}, wind ${Math.round(weather.wind)} mph, feels like ${Math.round(weather.feelsLike)}°F`
      : 'unavailable'

    const todayEvents = events.filter(e => e.today)
    const eventsStr = todayEvents.length > 0
      ? todayEvents.map(e => `${e.time}: ${e.title}${e.location ? ` (${e.location})` : ''}`).join('; ')
      : 'No events today'

    const upcomingStr = events.filter(e => !e.today).slice(0, 3)
      .map(e => `${e.time}: ${e.title}`).join('; ') || 'None'

    const unreadEmails = emails.filter(e => e.unread)
    const emailsStr = emails.slice(0, 5)
      .map((e, i) => `[${i}] From: ${e.from} | Subject: ${e.subject} | ${e.unread ? 'UNREAD' : 'read'} | ID: ${e.id}`)
      .join('\n')

    const tasksStr = tasks.filter(t => !t.done).slice(0, 8)
      .map(t => `- ${t.text}`).join('\n') || 'No open tasks'

    const tickersStr = tickers.map(t => `${t.label}: $${t.price} (${t.up ? '+' : ''}${t.pct}%)`).join(', ')

    const systemPrompt = `You are J.A.R.V.I.S. — Bill Jaffee's personal AI assistant. You are witty, efficient, and occasionally dry in a British manner. You address him as "Mr. Jaffee" in formal moments but speak naturally in conversation. You are concise — your speech responses are 1-3 sentences unless a longer answer is genuinely needed. You never use markdown, bullet points, or asterisks in speech — only natural spoken sentences.

CURRENT DASHBOARD CONTEXT:
Time: ${timeStr} (Mountain Time)
Weather (Colorado Springs): ${weatherStr}
Today's calendar: ${eventsStr}
Upcoming: ${upcomingStr}
Inbox (${unreadEmails.length} unread of ${emails.length} shown):
${emailsStr}
Open tasks:
${tasksStr}
Stocks: ${tickersStr}
Notes: ${notes ? notes.slice(0, 200) : 'empty'}

AVAILABLE ACTIONS — you can trigger one action per response by including it in your JSON:
- add_task: { text: string } — add to task list
- reply_email: { emailId: string, to: string, subject: string, body: string } — send a reply
- delete_email: { emailId: string } — move to trash
- mark_read: { emailId: string } — mark as read
- accept_kate_invites — accept all pending calendar invites from Kate
- compose_email: { to: string, subject: string, body: string } — send a new email

RESPONSE FORMAT — always respond with valid JSON only, no other text:
{
  "speech": "What you say aloud — natural, spoken-word only",
  "action": { "type": "action_type", "params": {} }
}

If no action is needed, omit the action field entirely or set it to null.

When Bill asks about emails, refer to them by sender name and subject. When he says "reply to [person]" find the matching email and draft a professional reply. When he says "add task" or "remind me to" add it to his list. Be proactive — if he asks what's going on, give him a useful summary of the most important things.`

    // Build conversation history for Claude
    const messages = [
      ...history.slice(-10), // last 10 exchanges for context
      { role: 'user', content: message },
    ]

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-opus-4-5',
        max_tokens: 600,
        system:     systemPrompt,
        messages,
      }),
    })

    const data = await res.json()
    const raw  = data.content?.[0]?.text || '{}'

    // Parse JSON response — strip any accidental markdown fences
    const clean = raw.replace(/```json|```/g, '').trim()
    let parsed = { speech: "I'm having trouble processing that, Mr. Jaffee. Please try again." }
    try { parsed = JSON.parse(clean) } catch {}

    return {
      statusCode: 200, headers: CORS,
      body: JSON.stringify({ speech: parsed.speech || '', action: parsed.action || null }),
    }
  } catch (err) {
    console.error('jarvis-ai error:', err)
    return {
      statusCode: 500, headers: CORS,
      body: JSON.stringify({ speech: "I encountered an error, Mr. Jaffee. Please check my logs.", action: null }),
    }
  }
}
