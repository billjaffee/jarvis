import { useCallback, useRef, useState, useEffect } from 'react'

// Pick the best available British/Jarvis-like voice
function pickVoice(voices) {
  const priority = [
    'Google UK English Male',
    'Daniel',            // macOS British
    'Arthur',            // Edge / macOS
    'Oliver',
    'Malcolm',
  ]
  for (const name of priority) {
    const v = voices.find(v => v.name.includes(name))
    if (v) return v
  }
  // Any British voice
  const gb = voices.find(v => v.lang === 'en-GB')
  if (gb) return gb
  // Any English
  const en = voices.find(v => v.lang.startsWith('en'))
  return en || voices[0] || null
}

export function useJarvisVoice() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [lastTranscript, setLastTranscript] = useState('')
  const [voiceReady, setVoiceReady] = useState(false)
  const recognitionRef = useRef(null)
  const voicesRef = useRef([])

  // Load voices (browsers load them async)
  useEffect(() => {
    const load = () => {
      const v = window.speechSynthesis?.getVoices() || []
      voicesRef.current = v
      if (v.length) setVoiceReady(true)
    }
    load()
    window.speechSynthesis?.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', load)
  }, [])

  const speak = useCallback((text, opts = {}) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.voice = pickVoice(voicesRef.current)
    utterance.rate = opts.rate ?? 0.92
    utterance.pitch = opts.pitch ?? 0.82
    utterance.volume = opts.volume ?? 1

    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(utterance)
  }, [])

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
  }, [])

  // startListening takes a context object with current data so Jarvis can answer
  const startListening = useCallback((commandContext) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      speak("Voice recognition isn't supported in this browser, Mr. Jaffee. I recommend Chrome or Edge.")
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.continuous = false

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = (e) => {
      setIsListening(false)
      if (e.error !== 'no-speech') {
        speak("I didn't catch that, Mr. Jaffee. Please try again.")
      }
    }

    recognition.onresult = (e) => {
      const raw = e.results[0][0].transcript
      const text = raw.toLowerCase().trim()
      setLastTranscript(raw)
      processCommand(text, commandContext, speak)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [speak])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  return {
    speak,
    stopSpeaking,
    isSpeaking,
    startListening,
    stopListening,
    isListening,
    lastTranscript,
    voiceReady,
  }
}

// ─── COMMAND PROCESSOR ────────────────────────────────────────
function processCommand(text, ctx = {}, speak) {
  const { weather, events, emailCount, flaggedCount, tasks, notes, addTask } = ctx

  const now = new Date()
  const hour = now.getHours()
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  // Greeting
  if (/hello|hi jarvis|hey jarvis|good morning|good afternoon|good evening/.test(text)) {
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
    return speak(`${greeting}, Mr. Jaffee. All systems are operational. What can I do for you?`)
  }

  // Time
  if (/what time|the time|current time/.test(text)) {
    return speak(`The time is ${timeStr}, Mr. Jaffee.`)
  }

  // Weather
  if (/weather|temperature|forecast|outside|degrees/.test(text)) {
    if (weather?.temp) {
      return speak(
        `Current conditions in Colorado Springs: ${Math.round(weather.temp)} degrees Fahrenheit, ${weather.description}. Wind speed is ${Math.round(weather.wind)} miles per hour.`
      )
    }
    return speak('Weather data is loading, Mr. Jaffee. Please try again in a moment.')
  }

  // Calendar
  if (/calendar|schedule|today|meeting|event|appointment/.test(text)) {
    if (!events || events.length === 0) {
      return speak("Your calendar is clear today, Mr. Jaffee. A rare and enviable situation.")
    }
    const todayEvents = events.filter(e => e.today)
    if (todayEvents.length === 0) {
      return speak("Nothing on the calendar today, Mr. Jaffee. No meetings, no commitments.")
    }
    const list = todayEvents.slice(0, 3).map(e => `${e.title} at ${e.time}`).join('. Then, ')
    return speak(`You have ${todayEvents.length} item${todayEvents.length !== 1 ? 's' : ''} today, Mr. Jaffee. ${list}.`)
  }

  // Email
  if (/email|mail|inbox|message|unread/.test(text)) {
    const unread = emailCount ?? 0
    const flagged = flaggedCount ?? 0
    return speak(
      `You have ${unread} unread message${unread !== 1 ? 's' : ''} in your inbox, Mr. Jaffee. ${flagged > 0 ? `${flagged} flagged for your attention.` : 'None flagged.'} Live integration arrives in Phase 2.`
    )
  }

  // Add task
  const taskMatch = text.match(/(?:add|create|new) task[:\s]+(.+)/)
  if (taskMatch) {
    const taskName = taskMatch[1].trim()
    if (taskName && addTask) {
      addTask(taskName)
      return speak(`Task added: "${taskName}". Your list has been updated, Mr. Jaffee.`)
    }
    return speak(`I didn't catch a task name. Please say: "Add task" followed by the task.`)
  }

  // Tasks
  if (/tasks|to.?do|my list/.test(text)) {
    if (!tasks || tasks.length === 0) {
      return speak("Your task list is empty, Mr. Jaffee. Impressively clear.")
    }
    const incomplete = tasks.filter(t => !t.done)
    if (incomplete.length === 0) {
      return speak("All tasks are completed, Mr. Jaffee. Extraordinary.")
    }
    return speak(
      `You have ${incomplete.length} outstanding task${incomplete.length !== 1 ? 's' : ''}. The first is: "${incomplete[0].text}".`
    )
  }

  // Notes
  if (/note|notes/.test(text)) {
    if (!notes || !notes.trim()) {
      return speak("Your notes are currently empty, Mr. Jaffee.")
    }
    return speak(`Your notes read: ${notes.slice(0, 200)}`)
  }

  // Status
  if (/status|system|online|phase/.test(text)) {
    return speak(
      `Systems are nominal, Mr. Jaffee. Running Phase 1 with live weather and mock data for email and calendar. Full Google integration comes online in Phase 2.`
    )
  }

  // Refresh / data
  if (/refresh|update|sync/.test(text)) {
    return speak(`Refreshing dashboard data now, Mr. Jaffee.`)
  }

  // Unknown
  return speak(
    `I'm afraid that command isn't in my Phase 1 repertoire, Mr. Jaffee. Try asking about the weather, calendar, email, tasks, or time. My full capabilities arrive in Phase 2.`
  )
}

// Export so Dashboard can use greeting logic directly
export function getGreeting(firstName = 'Mr. Jaffee') {
  const h = new Date().getHours()
  const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const day  = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  if (h < 5)  return `Still burning the midnight oil, ${firstName}. It is ${time} on ${day}. Here's a look at what's on your radar. I'm here to assist.`
  if (h < 12) return `Good morning, ${firstName}. It is ${time} on ${day}. Here's a look at what's on your radar. I'm here to assist.`
  if (h < 17) return `Good afternoon, ${firstName}. It is ${time} on ${day}. Here's a look at what's on your radar. I'm here to assist.`
  if (h < 21) return `Good evening, ${firstName}. It is ${time} on ${day}. Here's a look at what's on your radar. I'm here to assist.`
  return `Working late, ${firstName}. It is ${time} on ${day}. Here's a look at what's on your radar. I'm here to assist.`
}
