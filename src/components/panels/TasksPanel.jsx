import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, Circle, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react'

const STORAGE_KEY = 'jarvis_tasks'

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

export default function TasksPanel({ onTasksChange }) {
  const [tasks, setTasks] = useState(loadTasks)
  const [input, setInput] = useState('')
  const [showDone, setShowDone] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    onTasksChange?.(tasks)
  }, [tasks])

  const addTask = useCallback((text) => {
    const trimmed = typeof text === 'string' ? text.trim() : ''
    if (!trimmed) return
    setTasks(prev => [
      { id: Date.now(), text: trimmed, done: false, created: new Date().toISOString() },
      ...prev,
    ])
  }, [])

  // Expose addTask for Jarvis voice commands
  useEffect(() => {
    window.__jarvisAddTask = addTask
  }, [addTask])

  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const handleAdd = () => {
    addTask(input)
    setInput('')
  }

  const incomplete = tasks.filter(t => !t.done)
  const done = tasks.filter(t => t.done)

  return (
    <div className="hud-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="panel-header">
        <div className="status-dot pulse" />
        <span className="panel-title">Tasks</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <span style={{
            fontFamily: 'Share Tech Mono, monospace',
            fontSize: '0.6rem',
            color: 'var(--text-muted)',
          }}>
            {incomplete.length} open
          </span>
        </div>
      </div>

      {/* Input */}
      <div style={{
        padding: '0.6rem 0.8rem',
        borderBottom: '1px solid var(--border-dim)',
        display: 'flex',
        gap: '0.5rem',
      }}>
        <input
          className="hud-input"
          placeholder="Add a task..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          style={{ flex: 1, fontSize: '0.82rem' }}
        />
        <button
          onClick={handleAdd}
          className="btn btn-amber"
          style={{ padding: '0.35rem 0.7rem', flexShrink: 0 }}
          disabled={!input.trim()}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Task list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.4rem 0' }}>
        {incomplete.length === 0 && done.length === 0 && (
          <div style={{
            padding: '1.2rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.75rem',
            fontStyle: 'italic',
          }}>
            No tasks. Add one above or tell Jarvis.
          </div>
        )}

        {incomplete.map(task => (
          <TaskRow
            key={task.id}
            task={task}
            onToggle={toggleTask}
            onDelete={deleteTask}
          />
        ))}

        {done.length > 0 && (
          <>
            <button
              onClick={() => setShowDone(s => !s)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                borderTop: '1px solid var(--border-dim)',
                color: 'var(--text-muted)',
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: '0.62rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                padding: '0.4rem 0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              {showDone ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              {done.length} completed
            </button>
            {showDone && done.map(task => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onDelete={deleteTask}
                dim
              />
            ))}
          </>
        )}
      </div>

      <div style={{
        padding: '0.35rem 0.9rem',
        borderTop: '1px solid var(--border-dim)',
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '0.55rem',
        color: 'var(--text-muted)',
        letterSpacing: '0.08em',
      }}>
        Persisted locally · Say "Add task [name]" to Jarvis
      </div>
    </div>
  )
}

function TaskRow({ task, onToggle, onDelete, dim }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.5rem',
        padding: '0.45rem 0.9rem',
        opacity: dim ? 0.45 : 1,
        transition: 'opacity 0.2s, background 0.15s',
        background: hovered ? 'rgba(185,122,8,0.05)' : 'transparent',
      }}
    >
      <button
        onClick={() => onToggle(task.id)}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
          color: task.done ? 'var(--accent-gold)' : 'var(--text-muted)',
          flexShrink: 0,
          marginTop: '0.1rem',
        }}
      >
        {task.done
          ? <CheckCircle2 size={15} />
          : <Circle size={15} />
        }
      </button>

      <span style={{
        flex: 1,
        fontSize: '0.82rem',
        color: task.done ? 'var(--text-muted)' : 'var(--text-primary)',
        textDecoration: task.done ? 'line-through' : 'none',
        lineHeight: 1.4,
      }}>
        {task.text}
      </span>

      {hovered && (
        <button
          onClick={() => onDelete(task.id)}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            color: 'var(--text-muted)',
            flexShrink: 0,
          }}
        >
          <Trash2 size={12} />
        </button>
      )}
    </div>
  )
}

// Export addTask for voice hook to call
export { loadTasks }
