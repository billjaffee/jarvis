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
  const [isSpeaking, setIsSpeaking]       = useState(false)
  const [isListening, setIsListening]     = useState(false)
  const [isThinking, setIsThinking]       = useState(false)
  const [lastTranscript, setLastTranscript] = useState('')
  const [lastResponse, setLastResponse]   = useState('')
  const [voiceReady, setVoiceReady]       = useState(false)
  const [history, setHistory]             = useState([])
  const recognitionRef = useRef(null)
  const voicesRef      = useRef([])
  const contextRef     = useRef({})

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
    const utterance    = new SpeechSynthesisUtterance(text)
    utterance.voice    = pickVoice(voicesRef.current)
    utterance.rate     = opts.rate  ?? 0.90
    utterance.pitch    = opts.pitch ?? 0.80
    utterance.volume   = opts.volume ?? 1
    utterance.onstart  = () => setIsSpeaking(true)
    utterance.onend    = () => setIsSpeaking(false)
    utterance.onerror  = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
    setLastResponse(text)
  }, [])

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel()
    setIsSpeaking(false)
  }, [])

  const setContext = useCallback((ctx) => {
    contextRef.current = ctx
  }, [])

  // Execute actions returned by Claude
  const executeAction = useCallback(async (action) => {
    const { type, params = {} } = action
    try {
      switch (type) {
        case 'add_task':
          window.__jarvisAddTask?.(params.text)
          break

        case 'play_music': {
          // Open YouTube with the song — closest to the Iron Man experience
          const query = encodeURIComponent(params.query || 'Should I Stay or Should I Go The Clash')
          window.open(`https://www.youtube.com/results?search_query=${query}`, '_blank', 'noopener')
          break
        }

        case 'reply_email':
          await fetch('/.netlify/functions/gmail-reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
          })
          break

        case 'delete_email':
          await fetch('/.netlify/functions/gmail-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageId: params.emailId }),
          })
          contextRef.current.onDeleteEmail?.(params.emailId)
          break

        case 'mark_read':
          await fetch('/.netlify/functions/gmail-mark-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageId: params.emailId }),
          })
          contextRef.current.onMarkRead?.(params.emailId)
          break

        case 'accept_kate_invites':
          await fetch('/.netlify/functions/calendar-accept', { method: 'POST' })
          break

        case 'compose_email':
          await fetch('/.netlify/functions/gmail-reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...params, messageId: 'new' }),
          })
          break

        default:
          break
      }
    } catch (err) {
      console.error('Action error:', err)
    }
  }, [])

  const processWithAI = useCallback(async (transcript) => {
    setIsThinking(true)
    try {
      const res = await fetch('/.netlify/functions/jarvis-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: transcript,
          history,
          dashboardContext: {
            ...contextRef.current,
            time: new Date().toISOString(),
          },
        }),
      })
      const data = await res.json()
      const { speech, action } = data

      setHistory(prev => [
        ...prev.slice(-18),
        { role: 'user',      content: transcript },
        { role: 'assistant', content: speech },
      ])

      if (speech) speak(speech)
      if (action?.type) await executeAction(action)
    } catch (err) {
      speak("My apologies, sir. Something's gone sideways on my end. I'll sort it.")
      console.error('AI error:', err)
    } finally {
      setIsThinking(false)
    }
  }, [history, speak, executeAction])

  const startListening = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      speak("Voice recognition isn't available in this browser, sir. I'd recommend Chrome.")
      return
    }
    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.continuous = false

    recognition.onstart  = () => setIsListening(true)
    recognition.onend    = () => setIsListening(false)
    recognition.onerror  = (e) => {
      setIsListening(false)
      if (e.error !== 'no-speech') speak("I didn't quite catch that, sir. Shall we try again?")
    }
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript
      setLastTranscript(text)
      processWithAI(text)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [speak, processWithAI])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  const clearHistory = useCallback(() => setHistory([]), [])

  return {
    speak, stopSpeaking, isSpeaking,
    startListening, stopListening, isListening,
    isThinking, lastTranscript, lastResponse,
    voiceReady, history, clearHistory, setContext,
    sendMessage: processWithAI,
  }
}

export function getGreeting(firstName = 'sir') {
  const h   = new Date().getHours()
  const day = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  if (h < 5)  return `Still at it, sir. It's ${day}. All systems are online. Here's your current status.`
  if (h < 12) return `Good morning, sir. It's ${day}. Here's a look at what's on your radar. I'm here to assist.`
  if (h < 17) return `Good afternoon, sir. It's ${day}. Here's a look at what's on your radar. I'm here to assist.`
  if (h < 21) return `Good evening, sir. It's ${day}. Here's your status. I'm standing by.`
  return `Working late again, sir. It's ${day}. I've kept the lights on. Here's where things stand.`
}
