import { useCallback, useRef, useState, useEffect } from 'react'

function pickVoice(voices) {
  const priority = ['Google UK English Male', 'Daniel', 'Arthur', 'Oliver', 'Malcolm', 'James']
  for (const name of priority) {
    const v = voices.find(v => v.name.includes(name))
    if (v) return v
  }
  return voices.find(v => v.lang === 'en-GB') || voices.find(v => v.lang.startsWith('en')) || voices[0] || null
}

export function useJarvisVoice() {
  const [isSpeaking, setIsSpeaking]         = useState(false)
  const [isListening, setIsListening]       = useState(false)
  const [isThinking, setIsThinking]         = useState(false)
  const [lastTranscript, setLastTranscript] = useState('')
  const [lastResponse, setLastResponse]     = useState('')
  const [voiceReady, setVoiceReady]         = useState(false)
  const [history, setHistory]               = useState([])

  // Use refs to avoid stale closures in async callbacks
  const voicesRef      = useRef([])
  const contextRef     = useRef({})
  const historyRef     = useRef([])      // mirror of history state, always current
  const recognitionRef = useRef(null)

  // Keep historyRef in sync
  useEffect(() => { historyRef.current = history }, [history])

  // Load voices
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
    if (!window.speechSynthesis || !text) return
    window.speechSynthesis.cancel()
    const u     = new SpeechSynthesisUtterance(text)
    u.voice     = pickVoice(voicesRef.current)
    u.rate      = opts.rate  ?? 0.90
    u.pitch     = opts.pitch ?? 0.80
    u.volume    = opts.volume ?? 1
    u.onstart   = () => setIsSpeaking(true)
    u.onend     = () => setIsSpeaking(false)
    u.onerror   = () => setIsSpeaking(false)
    window.speechSynthesis.speak(u)
    setLastResponse(text)
  }, [])

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
  }, [])

  const setContext = useCallback((ctx) => { contextRef.current = ctx }, [])

  // Execute actions — stable, no deps on changing state
  const executeAction = useCallback(async (action) => {
    const { type, params = {} } = action
    try {
      switch (type) {
        case 'add_task':
          window.__jarvisAddTask?.(params.text)
          break
        case 'reply_email':
          await fetch('/.netlify/functions/gmail-reply', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body:JSON.stringify(params),
          })
          break
        case 'delete_email':
          await fetch('/.netlify/functions/gmail-delete', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body:JSON.stringify({ messageId:params.emailId }),
          })
          contextRef.current.onDeleteEmail?.(params.emailId)
          break
        case 'mark_read':
          await fetch('/.netlify/functions/gmail-mark-read', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body:JSON.stringify({ messageId:params.emailId }),
          })
          contextRef.current.onMarkRead?.(params.emailId)
          break
        case 'accept_kate_invites':
          await fetch('/.netlify/functions/calendar-accept', { method:'POST' })
          break
        case 'compose_email':
          await fetch('/.netlify/functions/gmail-reply', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body:JSON.stringify({ ...params, messageId:'new' }),
          })
          break
        default:
          break
      }
    } catch (err) { console.error('Action error:', err) }
  }, [])

  // Core AI call — uses refs so always has fresh data, no stale closure
  const sendMessage = useCallback(async (text) => {
    if (!text?.trim()) return
    setIsThinking(true)
    try {
      const res = await fetch('/.netlify/functions/jarvis-ai', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          message: text,
          history: historyRef.current.slice(-12),   // always fresh via ref
          dashboardContext: {
            ...contextRef.current,                   // always fresh via ref
            time: new Date().toISOString(),
          },
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const { speech, action } = data

      // Update history
      const newHistory = [
        ...historyRef.current.slice(-18),
        { role:'user',      content:text },
        { role:'assistant', content:speech || '' },
      ]
      historyRef.current = newHistory
      setHistory(newHistory)

      if (speech) speak(speech)
      if (action?.type) await executeAction(action)
    } catch (err) {
      console.error('AI error:', err)
      speak("My apologies, sir. I seem to have lost the thread. Shall we try again?")
    } finally {
      setIsThinking(false)
    }
  }, [speak, executeAction]) // stable — speak and executeAction don't change

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      speak("Voice recognition isn't available in this browser, sir. Chrome or Edge will do nicely.")
      return
    }
    const rec = new SR()
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.continuous = false
    rec.onstart   = () => setIsListening(true)
    rec.onend     = () => setIsListening(false)
    rec.onerror   = (e) => {
      setIsListening(false)
      if (e.error !== 'no-speech') speak("I didn't quite catch that, sir. Shall we try again?")
    }
    rec.onresult  = (e) => {
      const text = e.results[0][0].transcript
      setLastTranscript(text)
      sendMessage(text)  // sendMessage is stable, safe to call here
    }
    recognitionRef.current = rec
    rec.start()
  }, [speak, sendMessage])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const clearHistory = useCallback(() => {
    historyRef.current = []
    setHistory([])
  }, [])

  return {
    speak, stopSpeaking, isSpeaking,
    startListening, stopListening, isListening,
    isThinking, lastTranscript, lastResponse,
    voiceReady, history, clearHistory,
    setContext, sendMessage,
  }
}

export function getGreeting(name = 'sir') {
  const h   = new Date().getHours()
  const day = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' })
  if (h < 5)  return `Still at it, sir. It's ${day}. All systems nominal. Here's your status.`
  if (h < 12) return `Good morning, sir. It's ${day}. Here's a look at what's on your radar. I'm here to assist.`
  if (h < 17) return `Good afternoon, sir. It's ${day}. Here's a look at what's on your radar. I'm here to assist.`
  if (h < 21) return `Good evening, sir. It's ${day}. Here's your status. Standing by.`
  return `Working late again, sir. It's ${day}. I've kept the lights on. Here's where things stand.`
}
