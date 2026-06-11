import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PlansManager from './PlansManager'
import type { Plan } from '@/lib/supabase/database.types'

export default async function SuperadminPlansPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  if (user.email !== process.env.SUPERADMIN_EMAIL) {
    redirect('/admin')
  }

  const { data: plans } = await supabase
    .from('plans')
    .select('*')
    .order('sort_order')

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-stone-800 mb-1">Plans Management</h1>
        <p className="text-stone-400 text-sm">Enable/disable plans and edit their limits. Changes take effect immediately.</p>
      </div>
      <PlansManager plans={(plans ?? []) as Plan[]} />
    </div>
  )
}
