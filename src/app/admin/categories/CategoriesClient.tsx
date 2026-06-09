'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { saveCategories } from './actions'
import type { RelationshipCategory, RelationshipSubcategory } from '@/lib/supabase/database.types'

type CategoryWithSubs = RelationshipCategory & { subcategories: RelationshipSubcategory[] }

// Local state types — new items use 'new:xxx' ids
type LocalSub  = { id: string; label: string }
type LocalCat  = { id: string; label: string; subcategories: LocalSub[]; expanded: boolean }

function uid() { return `new:${Math.random().toString(36).slice(2)}` }

function initCats(cats: CategoryWithSubs[]): LocalCat[] {
  return cats.map(c => ({
    id: c.id,
    label: c.label,
    expanded: false,
    subcategories: [...c.subcategories].sort((a, b) => a.sort_order - b.sort_order)
      .map(s => ({ id: s.id, label: s.label })),
  }))
}

// ── Single side panel ─────────────────────────────────────────────────────────
function SidePanel({
  side,
  initialCategories,
}: {
  side: 'bride' | 'groom'
  initialCategories: CategoryWithSubs[]
}) {
  const router = useRouter()
  const [cats, setCats]                   = useState<LocalCat[]>(() => initCats(initialCategories))
  const [deletedCatIds, setDeletedCatIds] = useState<string[]>([])
  const [deletedSubIds, setDeletedSubIds] = useState<string[]>([])
  const [newCatLabel, setNewCatLabel]     = useState('')
  const [isDirty, setIsDirty]             = useState(false)
  const [saving, setSaving]               = useState(false)
  const [error, setError]                 = useState('')
  const [saved, setSaved]                 = useState(false)

  const color = side === 'bride'
    ? { ring: 'focus:ring-rose-200', btn: 'bg-rose-500 hover:bg-rose-600', badge: 'bg-rose-50 text-rose-500 border-rose-100', save: 'bg-rose-500 hover:bg-rose-600' }
    : { ring: 'focus:ring-blue-200', btn: 'bg-blue-500 hover:bg-blue-600', badge: 'bg-blue-50 text-blue-500 border-blue-100', save: 'bg-blue-500 hover:bg-blue-600' }

  function dirty() { setIsDirty(true); setSaved(false); setError('') }

  // ── Category operations ──
  function addCat() {
    const label = newCatLabel.trim()
    if (!label) return
    setCats(prev => [...prev, { id: uid(), label, expanded: false, subcategories: [] }])
    setNewCatLabel('')
    dirty()
  }

  function removeCat(catId: string) {
    if (!catId.startsWith('new:')) {
      setDeletedCatIds(prev => [...prev, catId])
    }
    setCats(prev => prev.filter(c => c.id !== catId))
    dirty()
  }

  function renameCat(catId: string, label: string) {
    setCats(prev => prev.map(c => c.id === catId ? { ...c, label } : c))
    dirty()
  }

  function toggleExpand(catId: string) {
    setCats(prev => prev.map(c => c.id === catId ? { ...c, expanded: !c.expanded } : c))
  }

  // ── Subcategory operations ──
  function addSub(catId: string, label: string) {
    if (!label.trim()) return
    setCats(prev => prev.map(c =>
      c.id === catId
        ? { ...c, subcategories: [...c.subcategories, { id: uid(), label: label.trim() }] }
        : c
    ))
    dirty()
  }

  function removeSub(catId: string, subId: string) {
    if (!subId.startsWith('new:')) {
      setDeletedSubIds(prev => [...prev, subId])
    }
    setCats(prev => prev.map(c =>
      c.id === catId ? { ...c, subcategories: c.subcategories.filter(s => s.id !== subId) } : c
    ))
    dirty()
  }

  function renameSub(catId: string, subId: string, label: string) {
    setCats(prev => prev.map(c =>
      c.id === catId
        ? { ...c, subcategories: c.subcategories.map(s => s.id === subId ? { ...s, label } : s) }
        : c
    ))
    dirty()
  }

  // ── Save ──
  async function handleSave() {
    setSaving(true)
    setError('')
    const result = await saveCategories(side, cats, deletedCatIds, deletedSubIds)
    setSaving(false)

    if (result?.error) {
      setError(result.error)
      return
    }

    setDeletedCatIds([])
    setDeletedSubIds([])
    setIsDirty(false)
    setSaved(true)
    router.refresh()
  }

  return (
    <div className="bg-white rounded-2xl border border-rose-50 shadow-sm p-6 flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-lg">{side === 'bride' ? '👰' : '🤵'}</span>
        <h3 className="font-serif text-lg text-stone-800 capitalize">{side}&apos;s Side</h3>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border font-medium ${color.badge}`}>
          {cats.length} {cats.length === 1 ? 'category' : 'categories'}
        </span>
      </div>

      {/* Status messages */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600">{error}</div>
      )}
      {saved && !isDirty && (
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 font-medium">
          Changes saved ✓
        </div>
      )}

      {/* Category list */}
      <div className="space-y-2">
        {cats.length === 0 && (
          <p className="text-sm text-stone-300 py-2">No categories yet — add one below.</p>
        )}

        {cats.map(cat => (
          <CategoryRow
            key={cat.id}
            cat={cat}
            color={color}
            onToggle={() => toggleExpand(cat.id)}
            onRename={label => renameCat(cat.id, label)}
            onRemove={() => removeCat(cat.id)}
            onAddSub={label => addSub(cat.id, label)}
            onRemoveSub={subId => removeSub(cat.id, subId)}
            onRenameSub={(subId, label) => renameSub(cat.id, subId, label)}
          />
        ))}
      </div>

      {/* Add category */}
      <div className="flex gap-2">
        <input
          value={newCatLabel}
          onChange={e => setNewCatLabel(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') addCat() }}
          placeholder={`Add ${side === 'bride' ? "bride's" : "groom's"} category…`}
          className={`flex-1 px-3 py-2 border border-rose-100 rounded-xl text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 ${color.ring} bg-white`}
        />
        <button
          type="button"
          disabled={!newCatLabel.trim()}
          onClick={addCat}
          className={`px-4 py-2 ${color.btn} text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-40`}
        >
          Add
        </button>
      </div>

      {/* Save button */}
      <button
        type="button"
        disabled={!isDirty || saving}
        onClick={handleSave}
        className={`w-full py-3 ${color.save} text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {saving ? 'Saving…' : isDirty ? 'Save changes' : 'No unsaved changes'}
      </button>
    </div>
  )
}

// ── Category row ──────────────────────────────────────────────────────────────
function CategoryRow({
  cat, color,
  onToggle, onRename, onRemove,
  onAddSub, onRemoveSub, onRenameSub,
}: {
  cat: LocalCat
  color: { ring: string }
  onToggle: () => void
  onRename: (label: string) => void
  onRemove: () => void
  onAddSub: (label: string) => void
  onRemoveSub: (subId: string) => void
  onRenameSub: (subId: string, label: string) => void
}) {
  const [editingCat, setEditingCat] = useState(false)
  const [catDraft, setCatDraft]     = useState(cat.label)
  const [subInput, setSubInput]     = useState('')
  const MAX_SUBS = 10

  return (
    <div className="rounded-xl border border-stone-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-stone-50">
        {editingCat ? (
          <>
            <input
              autoFocus
              value={catDraft}
              onChange={e => setCatDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { onRename(catDraft); setEditingCat(false) }
                if (e.key === 'Escape') { setCatDraft(cat.label); setEditingCat(false) }
              }}
              className="flex-1 px-2.5 py-1 border border-rose-200 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
            <button
              onClick={() => { onRename(catDraft); setEditingCat(false) }}
              className="text-xs text-rose-500 font-medium px-2 py-1 rounded hover:bg-rose-50"
            >
              Done
            </button>
            <button
              onClick={() => { setCatDraft(cat.label); setEditingCat(false) }}
              className="text-xs text-stone-400 px-2 py-1 rounded hover:bg-stone-100"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={onToggle} className="flex items-center gap-2 flex-1 min-w-0 text-left">
              <span className="text-sm font-medium text-stone-700 truncate">{cat.label}</span>
              {cat.subcategories.length > 0 && (
                <span className="text-xs text-stone-400 bg-white border border-stone-200 px-1.5 py-0.5 rounded-full shrink-0">
                  {cat.subcategories.length} sub
                </span>
              )}
              <span className="ml-auto text-stone-300 text-xs shrink-0">{cat.expanded ? '▲' : '▼'}</span>
            </button>
            <button
              onClick={() => { setEditingCat(true); setCatDraft(cat.label) }}
              className="text-xs text-stone-400 hover:text-stone-600 px-1.5 py-0.5 rounded hover:bg-stone-100 shrink-0"
            >
              Edit
            </button>
            <button
              onClick={onRemove}
              className="text-xs text-red-400 hover:text-red-600 px-1.5 py-0.5 rounded hover:bg-red-50 shrink-0"
            >
              Delete
            </button>
          </>
        )}
      </div>

      {/* Subcategories */}
      {cat.expanded && (
        <div className="px-3 py-3 space-y-2 bg-white">
          {cat.subcategories.length === 0 && (
            <p className="text-xs text-stone-300 italic">No sub-categories yet.</p>
          )}

          {cat.subcategories.map(sub => (
            <SubRow
              key={sub.id}
              sub={sub}
              color={color}
              onRename={label => onRenameSub(sub.id, label)}
              onRemove={() => onRemoveSub(sub.id)}
            />
          ))}

          {cat.subcategories.length >= MAX_SUBS && (
            <p className="text-xs text-amber-500">Maximum {MAX_SUBS} sub-categories reached.</p>
          )}

          {cat.subcategories.length < MAX_SUBS && (
            <form
              onSubmit={e => { e.preventDefault(); onAddSub(subInput); setSubInput('') }}
              className="flex gap-2 pt-1"
            >
              <input
                value={subInput}
                onChange={e => setSubInput(e.target.value)}
                placeholder="Add sub-category…"
                className={`flex-1 px-2.5 py-1.5 border border-rose-100 rounded-lg text-xs text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 ${color.ring} bg-white`}
              />
              <button
                type="submit"
                disabled={!subInput.trim()}
                className="text-xs px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg transition-colors disabled:opacity-40"
              >
                + Add
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

// ── Subcategory row ───────────────────────────────────────────────────────────
function SubRow({
  sub, color, onRename, onRemove,
}: {
  sub: LocalSub
  color: { ring: string }
  onRename: (label: string) => void
  onRemove: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(sub.label)

  return (
    <div className="flex items-center gap-2 pl-3 border-l-2 border-rose-100">
      {editing ? (
        <>
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { onRename(draft); setEditing(false) }
              if (e.key === 'Escape') { setDraft(sub.label); setEditing(false) }
            }}
            className={`flex-1 px-2.5 py-1 border border-rose-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-2 ${color.ring}`}
          />
          <button
            onClick={() => { onRename(draft); setEditing(false) }}
            className="text-xs text-rose-500 font-medium px-1.5 py-0.5 rounded hover:bg-rose-50"
          >
            Done
          </button>
          <button
            onClick={() => { setDraft(sub.label); setEditing(false) }}
            className="text-xs text-stone-400 px-1.5 py-0.5 rounded hover:bg-stone-100"
          >
            Cancel
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 text-xs text-stone-600 py-1 px-2 bg-stone-50 rounded-md truncate">{sub.label}</span>
          <button
            onClick={() => { setEditing(true); setDraft(sub.label) }}
            className="text-xs text-stone-400 hover:text-stone-600 px-1.5 py-0.5 rounded hover:bg-stone-100 shrink-0"
          >
            Edit
          </button>
          <button
            onClick={onRemove}
            className="text-xs text-red-400 hover:text-red-600 px-1.5 py-0.5 rounded hover:bg-red-50 shrink-0"
          >
            Delete
          </button>
        </>
      )}
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
      <SidePanel side="bride" initialCategories={bride} />
      <SidePanel side="groom" initialCategories={groom} />
    </div>
  )
}
