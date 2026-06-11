'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WeddingPhoto } from '@/lib/supabase/database.types'

type Props = {
  weddingId: string
  initialPhotos: WeddingPhoto[]
}

export default function PhotosSection({ weddingId, initialPhotos }: Props) {
  const [photos, setPhotos] = useState<WeddingPhoto[]>(initialPhotos)
  const [uploaderName, setUploaderName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      alert('Max 5MB')
      return
    }
    setUploading(true)
    const sb = createClient()
    const ext = file.name.split('.').pop()
    const path = `${weddingId}/${Date.now()}.${ext}`
    const { error: uploadError } = await sb.storage.from('wedding-moments').upload(path, file)
    if (uploadError) {
      setUploading(false)
      alert('Upload failed')
      return
    }
    const { data: { publicUrl } } = sb.storage.from('wedding-moments').getPublicUrl(path)
    await sb.from('wedding_photos').insert({
      wedding_id: weddingId,
      uploader_name: uploaderName.trim() || null,
      photo_url: publicUrl,
    })
    const { data } = await sb
      .from('wedding_photos')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false })
      .limit(50)
    setPhotos(data ?? [])
    setUploading(false)
    e.target.value = ''
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div>
        <h2 className="font-serif text-2xl text-stone-800 mb-1">Moments</h2>
        <p className="text-stone-400 text-sm">Share your photos from this special day.</p>
      </div>

      {/* Upload area */}
      <div className="bg-white rounded-2xl border border-rose-50 shadow-sm p-5 space-y-3">
        <input
          value={uploaderName}
          onChange={e => setUploaderName(e.target.value)}
          placeholder="Your name (optional)"
          className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
        />
        <label className={`flex flex-col items-center justify-center w-full py-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${uploading ? 'border-rose-200 bg-rose-50 opacity-60' : 'border-stone-200 hover:border-rose-300 hover:bg-rose-50/50'}`}>
          <span className="text-3xl mb-2">📸</span>
          <span className="text-sm font-medium text-stone-500">
            {uploading ? 'Uploading…' : 'Tap to add a photo'}
          </span>
          <span className="text-xs text-stone-300 mt-1">Max 5MB · JPG, PNG, WebP</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={handleUpload}
          />
        </label>
      </div>

      {/* Photos grid */}
      {photos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-3xl mb-2">📸</p>
          <p className="font-serif text-lg text-stone-600">No photos yet — be the first!</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map(photo => (
            <button
              key={photo.id}
              onClick={() => setLightboxSrc(photo.photo_url)}
              className="aspect-square rounded-xl overflow-hidden bg-stone-100 hover:opacity-90 transition-opacity"
            >
              <img
                src={photo.photo_url}
                alt={photo.uploader_name ?? 'Guest photo'}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
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
