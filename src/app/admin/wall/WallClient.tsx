'use client'

import { useState, useTransition } from 'react'
import type { WeddingNote, WeddingPhoto } from '@/lib/supabase/database.types'
import { deleteNote, deletePhoto } from './actions'

type Props = {
  notes: WeddingNote[]
  photos: WeddingPhoto[]
  momentslocked?: boolean
}

export default function WallClient({ notes: initialNotes, photos: initialPhotos, momentslocked = false }: Props) {
  const [activeTab, setActiveTab] = useState<'notes' | 'photos'>('notes')
  const [notes, setNotes] = useState(initialNotes)
  const [photos, setPhotos] = useState(initialPhotos)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDeleteNote(id: string) {
    startTransition(async () => {
      await deleteNote(id)
      setNotes(prev => prev.filter(n => n.id !== id))
    })
  }

  function handleDeletePhoto(id: string) {
    startTransition(async () => {
      await deletePhoto(id)
      setPhotos(prev => prev.filter(p => p.id !== id))
    })
  }

  return (
    <div className="space-y-5">
      {/* Tab switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${activeTab === 'notes' ? 'bg-rose-500 text-white' : 'bg-white border border-rose-100 text-stone-500 hover:text-stone-800'}`}
        >
          💌 Wishes
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'notes' ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-500'}`}>
            {notes.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('photos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'photos'
              ? 'bg-rose-500 text-white'
              : momentslocked
              ? 'bg-stone-100 border border-stone-200 text-stone-400 cursor-pointer'
              : 'bg-white border border-rose-100 text-stone-500 hover:text-stone-800'
          }`}
        >
          {momentslocked ? '🔒' : '📸'} Moments
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === 'photos' ? 'bg-white/20 text-white' : momentslocked ? 'bg-stone-200 text-stone-400' : 'bg-rose-50 text-rose-500'}`}>
            {photos.length}
          </span>
        </button>
      </div>

      {/* Notes tab */}
      {activeTab === 'notes' && (
        <div className="space-y-3">
          {notes.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-rose-50">
              <p className="text-3xl mb-2">💌</p>
              <p className="font-serif text-lg text-stone-600">No wishes yet</p>
              <p className="text-sm text-stone-400 mt-1">Guests haven&apos;t posted any messages yet.</p>
            </div>
          ) : (
            notes.map(note => (
              <div key={note.id} className="bg-white rounded-2xl border border-rose-50 shadow-sm p-5 flex gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-stone-800 italic leading-relaxed mb-2">&quot;{note.message}&quot;</p>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-stone-600">— {note.author_name}</p>
                    <p className="text-xs text-stone-300">
                      {new Date(note.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteNote(note.id)}
                  disabled={isPending}
                  className="shrink-0 p-2 text-stone-300 hover:text-red-400 transition-colors disabled:opacity-40"
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Photos tab */}
      {activeTab === 'photos' && (
        <div>
          {photos.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-rose-50">
              <p className="text-3xl mb-2">📸</p>
              <p className="font-serif text-lg text-stone-600">No photos yet</p>
              <p className="text-sm text-stone-400 mt-1">Guests haven&apos;t uploaded any photos yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {photos.map(photo => (
                <div key={photo.id} className="relative group rounded-2xl overflow-hidden bg-stone-100 aspect-square">
                  <img
                    src={photo.photo_url}
                    alt={photo.uploader_name ?? 'Guest photo'}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setLightboxSrc(photo.photo_url)}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex flex-col items-end justify-between p-2 opacity-0 group-hover:opacity-100">
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      disabled={isPending}
                      className="p-1.5 bg-black/50 hover:bg-red-500/80 text-white text-xs rounded-lg disabled:opacity-40 transition-colors"
                      title="Delete photo"
                    >
                      🗑️
                    </button>
                    {photo.uploader_name && (
                      <p className="text-white text-xs font-medium bg-black/40 px-2 py-0.5 rounded-lg truncate max-w-full">
                        {photo.uploader_name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl leading-none z-10"
            onClick={() => setLightboxSrc(null)}
          >
            ×
          </button>
          <img
            src={lightboxSrc}
            alt="Full size"
            className="max-w-full max-h-full rounded-xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
