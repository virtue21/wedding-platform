import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { storyImagesEntitlement } from '@/lib/storyImages'

const STYLE_WRAPPER =
  'Warm, romantic storybook cartoon illustration in soft watercolor style, gentle rose and cream palette, ' +
  'no text or lettering anywhere in the image. Scene: '

export const maxDuration = 60

export async function POST(req: NextRequest) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({ error: 'images_not_configured' }, { status: 501 })
  }

  // Must be a logged-in couple
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { data: wedding } = await supabase
    .from('weddings').select('id').eq('user_id', user.id).single()
  if (!wedding) return NextResponse.json({ error: 'no_wedding' }, { status: 404 })

  // Grand/Prestige only (server-side, can't be bypassed)
  const { entitled } = await storyImagesEntitlement(wedding.id)
  if (!entitled) return NextResponse.json({ error: 'not_on_plan' }, { status: 403 })

  let imagePrompt: string | undefined
  let slideIndex: number | undefined
  try {
    ({ imagePrompt, slideIndex } = await req.json())
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }
  if (!imagePrompt?.trim()) {
    return NextResponse.json({ error: 'missing_prompt' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: STYLE_WRAPPER + imagePrompt.trim() }] }],
        }),
      }
    )
    const data = await res.json()
    if (!res.ok) {
      console.error('[story-image] Gemini error:', JSON.stringify(data).slice(0, 500))
      return NextResponse.json({ error: 'generation_failed' }, { status: 502 })
    }

    type Part = { inlineData?: { mimeType?: string; data?: string } }
    const parts: Part[] = data?.candidates?.[0]?.content?.parts ?? []
    const img = parts.find(p => p.inlineData?.data)?.inlineData
    if (!img?.data) {
      console.error('[story-image] no image in response:', JSON.stringify(data).slice(0, 500))
      return NextResponse.json({ error: 'no_image_returned' }, { status: 502 })
    }

    const ext = img.mimeType?.includes('png') ? 'png' : 'jpg'
    const path = `${wedding.id}/ai-slide-${slideIndex ?? 0}-${Date.now()}.${ext}`
    const bytes = Buffer.from(img.data, 'base64')

    const sb = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { error: uploadError } = await sb.storage
      .from('story-images')
      .upload(path, bytes, { contentType: img.mimeType ?? 'image/jpeg' })
    if (uploadError) {
      console.error('[story-image] storage upload failed:', uploadError.message)
      return NextResponse.json({ error: 'storage_failed' }, { status: 500 })
    }

    const { data: { publicUrl } } = sb.storage.from('story-images').getPublicUrl(path)
    return NextResponse.json({ imageUrl: publicUrl })
  } catch (err) {
    console.error('[story-image] failed:', err)
    return NextResponse.json({ error: 'generation_failed' }, { status: 500 })
  }
}
