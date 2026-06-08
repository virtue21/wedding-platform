'use client'

import { uploadCoverImage } from './actions'

export default function CoverImageUpload() {
  return (
    <form action={uploadCoverImage} encType="multipart/form-data" className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          name="cover_image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="text-sm text-stone-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-rose-50 file:text-rose-600 hover:file:bg-rose-100 transition-colors"
          onChange={e => {
            const f = e.target.files?.[0]
            if (f && f.size > 10 * 1024 * 1024) {
              alert('Cover image must be under 10 MB.')
              e.target.value = ''
            }
          }}
        />
        <button type="submit" className="btn-ghost whitespace-nowrap">
          Upload
        </button>
      </div>
      <p className="text-xs text-stone-400">JPG, PNG or WEBP · max 10 MB · Recommended: landscape 3:1 ratio</p>
    </form>
  )
}
