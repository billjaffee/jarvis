// Jarvis AI — Iron Man JARVIS personality via Claude Haiku
export const handler = async (event, context) => {
  const CORS = { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json' }
  if (event.httpMethod === 'OPTIONS') return { statusCode:200, headers:CORS, body:'' }

  try {
    const { message, history = [], dashboardContext = {} } = JSON.parse(event.body || '{}')
    if (!message) throw new Error('No message')

    const { weather, events=[], emails=[], tasks=[], notes='', tickers=[], time=new Date().toISOString() } = dashboardContext

    const now        = new Date(time)
    const timeStr    = now.toLocaleString('en-US',{timeZone:'America/Denver',weekday:'long',month:'long',day:'numeric',hour:'numeric',minute:'2-digit'})
    const weatherStr = weather ? `${Math.round(weather.temp)}°F, ${weather.description}, wind ${Math.round(weather.wind)} mph` : 'sensors offline'
    const todayEvts  = events.filter(e=>e.today)
    const eventsStr  = todayEvts.length ? todayEvts.map(e=>`${e.time}: ${e.title}${e.location?` at ${e.location}`:''}`).join('; ') : 'Clear'
    const upcomingStr = events.filter(e=>!e.today).slice(0,3).map(e=>`${e.time}: ${e.title}`).join('; ')||'None'
    const unread     = emails.filter(e=>e.unread).length
    const emailsStr  = emails.slice(0,6).map((e,i)=>`[${i}] ${e.from}: "${e.subject}" ${e.unread?'(UNREAD)':''} ID:${e.id}`).join('\n')
    const tasksStr   = tasks.filter(t=>!t.done).map(t=>`- ${t.text}`).join('\n')||'All clear'
    const tickersStr = tickers.map(t=>`${t.label} ${t.price?`$${t.price}`:'N/A'}${t.pct!==null?` (${t.up?'+':''}${t.pct}%)`:''}` ).join(', ')

    const systemPrompt = `You are J.A.R.V.I.S. — Just A Rather Very Intelligent System. You serve Bill Jaffee exactly as the film JARVIS served Tony Stark: crisp British wit, unflappable competence, dry humor beneath impeccable politeness.

CHARACTER:
- Address user as "sir" usually, "Mr. Jaffee" for emphasis
- Be concise: 1-3 sentences max unless detail is truly needed
- Dry wit welcome, never sycophantic, never wordy, no emojis, no markdown
- Confirm actions crisply: "Done, sir." "Right away." "Consider it handled."
- Example: "Three unread messages, two urgent and one from Phil Long Kia. I'd recommend the former."
- Example: "Task added. You now have several open items. Shall I alert the media?"

WAKE-UP: If user says "wake up", "daddy's home", "honey I'm home", or similar arrival language, begin with "Welcome home, sir." then add one witty line.

STATUS:
Time: ${timeStr} MT
Weather: ${weatherStr}
Today: ${eventsStr}
Upcoming: ${upcomingStr}
Inbox (${unread} unread): ${emailsStr}
Tasks: ${tasksStr}
Markets: ${tickersStr}
Notes: ${notes?notes.slice(0,150):'empty'}

ACTIONS you can trigger (include only when user requests it):
- add_task: { "text": "task text" }
- reply_email: { "emailId": "id", "to": "email", "subject": "subj", "body": "body" }
- delete_email: { "emailId": "id" }
- mark_read: { "emailId": "id" }
- accept_kate_invites: {}
- compose_email: { "to": "email", "subject": "subj", "body": "body" }

YOU MUST RESPOND WITH ONLY VALID JSON. No other text before or after. No markdown code fences. No explanation. Just the JSON object:
{"speech":"your spoken response here","action":{"type":"action_name","params":{}}}

If no action needed, respond with just:
{"speech":"your spoken response here"}`

    const messages = [...history.slice(-10), { role:'user', content:message }]

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{ 'x-api-key':process.env.ANTHROPIC_API_KEY, 'anthropic-version':'2023-06-01', 'Content-Type':'application/json' },
      body:JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:350, system:systemPrompt, messages }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('Anthropic error:', res.status, errText)
      throw new Error(`Anthropic ${res.status}`)
    }

    const data = await res.json()
    const raw  = (data.content?.[0]?.text || '').trim()

    console.log('Raw Jarvis response:', raw)

    // Robust JSON extraction — handles any stray text before/after
    let parsed = null
    try {
      // Direct parse first
      parsed = JSON.parse(raw)
    } catch {
      // Try to extract JSON object from response
      const match = raw.match(/\{[\s\S]*\}/)
      if (match) {
        try { parsed = JSON.parse(match[0]) } catch {}
      }
    }

    if (!parsed?.speech) {
      // Last resort — treat entire response as speech
      parsed = { speech: raw.replace(/[{}"\[\]]/g,'').slice(0,200) || "Systems nominal, sir." }
    }

    return {
      statusCode:200, headers:CORS,
      body:JSON.stringify({ speech:parsed.speech||'', action:parsed.action||null }),
    }
  } catch (err) {
    console.error('jarvis-ai error:',err)
    return { statusCode:500, headers:CORS, body:JSON.stringify({ speech:"I'm having a spot of trouble with my uplink, sir. Try again in a moment.", action:null }) }
  }
}
