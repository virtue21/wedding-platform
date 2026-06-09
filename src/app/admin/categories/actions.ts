'use server'
import { revalidatePath } from 'next/cache'

// Called after any mutation so the seating page cache stays fresh
export async function revalidateAfterMutation() {
  revalidatePath('/admin/categories')
  revalidatePath('/admin/tables')
}
