'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WeddingStorySlide } from '@/lib/supabase/database.types'

type Props = {
  weddingId: string
  initialSlides: WeddingStorySlide[]
}

type DraftSlide = {
  title: string
  body: string
  image_url: string | null
  imageFile?: File
  imagePrompt?: string
  imageLoading?: boolean
}

export default function StorySetup({ weddingId, initialSlides }: Props) {
  const [slides, setSlides] = useState<WeddingStorySlide[]>(
    [...initialSlides].sort((a, b) => a.slide_number - b.slide_number)
  )
  const [storyText, setStoryText] = useState('')
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [draftSlides, setDraftSlides] = useState<DraftSlide[] | null>(null)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [imageNotice, setImageNotice] = useState<string | null>(null)
  const fileRefs = useRef<(HTMLInputElement | null)[]>([])

  // Slides written before AI prompts existed (or edited by hand) still get
  // illustrated — fall back to the slide's own words as the scene.
  function effectivePrompt(slide: DraftSlide): string {
    return slide.imagePrompt?.trim() || [slide.title, slide.body].filter(Boolean).join('. ')
  }

  async function generateSlideImage(idx: number, imagePrompt: string) {
    try {
      const res = await fetch('/api/generate-slide-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imagePrompt, slideIndex: idx }),
      })
      const data = await res.json()
      if (res.status === 403) {
        setImageNotice('upgrade')
      } else if (!res.ok) {
        setImageNotice('error')
      }
      setDraftSlides(prev => {
        if (!prev) return prev
        const updated = [...prev]
        updated[idx] = {
          ...updated[idx],
          image_url: data.imageUrl ?? updated[idx].image_url,
          imageLoading: false,
        }
        return updated
      })
    } catch {
      setImageNotice('error')
      setDraftSlides(prev => {
        if (!prev) return prev
        const updated = [...prev]
        updated[idx] = { ...updated[idx], imageLoading: false }
        return updated
      })
    }
  }

  // Load already-published slides back into the editor so the couple can
  // reword them, swap photos, or add AI illustrations after saving.
  function handleEditPublished() {
    setImageNotice(null)
    setDraftSlides(
      slides.map(s => ({
        title: s.title ?? '',
        body: s.body,
        image_url: s.image_url,
      }))
    )
  }

  async function handleGenerate() {
    if (!storyText.trim()) return
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storyText }),
      })
      const data = await res.json()
      if (data.slides) {
        const withImages: boolean = data.canGenerateImages === true
        const drafts: DraftSlide[] = data.slides.map(
          (s: { title: string; body: string; imagePrompt?: string }) => ({
            title: s.title,
            body: s.body,
            image_url: null,
            imagePrompt: s.imagePrompt,
            imageLoading: withImages && !!s.imagePrompt,
          })
        )
        setDraftSlides(drafts)
        // Kick off all illustrations in parallel; they fill in as they finish
        if (withImages) {
          drafts.forEach((d, idx) => {
            if (d.imagePrompt) generateSlideImage(idx, d.imagePrompt)
          })
        }
      }
    } finally {
      setGenerating(false)
    }
  }

  async function handleImageUpload(idx: number, file: File) {
    if (!draftSlides) return
    const sb = createClient()
    const ext = file.name.split('.').pop()
    const path = `${weddingId}/slide-${idx}-${Date.now()}.${ext}`
    const { error } = await sb.storage.from('story-images').upload(path, file)
    if (error) { alert('Image upload failed'); return }
    const { data: { publicUrl } } = sb.storage.from('story-images').getPublicUrl(path)
    const updated = [...draftSlides]
    updated[idx] = { ...updated[idx], image_url: publicUrl }
    setDraftSlides(updated)
  }

  async function handleSaveDrafts() {
    if (!draftSlides) return
    setSaving(true)
    const sb = createClient()
    // Delete existing slides for this wedding
    await sb.from('wedding_story_slides').delete().eq('wedding_id', weddingId)
    // Insert new slides
    const rows = draftSlides.map((s, i) => ({
      wedding_id: weddingId,
      slide_number: i,
      title: s.title || null,
      body: s.body,
      image_url: s.image_url,
    }))
    const { data, error } = await sb.from('wedding_story_slides').insert(rows).select()
    if (!error && data) {
      setSlides(data as WeddingStorySlide[])
      setDraftSlides(null)
      setStoryText('')
    }
    setSaving(false)
  }

  async function handleDeleteSlide(id: string) {
    const sb = createClient()
    await sb.from('wedding_story_slides').delete().eq('id', id)
    setSlides(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-rose-50 shadow-sm p-6">
        <h2 className="font-serif text-xl text-stone-800 mb-1">Your Love Story</h2>
        <p className="text-sm text-stone-400 mb-5">
          Tell your story in your own words — our AI will turn it into beautiful slides for your guests.
        </p>

        <textarea
          value={storyText}
          onChange={e => setStoryText(e.target.value)}
          placeholder="How did you meet? What was your first date like? When did you know they were the one? Write as much or as little as you like…"
          rows={6}
          className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-200 resize-none"
        />

        <button
          onClick={handleGenerate}
          disabled={generating || !storyText.trim()}
          className="mt-3 flex items-center gap-2 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {generating ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Generating…
            </>
          ) : (
            <>✨ Generate Story Slides with AI</>
          )}
        </button>
      </div>

      {/* Draft slides preview */}
      {draftSlides && (
        <div className="space-y-3">
          {imageNotice === 'upgrade' && (
            <div className="flex items-center justify-between gap-4 p-4 bg-stone-50 border border-stone-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <span className="text-xl">🔒</span>
                <div>
                  <p className="text-sm font-medium text-stone-700">AI illustrations are a Grand &amp; Prestige feature</p>
                  <p className="text-xs text-stone-400 mt-0.5">Upgrade your plan to turn each slide into a beautiful storybook illustration.</p>
                </div>
              </div>
              <a
                href="/admin/plans"
                className="flex-shrink-0 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-medium rounded-xl transition-colors"
              >
                Upgrade
              </a>
            </div>
          )}
          {imageNotice === 'error' && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl text-xs text-amber-700">
              Some illustrations couldn&apos;t be generated right now — use the ✨ button on a slide to retry, or add your own photos.
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-stone-600">
              {draftSlides.length} {draftSlides.length === 1 ? 'slide' : 'slides'} — edit, illustrate, then save
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDraftSlides(null)} className="text-xs text-stone-400 hover:text-stone-600">Discard</button>
              <button
                onClick={handleSaveDrafts}
                disabled={saving}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-medium rounded-xl disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving…' : 'Save All Slides'}
              </button>
            </div>
          </div>

          {draftSlides.map((slide, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-rose-50 shadow-sm overflow-hidden">
              {/* Image area */}
              {slide.imageLoading ? (
                <div className="w-full aspect-video bg-rose-50 animate-pulse flex flex-col items-center justify-center gap-2 text-rose-300">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span className="text-xs">Illustrating this moment…</span>
                </div>
              ) : slide.image_url ? (
                <div className="relative aspect-video">
                  <img src={slide.image_url} alt="" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 flex gap-1.5">
                    <button
                      onClick={() => {
                        const updated = [...draftSlides]
                        updated[idx] = { ...updated[idx], imageLoading: true }
                        setDraftSlides(updated)
                        generateSlideImage(idx, effectivePrompt(slide))
                      }}
                      title="Replace with an AI illustration"
                      className="h-7 px-2.5 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center text-xs"
                    >🔄</button>
                    <button
                      onClick={() => {
                        const updated = [...draftSlides]
                        updated[idx] = { ...updated[idx], image_url: null }
                        setDraftSlides(updated)
                      }}
                      className="w-7 h-7 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center text-xs"
                    >×</button>
                  </div>
                </div>
              ) : (
                <div className="flex">
                  <button
                    onClick={() => fileRefs.current[idx]?.click()}
                    className="flex-1 h-24 bg-rose-50 hover:bg-rose-100 flex items-center justify-center gap-2 text-rose-400 text-sm transition-colors"
                  >
                    <span>🖼️</span> Add photo
                  </button>
                  <button
                    onClick={() => {
                      const updated = [...draftSlides]
                      updated[idx] = { ...updated[idx], imageLoading: true }
                      setDraftSlides(updated)
                      generateSlideImage(idx, effectivePrompt(slide))
                    }}
                    className="flex-1 h-24 bg-stone-50 hover:bg-stone-100 border-l border-white flex items-center justify-center gap-2 text-stone-400 text-sm transition-colors"
                  >
                    <span>✨</span> Illustrate with AI
                  </button>
                </div>
              )}
              <input
                ref={el => { fileRefs.current[idx] = el }}
                type="file" accept="image/*" className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) handleImageUpload(idx, f)
                }}
              />

              <div className="p-4 space-y-2">
                {editingIdx === idx ? (
                  <>
                    <input
                      value={slide.title}
                      onChange={e => {
                        const updated = [...draftSlides]
                        updated[idx] = { ...updated[idx], title: e.target.value }
                        setDraftSlides(updated)
                      }}
                      placeholder="Slide title"
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm font-medium text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-200"
                    />
                    <textarea
                      value={slide.body}
                      onChange={e => {
                        const updated = [...draftSlides]
                        updated[idx] = { ...updated[idx], body: e.target.value }
                        setDraftSlides(updated)
                      }}
                      rows={3}
                      className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm text-stone-600 focus:outline-none focus:ring-2 focus:ring-rose-200 resize-none"
                    />
                    <button onClick={() => setEditingIdx(null)} className="text-xs text-rose-500">Done</button>
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {slide.title && <p className="font-serif font-medium text-stone-800 text-sm">{slide.title}</p>}
                        <p className="text-stone-500 text-sm mt-0.5 leading-relaxed">{slide.body}</p>
                      </div>
                      <button onClick={() => setEditingIdx(idx)} className="text-xs text-stone-300 hover:text-stone-500 shrink-0">Edit</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Existing published slides */}
      {!draftSlides && slides.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-stone-400 uppercase tracking-wide">Published Slides ({slides.length})</p>
            <button
              onClick={handleEditPublished}
              className="px-3.5 py-1.5 border border-rose-200 hover:border-rose-300 text-rose-500 text-xs font-medium rounded-xl transition-colors bg-white"
            >
              ✏️ Edit slides
            </button>
          </div>
          {slides.map((slide, idx) => (
            <div key={slide.id} className="bg-white rounded-2xl border border-rose-50 shadow-sm overflow-hidden flex">
              {slide.image_url && (
                <img src={slide.image_url} alt="" className="w-20 h-20 object-cover shrink-0" />
              )}
              <div className="p-4 flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs text-stone-300 mb-0.5">Slide {idx + 1}</p>
                    {slide.title && <p className="font-medium text-stone-700 text-sm">{slide.title}</p>}
                    <p className="text-stone-400 text-xs mt-0.5 line-clamp-2">{slide.body}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteSlide(slide.id)}
                    className="text-stone-200 hover:text-red-400 transition-colors shrink-0 text-lg leading-none"
                  >×</button>
                </div>
              </div>
            </div>
          ))}
          <p className="text-xs text-stone-400 text-center pt-1">
            Use <strong className="font-medium text-stone-500">Edit slides</strong> to reword them or add AI illustrations — or generate a new story above to start over.
          </p>
        </div>
      )}

      {!draftSlides && slides.length === 0 && (
        <div className="text-center py-8 text-stone-300">
          <p className="text-4xl mb-2">💑</p>
          <p className="text-sm">No story slides yet. Write your story above to get started.</p>
        </div>
      )}
    </div>
  )
}
