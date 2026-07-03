'use client'

import { useState, useMemo, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Item { id: string; text: string; done: boolean }
interface Section { id: string; title: string; items: Item[] }

const ACCENT = '#f97316'
const ACCENT2 = '#22d3ee'
const BG = '#0b0e14'
const CARD = '#131722'
const BORDER = '#232838'
const TEXT = '#e6e9f0'
const TEXT_MUTED = '#8b92a5'

export default function RoadmapPage() {
  const [sections, setSections] = useState<Section[]>([])
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/roadmap')
      .then(r => r.json())
      .then(d => { setSections(d.sections || []); setLoading(false) })
  }, [])

  const overallProgress = useMemo(() => {
    const all = sections.flatMap(s => s.items)
    const done = all.filter(i => i.done).length
    return all.length ? Math.round((done / all.length) * 100) : 0
  }, [sections])

  async function toggleItem(sectionId: string, itemId: string) {
    // Optimistic update
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
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, padding: '2rem 1.5rem', fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link href="/" style={{ color: TEXT_MUTED, display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>SpiritLamps Launch-Roadmap</h1>
            <p style={{ color: TEXT_MUTED, fontSize: 14, marginTop: 2 }}>Start: 3. Juli 2026 · Launch: 1. November 2026</p>
          </div>
        </div>

        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: TEXT_MUTED, marginBottom: 6 }}>
            <span>Gesamtfortschritt</span>
            <span style={{ color: ACCENT2, fontWeight: 600 }}>{overallProgress}%</span>
          </div>
          <div style={{ height: 8, borderRadius: 999, background: BORDER, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${overallProgress}%`,
              background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT2})`,
              transition: 'width 0.3s ease',
            }} />
          </div>
        </div>

        {sections.map(section => {
          const doneCount = section.items.filter(i => i.done).length
          const total = section.items.length
          const pct = total ? Math.round((doneCount / total) * 100) : 0
          return (
            <div key={section.id} style={{
              background: CARD, border: `1px solid ${BORDER}`,
              borderRadius: 12, padding: '1rem 1.25rem', marginBottom: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{section.title}</h2>
                <span style={{ fontSize: 12, color: ACCENT2 }}>{doneCount}/{total} · {pct}%</span>
              </div>

              <div style={{ height: 3, borderRadius: 999, background: BORDER, marginBottom: 12, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: ACCENT2, transition: 'width 0.3s' }} />
              </div>

              {section.items.map(item => (
                <label key={item.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '6px 0', cursor: 'pointer', fontSize: 14,
                  color: item.done ? TEXT_MUTED : TEXT,
                  textDecoration: item.done ? 'line-through' : 'none',
                }}>
                  <input type="checkbox" checked={item.done} onChange={() => toggleItem(section.id, item.id)}
                    style={{ marginTop: 3, accentColor: ACCENT, width: 16, height: 16, flexShrink: 0 }} />
                  <span>{item.text}</span>
                </label>
              ))}

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <input type="text" placeholder="Neue Aufgabe hinzufügen..."
                  value={drafts[section.id] || ''}
                  onChange={e => setDrafts(prev => ({ ...prev, [section.id]: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && addItem(section.id)}
                  style={{
                    flex: 1, background: BG, border: `1px solid ${BORDER}`,
                    borderRadius: 8, padding: '8px 10px', color: TEXT, fontSize: 13, outline: 'none',
                  }} />
                <button onClick={() => addItem(section.id)} style={{
                  background: 'transparent', border: `1px solid ${ACCENT}`,
                  color: ACCENT, borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer',
                }}>+</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
