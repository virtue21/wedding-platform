'use client'

import { useState } from 'react'
import { uploadCoverImage } from './actions'

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function CoverImageUpload() {
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string; type: string } | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) { setFileInfo(null); return }
    if (f.size > 10 * 1024 * 1024) {
      alert('Cover image must be under 10 MB.')
      e.target.value = ''
      setFileInfo(null)
      return
    }
    setFileInfo({ name: f.name, size: formatBytes(f.size), type: f.type.replace('image/', '').toUpperCase() })
  }

  return (
    <form action={uploadCoverImage} encType="multipart/form-data" className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          name="cover_image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="text-sm text-stone-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-rose-50 file:text-rose-600 hover:file:bg-rose-100 transition-colors"
          onChange={handleChange}
        />
        <button type="submit" className="btn-ghost whitespace-nowrap">
          Upload
        </button>
      </div>

      {fileInfo ? (
        <div className="flex items-center gap-2 text-xs text-stone-500 bg-stone-50 border border-stone-100 rounded-lg px-3 py-2">
          <span className="text-base">🖼️</span>
          <span className="font-medium text-stone-700 truncate max-w-[180px]">{fileInfo.name}</span>
          <span className="text-stone-300">·</span>
          <span className="shrink-0">{fileInfo.size}</span>
          <span className="text-stone-300">·</span>
          <span className="shrink-0 text-rose-500 font-medium">{fileInfo.type}</span>
        </div>
      ) : (
        <p className="text-xs text-stone-400">JPG, PNG or WEBP · max 10 MB · Recommended: landscape 3:1 ratio</p>
      )}
    </form>
  )
}
