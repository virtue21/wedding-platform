const SOCIALS = [
  { label: 'Instagram', handle: '@nemiplanner', href: 'https://www.instagram.com/nemiplanner/', icon: '📷' },
  { label: 'TikTok', handle: '@nemiplanner', href: 'https://www.tiktok.com/@nemiplanner', icon: '🎵' },
  { label: 'Email', handle: 'hello@nemiplanner.xyz', href: 'mailto:hello@nemiplanner.xyz', icon: '✉️' },
]

export default function SiteFooter() {
  return (
    <footer className="border-t border-rose-50 bg-white/60">
      <div className="max-w-lg mx-auto px-6 py-8 text-center space-y-4">
        <p className="font-serif text-stone-700 text-sm">
          💍 Made with <span className="text-rose-400">NemiPlanner</span>
        </p>
        <p className="text-xs text-stone-400">
          Plan your own wedding — RSVP, registry &amp; more at{' '}
          <a href="https://nemiplanner.xyz" className="text-rose-400 hover:text-rose-500 font-medium">
            nemiplanner.xyz
          </a>
        </p>
        <div className="flex items-center justify-center gap-5">
          {SOCIALS.map(s => (
            <a
              key={s.label}
              href={s.href}
              target={s.href.startsWith('mailto') ? undefined : '_blank'}
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-rose-500 transition-colors"
            >
              <span>{s.icon}</span>
              {s.handle}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
