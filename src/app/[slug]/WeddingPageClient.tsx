'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { WeddingRow, WeddingNote, WeddingPhoto, WeddingStorySlide } from '@/lib/supabase/database.types'
import NotesSection from './NotesSection'
import PhotosSection from './PhotosSection'
import StorySection from './StorySection'
import SiteFooter from '@/components/SiteFooter'

const VenueMap = dynamic(() => import('@/components/VenueMap'), { ssr: false })

function InstagramGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <defs>
        <radialGradient id="ig-guest" cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#fdf497" />
          <stop offset="45%" stopColor="#fd5949" />
          <stop offset="60%" stopColor="#d6249f" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect x="2" y="2" width="20" height="20" rx="5.5" fill="url(#ig-guest)" />
      <circle cx="12" cy="12" r="4.2" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="17.2" cy="6.8" r="1.3" fill="#fff" />
    </svg>
  )
}

type Tab = 'home' | 'story' | 'wishes' | 'moments'

type Props = {
  wedding: WeddingRow
  brideName: string
  groomName: string
  hasMap: boolean
  directionsUrl: string | null
  formattedDate: string
  initialNotes: WeddingNote[]
  wishesPublic?: boolean
  initialPhotos: WeddingPhoto[]
  storySlides: WeddingStorySlide[]
  slug: string
  hasMoments: boolean
  momentsCap?: number | null
  momentsCount?: number
}

export default function WeddingPageClient({
  wedding,
  brideName,
  groomName,
  hasMap,
  directionsUrl,
  formattedDate,
  initialNotes,
  wishesPublic = true,
  initialPhotos,
  storySlides,
  slug,
  hasMoments,
  momentsCap,
  momentsCount,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('home')

  const tabs: { id: Tab; icon: string; label: string }[] = [
    { id: 'home',    icon: '🏠', label: 'Home' },
    { id: 'story',   icon: '💑', label: 'Story' },
    { id: 'wishes',  icon: '💌', label: 'Wishes' },
    ...(hasMoments ? [{ id: 'moments' as Tab, icon: '📸', label: 'Moments' }] : []),
  ]

  return (
    <div className="min-h-screen bg-[#fdf8f4]">
      {/* Sticky top nav */}
      <header className="fixed top-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-md border-b border-rose-50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-serif text-stone-800 text-base">{brideName} & {groomName}</span>
          {wedding.rsvp_enabled && (
            <a
              href={`/${slug}/rsvp`}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl transition-colors"
            >
              RSVP
            </a>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="pt-14 pb-20">

        {/* ── HOME TAB ── */}
        {activeTab === 'home' && (
          <div className="max-w-lg mx-auto">
            {/* Cover image or gradient fallback */}
            {wedding.cover_image_url ? (
              <div className="relative w-full aspect-[4/3]">
                <img
                  src={wedding.cover_image_url}
                  alt={`${brideName} & ${groomName}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <p className="text-white/70 text-sm mb-1 tracking-widest uppercase">You&apos;re invited</p>
                  <h1 className="font-serif text-4xl text-white leading-tight">
                    {brideName} <span className="text-rose-300">&</span> {groomName}
                  </h1>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-rose-50 to-pink-100 px-8 pt-20 pb-12 text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 pointer-events-none select-none">
                  <div className="absolute top-4 left-8 text-6xl rotate-12">🌸</div>
                  <div className="absolute top-8 right-6 text-5xl -rotate-12">🌹</div>
                  <div className="absolute bottom-6 left-4 text-4xl rotate-6">💐</div>
                  <div className="absolute bottom-4 right-8 text-5xl -rotate-6">🌺</div>
                </div>
                <p className="text-rose-400 text-sm mb-3 tracking-widest uppercase relative">You&apos;re invited</p>
                <h1 className="font-serif text-4xl text-stone-800 leading-tight relative">
                  {brideName} <span className="text-rose-400">&</span> {groomName}
                </h1>
              </div>
            )}

            <div className="px-6 py-8 space-y-5">
              {/* Date + Venue card — only shown when RSVP is enabled */}
              {wedding.rsvp_enabled && (
                <div className="bg-white rounded-2xl border border-rose-50 shadow-sm p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="text-xl mt-0.5">📅</span>
                    <div>
                      <p className="text-xs text-stone-400 uppercase tracking-wide">Date</p>
                      <p className="font-medium text-stone-800 mt-0.5">{formattedDate}</p>
                    </div>
                  </div>
                  {/* Venue is optional — couples often book it later */}
                  {(wedding.venue_name || wedding.venue_address) && (
                    <>
                      <div className="h-px bg-rose-50" />
                      <div className="flex items-start gap-3">
                        <span className="text-xl mt-0.5">📍</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-stone-400 uppercase tracking-wide">Venue</p>
                          {wedding.venue_name && (
                            <p className="font-medium text-stone-800 mt-0.5">{wedding.venue_name}</p>
                          )}
                          {wedding.venue_address && (
                            <p className="text-sm text-stone-400 mt-0.5">{wedding.venue_address}</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {hasMap && (
                    <VenueMap
                      lat={wedding.venue_lat!}
                      lng={wedding.venue_lng!}
                      venueName={wedding.venue_name ?? 'Venue'}
                    />
                  )}

                  {directionsUrl && (
                    <a
                      href={directionsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 border border-rose-200 hover:border-rose-300 text-rose-500 text-sm font-medium rounded-xl transition-colors bg-white"
                    >
                      📍 View on Map
                    </a>
                  )}
                </div>
              )}

              {/* RSVP button — only when enabled */}
              {wedding.rsvp_enabled && (
                <Link
                  href={`/${slug}/rsvp`}
                  className="block w-full text-center py-4 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-2xl transition-colors text-base shadow-sm shadow-rose-200"
                >
                  Confirm Your Attendance
                </Link>
              )}

              {/* Gift Registry button — always shown */}
              <Link
                href={`/${slug}/registry`}
                className="block w-full text-center py-3.5 border border-rose-200 hover:border-rose-300 text-rose-500 font-medium rounded-2xl transition-colors text-sm bg-white"
              >
                🎁 View Gift Registry
              </Link>

              {/* Follow the couple — optional, sits below the CTAs so it
                  never competes with RSVP */}
              {(wedding.bride_instagram || wedding.groom_instagram) && (
                <div className="pt-1 text-center">
                  <p className="text-xs text-stone-400 mb-2.5">Follow the couple</p>
                  <div className="flex items-center justify-center gap-2.5 flex-wrap">
                    {wedding.bride_instagram && (
                      <a
                        href={`https://instagram.com/${wedding.bride_instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-rose-100 bg-white text-xs text-stone-600 hover:text-rose-500 hover:border-rose-300 transition-colors"
                      >
                        <InstagramGlyph />
                        {brideName} · @{wedding.bride_instagram}
                      </a>
                    )}
                    {wedding.groom_instagram && (
                      <a
                        href={`https://instagram.com/${wedding.groom_instagram}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-rose-100 bg-white text-xs text-stone-600 hover:text-rose-500 hover:border-rose-300 transition-colors"
                      >
                        <InstagramGlyph />
                        {groomName} · @{wedding.groom_instagram}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <SiteFooter />
          </div>
        )}

        {/* ── STORY TAB ── */}
        {activeTab === 'story' && (
          <StorySection slides={storySlides} />
        )}

        {/* ── WISHES TAB ── */}
        {activeTab === 'wishes' && (
          <NotesSection weddingId={wedding.id} initialNotes={initialNotes} wishesPublic={wishesPublic} />
        )}

        {/* ── MOMENTS TAB ── */}
        {activeTab === 'moments' && hasMoments && (
          <PhotosSection weddingId={wedding.id} initialPhotos={initialPhotos} momentsCap={momentsCap} momentsCount={momentsCount} />
        )}
      </div>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-rose-50">
        <div className="max-w-lg mx-auto flex">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-xs font-medium transition-colors ${
                activeTab === tab.id ? 'text-rose-500' : 'text-stone-400'
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
          <Link
            href={`/${slug}/registry`}
            className="flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-xs font-medium text-stone-400 hover:text-rose-400"
          >
            <span className="text-lg leading-none">🎁</span>
            Registry
          </Link>
        </div>
      </nav>
    </div>
  )
}
