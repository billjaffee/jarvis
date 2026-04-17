import { useState, useEffect, useRef } from 'react'
import { Save, RotateCcw } from 'lucide-react'

const STORAGE_KEY = 'jarvis_notes'

export default function NotesPanel({ onNotesChange }) {
  const [notes, setNotes] = useState(() => localStorage.getItem(STORAGE_KEY) || '')
  const [saved, setSaved] = useState(true)
  const [lastSaved, setLastSaved] = useState(null)
  const autoSaveRef = useRef(null)

  useEffect(() => {
    onNotesChange?.(notes)
  }, [notes])

  const handleChange = (e) => {
    setNotes(e.target.value)
    setSaved(false)
    clearTimeout(autoSaveRef.current)
    autoSaveRef.current = setTimeout(() => save(e.target.value), 1500)
  }

  const save = (text = notes) => {
    localStorage.setItem(STORAGE_KEY, text)
    setSaved(true)
    setLastSaved(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }))
  }

  const clear = () => {
    if (window.confirm('Clear all notes?')) {
      setNotes('')
      localStorage.removeItem(STORAGE_KEY)
      setSaved(true)
    }
  }

  return (
    <div className="hud-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <div className="status-dot pulse" />
        <span className="panel-title">Quick Notes</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {lastSaved && (
            <span style={{
              fontFamily: 'Share Tech Mono, monospace',
              fontSize: '0.55rem',
              color: saved ? 'var(--accent-gold)' : 'var(--text-muted)',
            }}>
              {saved ? `Saved ${lastSaved}` : 'Unsaved…'}
            </span>
          )}
          {!saved && (
            <button
              onClick={() => save()}
              className="btn btn-ghost"
              style={{ padding: '0.2rem 0.5rem', gap: '0.3rem', display: 'flex', alignItems: 'center' }}
            >
              <Save size={10} /> Save
            </button>
          )}
        </div>
      </div>

      <textarea
        value={notes}
        onChange={handleChange}
        placeholder={"Scratch pad — type anything.\nAuto-saves after 1.5s.\nSay 'Read my notes' to Jarvis."}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: 'var(--text-primary)',
          fontFamily: 'Barlow Condensed, sans-serif',
          fontSize: '0.88rem',
          lineHeight: 1.6,
          padding: '0.8rem 1rem',
          resize: 'none',
          width: '100%',
        }}
      />

      <div style={{
        padding: '0.35rem 0.9rem',
        borderTop: '1px solid var(--border-dim)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: '0.55rem',
          color: 'var(--text-muted)',
          letterSpacing: '0.08em',
        }}>
          {notes.length} chars · Persisted locally
        </span>
        {notes && (
          <button
            onClick={clear}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              fontFamily: 'Rajdhani, sans-serif',
              fontSize: '0.6rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}
          >
            <RotateCcw size={9} /> Clear
          </button>
        )}
      </div>
    </div>
  )
}
