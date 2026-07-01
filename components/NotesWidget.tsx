'use client'

import { useEffect, useState, useRef } from 'react'
import { Plus, Trash2, StickyNote } from 'lucide-react'
import { Note } from '@/lib/types'

const COLORS: { key: Note['color']; bg: string; border: string; text: string }[] = [
  { key: 'default', bg: 'bg-[#1a1a2e]', border: 'border-white/10', text: 'text-slate-300' },
  { key: 'yellow', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-200' },
  { key: 'cyan', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-200' },
  { key: 'pink', bg: 'bg-pink-500/10', border: 'border-pink-500/30', text: 'text-pink-200' },
  { key: 'green', bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-200' },
]

function colorStyle(color: Note['color']) {
  return COLORS.find((c) => c.key === color) ?? COLORS[0]
}

export default function NotesWidget() {
  const [notes, setNotes] = useState<Note[]>([])
  const [newText, setNewText] = useState('')
  const [newColor, setNewColor] = useState<Note['color']>('yellow')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    fetch('/api/notes').then(r => r.json()).then(d => setNotes(d.notes || []))
  }, [])

  async function addNote() {
    if (!newText.trim()) return
    const res = await fetch('/api/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newText.trim(), color: newColor }),
    })
    const data = await res.json()
    setNotes(data.notes)
    setNewText('')
  }

  async function deleteNote(id: string) {
    const res = await fetch('/api/notes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const data = await res.json()
    setNotes(data.notes)
  }

  async function saveEdit(id: string) {
    const res = await fetch('/api/notes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, text: editText }),
    })
    const data = await res.json()
    setNotes(data.notes)
    setEditingId(null)
  }

  function startEdit(note: Note) {
    setEditingId(note.id)
    setEditText(note.text)
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  return (
    <div className="card-base p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-yellow-400" /> Notizen
        </h2>
        <span className="text-[10px] text-slate-600">{notes.length} Notiz{notes.length !== 1 ? 'en' : ''}</span>
      </div>

      {/* New note input */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-2">
          <textarea
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) addNote() }}
            placeholder="Neue Notiz... (Ctrl+Enter zum Speichern)"
            rows={2}
            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-yellow-500/50 resize-none"
          />
          <div className="flex items-center gap-2">
            {COLORS.map((c) => (
              <button
                key={c.key}
                onClick={() => setNewColor(c.key)}
                className={`w-4 h-4 rounded-full border-2 transition-transform ${c.bg} ${newColor === c.key ? 'border-white scale-125' : 'border-transparent'}`}
              />
            ))}
          </div>
        </div>
        <button
          onClick={addNote}
          disabled={!newText.trim()}
          className="self-start px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg text-sm transition-colors disabled:opacity-40 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Notes grid */}
      {notes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {[...notes].reverse().map((note) => {
            const cs = colorStyle(note.color)
            return (
              <div
                key={note.id}
                className={`relative rounded-lg border p-3 ${cs.bg} ${cs.border} group`}
              >
                {editingId === note.id ? (
                  <textarea
                    ref={textareaRef}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onBlur={() => saveEdit(note.id)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) saveEdit(note.id) }}
                    className="w-full bg-transparent text-sm resize-none focus:outline-none"
                    rows={3}
                  />
                ) : (
                  <p
                    onClick={() => startEdit(note)}
                    className={`text-sm whitespace-pre-wrap cursor-text ${cs.text}`}
                  >
                    {note.text}
                  </p>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-slate-700">
                    {new Date(note.updatedAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                  </span>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {notes.length === 0 && (
        <p className="text-xs text-slate-600 text-center py-4">Noch keine Notizen</p>
      )}
    </div>
  )
}
