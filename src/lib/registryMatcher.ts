/**
 * Rule-based registry matching.
 *
 * Deliberately no LLM or web-search call: suggestions come from the curated
 * registry_catalog table, so cost stays flat regardless of how many couples
 * use it. The "intelligence" is the tier decision below.
 */

export type CookingFrequency = 'rarely' | 'sometimes' | 'often'
export type HouseholdSize = '1-2' | '3-4' | '5+'
export type BudgetBand = 'lean' | 'standard' | 'generous'
export type Tier = 'budget' | 'premium'

export type RegistryPreferences = {
  cooking_frequency: CookingFrequency | null
  household_size: HouseholdSize | null
  budget_band: BudgetBand | null
  owned_categories: string[]
  delivery_state: string | null
}

export type CatalogItem = {
  id: string
  category: string
  tier: Tier
  item_name: string | null
  price_low: number | null
  price_high: number | null
  retailer_url: string | null
  notes: string | null
  needs_sourcing: boolean
  sort_order: number
}

export type Suggestion = {
  catalogId: string
  category: string
  tier: Tier
  itemName: string
  priceLow: number | null
  priceHigh: number | null
  /** Vetted retailer link, or a search fallback when none is recorded yet. */
  url: string
  isSearchLink: boolean
  reason: string
}

/** Categories where heavy cooking justifies stepping up a tier. */
const COOKING_SENSITIVE = ['Cookware', 'Blender / Food Processor', 'Air Fryer']

/** Categories where a bigger household justifies stepping up a tier. */
const SIZE_SENSITIVE = ['Cookware', 'Air Fryer', 'Washing Machine']

/**
 * Decide budget vs premium for one category.
 * Budget band sets the baseline; the cooking and household hooks from the
 * catalog document can nudge it up one step, but never past the band's ceiling.
 */
export function chooseTier(category: string, prefs: RegistryPreferences): { tier: Tier; reason: string } {
  const band = prefs.budget_band ?? 'standard'

  if (band === 'generous') {
    return { tier: 'premium', reason: 'Matches your generous budget' }
  }

  if (band === 'lean') {
    // Lean budgets stay on budget tier — the point of the band is a ceiling.
    return { tier: 'budget', reason: 'Keeps within your lean budget' }
  }

  // Standard: start at budget, step up where the couple's habits justify it.
  const cooksALot = prefs.cooking_frequency === 'often'
  const bigHousehold = prefs.household_size === '5+'

  if (cooksALot && COOKING_SENSITIVE.includes(category)) {
    return { tier: 'premium', reason: 'You cook often, so this gets heavy use' }
  }
  if (bigHousehold && SIZE_SENSITIVE.includes(category)) {
    return { tier: 'premium', reason: 'Sized for a larger household' }
  }

  return { tier: 'budget', reason: 'Solid everyday pick for your budget' }
}

/** Jumia search fallback for items with no vetted link recorded yet. */
export function searchUrlFor(itemName: string): string {
  return `https://www.jumia.com.ng/catalog/?q=${encodeURIComponent(itemName)}`
}

/**
 * Build the suggestion list.
 *
 * Skips silently (never renders an empty card) when:
 *  - the couple already owns that category
 *  - the chosen tier is unsourced AND the other tier is too
 *  - a row has no item_name (nothing meaningful to show)
 */
export function buildSuggestions(catalog: CatalogItem[], prefs: RegistryPreferences): Suggestion[] {
  const byCategory: Record<string, CatalogItem[]> = {}
  for (const item of catalog) {
    (byCategory[item.category] ??= []).push(item)
  }

  const owned = new Set(prefs.owned_categories)
  const suggestions: Suggestion[] = []

  for (const [category, items] of Object.entries(byCategory)) {
    if (owned.has(category)) continue

    const { tier, reason } = chooseTier(category, prefs)

    const usable = (t: Tier) =>
      items.find(i => i.tier === t && !i.needs_sourcing && i.item_name)

    // Preferred tier, else fall back to the other so a half-sourced
    // category still contributes something useful.
    const picked = usable(tier) ?? usable(tier === 'premium' ? 'budget' : 'premium')
    if (!picked || !picked.item_name) continue

    const fellBack = picked.tier !== tier

    suggestions.push({
      catalogId: picked.id,
      category,
      tier: picked.tier,
      itemName: picked.item_name,
      priceLow: picked.price_low,
      priceHigh: picked.price_high,
      url: picked.retailer_url ?? searchUrlFor(picked.item_name),
      isSearchLink: !picked.retailer_url,
      reason: fellBack ? `Only the ${picked.tier} option is available for now` : reason,
    })
  }

  return suggestions.sort((a, b) => a.category.localeCompare(b.category))
}

/** Price to store on the registry item — midpoint of a range. */
export function representativePrice(low: number | null, high: number | null): number {
  if (low && high) return Math.round((low + high) / 2)
  return low ?? high ?? 0
}

export function formatPriceRange(low: number | null, high: number | null): string {
  if (low && high && low !== high) {
    return `₦${low.toLocaleString()} – ₦${high.toLocaleString()}`
  }
  const single = low ?? high
  return single ? `₦${single.toLocaleString()}` : 'Price varies'
}
