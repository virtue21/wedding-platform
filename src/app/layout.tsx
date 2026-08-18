import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import MixpanelProvider from '@/components/MixpanelProvider'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
})

const title = 'NemiPlanner — Wedding Planning & Guest Management App for Nigerian Weddings'
const description = 'Plan your Nigerian wedding with one link. Manage RSVPs, guest lists, seating charts, and gift registry — no subscriptions, one-time pricing from ₦35,000.'

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title: 'NemiPlanner — Wedding Planning Made Simple',
    description: 'Digital RSVPs, gift registry, guest management — one link, zero stress.',
    url: 'https://nemiplanner.xyz',
    siteName: 'NemiPlanner',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_NG',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NemiPlanner — Wedding Planning Made Simple',
    description: 'Digital RSVPs, gift registry, guest management — one link, zero stress.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32', type: 'image/x-icon' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'icon', url: '/android-chrome-192.png', sizes: '192x192', type: 'image/png' },
      { rel: 'icon', url: '/android-chrome-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">
        <MixpanelProvider>{children}</MixpanelProvider>
        <Analytics />
      </body>
    </html>
  )
}
