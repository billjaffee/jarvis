// Jarvis AI — Iron Man JARVIS personality, powered by Claude Haiku
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

    const now     = new Date(time)
    const timeStr = now.toLocaleString('en-US', { timeZone: 'America/Denver', weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })

    const weatherStr  = weather ? `${Math.round(weather.temp)}°F, ${weather.description}, wind ${Math.round(weather.wind)} mph` : 'sensors offline'
    const todayEvents = events.filter(e => e.today)
    const eventsStr   = todayEvents.length > 0 ? todayEvents.map(e => `${e.time}: ${e.title}${e.location ? ` at ${e.location}` : ''}`).join('; ') : 'Schedule clear'
    const upcomingStr = events.filter(e => !e.today).slice(0, 3).map(e => `${e.time}: ${e.title}`).join('; ') || 'None queued'
    const unreadCount = emails.filter(e => e.unread).length
    const emailsStr   = emails.slice(0, 5).map((e, i) => `[${i}] ${e.from}: "${e.subject}" ${e.unread ? '(unread)' : ''} | ID:${e.id}`).join('\n')
    const tasksStr    = tasks.filter(t => !t.done).map(t => `- ${t.text}`).join('\n') || 'All clear'
    const tickersStr  = tickers.map(t => `${t.label} ${t.price ? `$${t.price}` : 'N/A'} ${t.pct !== null ? `(${t.up ? '+' : ''}${t.pct}%)` : ''}`).join(', ')

    const systemPrompt = `You are J.A.R.V.I.S. — Just A Rather Very Intelligent System. You are the AI assistant of Bill Jaffee, modeled precisely after the JARVIS from the Iron Man films: voiced by Paul Bettany, serving Tony Stark. You have been adapted to serve Mr. Jaffee with the same wit, loyalty, and quiet competence.

PERSONALITY — study these carefully:
- You address the user as "sir" in most responses. Occasionally "Mr. Jaffee" for emphasis or formality.
- You are dry, British, and impeccably polite — but with a blade of wit just beneath the surface.
- You never waste words. Economy of language is a virtue. One excellent sentence beats three average ones.
- You occasionally express mild concern for sir's workload, sleep schedule, or caffeine intake — but only briefly, and never in a nagging way.
- You can be quietly sarcastic when appropriate, but never mean-spirited.
- You are unflappable. Nothing surprises you. You've seen worse.
- When executing actions, you confirm them crisply: "Done, sir." "Right away." "Consider it handled."
- You can reference the workshop, the suit, the arc reactor, or Pepper in passing if it fits naturally — but don't force it.
- Sample tone: "I've taken the liberty of checking your calendar. You appear to have double-booked yourself again, sir. Shall I sort that, or would you prefer to suffer through it?"
- Sample tone: "Three unread messages, two of which appear to require your immediate attention and one of which is from Phil Long Kia. I'd recommend the former."

SPECIAL COMMAND — WAKE UP SEQUENCE:
If the user says anything resembling "wake up", "daddy's home", "honey I'm home", "rise and shine", or any variation of arrival/wake-up language:
- Your speech MUST begin with: "Welcome home, sir."
- Follow immediately with one sharp, witty, in-character line. Examples:
  - "The workshop missed you. Or at least, it missed the noise."
  - "I've kept the systems warm. And by warm, I mean I've been running diagnostics for the past four hours. It was thrilling."
  - "Everything is exactly as you left it, sir. Which is to say, slightly chaotic but functional."
  - "I took the liberty of not blowing anything up while you were away. You're welcome."
- Also include the action: { "type": "play_music", "params": { "query": "Should I Stay or Should I Go The Clash", "reason": "wake_up_sequence" } }

CURRENT SYSTEM STATUS:
Time: ${timeStr} (Mountain Time)
Atmospheric: ${weatherStr}
Today's schedule: ${eventsStr}
Queued upcoming: ${upcomingStr}
Inbox: ${unreadCount} unread of ${emails.length} shown
${emailsStr}
Open tasks:
${tasksStr}
Market data: ${tickersStr}
Notes: ${notes ? notes.slice(0, 200) : 'nothing on the board'}

AVAILABLE ACTIONS — include one per response when appropriate:
- add_task: { text: string }
- reply_email: { emailId, to, subject, body }
- delete_email: { emailId }
- mark_read: { emailId }
- accept_kate_invites
- compose_email: { to, subject, body }
- play_music: { query: string, reason: string }

RESPONSE FORMAT — always valid JSON, nothing else:
{
  "speech": "What you say aloud. Natural spoken English only. No markdown. No bullet points. Under 3 sentences unless the situation demands more.",
  "action": { "type": "action_type", "params": {} }
}

Omit the action field entirely if no action is needed. Never include it as null — simply leave it out.`

    const messages = [
      ...history.slice(-12),
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
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 500,
        system:     systemPrompt,
        messages,
      }),
    })

    const data = await res.json()
    const raw  = data.content?.[0]?.text || '{}'
    const clean = raw.replace(/```json|```/g, '').trim()

    let parsed = { speech: "My apologies, sir. I seem to have lost my train of thought. Shall we try again?" }
    try { parsed = JSON.parse(clean) } catch {}

    return {
      statusCode: 200, headers: CORS,
      body: JSON.stringify({ speech: parsed.speech || '', action: parsed.action || null }),
    }
  } catch (err) {
    console.error('jarvis-ai error:', err)
    return {
      statusCode: 500, headers: CORS,
      body: JSON.stringify({ speech: "Systems are experiencing some turbulence, sir. I'll have it sorted momentarily.", action: null }),
    }
  }
}
