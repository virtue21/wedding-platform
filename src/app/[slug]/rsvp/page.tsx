import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { submitRsvp } from './actions'
import PhoneInput from './PhoneInput'
import SideAndCategory from './SideAndCategory'
import type { WeddingRow, RelationshipCategory } from '@/lib/supabase/database.types'

export default async function RsvpPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { error?: string }
}) {
  const supabase = createClient()

  const { data: wedding } = await supabase
    .from('weddings').select('*').eq('slug', params.slug).single() as { data: WeddingRow | null }

  if (!wedding) notFound()

  const { data: profile } = await supabase
    .from('user_profiles').select('bride_name, groom_name').eq('id', wedding.user_id).single()

  const brideName = profile?.bride_name ?? 'Bride'
  const groomName = profile?.groom_name ?? 'Groom'

  const { data: categories } = await supabase
    .from('relationship_categories')
    .select('*')
    .eq('wedding_id', wedding.id)
    .order('sort_order') as { data: RelationshipCategory[] | null }

  const brideCategories = (categories ?? []).filter(c => c.side === 'bride')
  const groomCategories = (categories ?? []).filter(c => c.side === 'groom')
  const action = submitRsvp.bind(null, params.slug)

  return (
    <div className="min-h-screen bg-[#fdf8f4]">
      <div className="max-w-lg mx-auto px-5 py-10">
        <Link href={`/${params.slug}`} className="inline-flex items-center gap-1.5 text-sm text-stone-400 hover:text-rose-400 transition-colors mb-8">
          ← Back
        </Link>

        <div className="text-center mb-8">
          <p className="text-rose-400 text-xs tracking-widest uppercase mb-2">RSVP</p>
          <h1 className="font-serif text-3xl text-stone-800">
            {brideName} <span className="text-rose-400">&</span> {groomName}
          </h1>
          <p className="text-stone-400 text-sm mt-1">We&apos;d love to have you there</p>
        </div>

        {searchParams.error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
            {searchParams.error}
          </div>
        )}

        <div className="bg-white rounded-3xl border border-rose-50 shadow-sm p-7">
          <form action={action} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Full name *</label>
              <input name="full_name" type="text" required placeholder="Emeka Obi" className="input" />
            </div>

            <PhoneInput />

            <div>
              <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">
                Email address
              </label>
              <input name="email" type="email" placeholder="emeka@example.com" className="input" />
            </div>

            <SideAndCategory brideCategories={brideCategories} groomCategories={groomCategories} />

            <button type="submit" className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-2xl transition-colors shadow-sm shadow-rose-200 mt-2">
              Confirm Attendance
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
