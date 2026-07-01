'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Receipt } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/eur', label: 'EÜR', icon: Receipt },
]

export default function NavBar() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 border-b border-[#1f1f2e] bg-[#0a0a0f]/90 backdrop-blur">
      <div className="max-w-7xl mx-auto px-6 h-12 flex items-center gap-1">
        <span className="text-xs font-semibold text-orange-400/90 tracking-widest mr-4">LIFE OS</span>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                active
                  ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
