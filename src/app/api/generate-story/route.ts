import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { storyText } = await req.json()
  if (!storyText?.trim()) {
    return NextResponse.json({ error: 'No story text provided' }, { status: 400 })
  }

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are helping a couple write their love story for their wedding website.
Given the following story, break it into at most 10 beautiful, concise slides.
Each slide should have a short title (max 5 words) and a body (max 2-3 sentences, warm and romantic).
Return ONLY valid JSON in this exact format, no extra text:
{"slides":[{"title":"string","body":"string"}]}

Story:
${storyText}`,
      },
    ],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  try {
    const parsed = JSON.parse(text)
    return NextResponse.json(parsed)
  } catch {
    // Try to extract JSON from the response if there's extra text
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return NextResponse.json(JSON.parse(match[0]))
      } catch { /* fall through */ }
    }
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
  }
}
