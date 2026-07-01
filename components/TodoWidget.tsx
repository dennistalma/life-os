'use client'

import { CheckSquare, Square } from 'lucide-react'
import { Todo, Priority, AppData } from '@/lib/types'

const PRIORITY_CONFIG: Record<Priority, {
  label: string
  color: string
  border: string
  bg: string
  dot: string
  check: string
}> = {
  high:   { label: 'Hoch',    color: 'text-red-400',   border: 'border-red-500/30',   bg: 'bg-red-500/5',   dot: 'bg-red-400',   check: 'text-red-400' },
  medium: { label: 'Mittel',  color: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-500/5', dot: 'bg-amber-400', check: 'text-amber-400' },
  low:    { label: 'Niedrig', color: 'text-green-400', border: 'border-green-500/30', bg: 'bg-green-500/5', dot: 'bg-green-400', check: 'text-green-400' },
}

interface Props {
  todos: Todo[]
  onUpdate: (data: Partial<AppData>) => void
}

export default function TodoWidget({ todos, onUpdate }: Props) {
  async function toggleTodo(id: string) {
    const updated = todos.map((t) => t.id === id ? { ...t, completed: !t.completed } : t)
    onUpdate({ todos: updated })
    await fetch('/api/data')
      .then((r) => r.json())
      .then((d) => fetch('/api/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...d, todos: updated }),
      }))
  }

  const priorities = ['high', 'medium', 'low'] as Priority[]
  const done = todos.filter((t) => t.completed)
  const total = todos.filter((t) => !t.completed).length

  return (
    <div className="card-base p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <span className="text-amber-400">✓</span> To-Dos
        </h2>
        <span className="text-xs text-slate-500">{total} offen · {done.length} erledigt</span>
      </div>

      {todos.length === 0 && (
        <p className="text-xs text-slate-600 py-2">Noch keine Aufgaben. Tippe etwas ins Smart Capture Feld.</p>
      )}

      {/* 3 Spalten nebeneinander */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {priorities.map((priority) => {
          const cfg = PRIORITY_CONFIG[priority]
          const items = todos.filter((t) => t.priority === priority && !t.completed)
          return (
            <div key={priority} className={`rounded-xl border ${cfg.border} ${cfg.bg} p-3 space-y-1.5`}>
              {/* Spalten-Header */}
              <div className="flex items-center gap-2 pb-1 border-b border-white/5">
                <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                <span className="text-[10px] text-slate-600 ml-auto">{items.length}</span>
              </div>

              {items.length === 0 ? (
                <p className="text-[10px] text-slate-700 py-2 text-center">Keine Aufgaben</p>
              ) : (
                items.map((todo) => (
                  <button
                    key={todo.id}
                    onClick={() => toggleTodo(todo.id)}
                    className="flex items-start gap-2 w-full text-left p-1.5 rounded-lg hover:bg-white/5 transition-colors group"
                  >
                    <Square className={`w-3.5 h-3.5 mt-0.5 text-slate-600 group-hover:${cfg.check} flex-shrink-0 transition-colors`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-300 leading-snug">{todo.text}</p>
                      {todo.dueDate && (
                        <p className="text-[10px] text-slate-600 mt-0.5">{todo.dueDate}</p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          )
        })}
      </div>

      {/* Erledigt */}
      {done.length > 0 && (
        <div className="pt-1 border-t border-[#1f1f2e]">
          <p className="text-xs text-slate-600 mb-1">Erledigt ({done.length})</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
            {done.slice(0, 6).map((todo) => (
              <button
                key={todo.id}
                onClick={() => toggleTodo(todo.id)}
                className="flex items-center gap-2 text-left p-1.5 rounded-lg hover:bg-[#1e1e2a] transition-colors"
              >
                <CheckSquare className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                <span className="text-xs text-slate-600 line-through truncate">{todo.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
