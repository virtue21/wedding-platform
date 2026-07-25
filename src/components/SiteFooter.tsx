function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}

const SOCIALS = [
  { label: 'Instagram', handle: '@nemiplanner', href: 'https://www.instagram.com/nemiplanner/', Icon: InstagramIcon },
  { label: 'TikTok', handle: '@nemiplanner', href: 'https://www.tiktok.com/@nemiplanner', Icon: TikTokIcon },
  { label: 'Email', handle: 'hello@nemiplanner.xyz', href: 'mailto:hello@nemiplanner.xyz', Icon: MailIcon },
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
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {SOCIALS.map(({ label, handle, href, Icon }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('mailto') ? undefined : '_blank'}
              rel="noopener noreferrer"
              aria-label={label}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-rose-100 bg-white text-xs text-stone-500 hover:text-rose-500 hover:border-rose-300 transition-colors"
            >
              <Icon />
              {handle}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
