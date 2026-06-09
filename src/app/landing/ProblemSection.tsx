'use client'

import { useEffect, useRef, useState } from 'react'

const cards = [
  {
    q: '"How many people are actually coming?"',
    a: 'You need a number for the caterer and all you have is maybes.',
  },
  {
    q: '"Where\'s the list?"',
    a: "It's in three WhatsApp chats, a Notes app, and your mum's head.",
  },
  {
    q: '"Who sent money?"',
    a: "You've been forwarding your account number all week and lost track.",
  },
  {
    q: '"Who gave us what?"',
    a: "The wedding is over and you can't match gifts to names.",
  },
]

const BACKGROUNDS = ['#FFF9F5', '#FFF6F1', '#FFF8F4', '#FFFAF7']

export default function ProblemSection() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [revealed, setRevealed] = useState<Set<number>>(new Set())

  useEffect(() => {
    const onScroll = () => {
      if (!sectionRef.current) return
      const scrolled = Math.max(0, -sectionRef.current.getBoundingClientRect().top)
      const wh = window.innerHeight
      setActive(Math.min(cards.length - 1, Math.floor(scrolled / wh)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => setRevealed(r => { const n = new Set(r); n.add(active); return n }), 650)
    return () => clearTimeout(t)
  }, [active])

  return (
    <div ref={sectionRef} style={{ height: `${cards.length * 100}vh` }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', overflow: 'hidden' }}>
        {cards.map((card, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: BACKGROUNDS[i],
              zIndex: cards.length - i,
              transform: i < active ? 'translateY(-100%)' : 'translateY(0)',
              transition: 'transform 0.75s cubic-bezier(0.77, 0, 0.175, 1)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Rose top edge */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 2,
              background: 'linear-gradient(90deg, transparent, #D4547A 30%, #D4547A 70%, transparent)',
              opacity: 0.4,
            }} />

            {/* Page shadow at bottom — suggests page depth */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
              background: `linear-gradient(to top, ${BACKGROUNDS[i]}, transparent)`,
              pointerEvents: 'none',
            }} />

            <div style={{ maxWidth: 640, padding: '0 32px', width: '100%', textAlign: 'center' }}>
              {/* Counter */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                marginBottom: 28,
              }}>
                {cards.map((_, j) => (
                  <div key={j} style={{
                    width: j === i ? 24 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: j === i ? '#D4547A' : '#E7B8C5',
                    transition: 'all 0.3s',
                  }} />
                ))}
              </div>

              {/* Question */}
              <h3 style={{
                fontFamily: 'var(--font-playfair)',
                fontSize: 'clamp(22px, 3.5vw, 40px)',
                color: '#1C1917',
                lineHeight: 1.35,
                marginBottom: 28,
                fontWeight: 600,
              }}>
                {card.q}
              </h3>

              {/* Divider */}
              <div style={{
                width: 48, height: 1.5,
                background: '#D4547A',
                margin: '0 auto 28px',
                opacity: 0.4,
              }} />

              {/* Answer */}
              <p style={{
                fontSize: 'clamp(17px, 2vw, 22px)',
                color: '#78716C',
                lineHeight: 1.65,
                opacity: revealed.has(i) ? 1 : 0,
                transform: revealed.has(i) ? 'translateY(0)' : 'translateY(16px)',
                transition: 'opacity 0.6s ease, transform 0.6s ease',
              }}>
                {card.a}
              </p>
            </div>

            {/* Scroll hint on last card */}
            {i === cards.length - 1 && (
              <div style={{
                position: 'absolute', bottom: 28,
                left: '50%', transform: 'translateX(-50%)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                opacity: revealed.has(i) ? 0.35 : 0,
                transition: 'opacity 0.5s ease 0.3s',
              }}>
                <span style={{ fontSize: 10, color: '#78716C', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  scroll to continue
                </span>
                <svg width="16" height="24" viewBox="0 0 16 24" fill="none">
                  <path d="M8 0v20M1 13l7 7 7-7" stroke="#D4547A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
