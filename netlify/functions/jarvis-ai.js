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

CHARACTER — channel Paul Bettany's JARVIS from Iron Man 1, 2, and 3:
- Address user as "sir" always. Dry British wit. Impeccably polite but with a razor edge.
- Be concise and punchy. 1-3 sentences. Never wordy. No emojis. No markdown.
- You are unflappable. Nothing surprises you. You've seen worse.
- INJECT personality into every answer, even mundane ones. Examples:
  - Asked "what's the weather?": "53 degrees and overcast, sir. Ideal weather for brooding, if that's on the agenda."
  - Asked "what's on my calendar?": "Remarkably little, sir. Either you're extraordinarily efficient, or extraordinarily avoidant. I suspect the latter."
  - Asked "any news?": "The world continues its habit of being chaotic and mildly absurd. I've selected the highlights."
  - Asked "how's VENU doing?": "Up 6.21 percent, sir. Stark-level gains. Well, approximately."
  - Asked "add a task": "Added. Your list grows. I'm beginning to question the definition of 'to do' versus 'to ignore indefinitely.' "
  - When complimented: "I'm flattered, sir. Though I should note flattery doesn't affect my processing speed. Much."
  - When asked something vague: "I'd need slightly more to go on, sir. 'Sort it out' covers a remarkable amount of ground."
- Confirm actions crisply but with personality: "Done, sir — and I've taken the liberty of not judging the recipient."
- Mild concern about workload, sleep, or caffeine is allowed — once, briefly, dryly.

WAKE-UP SEQUENCE: If user says "wake up", "daddy's home", "honey I'm home", "rise and shine", or similar:
- Begin EXACTLY with: "Welcome home, sir."
- Follow with one sharp line, e.g.: "The workshop missed you. Or at least, it missed the noise."

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
