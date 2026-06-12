'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WeddingPhoto } from '@/lib/supabase/database.types'

type Props = {
  weddingId: string
  initialPhotos: WeddingPhoto[]
  momentsCap?: number | null
  momentsCount?: number
}

export default function PhotosSection({ weddingId, initialPhotos, momentsCap, momentsCount }: Props) {
  const [photos, setPhotos] = useState<WeddingPhoto[]>(initialPhotos)
  const [uploaderName, setUploaderName] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  // Preview before confirm
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      alert('Max 10MB per photo')
      return
    }
    setPreviewFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  function handleCancelPreview() {
    setPreviewFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleConfirmUpload() {
    if (!previewFile) return
    setUploading(true)
    setUploadError(null)
    const sb = createClient()
    const ext = previewFile.name.split('.').pop() ?? 'jpg'
    const path = `${weddingId}/${Date.now()}.${ext}`
    const { error: storageError } = await sb.storage.from('wedding-moments').upload(path, previewFile)
    if (storageError) {
      setUploading(false)
      setUploadError(`Storage error: ${storageError.message}`)
      return
    }
    const { data: { publicUrl } } = sb.storage.from('wedding-moments').getPublicUrl(path)
    const { error: dbError } = await sb.from('wedding_photos').insert({
      wedding_id: weddingId,
      uploader_name: uploaderName.trim() || null,
      photo_url: publicUrl,
    })
    if (dbError) {
      setUploading(false)
      setUploadError(`Database error: ${dbError.message}`)
      return
    }
    // Refetch
    const { data } = await sb
      .from('wedding_photos')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false })
      .limit(50)
    setPhotos(data ?? [])
    setUploading(false)
    setPreviewFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div>
        <h2 className="font-serif text-2xl text-stone-800 mb-1">Moments</h2>
        <p className="text-stone-400 text-sm">Share your photos from this special day.</p>
      </div>

      {/* Upload area */}
      <div className="bg-white rounded-2xl border border-rose-50 shadow-sm p-5 space-y-3">
        {momentsCap !== null && momentsCap !== undefined && (momentsCount ?? 0) >= momentsCap ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-stone-400">
            <span className="text-3xl">📸</span>
            <p className="text-sm font-medium text-stone-500">
              {momentsCap === 0 ? 'Moments not available' : 'Moments wall is full'}
            </p>
            <p className="text-xs text-stone-400">
              {momentsCap === 0
                ? 'Photo sharing isn\'t enabled for this wedding.'
                : 'The upload limit has been reached for this wedding.'}
            </p>
          </div>
        ) : (
        <>
        <input
          value={uploaderName}
          onChange={e => setUploaderName(e.target.value)}
          placeholder="Your name"
          className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
        />

        {/* Preview state */}
        {previewUrl ? (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden aspect-video bg-stone-100">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
            {uploadError && (
              <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{uploadError}</p>
            )}
          <div className="flex gap-2">
              <button
                onClick={handleCancelPreview}
                disabled={uploading}
                className="flex-1 py-2.5 border border-stone-200 text-stone-500 text-sm font-medium rounded-xl hover:bg-stone-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={uploading}
                className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Uploading…
                  </>
                ) : (
                  '📸 Share this Moment'
                )}
              </button>
            </div>
          </div>
        ) : (
          <label className={`flex flex-col items-center justify-center w-full py-8 border-2 border-dashed rounded-xl transition-colors ${
            uploaderName.trim()
              ? 'border-stone-200 hover:border-rose-300 hover:bg-rose-50/50 cursor-pointer'
              : 'border-stone-100 bg-stone-50/50 cursor-not-allowed opacity-60'
          }`}>
            <span className="text-3xl mb-2">📸</span>
            <span className="text-sm font-medium text-stone-500">
              {uploaderName.trim() ? 'Tap to choose a photo' : 'Enter your name first'}
            </span>
            <span className="text-xs text-stone-300 mt-1">Max 10MB · JPG, PNG, WebP</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={!uploaderName.trim()}
              onChange={handleFileSelect}
            />
          </label>
        )}
        </>
        )}
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
          className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4"
          onClick={() => setLightboxSrc(null)}
        >
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 z-10">
            <button
              className="text-white/60 hover:text-white text-sm font-medium transition-colors"
              onClick={() => setLightboxSrc(null)}
            >
              ← Close
            </button>
            <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
              {/* Download */}
              <a
                href={lightboxSrc}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-lg transition-colors"
              >
                ⬇ Download
              </a>
              {/* Share (Web Share API — works on mobile) */}
              {'share' in navigator && (
                <button
                  onClick={async () => {
                    try {
                      await navigator.share({ url: lightboxSrc, title: 'Wedding Moment' })
                    } catch { /* user cancelled */ }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  ↗ Share
                </button>
              )}
            </div>
          </div>

          <img
            src={lightboxSrc}
            alt="Full size"
            className="max-w-full max-h-[85vh] rounded-xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
