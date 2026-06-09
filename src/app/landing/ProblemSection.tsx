'use client'

import { useEffect, useRef, useState } from 'react'

const cards = [
  {
    n: '01',
    icon: '🤔',
    q: 'How many people are actually coming?',
    a: 'You need a number for the caterer and all you have is maybes scattered across five different conversations.',
    bg: '#1C1917',
    accent: '#D4547A',
  },
  {
    n: '02',
    icon: '📱',
    q: "Where's the guest list?",
    a: "It's in three WhatsApp chats, a Notes app, a voice memo, and your mum's head.",
    bg: '#2D1B1F',
    accent: '#E8A0B0',
  },
  {
    n: '03',
    icon: '💸',
    q: 'Who actually sent money?',
    a: "You've been sharing your account number all week and now you have no idea who transferred what.",
    bg: '#1A1F2E',
    accent: '#A5B4FC',
  },
  {
    n: '04',
    icon: '🪑',
    q: 'Who sits where?',
    a: "The venue needs a seating chart by Friday. You haven't even confirmed half the RSVPs yet.",
    bg: '#2A1F1A',
    accent: '#FCD34D',
  },
  {
    n: '05',
    icon: '😮‍💨',
    q: 'There has to be a better way.',
    a: "There is. One link does everything — RSVPs, gifts, seating, and the guest list. Right here.",
    bg: '#3D0F1E',
    accent: '#D4547A',
    cta: true,
  },
]

// px per card scroll step: 50vh equivalent, calculated at runtime
const STEP_RATIO = 0.5

export default function ProblemSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [revealed, setRevealed] = useState<Set<number>>(new Set([0]))

  useEffect(() => {
    const onScroll = () => {
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      const scrolled = Math.max(0, -rect.top)
      const stepH = window.innerHeight * STEP_RATIO
      const next = Math.min(cards.length - 1, Math.floor(scrolled / stepH))
      setActive(next)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      setRevealed(r => { const n = new Set(r); n.add(active); return n })
    }, 300)
    return () => clearTimeout(t)
  }, [active])

  // Jump to a specific card by scrolling to the right offset
  function goToCard(i: number) {
    if (!sectionRef.current) return
    const sectionTop = sectionRef.current.getBoundingClientRect().top + window.scrollY
    const stepH = window.innerHeight * STEP_RATIO
    window.scrollTo({ top: sectionTop + i * stepH, behavior: 'smooth' })
  }

  return (
    // 50vh per card × 5 cards = 250vh total. Much less scroll debt on mobile.
    // bg matches first card so the scroll-room below the sticky card is dark, not cream.
    <div ref={sectionRef} style={{ height: `${cards.length * STEP_RATIO * 100}vh`, backgroundColor: '#1C1917' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', width: '100%', overflow: 'hidden' }}>

        {cards.map((card, i) => {
          const isPast = i < active
          const isCurrent = i === active

          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: card.bg,
                zIndex: cards.length - i,
                transform: isPast ? 'translateY(-100%)' : 'translateY(0)',
                transition: 'transform 0.75s cubic-bezier(0.76, 0, 0.24, 1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '56px 24px 40px',
              }}
            >
              {/* Book spine */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                background: `linear-gradient(to bottom, transparent, ${card.accent}66, transparent)`,
              }} />

              {/* Bottom shadow depth */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
                background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
                pointerEvents: 'none',
              }} />

              {/* Page number */}
              <div style={{
                position: 'absolute', top: 20, right: 20,
                fontFamily: 'monospace', fontSize: 10,
                color: `${card.accent}88`, letterSpacing: '0.15em',
              }}>
                {card.n} / 0{cards.length}
              </div>

              {/* Clickable dot nav — centered top */}
              <div style={{
                position: 'absolute', top: 20, left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex', gap: 7, alignItems: 'center',
              }}>
                {cards.map((_, j) => (
                  <button
                    key={j}
                    onClick={() => goToCard(j)}
                    aria-label={`Go to card ${j + 1}`}
                    style={{
                      width: j === active ? 22 : 7,
                      height: 7,
                      borderRadius: 4,
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      background: j <= active ? card.accent : 'rgba(255,255,255,0.18)',
                      transition: 'all 0.35s ease',
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>

              {/* Content */}
              <div style={{ maxWidth: 580, width: '100%', textAlign: 'center' }}>
                <div style={{
                  fontSize: 'clamp(40px, 7vw, 60px)',
                  marginBottom: 24,
                  lineHeight: 1,
                }}>
                  {card.icon}
                </div>

                <h3 style={{
                  fontFamily: 'var(--font-playfair)',
                  fontSize: 'clamp(22px, 4.5vw, 42px)',
                  color: '#FAFAF9',
                  lineHeight: 1.2,
                  marginBottom: 20,
                  fontWeight: 700,
                }}>
                  {card.q}
                </h3>

                <div style={{
                  width: 36, height: 2,
                  background: card.accent,
                  margin: '0 auto 20px',
                  borderRadius: 2,
                  opacity: revealed.has(i) ? 1 : 0,
                  transition: 'opacity 0.4s ease 0.15s',
                }} />

                <p style={{
                  fontFamily: 'Arial, sans-serif',
                  fontSize: 'clamp(15px, 2vw, 20px)',
                  color: 'rgba(250,250,249,0.62)',
                  lineHeight: 1.65,
                  opacity: revealed.has(i) ? 1 : 0,
                  transform: revealed.has(i) ? 'translateY(0)' : 'translateY(12px)',
                  transition: 'opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s',
                  maxWidth: 480,
                  margin: '0 auto',
                }}>
                  {card.a}
                </p>

                {card.cta && revealed.has(i) && (
                  <a
                    href="/auth/signup"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      marginTop: 32,
                      padding: '13px 28px',
                      background: card.accent,
                      color: 'white',
                      borderRadius: 14,
                      textDecoration: 'none',
                      fontFamily: 'Arial, sans-serif',
                      fontSize: 15,
                      fontWeight: 700,
                      boxShadow: `0 8px 28px ${card.accent}44`,
                    }}
                  >
                    Plan Your Wedding →
                  </a>
                )}
              </div>

              {/* Scroll hint */}
              {i < cards.length - 1 && (
                <div style={{
                  position: 'absolute', bottom: 20,
                  left: '50%', transform: 'translateX(-50%)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  opacity: isCurrent && revealed.has(i) ? 0.45 : 0,
                  transition: 'opacity 0.5s ease 0.8s',
                  pointerEvents: 'none',
                }}>
                  <span style={{
                    fontSize: 8, color: 'rgba(255,255,255,0.5)',
                    letterSpacing: '0.18em', textTransform: 'uppercase',
                    fontFamily: 'Arial, sans-serif',
                  }}>scroll</span>
                  <svg width="12" height="18" viewBox="0 0 12 18" fill="none">
                    <path d="M6 0v13M1 8l5 6 5-6" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
