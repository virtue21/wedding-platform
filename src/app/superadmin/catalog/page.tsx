import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

const STALE_AFTER_DAYS = 90

function serviceClient() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function daysSince(date: string | null): number | null {
  if (!date) return null
  return Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000)
}

function formatRange(low: number | null, high: number | null) {
  if (low && high && low !== high) return `₦${low.toLocaleString()} – ₦${high.toLocaleString()}`
  const single = low ?? high
  return single ? `₦${single.toLocaleString()}` : '—'
}

export default async function CatalogPage() {
  const sb = serviceClient()
  const { data: rows } = await sb
    .from('registry_catalog')
    .select('*')
    .order('sort_order')
    .order('tier')

  const catalog = rows ?? []
  const needsSourcing = catalog.filter(r => r.needs_sourcing)
  const stale = catalog.filter(r => {
    if (r.needs_sourcing) return false
    const age = daysSince(r.last_verified_date)
    return age === null || age > STALE_AFTER_DAYS
  })
  const missingUrl = catalog.filter(r => !r.needs_sourcing && !r.retailer_url)

  const cards = [
    { label: 'Catalog rows', value: catalog.length, tone: 'text-white' },
    { label: 'Needs sourcing', value: needsSourcing.length, tone: 'text-amber-400' },
    { label: `Stale (>${STALE_AFTER_DAYS}d)`, value: stale.length, tone: 'text-red-400' },
    { label: 'No retailer link', value: missingUrl.length, tone: 'text-blue-400' },
  ]

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-white text-2xl font-semibold">Registry Catalog</h1>
        <p className="text-stone-400 text-sm mt-1">
          Curated items behind the registry assistant. Re-verify links and prices before they go stale on couples.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map(c => (
          <div key={c.label} className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
            <p className={`text-2xl font-bold ${c.tone}`}>{c.value}</p>
            <p className="text-stone-500 text-xs mt-0.5">{c.label}</p>
          </div>
        ))}
      </div>

      {stale.length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
          <p className="text-red-300 text-sm font-medium">
            {stale.length} {stale.length === 1 ? 'row needs' : 'rows need'} re-verification
          </p>
          <p className="text-red-300/70 text-xs mt-1">
            Prices drift and marketplace listings get relisted under new URLs. These were last checked over {STALE_AFTER_DAYS} days ago, or never.
          </p>
        </div>
      )}

      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm min-w-[820px]">
          <thead>
            <tr className="border-b border-stone-800">
              {['Category', 'Tier', 'Item', 'Price', 'Link', 'Last verified', 'Status'].map(h => (
                <th key={h} className="text-left text-stone-400 text-xs font-medium px-5 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {catalog.map(r => {
              const age = daysSince(r.last_verified_date)
              const isStale = !r.needs_sourcing && (age === null || age > STALE_AFTER_DAYS)
              return (
                <tr key={r.id} className="border-b border-stone-800/50 hover:bg-stone-800/30 transition-colors">
                  <td className="px-5 py-3.5 text-stone-300">{r.category}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      r.tier === 'premium' ? 'bg-rose-500/20 text-rose-400' : 'bg-stone-800 text-stone-400'
                    }`}>{r.tier}</span>
                  </td>
                  <td className="px-5 py-3.5 text-stone-300 max-w-xs">
                    {r.item_name ?? <span className="text-stone-600 italic">not sourced</span>}
                    {r.notes && <p className="text-stone-500 text-xs mt-0.5">{r.notes}</p>}
                  </td>
                  <td className="px-5 py-3.5 text-stone-400 whitespace-nowrap">{formatRange(r.price_low, r.price_high)}</td>
                  <td className="px-5 py-3.5">
                    {r.retailer_url ? (
                      <a href={r.retailer_url} target="_blank" rel="noopener noreferrer" className="text-rose-400 hover:text-rose-300 text-xs underline underline-offset-2">
                        Open ↗
                      </a>
                    ) : (
                      <span className="text-blue-400/70 text-xs">search only</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-stone-400 text-xs whitespace-nowrap">
                    {r.last_verified_date ? `${age}d ago` : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    {r.needs_sourcing ? (
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">Needs sourcing</span>
                    ) : isStale ? (
                      <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">Stale</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">OK</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-stone-600 text-xs">
        Rows are edited directly in Supabase for now. Set <code className="text-stone-500">last_verified_date</code> to today
        once you&apos;ve confirmed a price and link.
      </p>
    </div>
  )
}
