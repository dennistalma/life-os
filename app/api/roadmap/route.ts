import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.LAGERUNG_URL || process.env.KV_REST_API_URL || '',
  token: process.env.LAGERUNG_REST_TOKEN || process.env.KV_REST_API_TOKEN || '',
})

const KEY = 'spiritlamps-roadmap'

const initialSections = [
  {
    id: 'juli', title: 'Juli – Fundament',
    items: [
      { id: 'j1', text: 'CE/VDE/TÜV-Sicherheitsbaustein in "Besonderheiten" einbauen', done: false },
      { id: 'j2', text: 'Trust-Bar-Icons (CE, VDE-Einzelprüfung, TÜV-Workshop) platzieren', done: false },
      { id: 'j3', text: 'Rechtlichen Disclaimer-Satz ins Impressum/FAQ', done: false },
      { id: 'j4', text: 'Scroll-Animation auf Mobile/Browsern testen', done: false },
      { id: 'j5', text: 'Logo-Animation: ProRes-4444-Alpha-Export finalisieren', done: false },
      { id: 'j6', text: 'Exploded-View-Video: fehlenden Holzsockel-Schritt nachbauen', done: false },
      { id: 'j7', text: 'Musik-Workflow abschließen (LALAL.AI → Cakewalk → Cryo Mix)', done: false },
      { id: 'j8', text: 'CE-Konformitätsdokumentation für alle Bauteile sammeln', done: false },
      { id: 'j9', text: 'VDE-0701-0702-Prüfprotokoll-Vorlage anlegen', done: false },
      { id: 'j10', text: 'Sicherheits-Formulierungen von Anwalt gegenchecken lassen', done: false },
      { id: 'j11', text: 'BattG/UN-38.3-Unterlagen für LED-Korken prüfen', done: false },
    ],
  },
  {
    id: 'august', title: 'August – Content & Produktion',
    items: [
      { id: 'a1', text: 'Finale Produktlinie für Launch festlegen', done: false },
      { id: 'a2', text: 'Produktionskapazität kalkulieren (Std./Lampe vs. verfügbare Zeit)', done: false },
      { id: 'a3', text: 'Ersten Launch-Bestand produzieren (Classic-Tier zuerst)', done: false },
      { id: 'a4', text: 'Container-Werkstatt-Umbau vorantreiben + als Content dokumentieren', done: false },
      { id: 'a5', text: 'Produktkategorie-Seiten (Classic/Premium/Rarität) mit SEO-Texten', done: false },
      { id: 'a6', text: 'Etsy-Shop live aufsetzen', done: false },
      { id: 'a7', text: 'Wix-Payments-Checkout testen', done: false },
      { id: 'a8', text: 'TikTok-Account professionalisieren, erste Skripte vorbereiten', done: false },
      { id: 'a9', text: 'Content-Kalender Juli–November erstellen', done: false },
      { id: 'a10', text: 'Mystery-Persona "Berufsalkoholiker"-Hook ausarbeiten', done: false },
    ],
  },
  {
    id: 'september', title: 'September – Sichtbarkeit aufbauen',
    items: [
      { id: 's1', text: 'Woche 1-2: 2x Making-of (Flammen & Bürsten, Zeitraffer)', done: false },
      { id: 's2', text: 'Woche 1-2: 1x Behind the Brand (Werkstatt-Tour)', done: false },
      { id: 's3', text: 'Woche 3-4: 2x Produkt-Hero-Shot (Vorher/Nachher)', done: false },
      { id: 's4', text: 'Woche 3-4: 1x Mystery-Hook ("1000 leere Flaschen im Keller")', done: false },
      { id: 's5', text: 'Instagram parallel bespielen (Reels + Feed)', done: false },
      { id: 's6', text: 'Hashtag-Sets aktiv einsetzen', done: false },
      { id: 's7', text: 'Google/Meta-Ad-Konten einrichten (noch nicht schalten)', done: false },
      { id: 's8', text: 'Cross-Browser/Mobile-QA-Durchlauf Website', done: false },
    ],
  },
  {
    id: 'oktober', title: 'Oktober – Endspurt',
    items: [
      { id: 'o1', text: 'BCB Berlin (12.-14.10.) vorbereiten: Muster, Karten, Standmaterial', done: false },
      { id: 'o2', text: 'Woche 1-2: 2x Mystery-Content, 1x VDE-Prüfung-Clip', done: false },
      { id: 'o3', text: 'Presse-/Influencer-Kontakte für Launch-Woche anfragen', done: false },
      { id: 'o4', text: 'BCB-Learnings einarbeiten, Countdown-Content vorbereiten', done: false },
      { id: 'o5', text: 'Woche 3-4: Split-Screen-Content (Plastik vs. SpiritLamps)', done: false },
      { id: 'o6', text: 'Website final freigeben (Texte, Bilder, Preise, Versand)', done: false },
      { id: 'o7', text: 'Countdown auf Social Media (T-7, T-3, T-1)', done: false },
      { id: 'o8', text: 'Newsletter-Anmeldungen sammeln, Launch-Mail vorbereiten', done: false },
    ],
  },
  {
    id: 'launch', title: '1. November – Launch-Tag',
    items: [
      { id: 'l1', text: 'Website live schalten', done: false },
      { id: 'l2', text: 'Launch-Post gleichzeitig auf TikTok + Instagram (Allerheiligen-Bezug)', done: false },
      { id: 'l3', text: 'Ads scharf schalten', done: false },
      { id: 'l4', text: 'Newsletter an gesammelte Adressen raus', done: false },
    ],
  },
]

async function load() {
  const data = await redis.get(KEY)
  if (!data) return initialSections
  return data as typeof initialSections
}

export async function GET() {
  const sections = await load()
  return NextResponse.json({ sections })
}
