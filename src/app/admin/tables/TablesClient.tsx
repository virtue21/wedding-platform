'use client'

import { useState, useTransition, useMemo } from 'react'
import { saveTable, deleteTable, assignGuestToTable } from './actions'
import type { SeatTable, Guest, RelationshipCategory, RelationshipSubcategory } from '@/lib/supabase/database.types'

type TableWithGuests = SeatTable & { guests: Pick<Guest, 'id' | 'full_name' | 'side'>[] }
type CategoryWithSubs = RelationshipCategory & { subcategories: RelationshipSubcategory[] }

function TableCard({ table, unassigned }: {
  table: TableWithGuests
  unassigned: Pick<Guest, 'id' | 'full_name' | 'side' | 'table_id'>[]
}) {
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(table.label)
  const [capacity, setCapacity] = useState(table.capacity)

  const count = table.guests.length
  const over = count > table.capacity

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${over ? 'border-red-100' : 'border-rose-50'}`}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          {editing ? (
            <div className="flex gap-2 flex-1">
              <input value={label} onChange={e => setLabel(e.target.value)} className="flex-1 px-2.5 py-1.5 border border-rose-100 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-200" />
              <input value={capacity} type="number" min={1} onChange={e => setCapacity(+e.target.value)} className="w-16 px-2.5 py-1.5 border border-rose-100 rounded-lg text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-200" />
              <button onClick={() => {
                const fd = new FormData(); fd.append('id', table.id); fd.append('label', label); fd.append('capacity', String(capacity))
                startTransition(() => { saveTable(fd); setEditing(false) })
              }} className="text-xs text-rose-500 font-medium">Save</button>
            </div>
          ) : (
            <div>
              <h3 className="font-medium text-stone-800">{table.label}</h3>
              <p className={`text-xs mt-0.5 ${over ? 'text-red-500 font-medium' : 'text-stone-400'}`}>
                {count}/{table.capacity} seats{over ? ' — over capacity!' : ''}
              </p>
            </div>
          )}
          {!editing && (
            <div className="flex gap-1.5 shrink-0">
              <button onClick={() => setEditing(true)} className="text-xs px-2.5 py-1 border border-rose-100 text-stone-400 rounded-lg hover:bg-rose-50">Edit</button>
              <button onClick={() => { if (confirm(`Delete ${table.label}?`)) startTransition(() => deleteTable(table.id)) }} className="text-xs px-2.5 py-1 border border-red-100 text-red-400 rounded-lg hover:bg-red-50">Delete</button>
            </div>
          )}
        </div>

        <div className="h-1.5 bg-rose-50 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full rounded-full transition-all ${over ? 'bg-red-300' : 'bg-rose-300'}`}
            style={{ width: `${Math.min((count / table.capacity) * 100, 100)}%` }}
          />
        </div>

        {table.guests.length > 0 && (
          <div className="space-y-1.5 mb-4">
            {table.guests.map(g => (
              <div key={g.id} className="flex items-center justify-between gap-2">
                <span className="text-sm text-stone-700">{g.full_name}</span>
                <button
                  onClick={() => startTransition(() => assignGuestToTable(g.id, null))}
                  disabled={isPending}
                  className="text-xs text-stone-300 hover:text-red-400 transition-colors"
                >✕</button>
              </div>
            ))}
          </div>
        )}

        {unassigned.length > 0 && (
          <select
            value=""
            disabled={isPending}
            onChange={e => { if (e.target.value) startTransition(() => assignGuestToTable(e.target.value, table.id)) }}
            className="w-full px-3 py-2 border border-rose-100 rounded-xl text-sm text-stone-400 focus:outline-none focus:ring-2 focus:ring-rose-200 bg-white"
          >
            <option value="">+ Assign a guest…</option>
            {unassigned.map(g => (
              <option key={g.id} value={g.id}>{g.full_name}</option>
            ))}
          </select>
        )}
      </div>
    </div>
  )
}

export default function TablesClient({
  tables,
  guests,
  categories,
}: {
  tables: TableWithGuests[]
  guests: Pick<Guest, 'id' | 'full_name' | 'side' | 'table_id'>[]
  categories: CategoryWithSubs[]
}) {
  const [isPending, startTransition] = useTransition()

  // Form state
  const [categoryId, setCategoryId] = useState('')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [customLabel, setCustomLabel] = useState('')
  const [capacity, setCapacity] = useState(10)

  const selectedCategory = categories.find(c => c.id === categoryId) ?? null
  const subs = selectedCategory?.subcategories ?? []

  // Auto-derive label suggestion from selection
  const labelSuggestion = useMemo(() => {
    if (subcategoryId) return subs.find(s => s.id === subcategoryId)?.label ?? ''
    if (categoryId) return selectedCategory?.label ?? ''
    return ''
  }, [categoryId, subcategoryId, selectedCategory, subs])

  const displayLabel = customLabel || labelSuggestion || 'Unnamed table'

  const unassigned = guests.filter(g => !g.table_id)
  const nextSort = tables.length > 0 ? Math.max(...tables.map(t => t.sort_order)) + 1 : 0

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const finalLabel = customLabel.trim() || labelSuggestion.trim()
    if (!finalLabel) return
    const fd = new FormData()
    fd.append('label', finalLabel)
    fd.append('capacity', String(capacity))
    fd.append('sort_order', String(nextSort))
    if (categoryId) fd.append('category_id', categoryId)
    if (subcategoryId) fd.append('subcategory_id', subcategoryId)
    startTransition(() => {
      saveTable(fd)
      setCategoryId('')
      setSubcategoryId('')
      setCustomLabel('')
      setCapacity(10)
    })
  }

  return (
    <div>
      {/* Add table form */}
      <form onSubmit={handleAdd} className="bg-white rounded-2xl border border-rose-50 shadow-sm p-6 mb-6 space-y-4">
        <h3 className="text-sm font-semibold text-stone-700">Create a new table</h3>

        <div className="grid sm:grid-cols-2 gap-3">
          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">
              Category <span className="text-stone-300 normal-case font-normal">(optional)</span>
            </label>
            <select
              value={categoryId}
              onChange={e => { setCategoryId(e.target.value); setSubcategoryId('') }}
              className="input"
            >
              <option value="">— No category (e.g. waiters, vendors) —</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.label} ({c.side})</option>
              ))}
            </select>
          </div>

          {/* Subcategory — only shown if category has subs */}
          {subs.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">
                Sub-category <span className="text-stone-300 normal-case font-normal">(optional)</span>
              </label>
              <select
                value={subcategoryId}
                onChange={e => setSubcategoryId(e.target.value)}
                className="input"
              >
                <option value="">— All of {selectedCategory?.label} —</option>
                {subs.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-3 gap-3 items-end">
          {/* Custom label */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">
              Table name <span className="text-stone-300 normal-case font-normal">(leave blank to use category name)</span>
            </label>
            <input
              value={customLabel}
              onChange={e => setCustomLabel(e.target.value)}
              placeholder={labelSuggestion || 'Head Table, Table 1…'}
              className="input"
            />
            {labelSuggestion && !customLabel && (
              <p className="text-xs text-stone-400 mt-1">Will be named &ldquo;<span className="text-stone-600 font-medium">{labelSuggestion}</span>&rdquo;</p>
            )}
          </div>
          {/* Capacity */}
          <div>
            <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Capacity</label>
            <input type="number" min={1} value={capacity} onChange={e => setCapacity(+e.target.value)} className="input" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-stone-400">
            Preview: <span className="font-medium text-stone-600">{displayLabel}</span> · {capacity} seats
          </p>
          <button
            type="submit"
            disabled={isPending || (!customLabel.trim() && !labelSuggestion.trim())}
            className="btn-primary"
          >
            Create table
          </button>
        </div>
      </form>

      {/* Unassigned count */}
      {unassigned.length > 0 && (
        <div className="flex items-center gap-2 mb-5 p-3.5 bg-amber-50 border border-amber-100 rounded-xl">
          <span className="text-amber-500">⚠️</span>
          <p className="text-sm text-amber-700">
            <span className="font-medium">{unassigned.length} guest{unassigned.length !== 1 ? 's' : ''}</span> not yet seated
          </p>
        </div>
      )}

      {tables.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-rose-50">
          <p className="text-4xl mb-3">🪑</p>
          <p className="font-serif text-xl text-stone-700 mb-2">No tables yet</p>
          <p className="text-stone-400 text-sm">Create your first table above to start assigning guests.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map(table => (
            <TableCard key={table.id} table={table} unassigned={unassigned} />
          ))}
        </div>
      )}
    </div>
  )
}
