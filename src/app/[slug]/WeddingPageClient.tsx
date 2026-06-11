'use client'

import { useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import type { WeddingRow, WeddingNote, WeddingPhoto } from '@/lib/supabase/database.types'
import NotesSection from './NotesSection'
import PhotosSection from './PhotosSection'

const VenueMap = dynamic(() => import('@/components/VenueMap'), { ssr: false })

type Props = {
  wedding: WeddingRow
  brideName: string
  groomName: string
  hasMap: boolean
  directionsUrl: string
  formattedDate: string
  initialNotes: WeddingNote[]
  initialPhotos: WeddingPhoto[]
  slug: string
}

export default function WeddingPageClient({
  wedding,
  brideName,
  groomName,
  hasMap,
  directionsUrl,
  formattedDate,
  initialNotes,
  initialPhotos,
  slug,
}: Props) {
  const [activeTab, setActiveTab] = useState<'home' | 'wishes' | 'moments'>('home')

  return (
    <div className="min-h-screen bg-[#fdf8f4]">
      {/* Sticky top nav */}
      <header className="fixed top-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-md border-b border-rose-50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-serif text-stone-800 text-base">{brideName} & {groomName}</span>
          {wedding.rsvp_enabled && (
            <Link
              href={`/${slug}/rsvp`}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl transition-colors"
            >
              RSVP
            </Link>
          )}
        </div>
      </header>

      {/* Main content */}
      <div className="pt-14 pb-20">
        {/* Home tab */}
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
                <div className="absolute inset-0 opacity-10">
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
              {/* Date + Venue card */}
              <div className="bg-white rounded-2xl border border-rose-50 shadow-sm p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">📅</span>
                  <div>
                    <p className="text-xs text-stone-400 uppercase tracking-wide">Date</p>
                    <p className="font-medium text-stone-800 mt-0.5">{formattedDate}</p>
                  </div>
                </div>
                <div className="h-px bg-rose-50" />
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">📍</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-stone-400 uppercase tracking-wide">Venue</p>
                    <p className="font-medium text-stone-800 mt-0.5">{wedding.venue_name}</p>
                    {wedding.rsvp_enabled && wedding.venue_address && (
                      <p className="text-sm text-stone-400 mt-0.5">{wedding.venue_address}</p>
                    )}
                  </div>
                </div>

                {/* Embedded map — only when rsvp_enabled and coords available */}
                {wedding.rsvp_enabled && hasMap && (
                  <VenueMap
                    lat={wedding.venue_lat!}
                    lng={wedding.venue_lng!}
                    venueName={wedding.venue_name}
                  />
                )}

                {/* View on Map — only when rsvp_enabled */}
                {wedding.rsvp_enabled && (
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2.5 border border-rose-200 hover:border-rose-300 text-rose-500 text-sm font-medium rounded-xl transition-colors bg-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="3 11 22 2 13 21 11 13 3 11" />
                    </svg>
                    📍 View on Map
                  </a>
                )}
              </div>

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
            </div>
          </div>
        )}

        {/* Wishes tab */}
        {activeTab === 'wishes' && (
          <NotesSection weddingId={wedding.id} initialNotes={initialNotes} />
        )}

        {/* Moments tab */}
        {activeTab === 'moments' && (
          <PhotosSection weddingId={wedding.id} initialPhotos={initialPhotos} />
        )}
      </div>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-rose-50 pb-safe">
        <div className="max-w-lg mx-auto flex">
          {([
            { id: 'home', icon: '🏠', label: 'Home' },
            { id: 'wishes', icon: '💌', label: 'Wishes' },
            { id: 'moments', icon: '📸', label: 'Moments' },
          ] as const).map(tab => (
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
