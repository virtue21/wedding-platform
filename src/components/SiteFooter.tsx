function InstagramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <radialGradient id="ig-grad" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="5%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#ig-grad)" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.3" fill="#fff" />
    </svg>
  )
}

function TikTokIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5.5" fill="#010101" />
      {/* cyan echo */}
      <path
        d="M16.6 7.3a3.6 3.6 0 0 1-2.8-3.1V4h-2.5v9.9a2.1 2.1 0 1 1-2.1-2.1c.22 0 .43.03.64.1V9.4a4.6 4.6 0 0 0-.64-.04 4.6 4.6 0 1 0 4.6 4.6v-5a5.9 5.9 0 0 0 3.44 1.1V7.6a3.6 3.6 0 0 1-.64-.3z"
        fill="#25F4EE"
        transform="translate(-0.4, -0.4)"
      />
      {/* red echo */}
      <path
        d="M16.6 7.3a3.6 3.6 0 0 1-2.8-3.1V4h-2.5v9.9a2.1 2.1 0 1 1-2.1-2.1c.22 0 .43.03.64.1V9.4a4.6 4.6 0 0 0-.64-.04 4.6 4.6 0 1 0 4.6 4.6v-5a5.9 5.9 0 0 0 3.44 1.1V7.6a3.6 3.6 0 0 1-.64-.3z"
        fill="#FE2C55"
        transform="translate(0.4, 0.4)"
      />
      {/* white core */}
      <path
        d="M16.6 7.3a3.6 3.6 0 0 1-2.8-3.1V4h-2.5v9.9a2.1 2.1 0 1 1-2.1-2.1c.22 0 .43.03.64.1V9.4a4.6 4.6 0 0 0-.64-.04 4.6 4.6 0 1 0 4.6 4.6v-5a5.9 5.9 0 0 0 3.44 1.1V7.6a3.6 3.6 0 0 1-.64-.3z"
        fill="#fff"
      />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5.5" fill="#e11d48" />
      <rect x="5.5" y="7.5" width="13" height="9" rx="1.5" fill="none" stroke="#fff" strokeWidth="1.6" />
      <path d="m5.5 8.5 6.5 4.5 6.5-4.5" fill="none" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
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
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-rose-100 bg-white text-xs text-stone-600 hover:text-rose-500 hover:border-rose-300 transition-colors shadow-sm"
            >
              <Icon />
              {handle}
            </a>
          ))}
        </div>
        <p className="text-[11px] text-stone-300">NemiPlanner &copy; {new Date().getFullYear()}</p>
      </div>
    </footer>
  )
}
