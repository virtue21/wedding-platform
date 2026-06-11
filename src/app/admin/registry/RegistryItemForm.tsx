'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { saveRegistryItem } from './actions'
import type { RegistryItem } from '@/lib/supabase/database.types'
import { track } from '@/lib/mixpanel'

type Props = {
  item?: RegistryItem
  nextSortOrder: number
  onClose: () => void
}

const CURRENCIES = [
  { code: 'NGN', label: '₦ NGN — Nigerian Naira' },
  { code: 'USD', label: '$ USD — US Dollar' },
  { code: 'GBP', label: '£ GBP — British Pound' },
  { code: 'EUR', label: '€ EUR — Euro' },
]

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function RegistryItemForm({ item, nextSortOrder, onClose }: Props) {
  const [pending, setPending] = useState(false)
  const [preview, setPreview] = useState<string | null>(item?.image_url ?? null)
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string; type: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) { setFileInfo(null); return }
    if (file.size > 5 * 1024 * 1024) {
      alert('Image is too large. Please choose a file under 5 MB.')
      e.target.value = ''
      setFileInfo(null)
      return
    }
    setPreview(URL.createObjectURL(file))
    setFileInfo({ name: file.name, size: formatBytes(file.size), type: file.type.replace('image/', '').toUpperCase() })
  }

  async function handleSubmit(formData: FormData) {
    setPending(true)
    await saveRegistryItem(formData)
    setPending(false)
    if (!item) {
      track('registry_item_added')
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-7 max-h-[90vh] overflow-y-auto">
        <h3 className="font-serif text-xl text-stone-800 mb-6">
          {item ? 'Edit item' : 'Add registry item'}
        </h3>
        <form action={handleSubmit} encType="multipart/form-data" className="space-y-4">
          {item && <input type="hidden" name="id" value={item.id} />}
          <input type="hidden" name="sort_order" value={item?.sort_order ?? nextSortOrder} />

          {/* Image upload */}
          <div>
            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Photo</label>
            <div
              className="relative w-full aspect-[16/9] rounded-2xl border-2 border-dashed border-rose-100 overflow-hidden cursor-pointer hover:border-rose-300 transition-colors bg-rose-50/40 flex items-center justify-center"
              onClick={() => fileRef.current?.click()}
            >
              {preview ? (
                <>
                  <Image src={preview} alt="Preview" fill className="object-cover" unoptimized />
                  <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-medium bg-black/50 px-3 py-1.5 rounded-full">Change photo</span>
                  </div>
                </>
              ) : (
                <div className="text-center p-4">
                  <div className="text-3xl mb-2">📷</div>
                  <p className="text-sm text-stone-400">Click to upload a photo</p>
                  <p className="text-xs text-stone-300 mt-0.5">JPG, PNG or WEBP · max 5 MB</p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              name="image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            {fileInfo && (
              <div className="flex items-center gap-2 mt-2 text-xs text-stone-500 bg-stone-50 border border-stone-100 rounded-lg px-3 py-2">
                <span>🖼️</span>
                <span className="font-medium text-stone-700 truncate max-w-[160px]">{fileInfo.name}</span>
                <span className="text-stone-300">·</span>
                <span>{fileInfo.size}</span>
                <span className="text-stone-300">·</span>
                <span className="text-rose-500 font-medium">{fileInfo.type}</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Item name *</label>
            <input name="name" type="text" required defaultValue={item?.name} placeholder="Samsung 500L Refrigerator" className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Description</label>
            <textarea name="description" rows={2} defaultValue={item?.description ?? ''} placeholder="Specs, color, model…" className="input resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Currency *</label>
              <select name="currency" defaultValue={item?.currency ?? 'NGN'} className="input">
                {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Quantity needed</label>
              <input name="quantity_needed" type="number" required min={1} defaultValue={item?.quantity_needed ?? 1} className="input" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Price *</label>
            <input name="price" type="number" required min={0} step={500} defaultValue={item?.price} placeholder="350000" className="input" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Checkout link</label>
            <input name="checkout_link" type="url" defaultValue={item?.checkout_link ?? ''} placeholder="https://jumia.com/…" className="input" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-rose-100 text-stone-500 rounded-xl text-sm hover:bg-rose-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={pending} className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50">
              {pending ? 'Saving…' : item ? 'Save changes' : 'Add item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
