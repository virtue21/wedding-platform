'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  buildSuggestions,
  representativePrice,
  type CatalogItem,
  type RegistryPreferences,
  type Suggestion,
} from '@/lib/registryMatcher'

async function currentWedding() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { supabase, wedding: null }
  const { data: wedding } = await supabase
    .from('weddings').select('id').eq('user_id', user.id).single()
  return { supabase, wedding }
}

export async function saveRegistryPreferences(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const { supabase, wedding } = await currentWedding()
  if (!wedding) return { ok: false, error: 'Set up your wedding first.' }

  const prefs = {
    wedding_id: wedding.id,
    cooking_frequency: (formData.get('cooking_frequency') as string) || null,
    household_size: (formData.get('household_size') as string) || null,
    budget_band: (formData.get('budget_band') as string) || null,
    owned_categories: formData.getAll('owned_categories') as string[],
    delivery_state: (formData.get('delivery_state') as string) || null,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('wedding_registry_preferences')
    .upsert(prefs, { onConflict: 'wedding_id' })

  if (error) {
    console.error('[registry prefs] save failed:', error.message)
    return { ok: false, error: 'Could not save your preferences. Please try again.' }
  }

  revalidatePath('/admin/registry')
  return { ok: true }
}

export async function getSuggestions(): Promise<{ suggestions: Suggestion[]; error?: string }> {
  const { supabase, wedding } = await currentWedding()
  if (!wedding) return { suggestions: [], error: 'Set up your wedding first.' }

  const [{ data: prefs }, { data: catalog }, { data: existing }] = await Promise.all([
    supabase.from('wedding_registry_preferences').select('*').eq('wedding_id', wedding.id).maybeSingle(),
    supabase.from('registry_catalog').select('*').eq('is_active', true).order('sort_order'),
    supabase.from('registry_items').select('name').eq('wedding_id', wedding.id),
  ])

  const preferences: RegistryPreferences = {
    cooking_frequency: prefs?.cooking_frequency ?? null,
    household_size: prefs?.household_size ?? null,
    budget_band: prefs?.budget_band ?? null,
    owned_categories: prefs?.owned_categories ?? [],
    delivery_state: prefs?.delivery_state ?? null,
  }

  let suggestions = buildSuggestions((catalog ?? []) as CatalogItem[], preferences)

  // Don't re-suggest something already on their registry.
  const existingNames = new Set((existing ?? []).map(i => i.name.toLowerCase().trim()))
  suggestions = suggestions.filter(s => !existingNames.has(s.itemName.toLowerCase().trim()))

  return { suggestions }
}

/** Adds only the items the couple confirmed on the review screen. */
export async function acceptSuggestions(
  accepted: { itemName: string; category: string; priceLow: number | null; priceHigh: number | null; url: string; imageUrl?: string | null; notes?: string }[]
): Promise<{ ok: boolean; added: number; error?: string }> {
  const { supabase, wedding } = await currentWedding()
  if (!wedding) return { ok: false, added: 0, error: 'Set up your wedding first.' }
  if (accepted.length === 0) return { ok: true, added: 0 }

  const { data: last } = await supabase
    .from('registry_items')
    .select('sort_order')
    .eq('wedding_id', wedding.id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()

  let sortOrder = (last?.sort_order ?? -1) + 1

  const rows = accepted.map(s => ({
    wedding_id: wedding.id,
    name: s.itemName,
    description: s.notes ?? s.category,
    price: representativePrice(s.priceLow, s.priceHigh),
    currency: 'NGN',
    checkout_link: s.url,
    image_url: s.imageUrl ?? null,
    quantity_needed: 1,
    sort_order: sortOrder++,
  }))

  const { error } = await supabase.from('registry_items').insert(rows)
  if (error) {
    console.error('[registry suggestions] insert failed:', error.message)
    return { ok: false, added: 0, error: 'Could not add these items. Please try again.' }
  }

  revalidatePath('/admin/registry')
  return { ok: true, added: rows.length }
}
