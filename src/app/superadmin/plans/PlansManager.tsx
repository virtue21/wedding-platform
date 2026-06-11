'use client'

import { useState, useTransition } from 'react'
import { togglePlan, updatePlan } from './actions'
import type { Plan } from '@/lib/supabase/database.types'

type EditState = {
  name: string
  priceDisplay: string // in ₦, user types this
  guest_cap: string
  registry_item_cap: string
  table_cap: string
  has_moments: boolean
  moments_upload_cap: string
}

function planToEdit(plan: Plan): EditState {
  return {
    name: plan.name,
    priceDisplay: String(plan.price / 100),
    guest_cap: plan.guest_cap != null ? String(plan.guest_cap) : '',
    registry_item_cap: plan.registry_item_cap != null ? String(plan.registry_item_cap) : '',
    table_cap: plan.table_cap != null ? String(plan.table_cap) : '',
    has_moments: plan.has_moments,
    moments_upload_cap: plan.moments_upload_cap != null ? String(plan.moments_upload_cap) : '',
  }
}

function PlanCard({ plan }: { plan: Plan }) {
  const [isPending, startTransition] = useTransition()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<EditState>(planToEdit(plan))
  const [saving, setSaving] = useState(false)

  function handleField(key: keyof EditState, value: string | boolean) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    await updatePlan(plan.id, {
      name: form.name,
      price: Math.round(parseFloat(form.priceDisplay || '0') * 100),
      guest_cap: form.guest_cap ? parseInt(form.guest_cap) : null,
      registry_item_cap: form.registry_item_cap ? parseInt(form.registry_item_cap) : null,
      table_cap: form.table_cap ? parseInt(form.table_cap) : null,
      has_moments: form.has_moments,
      moments_upload_cap: form.moments_upload_cap ? parseInt(form.moments_upload_cap) : null,
    })
    setSaving(false)
    setEditing(false)
  }

  function handleToggle() {
    startTransition(() => {
      togglePlan(plan.id, !plan.is_active)
    })
  }

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="font-serif text-xl text-stone-800">{plan.name}</h3>
          <p className="text-sm text-stone-400">₦{(plan.price / 100).toLocaleString('en-NG')}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
            plan.is_active
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
              : 'bg-stone-100 text-stone-400 border-stone-200'
          }`}>
            {plan.is_active ? 'Active' : 'Disabled'}
          </span>
          <button
            onClick={handleToggle}
            disabled={isPending}
            className={`relative w-10 h-5 rounded-full transition-colors disabled:opacity-50 ${plan.is_active ? 'bg-emerald-400' : 'bg-stone-200'}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${plan.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {editing ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-stone-400 mb-1">Name</label>
              <input
                value={form.name}
                onChange={e => handleField('name', e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-400 mb-1">Price (₦)</label>
              <input
                type="number"
                value={form.priceDisplay}
                onChange={e => handleField('priceDisplay', e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-400 mb-1">Guest Cap (blank = unlimited)</label>
              <input
                type="number"
                value={form.guest_cap}
                onChange={e => handleField('guest_cap', e.target.value)}
                placeholder="Unlimited"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-400 mb-1">Registry Item Cap</label>
              <input
                type="number"
                value={form.registry_item_cap}
                onChange={e => handleField('registry_item_cap', e.target.value)}
                placeholder="Unlimited"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-400 mb-1">Table Cap</label>
              <input
                type="number"
                value={form.table_cap}
                onChange={e => handleField('table_cap', e.target.value)}
                placeholder="Unlimited"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-400 mb-1">Moments Upload Cap</label>
              <input
                type="number"
                value={form.moments_upload_cap}
                onChange={e => handleField('moments_upload_cap', e.target.value)}
                placeholder="Unlimited"
                disabled={!form.has_moments}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 disabled:opacity-40"
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-stone-600 cursor-pointer">
            <input
              type="checkbox"
              checked={form.has_moments}
              onChange={e => handleField('has_moments', e.target.checked)}
              className="rounded"
            />
            Has Moments wall
          </label>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium rounded-xl disabled:opacity-50 transition-colors"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button
              onClick={() => { setEditing(false); setForm(planToEdit(plan)) }}
              className="px-4 py-2 border border-stone-200 text-stone-500 text-sm font-medium rounded-xl hover:bg-stone-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-1.5 text-sm text-stone-500">
          <p>Guests: {plan.guest_cap ?? 'Unlimited'}</p>
          <p>Registry items: {plan.registry_item_cap ?? 'Unlimited'}</p>
          <p>Tables: {plan.table_cap ?? 'Unlimited'}</p>
          <p>Moments: {plan.has_moments ? (plan.moments_upload_cap ? `${plan.moments_upload_cap} uploads` : 'Unlimited uploads') : 'No'}</p>
          <button
            onClick={() => setEditing(true)}
            className="mt-3 px-4 py-1.5 border border-stone-200 text-stone-500 text-xs font-medium rounded-lg hover:bg-stone-50 transition-colors"
          >
            Edit
          </button>
        </div>
      )}
    </div>
  )
}

export default function PlansManager({ plans }: { plans: Plan[] }) {
  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {plans.map(plan => (
        <PlanCard key={plan.id} plan={plan} />
      ))}
    </div>
  )
}
