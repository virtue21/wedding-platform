import { redirect } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import { saveWeddingSetup } from './actions'
import { slugify } from '@/lib/slugify'
import SlugField from './SlugField'
import QRDownload from './QRDownload'
import VenueSearch from '@/components/VenueSearch'
import PaymentMethodsSection from './PaymentMethodsSection'
import CoverImageUpload from './CoverImageUpload'
import type { Database } from '@/lib/supabase/database.types'

type WeddingRow = Database['public']['Tables']['weddings']['Row']
type ProfileRow = Database['public']['Tables']['user_profiles']['Row']

export default async function SetupPage({
  searchParams,
}: {
  searchParams: { error?: string; saved?: string }
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [profileResult, weddingResult] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    supabase.from('weddings').select('*').eq('user_id', user.id).single(),
  ])
  const paymentMethodsResult = weddingResult.data
    ? await supabase.from('wedding_payment_methods')
        .select('*').eq('wedding_id', weddingResult.data.id).order('created_at')
    : { data: [] }
  const profile        = profileResult.data as ProfileRow | null
  const wedding        = weddingResult.data as WeddingRow | null
  const paymentMethods = (paymentMethodsResult.data ?? []) as import('@/lib/supabase/database.types').WeddingPaymentMethod[]

  const defaultSlug = wedding?.slug ?? slugify(profile?.bride_name ?? '', profile?.groom_name ?? '')
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'
  const guestUrl = `${baseUrl}/${defaultSlug}`

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <header className="bg-white border-b border-rose-50">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-serif text-stone-800 text-base">💍 Wedding Setup</span>
          <a href="/admin/guests" className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
            Dashboard →
          </a>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {searchParams.error && (
          <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700">
            {searchParams.error}
          </div>
        )}
        {searchParams.saved && (
          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm text-emerald-700">
            Changes saved successfully.
          </div>
        )}

        {/* Wedding Details */}
        <section className="card">
          <h2 className="heading-serif text-lg mb-6">Wedding details</h2>
          <form action={saveWeddingSetup} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">
                  Bride&apos;s name <span className="text-rose-400">*</span>
                </label>
                <input name="bride_name" type="text" required defaultValue={profile?.bride_name ?? ''} className="input" />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">
                  Groom&apos;s name <span className="text-rose-400">*</span>
                </label>
                <input name="groom_name" type="text" required defaultValue={profile?.groom_name ?? ''} className="input" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">
                  Wedding date <span className="text-rose-400">*</span>
                </label>
                <input
                  name="wedding_date"
                  type="date"
                  required
                  defaultValue={wedding?.wedding_date ?? ''}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">
                  Venue name <span className="text-rose-400">*</span>
                </label>
                <input name="venue_name" type="text" required defaultValue={wedding?.venue_name ?? ''} placeholder="Eko Hotel, Lagos" className="input" />
              </div>
            </div>

            {/* Venue address with map autocomplete */}
            <VenueSearch
              defaultAddress={wedding?.venue_address ?? ''}
              defaultLat={wedding?.venue_lat ?? undefined}
              defaultLng={wedding?.venue_lng ?? undefined}
              defaultState={wedding?.venue_state ?? ''}
            />

            <SlugField defaultValue={defaultSlug} />


            <div className="pt-1">
              <button type="submit" className="btn-primary">
                Save changes
              </button>
            </div>
          </form>
        </section>

        {/* Payment Methods */}
        <section className="card">
          <h2 className="heading-serif text-lg mb-1">Payment methods for cash gifts</h2>
          <p className="text-sm text-stone-400 mb-5">
            Add one account per currency. Guests will be able to choose which one to use when sending a cash gift.
          </p>
          <PaymentMethodsSection
            weddingId={wedding?.id ?? null}
            initialMethods={paymentMethods}
          />
        </section>

        {/* Cover Image */}
        <section className="card">
          <h2 className="heading-serif text-lg mb-1">Cover image</h2>
          <p className="text-sm text-stone-400 mb-5">Shown as the banner on your wedding page</p>

          {wedding?.cover_image_url && (
            <div className="mb-4 rounded-xl overflow-hidden border border-rose-50 aspect-[3/1] relative">
              <Image src={wedding.cover_image_url} alt="Cover" fill className="object-cover" />
            </div>
          )}

          <CoverImageUpload />
        </section>

        {/* QR Code */}
        {wedding?.slug && (
          <section className="card">
            <h2 className="heading-serif text-lg mb-1">Your QR code</h2>
            <p className="text-sm text-stone-400 mb-5">
              Guests scan this to reach your wedding page at{' '}
              <a href={guestUrl} target="_blank" className="text-rose-500 underline underline-offset-2">
                {guestUrl}
              </a>
            </p>
            <QRDownload url={guestUrl} />
          </section>
        )}
      </main>
    </div>
  )
}
