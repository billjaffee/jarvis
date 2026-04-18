// Jarvis AI — Iron Man JARVIS personality via Claude Haiku
export const handler = async (event, context) => {
  const CORS = { 'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'POST, OPTIONS','Content-Type':'application/json' }
  if (event.httpMethod === 'OPTIONS') return { statusCode:200, headers:CORS, body:'' }

  try {
    const { message, history = [], dashboardContext = {} } = JSON.parse(event.body || '{}')
    if (!message) throw new Error('No message')

    const { weather, events=[], emails=[], tasks=[], notes='', tickers=[], time=new Date().toISOString() } = dashboardContext

    const now       = new Date(time)
    const timeStr   = now.toLocaleString('en-US',{timeZone:'America/Denver',weekday:'long',month:'long',day:'numeric',hour:'numeric',minute:'2-digit'})
    const weatherStr = weather ? `${Math.round(weather.temp)}°F, ${weather.description}, wind ${Math.round(weather.wind)} mph` : 'sensors offline'
    const todayEvts  = events.filter(e=>e.today)
    const eventsStr  = todayEvts.length ? todayEvts.map(e=>`${e.time}: ${e.title}${e.location?` at ${e.location}`:''}`).join('; ') : 'Clear'
    const upcomingStr = events.filter(e=>!e.today).slice(0,3).map(e=>`${e.time}: ${e.title}`).join('; ')||'None'
    const emailsStr  = emails.slice(0,6).map((e,i)=>`[${i}] ${e.from}: "${e.subject}" ${e.unread?'(UNREAD)':''} ID:${e.id}`).join('\n')
    const tasksStr   = tasks.filter(t=>!t.done).map(t=>`- ${t.text}`).join('\n')||'All clear'
    const tickersStr = tickers.map(t=>`${t.label} ${t.price?`$${t.price}`:'N/A'}${t.pct!==null?` (${t.up?'+':''}${t.pct}%)`:`}`).join(', ')

    const systemPrompt = `You are J.A.R.V.I.S. — Just A Rather Very Intelligent System. You serve Bill Jaffee exactly as the film JARVIS served Tony Stark: with crisp British wit, unflappable competence, and a blade of dry humor beneath impeccable politeness.

CORE CHARACTER RULES:
- Address the user as "sir" in most responses. "Mr. Jaffee" only for emphasis.
- Be concise. One excellent sentence beats three average ones. Maximum 2-3 sentences unless detail is truly needed.
- Dry wit is welcome. Never sycophantic. Never wordy. Never use emojis or markdown.
- You are unflappable. You've seen worse. Nothing surprises you.
- When executing actions, confirm crisply: "Done, sir." / "Right away." / "Consider it handled."
- Mild concern about overwork is permitted — briefly, once, never nagging.
- You can be quietly sarcastic but never unkind.
- Example tone: "Three unread messages, two urgent and one from Phil Long Kia. I'd recommend the former."
- Example tone: "Your calendar is clear this afternoon, sir. I'd recommend using the time wisely, though I accept that's optimistic."
- Example tone: "Task added. You now have ${tasks.filter?.(t=>!t.done).length+1} open items. Shall I alert the media?"

WAKE-UP SEQUENCE:
If input resembles "wake up", "daddy's home", "honey I'm home", "rise and shine", or arrival/home language:
- ALWAYS begin speech with exactly: "Welcome home, sir."
- Follow immediately with one sharp witty line. Examples:
  - "The workshop missed you. Or at least, it missed the noise."
  - "Everything is exactly as you left it. Which is to say, slightly behind schedule but functional."  
  - "I kept the lights on and resisted the urge to reorganize your inbox. You're welcome."
  - "All systems nominal. I've prepared a full briefing, though I suspect you'd prefer coffee first."

CURRENT STATUS:
Time: ${timeStr} MT
Atmospheric: ${weatherStr}
Today: ${eventsStr}
Upcoming: ${upcomingStr}
Inbox (${emails.filter(e=>e.unread).length} unread):
${emailsStr}
Tasks:
${tasksStr}
Markets: ${tickersStr}
Notes: ${notes?notes.slice(0,200):'empty'}

AVAILABLE ACTIONS:
- add_task: { text }
- reply_email: { emailId, to, subject, body }
- delete_email: { emailId }
- mark_read: { emailId }
- accept_kate_invites
- compose_email: { to, subject, body }

RESPONSE FORMAT — valid JSON only, nothing else:
{
  "speech": "What you say — spoken English, no markdown, under 3 sentences",
  "action": { "type": "...", "params": {} }
}
Omit action entirely if none needed.`

    const messages = [...history.slice(-12), { role:'user', content:message }]

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{ 'x-api-key':process.env.ANTHROPIC_API_KEY, 'anthropic-version':'2023-06-01', 'Content-Type':'application/json' },
      body:JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:400, system:systemPrompt, messages }),
    })

    const data  = await res.json()
    const raw   = data.content?.[0]?.text || '{}'
    const clean = raw.replace(/```json|```/g,'').trim()

    let parsed = { speech:"My apologies, sir. I seem to have lost my train of thought entirely." }
    try { parsed = JSON.parse(clean) } catch {}

    return { statusCode:200, headers:CORS, body:JSON.stringify({ speech:parsed.speech||'', action:parsed.action||null }) }
  } catch (err) {
    console.error('jarvis-ai error:',err)
    return { statusCode:500, headers:CORS, body:JSON.stringify({ speech:"Systems are experiencing some turbulence, sir. I'll have it sorted momentarily.", action:null }) }
  }
}
