import { NextResponse } from 'next/server'
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.LAGERUNG_URL || process.env.KV_REST_API_URL || '',
  token: process.env.LAGERUNG_REST_TOKEN || process.env.KV_REST_API_TOKEN || '',
})

const KEY = 'spiritlamps-roadmap-v2'

export interface RoadmapItem {
  id: string
  text: string
  done: boolean
  category?: string
  notes?: string
}

export interface RoadmapSection {
  id: string
  title: string
  emoji: string
  items: RoadmapItem[]
}

const initialSections: RoadmapSection[] = [
  {
    id: 'juli', title: 'Juli – Fundament', emoji: '🟢',
    items: [
      { id: 'j1', text: 'Neuen Sicherheits-Baustein (CE/VDE/TÜV-Text) in "Besonderheiten" einbauen', done: false, category: 'Website / Wix', notes: 'Trust-relevanter Baustein direkt auf der Produktseite unter "Besonderheiten". Kurzer, rechtlich geprüfter Text zu CE-Konformität, VDE-Einzelprüfung und TÜV-Workshop.' },
      { id: 'j2', text: 'Trust-Bar/Icon-Leiste (CE, VDE-Einzelprüfung, TÜV-Workshop, Handarbeit Bayern) platzieren', done: false, category: 'Website / Wix', notes: 'Icons mit kurzen Labels unterhalb des Hero-Bereichs oder im Footer. Visuell sofort vertrauensbildend.' },
      { id: 'j3', text: 'Rechtlichen Disclaimer-Satz ins Impressum/FAQ einfügen', done: false, category: 'Website / Wix', notes: 'Haftungsausschluss bzgl. Eigenbau-Verwendung. Vom Anwalt formulieren lassen.' },
      { id: 'j4', text: 'Scroll-Animation (27-Frame-Sequenz) auf Mobile/verschiedenen Browsern testen', done: false, category: 'Website / Wix', notes: 'Chrome, Safari, Firefox. iOS + Android. Besonders auf älteren Geräten prüfen ob Animation flüssig läuft.' },
      { id: 'j5', text: 'Logo-Animation: ProRes 4444 Alpha-Export über DaVinci Resolve finalisieren', done: false, category: 'Video / Branding', notes: 'Luma Keyer verwenden, Wasserzeichen raustrimmen. Export-Preset: ProRes 4444, 25fps, transparenter Hintergrund.' },
      { id: 'j6', text: 'Exploded-View-Produktvideo: fehlenden Holzsockel-Schritt nachbauen', done: false, category: 'Video / Branding', notes: 'Der Holzsockel fehlt noch in der Explosionsanimation. Schritt zwischen Korkboden und Glasflasche einfügen.' },
      { id: 'j7', text: 'Musik-Workflow abschließen: LALAL.AI → Cakewalk → Cryo Mix', done: false, category: 'Video / Branding', notes: 'Stems aus LALAL.AI in Cakewalk importieren, mit Cryo Mix finales Master für Markenvideo erstellen.' },
      { id: 'j8', text: 'CE-Konformitätsdokumentation für alle Bauteile zusammenstellen', done: false, category: 'Recht / Compliance', notes: 'Typenschilder, Datenblätter, Konformitätserklärungen von allen Lieferanten. Ordner anlegen: je Bauteil eine Seite.' },
      { id: 'j9', text: 'VDE-0701-0702-Prüfprotokoll-Vorlage anlegen', done: false, category: 'Recht / Compliance', notes: 'Log für jede einzelne Lampe: Datum, Seriennummer, Messwerte, Prüfer. Vorlage in Excel/PDF.' },
      { id: 'j10', text: 'Marketing-Formulierungen zu Sicherheit von Wettbewerbsrecht-Anwalt gegenchecken lassen', done: false, category: 'Recht / Compliance', notes: 'Insbesondere: "geprüft", "zertifiziert", "sicher" – diese Wörter sind heikel. Anwalt soll alle Claims auf der Website kurz reviewen.' },
      { id: 'j11', text: 'Import-Unterlagen für LED-Korken prüfen: BattG-Registrierung, UN 38.3-Zertifikat', done: false, category: 'Recht / Compliance', notes: 'BattG: Batteriegesetz-Registrierung beim Umweltbundesamt. UN 38.3: Zertifikat vom Hersteller/Lieferanten anfordern.' },
      { id: 'j12', text: 'Status Alibaba-Bestellung (Wene Wang) verfolgen, Lieferzeit einplanen', done: false, category: 'Sourcing', notes: 'Lieferzeit im Blick behalten. Falls Verzögerung → Produktionsstart für Classic-Tier ggf. verschieben.' },
    ],
  },
  {
    id: 'august', title: 'August – Content & Produktion', emoji: '🟡',
    items: [
      { id: 'a1', text: 'Finale Produktlinie für Launch festlegen (welche Flaschen/Kategorien starten zuerst)', done: false, category: 'Produkt / Fertigung', notes: 'Entscheidung: Classic zuerst (schneller skalierbar), dann Premium. Rarität erst nach erstem Feedback.' },
      { id: 'a2', text: 'Produktionskapazität kalkulieren: ~4 Std./Lampe – wie viele Stück bis 1.11. realistisch?', done: false, category: 'Produkt / Fertigung', notes: 'Verfügbare Stunden/Woche × Wochen bis Launch = max. Stückzahl. Puffer für QA + VDE-Prüfung einrechnen.' },
      { id: 'a3', text: 'Ersten Launch-Bestand produzieren beginnen (Classic-Tier zuerst)', done: false, category: 'Produkt / Fertigung', notes: 'Ziel: genug Stück für erste Woche on stock. Nicht zu viel – lieber Scarcity nutzen.' },
      { id: 'a4', text: 'Container-Werkstatt-Umbau vorantreiben + als TikTok/Insta-Content dokumentieren', done: false, category: 'Produkt / Fertigung', notes: 'Umbau-Prozess filmen. Vorher/Nachher. Perfekter "Behind the Brand"-Content.' },
      { id: 'a5', text: 'Produktkategorie-Seiten (Classic/Premium/Rarität) mit SEO-Texten befüllen', done: false, category: 'Website', notes: 'Keyword-Fokus: "Whiskyflaschen Lampe", "handgemachte Tischlampe", "upcycling Lampe kaufen". Texte individuell, kein Copy-Paste.' },
      { id: 'a6', text: 'Etsy-Shop-Struktur live aufsetzen (Listings, Preise, SEO-Keywords)', done: false, category: 'Website', notes: 'Etsy-Listing-Titel: max. 140 Zeichen, Keyword am Anfang. Fotos: mind. 5 pro Listing, weißer Hintergrund + Lifestyle-Shot.' },
      { id: 'a7', text: 'Wix-Payments-Checkout durchtesten (Testkäufe)', done: false, category: 'Website', notes: 'Kompletten Checkout-Flow durchlaufen: Produkt → Warenkorb → Zahlung → Bestätigungsmail. Auf Mobile testen.' },
      { id: 'a8', text: 'TikTok-Account professionalisieren (Bio, Highlights, erste 5 Skripte vorbereiten)', done: false, category: 'Marketing', notes: 'Bio: kurz, klar, Link zur Website. Profilbild: Logo oder Werkstatt-Shot. Erste 5 Skripte: Making-of, Werkstatt-Tour, Mystery-Hook, Produkt-Hero, Sicherheits-Clip.' },
      { id: 'a9', text: 'Content-Kalender Juli–November erstellen (mind. 3–4x/Woche ab September)', done: false, category: 'Marketing', notes: 'Kategorien-Mix: 1=Making-of, 2=Produkt, 3=Mystery/Story, 4=Behind the Brand, 5=Sicherheit, 6=Social Proof. Kalender in Notion/Sheets.' },
      { id: 'a10', text: 'Mystery-Persona "Berufsalkoholiker"-Hook-Strategie ausarbeiten und erste Clips drehen', done: false, category: 'Marketing', notes: 'Hook: "Ich bin Berufsalkoholiker – aber die Flaschen bleiben leer." Persona aufbauen, nicht zu früh aufdecken was dahinter steckt.' },
    ],
  },
  {
    id: 'september', title: 'September – Sichtbarkeit aufbauen', emoji: '🟠',
    items: [
      { id: 's1', text: 'Erste organische TikTok-Videos posten (Werkstatt, Making-of, Flammen-und-Bürste)', done: false, category: 'Social Media', notes: 'Noch nicht verkaufen – Vertrauen aufbauen. Zeigen wie es gemacht wird.' },
      { id: 's2', text: 'Instagram parallel bespielen (Reels + Feed)', done: false, category: 'Social Media', notes: 'Reels = TikTok-Content recyclen (leicht anpassen). Feed: hochwertige Produktfotos.' },
      { id: 's3', text: 'Hashtag-Sets aus Marketing-Assets aktiv einsetzen', done: false, category: 'Social Media', notes: 'Verschiedene Sets testen (nicht immer dieselben). Performance tracken welche Sets mehr Reach bringen.' },
      { id: 's4', text: 'Community/Follower vor Launch aufbauen – Ziel: nicht bei 0 starten am 1.11.', done: false, category: 'Social Media', notes: 'Ziel: mind. 200-500 echte Follower bis Launch. Engagement wichtiger als reine Follower-Zahl.' },
      { id: 's5', text: 'Woche 1-2: 2× Making-of (Flammen & Bürsten in Nahaufnahme, Zeitraffer)', done: false, category: 'Content Sep W1-2', notes: 'Kategorie 1. Zeitraffer 4-Std-Arbeit auf 60 Sek. Nahaufnahme Flammen-Technik.' },
      { id: 's6', text: 'Woche 1-2: 1× Behind the Brand (Werkstatt-Tour, "wer ist Dennis")', done: false, category: 'Content Sep W1-2', notes: 'Kategorie 4. Persönlich, authentisch. Noch nicht verkaufen.' },
      { id: 's7', text: 'Woche 3-4: 2× Produkt-Hero-Shot (Vorher/Nachher-Split)', done: false, category: 'Content Sep W3-4', notes: 'Kategorie 2. Leere Flasche → fertige Lampe. Split-Screen oder Überblende.' },
      { id: 's8', text: 'Woche 3-4: 1× Mystery-Hook "Warum ich 1.000 leere Flaschen im Keller habe"', done: false, category: 'Content Sep W3-4', notes: 'Kategorie 3. Erster viraler Testballon. Hook in ersten 2 Sekunden. Nicht auflösen – Neugier halten.' },
      { id: 's9', text: 'Google/Meta-Ad-Konten einrichten (noch nicht schalten)', done: false, category: 'Ads', notes: 'Konten erstellen, Zahlungsmethode hinterlegen, erste Creatives hochladen. Noch nicht live schalten – erst bei Launch.' },
      { id: 's10', text: 'Erste Creatives auf Basis der Ad-Keywords bauen', done: false, category: 'Ads', notes: 'Keywords aus Wissensdatenbank verwenden. Formate: 9:16 für Instagram/TikTok, 1:1 für Feed.' },
      { id: 's11', text: 'Fertigung fortsetzen, QA + VDE-Prüfung pro Lampe als festen Workflow einüben', done: false, category: 'Produktion', notes: 'Jede Lampe: Sichtprüfung → VDE-Prüfung → Protokoll ausfüllen → Seriennummer vergeben.' },
      { id: 's12', text: 'Vollständiger Cross-Browser/Mobile-QA-Durchlauf Website', done: false, category: 'Website', notes: 'Chrome, Safari, Firefox, Edge. iOS Safari besonders wichtig (häufigster Mobile-Browser). Ladezeiten messen.' },
      { id: 's13', text: 'Material-Vergleichsvideo vorbereiten (Konkurrenz-Produkte bestellen)', done: false, category: 'Content', notes: 'Flaschengeist, Holzbirne, BierZeug etc. bestellen. Optisch nebeneinander stellen: Plastik vs. Massivholz/Gusseisen. WICHTIG: Logos unkenntlich machen, nur sachlicher Vergleich, vorher Anwalt fragen!' },
    ],
  },
  {
    id: 'oktober', title: 'Oktober – Endspurt', emoji: '🔴',
    items: [
      { id: 'o1', text: 'BCB Berlin (12.–14.10.) vorbereiten: Produktmuster, Visitenkarten, QR-Code', done: false, category: 'Messe BCB', notes: 'Bar Convent Berlin. Produktmuster: mind. 3 Stück verschiedene Kategorien. Visitenkarten: QR-Code zur Website drauf. Standmaterial checken.' },
      { id: 'o2', text: 'Woche 1-2: 2× Mystery-Content, 1× VDE-Prüfung-Clip', done: false, category: 'Content Okt W1-2', notes: 'POV-Content, Markenspruch-Voiceover. VDE-Clip: 15 Sek, Prüfgerät in Aktion zeigen – Vertrauensbeweis.' },
      { id: 'o3', text: 'Woche 1-2: 1× "Ein Tag als Ein-Mann-Manufaktur"', done: false, category: 'Content Okt W1-2', notes: 'Kategorie 4. Morgens bis abends, alles zeigen. Authentisch, keine Schnitte die zu glatt wirken.' },
      { id: 'o4', text: 'BCB Berlin (12.–14.10.) als Content nutzen (Behind-the-Scenes Messeaufbau)', done: false, category: 'Messe BCB', notes: 'Stories + Reels vom Aufbau, erste Reaktionen filmen (mit Erlaubnis). Gold für Social Proof.' },
      { id: 'o5', text: 'BCB-Learnings einarbeiten (Feedback zu Preisen/Produkten)', done: false, category: 'Messe BCB', notes: 'Was kam gut an? Was nicht? Preise anpassen? Produktlinie ändern? Sofort umsetzen.' },
      { id: 'o6', text: 'Erste Presse-/Influencer-Kontakte für Launch-Woche anfragen', done: false, category: 'PR', notes: 'Lifestyle-Blogger, Interior-Creator, Whisky-Channels. Nicht zu viele – 5-10 gezielte Anfragen besser als Massen-Mail.' },
      { id: 'o7', text: 'Woche 3-4: Split-Screen Plastik-Konkurrenz vs. SpiritLamps', done: false, category: 'Content Okt W3-4', notes: 'Kategorie 5. Erst nach Rechtscheck. Bilder sprechen lassen, kein abwertendes Wording.' },
      { id: 'o8', text: 'Woche 3-4: Weitere Hero-Shots, Container-Werkstatt als Kulisse', done: false, category: 'Content Okt W3-4', notes: 'Kategorie 2. Werkstatt als authentischer Background. Warmes Licht, Holz, Werkzeug sichtbar.' },
      { id: 'o9', text: 'Website final freigeben (alle Texte, Bilder, Preise, Versandinfos)', done: false, category: 'Launch-Vorbereitung', notes: 'Finaler Review: alle Preise stimmen, Versandzeiten korrekt, Impressum vollständig, Datenschutz aktuell.' },
      { id: 'o10', text: 'Lagerbestand/Versandprozess letzter Check', done: false, category: 'Launch-Vorbereitung', notes: 'Verpackungsmaterial ausreichend? Versandlabels-Workflow klar? Bearbeitungszeit realistisch kommuniziert?' },
      { id: 'o11', text: 'Countdown auf Social Media starten (T-7, T-3, T-1)', done: false, category: 'Launch-Vorbereitung', notes: 'T-7: "In einer Woche". T-3: Produktdetail-Teaser. T-1: "Morgen ist es soweit". Einheitliches Design.' },
      { id: 'o12', text: 'Newsletter-Anmeldungen aus Wix-CTA sammeln und Launch-Mail vorbereiten', done: false, category: 'Launch-Vorbereitung', notes: 'Launch-Mail: Betreff mit Allerheiligen-Bezug. Inhalt: Launch-Story, Produkte, direkter Link zum Shop.' },
    ],
  },
  {
    id: 'launch', title: '1. November – Launch-Tag', emoji: '🚀',
    items: [
      { id: 'l1', text: 'Website live schalten', done: false, category: 'Launch', notes: 'Domain-Weiterleitung prüfen. Cache leeren. Alle Seiten einmal aufrufen und Screenshot machen.' },
      { id: 'l2', text: 'Launch-Post gleichzeitig auf TikTok + Instagram', done: false, category: 'Launch', notes: 'Allerheiligen-Bezug: "Heute ist der Tag, an dem man an das denkt, was bleibt. Nicht alles, das leer wird, ist zu Ende. Manches bekommt einfach ein neues Licht. — SpiritLamps ist ab heute live."' },
      { id: 'l3', text: 'Ads scharf schalten', done: false, category: 'Launch', notes: 'Google + Meta gleichzeitig. Budget: konservativ starten, nach 48h anpassen je nach Performance.' },
      { id: 'l4', text: 'Newsletter an gesammelte Adressen raus', done: false, category: 'Launch', notes: 'Zeitpunkt: morgens 9 Uhr. Betreff testen (A/B wenn möglich). Direkter CTA-Button zum Shop.' },
      { id: 'l5', text: 'Allerheiligen-Bezug im Launch-Content nutzen', done: false, category: 'Launch', notes: 'Video-Hook: dunkler Raum, leere Flasche, Kamera fährt ran, Lampe geht an. Text-Overlay mit Launch-Spruch. Kein religiöses Wording, kein Kreuz/Kirche – nur der "Weiterleben"-Gedanke.' },
    ],
  },
]

async function load(): Promise<RoadmapSection[]> {
  const data = await redis.get(KEY)
  if (!data) {
    await redis.set(KEY, initialSections)
    return initialSections
  }
  return data as RoadmapSection[]
}

export async function GET() {
  const sections = await load()
  return NextResponse.json({ sections })
}
