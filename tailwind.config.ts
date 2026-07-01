import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0a0a0f',
          secondary: '#111118',
          card: '#16161f',
          hover: '#1e1e2a',
        },
        accent: {
          orange: '#f97316',
          'orange-dim': '#c2410c',
          cyan: '#06b6d4',
          'cyan-dim': '#0e7490',
        },
        border: {
          subtle: '#1f1f2e',
          glow: '#2a2a3d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow-orange': '0 0 20px rgba(249, 115, 22, 0.15)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.15)',
        'glow-orange-lg': '0 0 40px rgba(249, 115, 22, 0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
export default config
