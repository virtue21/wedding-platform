'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WeddingNote } from '@/lib/supabase/database.types'

type Props = {
  weddingId: string
  initialNotes: WeddingNote[]
}

export default function NotesSection({ weddingId, initialNotes }: Props) {
  const [notes, setNotes] = useState<WeddingNote[]>(initialNotes)
  const [authorName, setAuthorName] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!authorName.trim() || !message.trim()) {
      setError('Please enter your name and message.')
      return
    }
    setSubmitting(true)
    setError('')
    const sb = createClient()
    const { error: insertError } = await sb
      .from('wedding_notes')
      .insert({ wedding_id: weddingId, author_name: authorName.trim(), message: message.trim() })
    if (insertError) {
      setError('Failed to post. Try again.')
      setSubmitting(false)
      return
    }
    const { data } = await sb
      .from('wedding_notes')
      .select('*')
      .eq('wedding_id', weddingId)
      .order('created_at', { ascending: false })
      .limit(50)
    setNotes(data ?? [])
    setAuthorName('')
    setMessage('')
    setSubmitting(false)
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      <div>
        <h2 className="font-serif text-2xl text-stone-800 mb-1">Wishes & Messages</h2>
        <p className="text-stone-400 text-sm">Leave a heartfelt message for the couple. Everyone can read them.</p>
      </div>

      {/* Write form */}
      <div className="bg-white rounded-2xl border border-rose-50 shadow-sm p-5 space-y-3">
        <input
          name="author"
          value={authorName}
          onChange={e => setAuthorName(e.target.value)}
          placeholder="Your name"
          className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
        />
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Write your wishes here..."
          rows={3}
          className="w-full px-4 py-3 border border-stone-200 rounded-xl text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-200 resize-none"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          {submitting ? 'Sending…' : 'Send with Love 💌'}
        </button>
      </div>

      {/* Notes list */}
      {notes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-3xl mb-2">💌</p>
          <p className="font-serif text-lg text-stone-600">Be the first to write a wish</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map(note => (
            <div key={note.id} className="bg-white rounded-2xl border border-rose-50 p-5">
              <p className="font-serif text-stone-800 italic leading-relaxed mb-3">&quot;{note.message}&quot;</p>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-stone-600">— {note.author_name}</p>
                <p className="text-xs text-stone-300">
                  {new Date(note.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
