'use client'

import { useEffect, useRef, useState } from 'react'

const cards = [
  {
    n: '01',
    q: 'How many people are actually coming?',
    a: 'You need a number for the caterer and all you have is maybes.',
  },
  {
    n: '02',
    q: "Where's the list?",
    a: "It's in three WhatsApp chats, a Notes app, and your mum's head.",
  },
  {
    n: '03',
    q: 'Who sent money?',
    a: "You've been forwarding your account number all week and lost track.",
  },
  {
    n: '04',
    q: 'Who gave us what?',
    a: "The wedding is over and you can't match gifts to names.",
  },
]

// px of each card peeking below the active one
const PEEK = 14
// scroll distance per card (vh fraction)
const STEP = 0.85

export default function ProblemSection() {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return
      const scrolled = Math.max(0, -ref.current.getBoundingClientRect().top)
      setActive(Math.min(cards.length - 1, Math.floor(scrolled / (window.innerHeight * STEP))))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function goTo(i: number) {
    if (!ref.current) return
    const top = ref.current.getBoundingClientRect().top + window.scrollY
    window.scrollTo({ top: top + i * window.innerHeight * STEP, behavior: 'smooth' })
  }

  return (
    <div ref={ref} style={{ height: `${cards.length * STEP * 100}vh`, background: '#FDF8F4' }}>
      <div style={{
        position: 'sticky', top: 0, height: '100vh', width: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', padding: '0 20px',
      }}>

        {/* Eyebrow + dots */}
        <div style={{ position: 'absolute', top: 28, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <p style={{ fontSize: 10, color: '#A8A29E', letterSpacing: '0.16em', textTransform: 'uppercase', fontFamily: 'Arial, sans-serif', margin: 0 }}>
            Been here before?
          </p>
          <div style={{ display: 'flex', gap: 7 }}>
            {cards.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                aria-label={`Card ${i + 1}`}
                style={{
                  width: i === active ? 22 : 7, height: 7, borderRadius: 4,
                  border: 'none', cursor: 'pointer', padding: 0,
                  background: i <= active ? '#D4547A' : '#E7E5E4',
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>
        </div>

        {/* Card stack — all cards layered at the same position */}
        <div style={{
          position: 'relative',
          width: '100%', maxWidth: 520,
          // Extra height to show peeking cards below
          height: `calc(62vh + ${(cards.length - 1) * PEEK}px)`,
        }}>
          {cards.map((card, i) => {
            const isPast = i < active
            const depth = Math.max(0, i - active) // 0 = current, 1 = first below, etc.

            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0,
                  height: '62vh',
                  background: '#FFF9F5',
                  borderRadius: 20,
                  border: '1px solid #EDE8E4',
                  boxShadow: `0 ${4 + depth * 4}px ${16 + depth * 12}px rgba(0,0,0,${0.07 + depth * 0.02})`,
                  zIndex: cards.length - i,
                  // Past: fly off the top. Future/current: stack with depth offset
                  transform: isPast
                    ? 'translateY(-110%)'
                    : `translateY(${depth * PEEK}px) scale(${1 - depth * 0.025})`,
                  transformOrigin: 'top center',
                  transition: isPast
                    ? 'transform 0.85s cubic-bezier(0.76, 0, 0.24, 1)'
                    : 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  padding: 'clamp(28px, 5vw, 48px) clamp(24px, 5vw, 40px)',
                }}
              >
                {/* Card number */}
                <span style={{
                  fontFamily: 'monospace', fontSize: 10,
                  color: '#D4547A', letterSpacing: '0.14em', marginBottom: 20,
                }}>
                  {card.n} / 04
                </span>

                {/* Question */}
                <h3 style={{
                  fontFamily: 'var(--font-playfair)',
                  fontSize: 'clamp(20px, 4vw, 34px)',
                  color: '#1C1917',
                  lineHeight: 1.25,
                  fontWeight: 700,
                  marginBottom: 18,
                  margin: '0 0 18px 0',
                }}>
                  {card.q}
                </h3>

                {/* Pink accent line */}
                <div style={{
                  width: 36, height: 2.5,
                  background: 'linear-gradient(to right, #D4547A, #E8A0B0)',
                  borderRadius: 2, margin: '0 0 18px 0',
                }} />

                {/* Answer */}
                <p style={{
                  fontFamily: 'Arial, sans-serif',
                  fontSize: 'clamp(14px, 2vw, 17px)',
                  color: '#78716C',
                  lineHeight: 1.7,
                  margin: 0,
                }}>
                  {card.a}
                </p>
              </div>
            )
          })}
        </div>

        {/* Next button */}
        {active < cards.length - 1 ? (
          <button
            onClick={() => goTo(active + 1)}
            style={{
              position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#A8A29E', fontFamily: 'Arial, sans-serif',
              fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase',
            }}
          >
            next
            <svg width="12" height="16" viewBox="0 0 12 16" fill="none">
              <path d="M6 0v11M1 6.5l5 6 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ) : (
          <p style={{
            position: 'absolute', bottom: 28,
            fontFamily: 'Arial, sans-serif', fontSize: 11,
            color: '#A8A29E', letterSpacing: '0.1em',
          }}>
            Scroll to continue ↓
          </p>
        )}
      </div>
    </div>
  )
}
