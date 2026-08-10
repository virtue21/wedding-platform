'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { WeddingRow, WeddingNote, WeddingPhoto, WeddingStorySlide } from '@/lib/supabase/database.types'
import NotesSection from './NotesSection'
import PhotosSection from './PhotosSection'
import StorySection from './StorySection'
import GuestHome from './GuestHome'

type Tab = 'home' | 'story' | 'wishes' | 'moments'

type Props = {
  wedding: WeddingRow
  brideName: string
  groomName: string
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
  registryRemaining?: number
  confirmed?: boolean
}

export default function WeddingPageClient({
  wedding,
  brideName,
  groomName,
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
  registryRemaining = 0,
  confirmed = false,
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
      {/* Sticky top nav — hidden on Home, where the hero already carries
          the couple's names and the RSVP action */}
      <header className={`fixed top-0 left-0 right-0 z-20 bg-white/90 backdrop-blur-md border-b border-rose-50 ${activeTab === 'home' ? 'hidden' : ''}`}>
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
      <div className={activeTab === 'home' ? 'pb-20' : 'pt-14 pb-20'}>

        {/* ── HOME TAB ── */}
        {activeTab === 'home' && (
          <GuestHome
            wedding={wedding}
            brideName={brideName}
            groomName={groomName}
            formattedDate={formattedDate}
            directionsUrl={directionsUrl}
            slug={slug}
            registryRemaining={registryRemaining}
            confirmed={confirmed}
          />
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
              className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1.5"
            >
              <span
                className="rounded-full"
                style={{ width: 5, height: 5, background: activeTab === tab.id ? '#e11d48' : '#d6d3d1' }}
              />
              <span
                className="font-semibold"
                style={{ fontSize: 11, letterSpacing: '0.04em', color: activeTab === tab.id ? '#e11d48' : '#a8a29e' }}
              >
                {tab.label}
              </span>
            </button>
          ))}
          <Link
            href={`/${slug}/registry`}
            className="flex-1 flex flex-col items-center justify-center py-2.5 gap-1.5"
          >
            <span className="rounded-full" style={{ width: 5, height: 5, background: '#d6d3d1' }} />
            <span className="font-semibold" style={{ fontSize: 11, letterSpacing: '0.04em', color: '#a8a29e' }}>
              Registry
            </span>
          </Link>
        </div>
      </nav>
    </div>
  )
}
