'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  addCategory, deleteCategory, renameCategory,
  addSubcategory, deleteSubcategory, renameSubcategory,
} from './actions'
import type { RelationshipCategory, RelationshipSubcategory } from '@/lib/supabase/database.types'

type CategoryWithSubs = RelationshipCategory & { subcategories: RelationshipSubcategory[] }

// ── Single subcategory row ────────────────────────────────────────────────────
function SubcategoryRow({
  sub,
  onDelete,
  onRename,
}: {
  sub: RelationshipSubcategory
  onDelete: (id: string) => void
  onRename: (id: string, label: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(sub.label)
  const [isPending, startTransition] = useTransition()

  function save() {
    const trimmed = label.trim()
    if (!trimmed) return
    startTransition(async () => {
      await renameSubcategory(sub.id, trimmed)
      onRename(sub.id, trimmed)
      setEditing(false)
    })
  }

  return (
    <div className="flex items-center gap-2 pl-3 border-l-2 border-rose-100">
      {editing ? (
        <>
          <input
            autoFocus
            value={label}
            onChange={e => setLabel(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') save()
              if (e.key === 'Escape') { setLabel(sub.label); setEditing(false) }
            }}
            className="flex-1 px-2.5 py-1 border border-rose-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
          <button onClick={save} className="text-xs text-rose-500 font-medium">Save</button>
          <button onClick={() => { setLabel(sub.label); setEditing(false) }} className="text-xs text-stone-400">✕</button>
        </>
      ) : (
        <>
          <span className="flex-1 text-xs text-stone-600 py-1 px-2 bg-stone-50 rounded-md">{label}</span>
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors px-1.5 py-0.5 rounded hover:bg-stone-100 shrink-0"
          >
            Edit
          </button>
          <button
            disabled={isPending}
            onClick={() => {
              if (confirm(`Delete "${label}"?`)) {
                startTransition(async () => {
                  await deleteSubcategory(sub.id)
                  onDelete(sub.id)
                })
              }
            }}
            className="text-xs text-red-400 hover:text-red-600 transition-colors px-1.5 py-0.5 rounded hover:bg-red-50 shrink-0 disabled:opacity-30"
          >Delete</button>
        </>
      )}
    </div>
  )
}

// ── Category row (with local subs state) ─────────────────────────────────────
function CategoryRow({ cat, color }: { cat: CategoryWithSubs; color: { ring: string } }) {
  const [expanded, setExpanded]   = useState(false)
  const [editing, setEditing]     = useState(false)
  const [catLabel, setCatLabel]   = useState(cat.label)
  const [subs, setSubs]           = useState<RelationshipSubcategory[]>(cat.subcategories)
  const [subInput, setSubInput]   = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()


  const MAX_SUBS = 10

  function handleAddSub(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = subInput.trim()
    if (!trimmed || subs.length >= MAX_SUBS) return

    startTransition(async () => {
      // Optimistic: show item immediately with a temp id
      const tempId = `temp-${Date.now()}`
      const optimistic: RelationshipSubcategory = {
        id: tempId,
        category_id: cat.id,
        label: trimmed,
        sort_order: subs.length,
      }
      setSubs(prev => [...prev, optimistic])
      setSubInput('')

      // Persist — server returns the real saved row
      const saved = await addSubcategory(cat.id, trimmed)

      // Swap temp item for the real row (real DB id)
      if (saved) {
        setSubs(prev => prev.map(s => s.id === tempId ? saved : s))
      }
    })
  }

  return (
    <div className="rounded-xl border border-rose-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-stone-50">
        {editing ? (
          <>
            <input
              autoFocus
              value={catLabel}
              onChange={e => setCatLabel(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') startTransition(async () => { await renameCategory(cat.id, catLabel); setEditing(false); router.refresh() })
                if (e.key === 'Escape') { setCatLabel(cat.label); setEditing(false) }
              }}
              className="flex-1 px-2.5 py-1 border border-rose-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
            <button
              onClick={() => startTransition(async () => { await renameCategory(cat.id, catLabel); setEditing(false); router.refresh() })}
              className="text-xs text-rose-500 font-medium"
            >Save</button>
            <button onClick={() => { setCatLabel(cat.label); setEditing(false) }} className="text-xs text-stone-400">Cancel</button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-2 flex-1 min-w-0 text-left"
            >
              <span className="text-sm font-medium text-stone-700">{catLabel}</span>
              {subs.length > 0 && (
                <span className="text-xs text-stone-400 bg-white border border-stone-200 px-1.5 py-0.5 rounded-full">
                  {subs.length} sub
                </span>
              )}
              <span className="ml-auto text-stone-300 text-xs">{expanded ? '▲' : '▼'}</span>
            </button>
            <button
              onClick={() => { setEditing(true); setCatLabel(catLabel) }}
              className="text-xs text-stone-400 hover:text-stone-600 transition-colors shrink-0 px-1.5 py-0.5 rounded hover:bg-stone-100"
            >Edit</button>
            <button
              disabled={isPending}
              onClick={() => {
                if (confirm(`Delete "${catLabel}" and all its sub-categories?`)) {
                  startTransition(async () => { await deleteCategory(cat.id); router.refresh() })
                }
              }}
              className="text-xs text-red-400 hover:text-red-600 transition-colors shrink-0 px-1.5 py-0.5 rounded hover:bg-red-50 disabled:opacity-30"
            >Delete</button>
          </>
        )}
      </div>

      {/* Subcategories panel */}
      {expanded && (
        <div className="px-3 py-3 space-y-2 bg-white">
          {subs.length === 0 && (
            <p className="text-xs text-stone-300 italic py-1">No sub-categories yet — add one below.</p>
          )}

          {subs.map(sub => (
            <SubcategoryRow
              key={sub.id}
              sub={sub}
              onDelete={id => setSubs(prev => prev.filter(s => s.id !== id))}
              onRename={(id, label) => setSubs(prev => prev.map(s => s.id === id ? { ...s, label } : s))}
            />
          ))}

          {subs.length >= MAX_SUBS && (
            <p className="text-xs text-amber-500 py-1">Maximum {MAX_SUBS} sub-categories reached.</p>
          )}

          {/* Add sub-category */}
          {subs.length < MAX_SUBS && (
            <form onSubmit={handleAddSub} className="flex gap-2 mt-2">
              <input
                value={subInput}
                onChange={e => setSubInput(e.target.value)}
                placeholder="Add sub-category…"
                className={`flex-1 px-2.5 py-1.5 border border-rose-100 rounded-lg text-xs text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 ${color.ring} bg-white`}
              />
              <button
                type="submit"
                disabled={isPending || !subInput.trim()}
                className="text-xs px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg transition-colors disabled:opacity-40"
              >
                {isPending ? '…' : '+ Add'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

// ── Category list (bride or groom side) ──────────────────────────────────────
function CategoryList({ side, categories }: { side: 'bride' | 'groom'; categories: CategoryWithSubs[] }) {
  const [label, setLabel] = useState('')
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const color = side === 'bride'
    ? { ring: 'focus:ring-rose-200', btn: 'bg-rose-500 hover:bg-rose-600', badge: 'bg-rose-50 text-rose-500 border-rose-100' }
    : { ring: 'focus:ring-blue-200', btn: 'bg-blue-500 hover:bg-blue-600', badge: 'bg-blue-50 text-blue-500 border-blue-100' }

  return (
    <div className="bg-white rounded-2xl border border-rose-50 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-lg">{side === 'bride' ? '👰' : '🤵'}</span>
        <h3 className="font-serif text-lg text-stone-800 capitalize">{side}&apos;s Side</h3>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border font-medium ${color.badge}`}>
          {categories.length} {categories.length === 1 ? 'category' : 'categories'}
        </span>
      </div>

      <p className="text-xs text-stone-400 mb-4">
        Click a category to expand and add sub-categories (up to 10 each).
      </p>

      <div className="space-y-2 mb-5">
        {categories.length === 0 && (
          <p className="text-sm text-stone-300 py-2">No categories yet — add one below.</p>
        )}
        {categories.map(cat => (
          <CategoryRow key={cat.id} cat={cat} color={color} />
        ))}
      </div>

      {/* Add category */}
      <form
        onSubmit={e => {
          e.preventDefault()
          const trimmed = label.trim()
          if (!trimmed) return
          const fd = new FormData()
          fd.append('side', side)
          fd.append('label', trimmed)
          startTransition(async () => {
            await addCategory(fd)
            setLabel('')
            router.refresh()
          })
        }}
        className="flex gap-2"
      >
        <input
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder={`Add ${side === 'bride' ? "bride's" : "groom's"} category…`}
          className={`flex-1 px-3 py-2 border border-rose-100 rounded-xl text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 ${color.ring} bg-white`}
        />
        <button
          type="submit"
          disabled={isPending || !label.trim()}
          className={`px-4 py-2 ${color.btn} text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-40`}
        >
          {isPending ? '…' : 'Add'}
        </button>
      </form>
    </div>
  )
}

// ── Root export ───────────────────────────────────────────────────────────────
export default function CategoriesClient({
  bride,
  groom,
}: {
  bride: CategoryWithSubs[]
  groom: CategoryWithSubs[]
}) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <CategoryList side="bride" categories={bride} />
      <CategoryList side="groom" categories={groom} />
    </div>
  )
}
