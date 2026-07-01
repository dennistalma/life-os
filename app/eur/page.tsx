'use client'

import { useEffect, useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { Transaction } from '@/lib/types'

const fmt = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7) // YYYY-MM
}

function toCsv(transactions: Transaction[]): string {
  const header = ['Datum', 'Typ', 'Beschreibung', 'Aussteller', 'Kategorie', 'Netto', 'MwSt.', 'Brutto']
  const rows = transactions.map((t) => [
    t.date,
    t.type === 'income' ? 'Einnahme' : 'Ausgabe',
    t.description,
    t.vendor ?? '',
    t.category ?? '',
    (t.netAmount ?? t.amount).toFixed(2),
    (t.vatAmount ?? 0).toFixed(2),
    t.amount.toFixed(2),
  ])
  return [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
}

export default function EurPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/data')
      .then((r) => r.json())
      .then((d) => {
        setTransactions(d.transactions ?? [])
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [])

  const sorted = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)),
    [transactions]
  )

  const totals = useMemo(() => {
    const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const expenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    return { income, expenses, balance: income - expenses }
  }, [transactions])

  const byMonth = useMemo(() => {
    const map = new Map<string, { income: number; expenses: number }>()
    for (const t of transactions) {
      const key = monthKey(t.date)
      const cur = map.get(key) ?? { income: 0, expenses: 0 }
      if (t.type === 'income') cur.income += t.amount
      else cur.expenses += t.amount
      map.set(key, cur)
    }
    return [...map.entries()].sort((a, b) => b[0].localeCompare(a[0]))
  }, [transactions])

  function handleExport() {
    const csv = toCsv(sorted)
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `euer-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f]">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-center justify-end">
          <button
            onClick={handleExport}
            disabled={!loaded || transactions.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-medium hover:bg-cyan-500/20 disabled:opacity-30 transition-all"
          >
            <Download className="w-4 h-4" /> CSV exportieren
          </button>
        </div>

        <h1 className="text-xl font-semibold text-slate-100">Einnahmen-Überschuss-Rechnung</h1>

        <div className="grid grid-cols-3 gap-3">
          <div className="card-base p-4">
            <p className="text-xs text-slate-500 mb-1">Einnahmen gesamt</p>
            <p className="text-xl font-semibold text-green-400">{fmt(totals.income)}</p>
          </div>
          <div className="card-base p-4">
            <p className="text-xs text-slate-500 mb-1">Ausgaben gesamt</p>
            <p className="text-xl font-semibold text-red-400">{fmt(totals.expenses)}</p>
          </div>
          <div className="card-base p-4">
            <p className="text-xs text-slate-500 mb-1">Überschuss</p>
            <p className={`text-xl font-semibold ${totals.balance >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>
              {fmt(totals.balance)}
            </p>
          </div>
        </div>

        {byMonth.length > 0 && (
          <div className="card-base p-4 space-y-2">
            <h2 className="text-sm font-semibold text-slate-300">Nach Monat</h2>
            <div className="space-y-1">
              {byMonth.map(([month, v]) => (
                <div key={month} className="flex items-center gap-3 text-sm py-1">
                  <span className="text-slate-500 w-20 font-mono">{month}</span>
                  <span className="text-green-400 flex-1">+{fmt(v.income)}</span>
                  <span className="text-red-400 flex-1">-{fmt(v.expenses)}</span>
                  <span className="text-slate-300 font-medium">{fmt(v.income - v.expenses)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card-base p-4 space-y-2">
          <h2 className="text-sm font-semibold text-slate-300">Alle Buchungen</h2>
          {sorted.length === 0 ? (
            <p className="text-xs text-slate-600 py-2">Noch keine Buchungen erfasst.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-[#1f1f2e]">
                    <th className="py-2 pr-3 font-medium">Datum</th>
                    <th className="py-2 pr-3 font-medium">Beschreibung</th>
                    <th className="py-2 pr-3 font-medium">Aussteller</th>
                    <th className="py-2 pr-3 font-medium">Kategorie</th>
                    <th className="py-2 pr-3 font-medium text-right">Netto</th>
                    <th className="py-2 pr-3 font-medium text-right">MwSt.</th>
                    <th className="py-2 font-medium text-right">Brutto</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((t) => (
                    <tr key={t.id} className="border-b border-[#1f1f2e]/50 hover:bg-[#1e1e2a] transition-colors">
                      <td className="py-2 pr-3 text-slate-500 font-mono text-xs">{t.date}</td>
                      <td className="py-2 pr-3 text-slate-300">{t.description}</td>
                      <td className="py-2 pr-3 text-slate-500">{t.vendor ?? '–'}</td>
                      <td className="py-2 pr-3 text-slate-500">{t.category ?? '–'}</td>
                      <td className="py-2 pr-3 text-right text-slate-400">{fmt(t.netAmount ?? t.amount)}</td>
                      <td className="py-2 pr-3 text-right text-slate-400">{fmt(t.vatAmount ?? 0)}</td>
                      <td className={`py-2 text-right font-medium ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                        {t.type === 'expense' ? '-' : '+'}{fmt(t.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
