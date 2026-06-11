'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { revalidateAfterMutation } from './actions'
import { track } from '@/lib/mixpanel'

type Sub = { id: string; label: string; sort_order: number; category_id: string }
type Cat = { id: string; label: string; sort_order: number; side: 'bride' | 'groom'; subcategories: Sub[] }

// ─── SubRow ───────────────────────────────────────────────────────────────────
function SubRow({
  sub,
  onEdit,
  onDelete,
  dragHandlers,
  isDragging,
  isOver,
}: {
  sub: Sub
  onEdit: (id: string, label: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  dragHandlers: {
    onDragStart: () => void
    onDragOver: (e: React.DragEvent) => void
    onDrop: () => void
    onDragEnd: () => void
  }
  isDragging: boolean
  isOver: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(sub.label)

  // keep draft in sync when label changes after re-fetch
  useEffect(() => { if (!editing) setDraft(sub.label) }, [sub.label, editing])

  return (
    <div
      draggable
      {...dragHandlers}
      className={`flex items-center gap-2 pl-2 border-l-2 py-1 transition-all select-none ${
        isDragging ? 'opacity-25' : ''
      } ${isOver ? 'border-l-rose-400' : 'border-l-rose-100'}`}
    >
      <span className="text-stone-300 cursor-grab active:cursor-grabbing text-xs shrink-0">⠿</span>

      {editing ? (
        <>
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { onEdit(sub.id, draft); setEditing(false) }
              if (e.key === 'Escape') { setDraft(sub.label); setEditing(false) }
            }}
            className="flex-1 px-2 py-0.5 text-xs border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-200"
          />
          <button onClick={() => { onEdit(sub.id, draft); setEditing(false) }}
            className="text-xs text-rose-500 font-medium px-1.5 py-0.5 rounded hover:bg-rose-50 shrink-0">Done</button>
          <button onClick={() => { setDraft(sub.label); setEditing(false) }}
            className="text-xs text-stone-400 px-1.5 py-0.5 rounded hover:bg-stone-100 shrink-0">Cancel</button>
        </>
      ) : (
        <>
          <span className="flex-1 text-xs text-stone-600 py-1 px-2 bg-stone-50 rounded-md truncate">{sub.label}</span>
          <button onClick={() => { setEditing(true); setDraft(sub.label) }}
            className="text-xs text-stone-400 hover:text-stone-600 px-1.5 py-0.5 rounded hover:bg-stone-100 shrink-0">Edit</button>
          <button onClick={() => onDelete(sub.id)}
            className="text-xs text-red-400 hover:text-red-600 px-1.5 py-0.5 rounded hover:bg-red-50 shrink-0">Delete</button>
        </>
      )}
    </div>
  )
}

// ─── CategoryCard ─────────────────────────────────────────────────────────────
function CategoryCard({
  cat,
  onEditCat,
  onDeleteCat,
  onAddSub,
  onEditSub,
  onDeleteSub,
  onReorderSubs,
  dragHandlers,
  isDragging,
  isOver,
}: {
  cat: Cat
  onEditCat: (id: string, label: string) => Promise<void>
  onDeleteCat: (id: string) => Promise<void>
  onAddSub: (catId: string, label: string) => Promise<void>
  onEditSub: (id: string, label: string) => Promise<void>
  onDeleteSub: (id: string) => Promise<void>
  onReorderSubs: (catId: string, orderedIds: string[]) => Promise<void>
  dragHandlers: {
    onDragStart: () => void
    onDragOver: (e: React.DragEvent) => void
    onDrop: () => void
    onDragEnd: () => void
  }
  isDragging: boolean
  isOver: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [editingCat, setEditingCat] = useState(false)
  const [catDraft, setCatDraft] = useState(cat.label)
  const [subInput, setSubInput] = useState('')
  const dragSubId = useRef<string | null>(null)
  const [draggingSubId, setDraggingSubId] = useState<string | null>(null)
  const [overSubId, setOverSubId] = useState<string | null>(null)

  useEffect(() => { if (!editingCat) setCatDraft(cat.label) }, [cat.label, editingCat])

  async function handleDropSub(targetId: string) {
    setOverSubId(null)
    const fromId = dragSubId.current
    dragSubId.current = null
    setDraggingSubId(null)
    if (!fromId || fromId === targetId) return
    const fromIdx = cat.subcategories.findIndex(s => s.id === fromId)
    const toIdx   = cat.subcategories.findIndex(s => s.id === targetId)
    if (fromIdx === -1 || toIdx === -1) return
    const reordered = [...cat.subcategories]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    await onReorderSubs(cat.id, reordered.map(s => s.id))
  }

  return (
    <div
      draggable
      {...dragHandlers}
      className={`rounded-xl border overflow-hidden transition-all select-none ${
        isDragging ? 'opacity-25' : ''
      } ${isOver ? 'border-rose-300 shadow-sm' : 'border-stone-100'}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5 bg-stone-50">
        <span className="text-stone-300 cursor-grab active:cursor-grabbing text-sm shrink-0">⠿</span>

        {editingCat ? (
          <>
            <input
              autoFocus
              value={catDraft}
              onChange={e => setCatDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') { onEditCat(cat.id, catDraft); setEditingCat(false) }
                if (e.key === 'Escape') { setCatDraft(cat.label); setEditingCat(false) }
              }}
              className="flex-1 px-2.5 py-1 border border-rose-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
            />
            <button onClick={() => { onEditCat(cat.id, catDraft); setEditingCat(false) }}
              className="text-xs text-rose-500 font-medium px-2 py-1 rounded hover:bg-rose-50 shrink-0">Done</button>
            <button onClick={() => { setCatDraft(cat.label); setEditingCat(false) }}
              className="text-xs text-stone-400 px-2 py-1 rounded hover:bg-stone-100 shrink-0">Cancel</button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setExpanded(v => !v)}
              className="flex items-center gap-2 flex-1 min-w-0 text-left">
              <span className="text-sm font-medium text-stone-700 truncate">{cat.label}</span>
              {cat.subcategories.length > 0 && (
                <span className="text-xs text-stone-400 bg-white border border-stone-200 px-1.5 py-0.5 rounded-full shrink-0">
                  {cat.subcategories.length} sub
                </span>
              )}
              <span className="ml-auto text-stone-300 text-xs shrink-0">{expanded ? '▲' : '▼'}</span>
            </button>
            <button onClick={() => { setEditingCat(true); setCatDraft(cat.label) }}
              className="text-xs text-stone-400 hover:text-stone-600 px-2 py-1 rounded hover:bg-stone-100 shrink-0">Edit</button>
            <button onClick={() => onDeleteCat(cat.id)}
              className="text-xs text-red-400 hover:text-red-600 px-2 py-1 rounded hover:bg-red-50 shrink-0">Delete</button>
          </>
        )}
      </div>

      {/* Subcategories */}
      {expanded && (
        <div className="px-3 py-3 space-y-1.5 bg-white border-t border-stone-50">
          {cat.subcategories.length === 0 && (
            <p className="text-xs text-stone-300 italic mb-2">No sub-categories yet.</p>
          )}

          {cat.subcategories.map(sub => (
            <SubRow
              key={sub.id}
              sub={sub}
              onEdit={onEditSub}
              onDelete={onDeleteSub}
              dragHandlers={{
                onDragStart: () => { dragSubId.current = sub.id; setDraggingSubId(sub.id) },
                onDragOver: (e) => { e.preventDefault(); e.stopPropagation(); setOverSubId(sub.id) },
                onDrop: () => handleDropSub(sub.id),
                onDragEnd: () => { dragSubId.current = null; setDraggingSubId(null); setOverSubId(null) },
              }}
              isDragging={draggingSubId === sub.id}
              isOver={overSubId === sub.id && draggingSubId !== sub.id}
            />
          ))}

          <form
            onSubmit={e => {
              e.preventDefault()
              if (subInput.trim()) { onAddSub(cat.id, subInput.trim()); setSubInput('') }
            }}
            className="flex gap-2 pt-1"
          >
            <input
              value={subInput}
              onChange={e => setSubInput(e.target.value)}
              placeholder="Add sub-category…"
              className="flex-1 px-2.5 py-1.5 border border-rose-100 rounded-lg text-xs text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-200 bg-white"
            />
            <button type="submit" disabled={!subInput.trim()}
              className="text-xs px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-lg transition-colors disabled:opacity-40">
              + Add
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

// ─── SideSection ──────────────────────────────────────────────────────────────
function SideSection({
  side, cats, weddingId, onRefetch,
}: {
  side: 'bride' | 'groom'
  cats: Cat[]
  weddingId: string
  onRefetch: () => Promise<void>
}) {
  const [newCatLabel, setNewCatLabel] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const dragCatId = useRef<string | null>(null)
  const [draggingCatId, setDraggingCatId] = useState<string | null>(null)
  const [overCatId, setOverCatId] = useState<string | null>(null)
  const sb = createClient()

  const isBride = side === 'bride'

  async function run(fn: () => Promise<void>) {
    setBusy(true); setErr('')
    try {
      await fn()
      await onRefetch()
      await revalidateAfterMutation()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  // ── Category CRUD ──
  async function handleAddCat() {
    if (!newCatLabel.trim()) return
    const label = newCatLabel.trim()
    setNewCatLabel('')
    await run(async () => {
      const nextSort = cats.length > 0 ? Math.max(...cats.map(c => c.sort_order)) + 1 : 0
      const { error } = await sb.from('relationship_categories')
        .insert({ wedding_id: weddingId, side, label, sort_order: nextSort })
      if (error) throw new Error(error.message)
      track('category_created')
    })
  }

  async function handleEditCat(id: string, label: string) {
    if (!label.trim()) return
    await run(async () => {
      const { error } = await sb.from('relationship_categories').update({ label: label.trim() }).eq('id', id)
      if (error) throw new Error(error.message)
    })
  }

  async function handleDeleteCat(id: string) {
    const { data: blocked } = await sb.from('guests').select('id')
      .eq('category_id', id).eq('is_removed', false).limit(1)
    if (blocked && blocked.length > 0) {
      setErr('This category still has guests assigned. Reassign them first.')
      return
    }
    await run(async () => {
      const { error } = await sb.from('relationship_categories').delete().eq('id', id)
      if (error) throw new Error(error.message)
      track('category_deleted')
    })
  }

  async function handleDropCat(targetId: string) {
    setOverCatId(null)
    const fromId = dragCatId.current
    dragCatId.current = null
    setDraggingCatId(null)
    if (!fromId || fromId === targetId) return
    const fromIdx = cats.findIndex(c => c.id === fromId)
    const toIdx   = cats.findIndex(c => c.id === targetId)
    if (fromIdx === -1 || toIdx === -1) return
    const reordered = [...cats]
    const [moved] = reordered.splice(fromIdx, 1)
    reordered.splice(toIdx, 0, moved)
    await run(async () => {
      for (let i = 0; i < reordered.length; i++) {
        const { error } = await sb.from('relationship_categories').update({ sort_order: i }).eq('id', reordered[i].id)
        if (error) throw new Error(error.message)
      }
    })
  }

  // ── Subcategory CRUD ──
  async function handleAddSub(catId: string, label: string) {
    await run(async () => {
      const cat = cats.find(c => c.id === catId)
      const nextSort = cat && cat.subcategories.length > 0
        ? Math.max(...cat.subcategories.map(s => s.sort_order)) + 1 : 0
      const { error } = await sb.from('relationship_subcategories')
        .insert({ category_id: catId, label: label.trim(), sort_order: nextSort })
      if (error) throw new Error(error.message)
    })
  }

  async function handleEditSub(id: string, label: string) {
    if (!label.trim()) return
    await run(async () => {
      const { error } = await sb.from('relationship_subcategories').update({ label: label.trim() }).eq('id', id)
      if (error) throw new Error(error.message)
    })
  }

  async function handleDeleteSub(id: string) {
    await run(async () => {
      const { error } = await sb.from('relationship_subcategories').delete().eq('id', id)
      if (error) throw new Error(error.message)
    })
  }

  async function handleReorderSubs(catId: string, orderedIds: string[]) {
    await run(async () => {
      for (let i = 0; i < orderedIds.length; i++) {
        const { error } = await sb.from('relationship_subcategories').update({ sort_order: i }).eq('id', orderedIds[i])
        if (error) throw new Error(error.message)
      }
    })
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-lg">{isBride ? '👰' : '🤵'}</span>
        <h3 className="font-serif text-lg text-stone-800 capitalize">{side}&apos;s Side</h3>
        {busy && <div className="w-3.5 h-3.5 border-2 border-rose-300 border-t-transparent rounded-full animate-spin ml-1" />}
        <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border font-medium ${
          isBride ? 'bg-rose-50 text-rose-500 border-rose-100' : 'bg-blue-50 text-blue-500 border-blue-100'
        }`}>
          {cats.length} {cats.length === 1 ? 'category' : 'categories'}
        </span>
      </div>

      {err && (
        <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{err}</p>
      )}

      {/* Category list */}
      <div className="space-y-2">
        {cats.length === 0 && !busy && (
          <p className="text-sm text-stone-300 py-2">No categories yet.</p>
        )}
        {cats.map(cat => (
          <CategoryCard
            key={cat.id}
            cat={cat}
            onEditCat={handleEditCat}
            onDeleteCat={handleDeleteCat}
            onAddSub={handleAddSub}
            onEditSub={handleEditSub}
            onDeleteSub={handleDeleteSub}
            onReorderSubs={handleReorderSubs}
            dragHandlers={{
              onDragStart: () => { dragCatId.current = cat.id; setDraggingCatId(cat.id) },
              onDragOver: (e) => { e.preventDefault(); setOverCatId(cat.id) },
              onDrop: () => handleDropCat(cat.id),
              onDragEnd: () => { dragCatId.current = null; setDraggingCatId(null); setOverCatId(null) },
            }}
            isDragging={draggingCatId === cat.id}
            isOver={overCatId === cat.id && draggingCatId !== cat.id}
          />
        ))}
      </div>

      {/* Add category */}
      <div className="flex gap-2">
        <input
          value={newCatLabel}
          onChange={e => setNewCatLabel(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleAddCat() }}
          placeholder={`Add ${isBride ? "bride's" : "groom's"} category…`}
          disabled={busy}
          className={`flex-1 px-3 py-2 border ${
            isBride ? 'border-rose-100 focus:ring-rose-200' : 'border-blue-100 focus:ring-blue-200'
          } rounded-xl text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none focus:ring-2 bg-white disabled:opacity-60`}
        />
        <button
          type="button"
          disabled={!newCatLabel.trim() || busy}
          onClick={handleAddCat}
          className={`px-4 py-2 ${
            isBride ? 'bg-rose-500 hover:bg-rose-600' : 'bg-blue-500 hover:bg-blue-600'
          } text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-40`}
        >Add</button>
      </div>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-8">
      {[0, 1].map(col => (
        <div key={col} className="space-y-3">
          <div className="h-7 w-32 bg-stone-100 rounded-lg animate-pulse" />
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 bg-stone-100 rounded-xl animate-pulse" style={{ opacity: 1 - i * 0.15 }} />
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function CategoriesClient({ weddingId }: { weddingId: string }) {
  const [bride, setBride] = useState<Cat[]>([])
  const [groom, setGroom] = useState<Cat[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  const fetchData = useCallback(async () => {
    setFetchError('')
    const sb = createClient()

    // Query categories
    const { data: cats, error: catsErr } = await sb
      .from('relationship_categories')
      .select('id, label, sort_order, side')
      .eq('wedding_id', weddingId)
      .order('sort_order')

    if (catsErr) { setFetchError(catsErr.message); setLoading(false); return }

    // Query subcategories separately — avoids nested-select alias issues entirely
    const catIds = (cats ?? []).map(c => c.id)
    let subs: Sub[] = []
    if (catIds.length > 0) {
      const { data: subsData, error: subsErr } = await sb
        .from('relationship_subcategories')
        .select('id, label, sort_order, category_id')
        .in('category_id', catIds)
        .order('sort_order')

      if (subsErr) { setFetchError(subsErr.message); setLoading(false); return }
      subs = subsData ?? []
    }

    // Join in JS
    const allCats: Cat[] = (cats ?? []).map(c => ({
      ...c,
      subcategories: subs
        .filter(s => s.category_id === c.id)
        .sort((a, b) => a.sort_order - b.sort_order),
    }))

    setBride(allCats.filter(c => c.side === 'bride'))
    setGroom(allCats.filter(c => c.side === 'groom'))
    setLoading(false)
  }, [weddingId])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-serif text-3xl text-stone-800 mb-1">Relationship Categories</h1>
        <p className="text-stone-400 text-sm">
          Guests pick a category when RSVPing. Add optional sub-categories to drill down further.
        </p>
      </div>

      {fetchError && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">{fetchError}</div>
      )}

      {loading ? <Skeleton /> : (
        <div className="grid md:grid-cols-2 gap-8">
          <SideSection side="bride" cats={bride} weddingId={weddingId} onRefetch={fetchData} />
          <SideSection side="groom" cats={groom} weddingId={weddingId} onRefetch={fetchData} />
        </div>
      )}
    </div>
  )
}
