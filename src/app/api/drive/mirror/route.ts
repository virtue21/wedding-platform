import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createFolder, shareWithEmail, uploadFromUrl } from '@/lib/googleDrive'

/**
 * Mirrors a guest-uploaded photo into the wedding's Google Drive folder.
 * Creates + shares the folder (with the couple's login email) on first use.
 * Fire-and-forget from the client — failures never affect the Supabase upload.
 */
export async function POST(req: NextRequest) {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    return NextResponse.json({ ok: false, error: 'drive_not_configured' }, { status: 501 })
  }

  let photoId: string | undefined
  try {
    ({ photoId } = await req.json())
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_request' }, { status: 400 })
  }
  if (!photoId) return NextResponse.json({ ok: false, error: 'missing_photo_id' }, { status: 400 })

  const sb = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    const { data: photo } = await sb
      .from('wedding_photos')
      .select('id, wedding_id, photo_url, uploader_name, created_at')
      .eq('id', photoId)
      .single()
    if (!photo) return NextResponse.json({ ok: false, error: 'photo_not_found' }, { status: 404 })

    const { data: wedding } = await sb
      .from('weddings')
      .select('id, slug, user_id, drive_folder_id, drive_folder_url')
      .eq('id', photo.wedding_id)
      .single()
    if (!wedding) return NextResponse.json({ ok: false, error: 'wedding_not_found' }, { status: 404 })

    // Ensure the wedding has a Drive folder, shared with the couple
    let folderId: string | null = wedding.drive_folder_id
    if (!folderId) {
      const { data: profile } = await sb
        .from('user_profiles')
        .select('bride_name, groom_name')
        .eq('id', wedding.user_id)
        .single()
      const coupleName = profile ? `${profile.bride_name} & ${profile.groom_name}` : wedding.slug

      const folder = await createFolder(`${coupleName} — Wedding Moments (NemiPlanner)`)
      folderId = folder.id

      const authResult = await sb.auth.admin.getUserById(wedding.user_id)
      const email = authResult.data?.user?.email
      if (email) {
        try {
          await shareWithEmail(folder.id, email)
        } catch (err) {
          console.error('[drive] share failed (folder still created):', err)
        }
      }

      await sb
        .from('weddings')
        .update({ drive_folder_id: folder.id, drive_folder_url: folder.url })
        .eq('id', wedding.id)
    }

    const ext = (photo.photo_url.split('.').pop() ?? 'jpg').split('?')[0]
    const stamp = new Date(photo.created_at).toISOString().replace(/[:.]/g, '-')
    const by = photo.uploader_name ? `-${photo.uploader_name.replace(/[^\w-]/g, '_')}` : ''
    await uploadFromUrl(photo.photo_url, `${stamp}${by}.${ext}`, folderId!)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[drive] mirror failed:', err)
    return NextResponse.json({ ok: false, error: 'mirror_failed' }, { status: 500 })
  }
}
