import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Life OS',
  description: 'Dein persönliches Life Operating System',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de" className="dark">
      <body className="bg-[#0a0a0f] text-slate-200 antialiased">{children}</body>
    </html>
  )
}
