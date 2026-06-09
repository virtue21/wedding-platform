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
    q: 'Where\'s the guest list?',
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
    icon: '🎁',
    q: 'Who gave us what?',
    a: "The wedding is over. You want to write thank-you notes but you can't match a single gift to a name.",
    bg: '#1F2A1C',
    accent: '#86EFAC',
  },
  {
    n: '05',
    icon: '🪑',
    q: 'Who sits where?',
    a: "The venue needs a seating chart by Friday. You haven't even confirmed half the RSVPs yet.",
    bg: '#2A1F1A',
    accent: '#FCD34D',
  },
  {
    n: '06',
    icon: '😮‍💨',
    q: 'There has to be a better way.',
    a: "There is. One link does everything — RSVPs, gifts, seating, and the guest list. Right here.",
    bg: '#3D0F1E',
    accent: '#D4547A',
    cta: true,
  },
]

export default function ProblemSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [revealed, setRevealed] = useState<Set<number>>(new Set([0]))

  useEffect(() => {
    const onScroll = () => {
      if (!sectionRef.current) return
      const rect = sectionRef.current.getBoundingClientRect()
      // scrolled = how many px we've moved INTO the section
      const scrolled = Math.max(0, -rect.top)
      const wh = window.innerHeight
      const next = Math.min(cards.length - 1, Math.floor(scrolled / wh))
      setActive(next)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      setRevealed(r => { const n = new Set(r); n.add(active); return n })
    }, 400)
    return () => clearTimeout(t)
  }, [active])

  return (
    // height = N * 100vh so each card gets a full viewport of scrolling room
    <div ref={sectionRef} style={{ height: `${cards.length * 100}vh` }}>
      {/* Sticky viewport — stays at top while user scrolls through */}
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>

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
                // Earlier cards have higher z-index so they appear on top
                zIndex: cards.length - i,
                // Past cards slide up (page-turn), current + future stay put
                transform: isPast ? 'translateY(-100%)' : 'translateY(0)',
                transition: 'transform 0.8s cubic-bezier(0.76, 0, 0.24, 1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 24px',
              }}
            >
              {/* Book spine line on the left */}
              <div style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
                background: `linear-gradient(to bottom, transparent, ${card.accent}66, transparent)`,
              }} />

              {/* Page-edge shadow at bottom — depth illusion */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
                background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
                pointerEvents: 'none',
              }} />

              {/* Page number top-right */}
              <div style={{
                position: 'absolute', top: 28, right: 28,
                fontFamily: 'monospace',
                fontSize: 11,
                color: `${card.accent}66`,
                letterSpacing: '0.15em',
              }}>
                {card.n} / 06
              </div>

              {/* Progress dots */}
              <div style={{
                position: 'absolute', top: 32, left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex', gap: 6,
              }}>
                {cards.map((_, j) => (
                  <div key={j} style={{
                    width: j === i ? 20 : 5,
                    height: 5,
                    borderRadius: 3,
                    background: j < i ? card.accent : j === i ? card.accent : 'rgba(255,255,255,0.15)',
                    transition: 'all 0.4s ease',
                  }} />
                ))}
              </div>

              {/* Main content */}
              <div style={{ maxWidth: 620, width: '100%', textAlign: 'center' }}>
                {/* Icon */}
                <div style={{
                  fontSize: 'clamp(36px, 6vw, 56px)',
                  marginBottom: 28,
                  opacity: isCurrent ? 1 : 0.4,
                  transition: 'opacity 0.4s',
                }}>
                  {card.icon}
                </div>

                {/* Question */}
                <h3 style={{
                  fontFamily: 'var(--font-playfair)',
                  fontSize: 'clamp(24px, 4vw, 44px)',
                  color: '#FAFAF9',
                  lineHeight: 1.25,
                  marginBottom: 24,
                  fontWeight: 700,
                }}>
                  {card.q}
                </h3>

                {/* Accent rule */}
                <div style={{
                  width: 40, height: 2,
                  background: card.accent,
                  margin: '0 auto 24px',
                  borderRadius: 2,
                  opacity: revealed.has(i) ? 1 : 0,
                  transition: 'opacity 0.4s ease 0.2s',
                }} />

                {/* Answer */}
                <p style={{
                  fontFamily: 'Arial, sans-serif',
                  fontSize: 'clamp(16px, 2.2vw, 21px)',
                  color: 'rgba(250,250,249,0.65)',
                  lineHeight: 1.7,
                  opacity: revealed.has(i) ? 1 : 0,
                  transform: revealed.has(i) ? 'translateY(0)' : 'translateY(14px)',
                  transition: 'opacity 0.55s ease 0.25s, transform 0.55s ease 0.25s',
                }}>
                  {card.a}
                </p>

                {/* CTA on last card */}
                {card.cta && revealed.has(i) && (
                  <a
                    href="/auth/signup"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      marginTop: 36,
                      padding: '14px 32px',
                      background: card.accent,
                      color: 'white',
                      borderRadius: 14,
                      textDecoration: 'none',
                      fontFamily: 'Arial, sans-serif',
                      fontSize: 15,
                      fontWeight: 700,
                      opacity: revealed.has(i) ? 1 : 0,
                      transition: 'opacity 0.5s ease 0.6s',
                      boxShadow: `0 8px 32px ${card.accent}44`,
                    }}
                  >
                    Plan Your Wedding →
                  </a>
                )}
              </div>

              {/* Scroll hint — all cards except last */}
              {i < cards.length - 1 && (
                <div style={{
                  position: 'absolute', bottom: 24,
                  left: '50%', transform: 'translateX(-50%)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  opacity: revealed.has(i) && isCurrent ? 0.4 : 0,
                  transition: 'opacity 0.5s ease 0.8s',
                }}>
                  <span style={{
                    fontSize: 9, color: 'rgba(255,255,255,0.5)',
                    letterSpacing: '0.16em', textTransform: 'uppercase',
                    fontFamily: 'Arial, sans-serif',
                  }}>
                    scroll
                  </span>
                  <svg width="14" height="20" viewBox="0 0 14 20" fill="none">
                    <path d="M7 0v16M1 10l6 6 6-6" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
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
