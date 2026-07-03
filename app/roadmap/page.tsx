'use client'

import { useState, useMemo, useEffect } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import Link from 'next/link'

interface Item { id: string; text: string; done: boolean; category?: string; notes?: string; duration?: string }
interface Section { id: string; title: string; emoji: string; items: Item[] }

const ACCENT = '#f97316'
const ACCENT2 = '#22d3ee'
const BG = '#0b0e14'
const CARD = '#131722'
const BORDER = '#232838'
const PANEL_BG = '#0f1520'
const TEXT = '#e6e9f0'
const TEXT_MUTED = '#8b92a5'

export default function RoadmapPage() {
  const [sections, setSections] = useState<Section[]>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingNotes, setEditingNotes] = useState<Record<string, string>>({})
  const [savingNotes, setSavingNotes] = useState(false)

  useEffect(() => {
    const load = () => fetch('/api/roadmap')
      .then(r => r.json())
      .then(d => { setSections(d.sections || []); setLoading(false) })
    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [])


  function parseDuration(d?: string): number {
    if (!d) return 0
    const s = d.toLowerCase()
    // Minutes
    if (s.includes('min')) {
      const m = s.match(/(\d+)/)
      return m ? parseInt(m[1]) / 60 : 0
    }
    // Days (1 Tag = 8h)
    if (s.includes('tag')) {
      const m = s.match(/(\d+)[–\-](\d+)/)
      if (m) return ((parseInt(m[1]) + parseInt(m[2])) / 2) * 8
      const m2 = s.match(/(\d+)/)
      return m2 ? parseInt(m2[1]) * 8 : 0
    }
    // Hours range e.g. "1–2 Std" or "mehrere Std/Woche"
    if (s.includes('std') || s.includes('h')) {
      if (s.includes('mehrere')) return 4
      const m = s.match(/(\d+)[–\-](\d+)/)
      if (m) return (parseInt(m[1]) + parseInt(m[2])) / 2
      const m2 = s.match(/(\d+)/)
      return m2 ? parseInt(m2[1]) : 0
    }
    return 0
  }

  function formatHours(h: number): string {
    if (h === 0) return ''
    if (h < 1) return `${Math.round(h * 60)} Min`
    const rounded = Math.round(h * 10) / 10
    return `${rounded} Std`
  }

  const overallProgress = useMemo(() => {
    const all = sections.flatMap(s => s.items)
    const done = all.filter(i => i.done).length
    return all.length ? Math.round((done / all.length) * 100) : 0
  }, [sections])

  async function toggleItem(sectionId: string, itemId: string) {
    setSections(prev => prev.map(s =>
      s.id !== sectionId ? s : {
        ...s, items: s.items.map(i => i.id === itemId ? { ...i, done: !i.done } : i)
      }
    ))
    await fetch('/api/roadmap/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sectionId, itemId }),
    })
  }

  async function saveNotes(sectionId: string, itemId: string, notes: string) {
    setSavingNotes(true)
    setSections(prev => prev.map(s =>
      s.id !== sectionId ? s : {
        ...s, items: s.items.map(i => i.id === itemId ? { ...i, notes } : i)
      }
    ))
    await fetch('/api/roadmap/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sectionId, itemId, notes }),
    })
    setSavingNotes(false)
  }

  function toggleExpand(itemId: string, currentNotes: string) {
    if (expandedId === itemId) {
      setExpandedId(null)
    } else {
      setExpandedId(itemId)
      setEditingNotes(prev => ({ ...prev, [itemId]: currentNotes || '' }))
    }
  }

  async function addItem(sectionId: string) {
    const text = (drafts[sectionId] || '').trim()
    if (!text) return
    const newItem: Item = { id: `${sectionId}-${Date.now()}`, text, done: false }
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, items: [...s.items, newItem] } : s))
    setDrafts(prev => ({ ...prev, [sectionId]: '' }))
    await fetch('/api/roadmap/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sectionId, text }),
    })
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT_MUTED }}>
      Lade Roadmap...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>


      <div style={{ padding: '2rem 2rem', maxWidth: 1200, margin: '0 auto', width: '100%' }}>

        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ color: TEXT_MUTED, display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>SpiritLamps Launch-Roadmap</h1>
            <p style={{ color: TEXT_MUTED, fontSize: 13, marginTop: 2 }}>Start: 3. Juli 2026 · Launch: 1. November 2026 · BCB Berlin: 12.–14. Oktober</p>
          </div>
        </div>

        {/* Overall progress */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: TEXT_MUTED, marginBottom: 6 }}>
            <span>Gesamtfortschritt</span>
            <span style={{ color: ACCENT2, fontWeight: 600 }}>{overallProgress}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: BORDER, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${overallProgress}%`, background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT2})`, transition: 'width 0.4s ease' }} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sections.map(section => {
            const doneCount = section.items.filter(i => i.done).length
            const total = section.items.length
            const pct = total ? Math.round((doneCount / total) * 100) : 0
            const remainingHours = section.items
              .filter(i => !i.done)
              .reduce((sum, i) => sum + parseDuration(i.duration), 0)
            const remainingLabel = formatHours(remainingHours)
            return (
              <div key={section.id} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                  <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{section.emoji} {section.title}</h2>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'baseline' }}>
                    <span style={{ fontSize: 12, color: ACCENT2 }}>{doneCount}/{total} · {pct}%</span>
                    {remainingLabel && (
                      <span style={{ fontSize: 13, color: ACCENT, fontWeight: 700 }}>⏱ {remainingLabel} offen</span>
                    )}
                  </div>
                </div>
                <div style={{ height: 3, borderRadius: 999, background: BORDER, marginBottom: 12, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: ACCENT2, transition: 'width 0.3s' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                  {section.items.map(item => {
                    const isOpen = expandedId === item.id
                    const noteVal = editingNotes[item.id] ?? (item.notes || '')
                    return (
                      <div key={item.id} style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${isOpen ? ACCENT : item.done ? 'rgba(255,255,255,0.05)' : BORDER}` }}>
                        {/* Row */}
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          background: item.done ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                          padding: '10px 14px',
                        }}>
                          <input
                            type="checkbox"
                            checked={item.done}
                            onChange={() => toggleItem(section.id, item.id)}
                            style={{ accentColor: ACCENT, width: 16, height: 16, flexShrink: 0, cursor: 'pointer' }}
                          />
                          <button
                            onClick={() => toggleExpand(item.id, item.notes || '')}
                            style={{
                              background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left',
                              fontSize: 18, color: item.done ? TEXT_MUTED : TEXT,
                              textDecoration: item.done ? 'line-through' : 'none',
                              lineHeight: 1.4, flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}
                          >
                            <span>
                              {item.text}
                              {item.notes && <span style={{ marginLeft: 6, fontSize: 10, color: ACCENT2 }}>●</span>}
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                              {item.duration && (
                                <span style={{ fontSize: 13, color: ACCENT, fontWeight: 600 }}>⏱ {item.duration}</span>
                              )}
                              <span style={{ fontSize: 12, color: TEXT_MUTED }}>{isOpen ? '▲' : '▼'}</span>
                            </span>
                          </button>
                        </div>

                        {/* Accordion body */}
                        {isOpen && (
                          <div style={{ background: 'rgba(0,0,0,0.25)', borderTop: `1px solid ${BORDER}`, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {item.category && (
                              <span style={{ fontSize: 11, color: ACCENT2, background: 'rgba(34,211,238,0.1)', padding: '2px 8px', borderRadius: 99, border: `1px solid rgba(34,211,238,0.2)`, alignSelf: 'flex-start' }}>
                                {item.category}
                              </span>
                            )}
                            <textarea
                              value={noteVal}
                              onChange={e => setEditingNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                              placeholder="Notizen, Links, nächste Schritte..."
                              rows={3}
                              style={{
                                background: 'rgba(0,0,0,0.3)', border: `1px solid ${BORDER}`, borderRadius: 8,
                                padding: '12px 16px', color: TEXT, fontSize: 28, lineHeight: 1.6, outline: 'none', resize: 'vertical',
                              }}
                            />
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                onClick={() => saveNotes(section.id, item.id, noteVal)}
                                disabled={savingNotes || noteVal === (item.notes || '')}
                                style={{
                                  padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer',
                                  background: ACCENT, color: '#fff', fontSize: 13, fontWeight: 500,
                                  opacity: (savingNotes || noteVal === (item.notes || '')) ? 0.4 : 1,
                                }}
                              >
                                {savingNotes ? 'Speichere...' : 'Notiz speichern'}
                              </button>
                              <button
                                onClick={() => toggleItem(section.id, item.id)}
                                style={{
                                  padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                                  background: item.done ? 'rgba(34,197,94,0.15)' : 'rgba(249,115,22,0.12)',
                                  color: item.done ? '#4ade80' : ACCENT,
                                }}
                              >
                                {item.done ? '✓ Als offen markieren' : '○ Als erledigt markieren'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <input
                    type="text"
                    placeholder="Neue Aufgabe..."
                    value={drafts[section.id] || ''}
                    onChange={e => setDrafts(prev => ({ ...prev, [section.id]: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && addItem(section.id)}
                    style={{ flex: 1, background: BG, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '6px 10px', color: TEXT, fontSize: 12, outline: 'none' }}
                  />
                  <button onClick={() => addItem(section.id)} style={{ background: 'transparent', border: `1px solid ${ACCENT}`, color: ACCENT, borderRadius: 8, padding: '6px 12px', fontSize: 13, cursor: 'pointer' }}>
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
