'use client'

import { useState } from 'react'
import { saveCategories } from './actions'
import type { RelationshipCategory, RelationshipSubcategory } from '@/lib/supabase/database.types'

type CategoryWithSubs = RelationshipCategory & { subcategories: RelationshipSubcategory[] }

// ─── local state types (new items use 'new:xxx' ids) ─────────────────────────
type LocalSub = { id: string; label: string }
type LocalCat = { id: string; label: string; subcategories: LocalSub[]; expanded: boolean }

function uid() { return `new:${Math.random().toString(36).slice(2)}` }

function initCats(cats: CategoryWithSubs[], preserveExpanded?: Map<string, boolean>): LocalCat[] {
  return cats.map(c => ({
    id: c.id,
    label: c.label,
    expanded: preserveExpanded?.get(c.id) ?? false,
    subcategories: [...c.subcategories]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(s => ({ id: s.id, label: s.label })),
  }))
}

function expandedMap(cats: LocalCat[]): Map<string, boolean> {
  return new Map(cats.map(c => [c.id, c.expanded]))
}

// ─── Category row ─────────────────────────────────────────────────────────────
function CategoryRow({
  cat,
  onToggle, onRename, onRemove,
  onAddSub, onRemoveSub, onRenameSub,
}: {
  cat: LocalCat
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

  // keep draft in sync if parent label changes (e.g. after save resets cats)
  const labelRef = cat.label
  if (!editingCat && catDraft !== labelRef) setCatDraft(labelRef)

  return (
    <div className="rounded-xl border border-stone-100 overflow-hidden">
      {/* Header row */}
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
              className="text-xs text-rose-500 font-medium px-2 py-1 rounded hover:bg-rose-50 shrink-0"
            >Done</button>
            <button
              onClick={() => { setCatDraft(cat.label); setEditingCat(false) }}
              className="text-xs text-stone-400 px-2 py-1 rounded hover:bg-stone-100 shrink-0"
            >Cancel</button>
          </>
        ) : (
          <>
            {/* Expand/collapse toggle */}
            <button
              type="button"
              onClick={onToggle}
              className="flex items-center gap-2 flex-1 min-w-0 text-left"
            >
              <span className="text-sm font-medium text-stone-700 truncate">{cat.label}</span>
              {cat.subcategories.length > 0 && (
                <span className="text-xs text-stone-400 bg-white border border-stone-200 px-1.5 py-0.5 rounded-full shrink-0">
                  {cat.subcategories.length} sub
                </span>
              )}
              <span className="ml-auto text-stone-300 text-xs shrink-0">
                {cat.expanded ? '▲' : '▼'}
              </span>
            </button>
            <button
              onClick={() => { setEditingCat(true); setCatDraft(cat.label) }}
              className="text-xs text-stone-400 hover:text-stone-600 px-2 py-1 rounded hover:bg-stone-100 shrink-0"
            >Edit</button>
            <button
              onClick={onRemove}
              className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 shrink-0"
            >Delete</button>
          </>
        )}
      </div>

      {/* Subcategory panel */}
      {cat.expanded && (
        <div className="px-3 py-3 space-y-2 bg-white border-t border-stone-50">
          {cat.subcategories.length === 0 && (
            <p className="text-xs text-stone-300 italic">No sub-categories yet.</p>
          )}

          {cat.subcategories.map(sub => (
            <SubRow
              key={sub.id}
              sub={sub}
              onRename={label => onRenameSub(sub.id, label)}
              onRemove={() => onRemoveSub(sub.id)}
            />
          ))}

          {cat.subcategories.length >= MAX_SUBS && (
            <p className="text-xs text-amber-500">Maximum {MAX_SUBS} sub-categories reached.</p>
          )}

          {cat.subcategories.length < MAX_SUBS && (
            <form
              onSubmit={e => { e.preventDefault(); if (subInput.trim()) { onAddSub(subInput); setSubInput('') } }}
              className="flex gap-2 pt-1"
            >
              <input
                value={subInput}
                onChange={e => setSubInput(e.target.value)}
                placeholder="Add sub-category…"
                className="flex-1 px-2.5 py-1.5 border border-rose-100 rounded-lg text-xs text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-200 bg-white"
              />
              <button
                type="submit"
                disabled={!subInput.trim()}
                className="text-xs px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg transition-colors disabled:opacity-40"
              >+ Add</button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Subcategory row ──────────────────────────────────────────────────────────
function SubRow({
  sub, onRename, onRemove,
}: {
  sub: LocalSub
  onRename: (label: string) => void
  onRemove: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(sub.label)

  if (!editing && draft !== sub.label) setDraft(sub.label)

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
            className="flex-1 px-2.5 py-1 border border-rose-200 rounded-lg text-xs text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
          <button
            onClick={() => { onRename(draft); setEditing(false) }}
            className="text-xs text-rose-500 font-medium px-1.5 py-0.5 rounded hover:bg-rose-50 shrink-0"
          >Done</button>
          <button
            onClick={() => { setDraft(sub.label); setEditing(false) }}
            className="text-xs text-stone-400 px-1.5 py-0.5 rounded hover:bg-stone-100 shrink-0"
          >Cancel</button>
        </>
      ) : (
        <>
          <span className="flex-1 text-xs text-stone-600 py-1 px-2 bg-stone-50 rounded-md truncate">
            {sub.label}
          </span>
          <button
            onClick={() => { setEditing(true); setDraft(sub.label) }}
            className="text-xs text-stone-400 hover:text-stone-600 px-1.5 py-0.5 rounded hover:bg-stone-100 shrink-0"
          >Edit</button>
          <button
            onClick={onRemove}
            className="text-xs text-red-400 hover:text-red-600 px-1.5 py-0.5 rounded hover:bg-red-50 shrink-0"
          >Delete</button>
        </>
      )}
    </div>
  )
}

// ─── Side section (no save button — save is centralised) ──────────────────────
function SideSection({
  side,
  cats,
  onAddCat,
  onRemoveCat,
  onRenameCat,
  onToggleExpand,
  onAddSub,
  onRemoveSub,
  onRenameSub,
}: {
  side: 'bride' | 'groom'
  cats: LocalCat[]
  onAddCat: (label: string) => void
  onRemoveCat: (id: string) => void
  onRenameCat: (id: string, label: string) => void
  onToggleExpand: (id: string) => void
  onAddSub: (catId: string, label: string) => void
  onRemoveSub: (catId: string, subId: string) => void
  onRenameSub: (catId: string, subId: string, label: string) => void
}) {
  const [newCatLabel, setNewCatLabel] = useState('')
  const isBride = side === 'bride'
  const accent = isBride
    ? 'border-rose-100 focus:ring-rose-200'
    : 'border-blue-100 focus:ring-blue-200'
  const addBtn = isBride
    ? 'bg-rose-500 hover:bg-rose-600'
    : 'bg-blue-500 hover:bg-blue-600'
  const badge = isBride
    ? 'bg-rose-50 text-rose-500 border-rose-100'
    : 'bg-blue-50 text-blue-500 border-blue-100'

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-lg">{isBride ? '👰' : '🤵'}</span>
        <h3 className="font-serif text-lg text-stone-800 capitalize">{side}&apos;s Side</h3>
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border font-medium ${badge}`}>
          {cats.length} {cats.length === 1 ? 'category' : 'categories'}
        </span>
      </div>

      {/* Category list */}
      <div className="space-y-2">
        {cats.length === 0 && (
          <p className="text-sm text-stone-300 py-2">No categories yet.</p>
        )}
        {cats.map(cat => (
          <CategoryRow
            key={cat.id}
            cat={cat}
            onToggle={() => onToggleExpand(cat.id)}
            onRename={label => onRenameCat(cat.id, label)}
            onRemove={() => onRemoveCat(cat.id)}
            onAddSub={label => onAddSub(cat.id, label)}
            onRemoveSub={subId => onRemoveSub(cat.id, subId)}
            onRenameSub={(subId, label) => onRenameSub(cat.id, subId, label)}
          />
        ))}
      </div>

      {/* Add category input */}
      <div className="flex gap-2">
        <input
          value={newCatLabel}
          onChange={e => setNewCatLabel(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && newCatLabel.trim()) {
              onAddCat(newCatLabel.trim())
              setNewCatLabel('')
            }
          }}
          placeholder={`Add ${isBride ? "bride's" : "groom's"} category…`}
          className={`flex-1 px-3 py-2 border ${accent} rounded-xl text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 bg-white`}
        />
        <button
          type="button"
          disabled={!newCatLabel.trim()}
          onClick={() => { if (newCatLabel.trim()) { onAddCat(newCatLabel.trim()); setNewCatLabel('') } }}
          className={`px-4 py-2 ${addBtn} text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-40`}
        >Add</button>
      </div>
    </div>
  )
}

// ─── Root export ──────────────────────────────────────────────────────────────
export default function CategoriesClient({
  bride: initialBride,
  groom: initialGroom,
}: {
  bride: CategoryWithSubs[]
  groom: CategoryWithSubs[]
}) {
  // All state lives here — the single source of truth
  const [brideCats, setBrideCats]             = useState<LocalCat[]>(() => initCats(initialBride))
  const [groomCats, setGroomCats]             = useState<LocalCat[]>(() => initCats(initialGroom))
  const [delBrideCatIds, setDelBrideCatIds]   = useState<string[]>([])
  const [delGroomCatIds, setDelGroomCatIds]   = useState<string[]>([])
  const [isDirty, setIsDirty]                 = useState(false)
  const [saving, setSaving]                   = useState(false)
  const [error, setError]                     = useState('')
  const [saveMsg, setSaveMsg]                 = useState('')

  function dirty() { setIsDirty(true); setSaveMsg(''); setError('') }

  // ── Bride operations ──
  function brideAddCat(label: string) {
    setBrideCats(p => [...p, { id: uid(), label, expanded: false, subcategories: [] }])
    dirty()
  }
  function brideRemoveCat(id: string) {
    if (!id.startsWith('new:')) setDelBrideCatIds(p => [...p, id])
    setBrideCats(p => p.filter(c => c.id !== id))
    dirty()
  }
  function brideRenameCat(id: string, label: string) {
    setBrideCats(p => p.map(c => c.id === id ? { ...c, label } : c))
    dirty()
  }
  function brideToggle(id: string) {
    setBrideCats(p => p.map(c => c.id === id ? { ...c, expanded: !c.expanded } : c))
  }
  function brideAddSub(catId: string, label: string) {
    setBrideCats(p => p.map(c => c.id === catId
      ? { ...c, subcategories: [...c.subcategories, { id: uid(), label }] } : c))
    dirty()
  }
  function brideRemoveSub(catId: string, subId: string) {
    setBrideCats(p => p.map(c => c.id === catId
      ? { ...c, subcategories: c.subcategories.filter(s => s.id !== subId) } : c))
    dirty()
  }
  function brideRenameSub(catId: string, subId: string, label: string) {
    setBrideCats(p => p.map(c => c.id === catId
      ? { ...c, subcategories: c.subcategories.map(s => s.id === subId ? { ...s, label } : s) } : c))
    dirty()
  }

  // ── Groom operations ──
  function groomAddCat(label: string) {
    setGroomCats(p => [...p, { id: uid(), label, expanded: false, subcategories: [] }])
    dirty()
  }
  function groomRemoveCat(id: string) {
    if (!id.startsWith('new:')) setDelGroomCatIds(p => [...p, id])
    setGroomCats(p => p.filter(c => c.id !== id))
    dirty()
  }
  function groomRenameCat(id: string, label: string) {
    setGroomCats(p => p.map(c => c.id === id ? { ...c, label } : c))
    dirty()
  }
  function groomToggle(id: string) {
    setGroomCats(p => p.map(c => c.id === id ? { ...c, expanded: !c.expanded } : c))
  }
  function groomAddSub(catId: string, label: string) {
    setGroomCats(p => p.map(c => c.id === catId
      ? { ...c, subcategories: [...c.subcategories, { id: uid(), label }] } : c))
    dirty()
  }
  function groomRemoveSub(catId: string, subId: string) {
    setGroomCats(p => p.map(c => c.id === catId
      ? { ...c, subcategories: c.subcategories.filter(s => s.id !== subId) } : c))
    dirty()
  }
  function groomRenameSub(catId: string, subId: string, label: string) {
    setGroomCats(p => p.map(c => c.id === catId
      ? { ...c, subcategories: c.subcategories.map(s => s.id === subId ? { ...s, label } : s) } : c))
    dirty()
  }

  // ── Central save ──
  async function handleSave() {
    setSaving(true)
    setError('')

    const result = await saveCategories(
      brideCats,
      groomCats,
      delBrideCatIds,
      delGroomCatIds,
      [], // deletedSubIds no longer needed — action replaces all subs per category
    )

    setSaving(false)

    if (result.error) {
      setError(result.error)
      return
    }

    // Reset local state from DB data returned by action (real IDs replace temp 'new:xxx')
    // Preserve expanded state so panels don't collapse after saving
    if (result.bride && result.groom) {
      setBrideCats(prev => initCats(result.bride!, expandedMap(prev)))
      setGroomCats(prev => initCats(result.groom!, expandedMap(prev)))

      const totalSubs = [...result.bride, ...result.groom]
        .reduce((n, c) => n + c.subcategories.length, 0)
      const totalCats = result.bride.length + result.groom.length
      setSaveMsg(`Saved ${totalCats} categories and ${totalSubs} sub-categories.`)
    }

    setDelBrideCatIds([])
    setDelGroomCatIds([])
    setIsDirty(false)
  }

  return (
    <div className="space-y-8">

      {/* Page header — title left, save button right */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-stone-800 mb-1">Relationship Categories</h1>
          <p className="text-stone-400 text-sm">
            Guests pick a category when RSVPing. Add optional sub-categories to drill down further.
          </p>
        </div>

        <button
          type="button"
          disabled={!isDirty || saving}
          onClick={handleSave}
          className="shrink-0 px-5 py-2.5 bg-rose-500 hover:bg-rose-600 active:scale-[0.98] text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm whitespace-nowrap"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>

      {/* Status messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
          {error}
        </div>
      )}
      {saveMsg && !isDirty && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700 font-medium">
          ✓ {saveMsg}
        </div>
      )}

      {/* Two columns */}
      <div className="grid md:grid-cols-2 gap-8">
        <SideSection
          side="bride"
          cats={brideCats}
          onAddCat={brideAddCat}
          onRemoveCat={brideRemoveCat}
          onRenameCat={brideRenameCat}
          onToggleExpand={brideToggle}
          onAddSub={brideAddSub}
          onRemoveSub={brideRemoveSub}
          onRenameSub={brideRenameSub}
        />
        <SideSection
          side="groom"
          cats={groomCats}
          onAddCat={groomAddCat}
          onRemoveCat={groomRemoveCat}
          onRenameCat={groomRenameCat}
          onToggleExpand={groomToggle}
          onAddSub={groomAddSub}
          onRemoveSub={groomRemoveSub}
          onRenameSub={groomRenameSub}
        />
      </div>
    </div>
  )
}
