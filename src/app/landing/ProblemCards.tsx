'use client'

import { useEffect, useRef, useState } from 'react'

const problems = [
  {
    icon: '🤔',
    question: '"How many people are actually coming?"',
    answer: 'You need a number for the caterer and all you have is maybes.',
  },
  {
    icon: '📱',
    question: '"Where\'s the list?"',
    answer: "It's in three WhatsApp chats, a Notes app, and your mum's head.",
  },
  {
    icon: '💸',
    question: '"Who sent money?"',
    answer: "You've been forwarding your account number all week and lost track.",
  },
  {
    icon: '🎁',
    question: '"Who gave us what?"',
    answer: "The wedding is over and you can't match gifts to names.",
  },
]

function FlipCard({ icon, question, answer, delay }: {
  icon: string
  question: string
  answer: string
  delay: number
}) {
  const [flipped, setFlipped] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setFlipped(true), delay)
          observer.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div
      ref={ref}
      onClick={() => setFlipped(f => !f)}
      className="cursor-pointer"
      style={{ perspective: '1000px', height: '180px' }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: flipped ? 'rotateX(180deg)' : 'rotateX(0deg)',
        }}
      >
        {/* Front — question only */}
        <div
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
          className="absolute inset-0 bg-rose-50 border border-rose-100 rounded-2xl p-6 flex flex-col justify-center"
        >
          <span className="text-2xl mb-3 block">{icon}</span>
          <p className="font-semibold text-stone-800 text-sm leading-snug">{question}</p>
          <p className="text-xs text-rose-400 mt-3 font-medium">Tap to see the problem ↓</p>
        </div>

        {/* Back — answer */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateX(180deg)',
          }}
          className="absolute inset-0 bg-stone-800 border border-stone-700 rounded-2xl p-6 flex flex-col justify-center"
        >
          <p className="font-semibold text-rose-300 text-sm leading-snug mb-3">{question}</p>
          <p className="text-stone-300 text-sm leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  )
}

export default function ProblemCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {problems.map((p, i) => (
        <FlipCard
          key={i}
          icon={p.icon}
          question={p.question}
          answer={p.answer}
          delay={i * 150}
        />
      ))}
    </div>
  )
}
