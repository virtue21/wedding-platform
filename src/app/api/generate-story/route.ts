import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { storyImagesEntitlement } from '@/lib/storyImages'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { storyText } = await req.json()
  if (!storyText?.trim()) {
    return NextResponse.json({ error: 'No story text provided' }, { status: 400 })
  }

  // Does this couple's plan include AI slide illustrations?
  let canGenerateImages = false
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: wedding } = await supabase
        .from('weddings').select('id').eq('user_id', user.id).single()
      if (wedding) {
        canGenerateImages = (await storyImagesEntitlement(wedding.id)).entitled
      }
    }
  } catch {
    canGenerateImages = false
  }

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `You are helping a couple write their love story for their wedding website.
Given the following story, break it into at most 10 beautiful, concise slides.
Each slide should have:
- "title": a short title (max 5 words)
- "body": 2-3 warm, romantic sentences
- "imagePrompt": a vivid one-sentence visual description of the scene for an illustrator — concrete setting, action, and mood, no names (say "the couple", "a young man", "a young woman"). Keep the two main characters visually consistent across all slides by repeating a brief consistent description of them.
Return ONLY valid JSON in this exact format, no extra text:
{"slides":[{"title":"string","body":"string","imagePrompt":"string"}]}

Story:
${storyText}`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  try {
    const parsed = JSON.parse(text)
    return NextResponse.json({ ...parsed, canGenerateImages })
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return NextResponse.json({ ...JSON.parse(match[0]), canGenerateImages })
      } catch { /* fall through */ }
    }
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }
}
