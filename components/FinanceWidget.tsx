'use client'

import { Transaction } from '@/lib/types'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface Props {
  transactions: Transaction[]
}

export default function FinanceWidget({ transactions }: Props) {
  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const balance = income - expenses

  const recent = [...transactions]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5)

  const fmt = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })

  return (
    <div className="card-base p-4 space-y-3">
      <h2 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
        <span className="text-green-400">€</span> Finanzen
      </h2>

      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-lg bg-green-500/5 border border-green-500/15">
          <p className="text-xs text-slate-500 mb-1">Einnahmen</p>
          <p className="text-sm font-semibold text-green-400">{fmt(income)}</p>
        </div>
        <div className="p-2.5 rounded-lg bg-red-500/5 border border-red-500/15">
          <p className="text-xs text-slate-500 mb-1">Ausgaben</p>
          <p className="text-sm font-semibold text-red-400">{fmt(expenses)}</p>
        </div>
        <div className={`p-2.5 rounded-lg border ${balance >= 0 ? 'bg-cyan-500/5 border-cyan-500/15' : 'bg-red-500/5 border-red-500/15'}`}>
          <p className="text-xs text-slate-500 mb-1">Bilanz</p>
          <p className={`text-sm font-semibold ${balance >= 0 ? 'text-cyan-400' : 'text-red-400'}`}>{fmt(balance)}</p>
        </div>
      </div>

      {recent.length === 0 ? (
        <p className="text-xs text-slate-600 py-1">Tippe z.B. "50€ für Holz ausgegeben" oder "500€ Gehalt erhalten".</p>
      ) : (
        <div className="space-y-1">
          {recent.map((t) => (
            <div key={t.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#1e1e2a] transition-colors">
              {t.type === 'income'
                ? <TrendingUp className="w-4 h-4 text-green-400 flex-shrink-0" />
                : <TrendingDown className="w-4 h-4 text-red-400 flex-shrink-0" />
              }
              <span className="text-sm text-slate-300 flex-1">{t.description}</span>
              <span className={`text-sm font-medium ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                {t.type === 'expense' ? '-' : '+'}{fmt(t.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
