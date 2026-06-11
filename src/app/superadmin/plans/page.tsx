import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import type { Plan } from '@/lib/supabase/database.types'
import PlansManager from './PlansManager'

function serviceClient() {
  return createServiceClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export default async function SuperadminPlansPage() {
  const sb = serviceClient()
  const { data: plans } = await sb
    .from('plans')
    .select('*')
    .order('sort_order')

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-white text-2xl font-semibold">Plans</h1>
        <p className="text-stone-400 text-sm mt-1">Enable/disable plans and edit limits. Changes take effect immediately.</p>
      </div>
      <PlansManager plans={(plans ?? []) as Plan[]} />
    </div>
  )
}
