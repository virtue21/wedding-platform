'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import type { WeddingRow } from '@/lib/supabase/database.types'
import { track } from '@/lib/mixpanel'

const TOAST_MS = 7000

/* ── line icons (replacing emoji) ─────────────────────────────────── */
const stroke = { fill: 'none', stroke: '#fb7185', strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

function CalendarIcon() {
  return <svg width="18" height="18" viewBox="0 0 20 20" {...stroke} style={{ marginTop: 2, flex: 'none' }}>
    <rect x="2.5" y="4" width="15" height="13.5" rx="3" /><path d="M2.5 8h15M6.5 2.5v3M13.5 2.5v3" />
  </svg>
}
function PinIcon() {
  return <svg width="18" height="18" viewBox="0 0 20 20" {...stroke} style={{ marginTop: 2, flex: 'none' }}>
    <path d="M10 17.5s6-4.9 6-9.1A6 6 0 004 8.4c0 4.2 6 9.1 6 9.1z" /><circle cx="10" cy="8.2" r="2.2" />
  </svg>
}
function StarIcon() {
  return <svg width="18" height="18" viewBox="0 0 20 20" {...stroke} style={{ marginTop: 2, flex: 'none' }}>
    <path d="M10 2.8l2 3.2 3.6.9-2.4 2.9.2 3.7L10 12.2l-3.4 1.3.2-3.7L4.4 6.9 8 6z" />
  </svg>
}
function CheckIcon() {
  return <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="#10b981" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flex: 'none' }}>
    <circle cx="10" cy="10" r="8" /><path d="M6.5 10.2l2.4 2.3 4.6-4.8" />
  </svg>
}

type Props = {
  wedding: WeddingRow
  brideName: string
  groomName: string
  formattedDate: string
  directionsUrl: string | null
  slug: string
  registryRemaining: number
  /** Set once this guest has RSVP'd, from their guest cookie. */
  confirmed: boolean
  /** True only on the redirect immediately after submitting — fires the
      completion event once, never on a later return visit. */
  justRsvpd?: boolean
}

function daysAway(dateStr: string): string | null {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const day = new Date(dateStr + 'T00:00:00')
  const diff = Math.round((day.getTime() - today.getTime()) / 86_400_000)
  if (diff > 1) return `${diff} days away`
  if (diff === 1) return 'Tomorrow'
  if (diff === 0) return 'Today'
  return null
}

function formatDeadline(d: string | null): string | null {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString('en-NG', { day: 'numeric', month: 'long' })
}

const ghostBtn: React.CSSProperties = {
  padding: '8px 14px', background: '#fff', color: '#57534e',
  fontSize: 13, fontWeight: 500, border: '1px solid #e7e5e4',
  borderRadius: 12, cursor: 'pointer', textDecoration: 'none',
  display: 'inline-block', transition: 'color .15s, border-color .15s',
}
const rowLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: '#a8a29e',
}
const rowValue: React.CSSProperties = {
  fontSize: 15, fontWeight: 600, lineHeight: 1.4, color: '#1c1917',
}

export default function GuestHome({
  wedding, brideName, groomName, formattedDate, directionsUrl,
  slug, registryRemaining, confirmed, justRsvpd = false,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  // justRsvpd (the one-time ?rsvp=1 flag) is the only thing that should
  // ever show this toast — confirmed is the guest's persistent cookie
  // state and stays true on every future visit, which used to re-fire the
  // "we've let them know" toast on every refresh or page change.
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    if (!justRsvpd) return
    track('rsvp_completed', { wedding_slug: slug })
    // Drop ?rsvp=1 so a refresh or share of this URL doesn't re-fire it.
    router.replace(pathname)
  }, [justRsvpd, slug, pathname, router])

  useEffect(() => {
    if (!(justRsvpd && confirmed && wedding.rsvp_enabled)) return
    setShowToast(true)
    const t = setTimeout(() => setShowToast(false), TOAST_MS)
    return () => clearTimeout(t)
  }, [justRsvpd, confirmed, wedding.rsvp_enabled])

  const countdown = daysAway(wedding.wedding_date)
  const deadline = formatDeadline(wedding.rsvp_deadline)

  const ceremony = wedding.ceremony_time
    ? wedding.doors_time
      ? `${wedding.ceremony_time}, doors at ${wedding.doors_time}`
      : wedding.ceremony_time
    : null

  const hasDetails = ceremony || wedding.venue_name || wedding.venue_address || wedding.dress_code

  return (
    <div className="max-w-lg mx-auto">

      {/* Cover — full bleed, fading into the ivory ground so the names
          land on a clean plate regardless of the photo */}
      <div style={{ position: 'relative', minHeight: 380, background: '#fff1f2' }}>
        {wedding.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={wedding.cover_image_url}
            alt={`${brideName} & ${groomName}`}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(28,25,23,0.42) 0%, rgba(28,25,23,0.08) 32%, rgba(28,25,23,0.30) 62%, rgba(253,248,244,0.96) 100%)',
        }} />
        <div style={{
          position: 'relative', minHeight: 380, padding: '0 24px 22px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'flex-end', gap: 12, textAlign: 'center',
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#e11d48' }}>
            You&apos;re invited
          </div>
          <h1 className="font-serif" style={{ fontSize: 44, fontWeight: 600, lineHeight: 1.05, letterSpacing: '-0.02em', color: '#1c1917' }}>
            {brideName} <span style={{ color: '#e11d48' }}>&amp;</span> {groomName}
          </h1>
          <div className="font-serif" style={{ fontSize: 20, fontWeight: 500, lineHeight: 1.3, color: '#57534e' }}>
            {formattedDate}
          </div>
          {countdown && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: '#fff', border: '1px solid #fce7f3', borderRadius: 99 }}>
              <span style={{ width: 6, height: 6, borderRadius: 99, background: '#e11d48' }} />
              <span style={{ fontSize: 12, fontWeight: 500, color: '#57534e', fontVariantNumeric: 'tabular-nums' }}>{countdown}</span>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation toast — auto-dismisses after 7s, dismissible early.
          A permanent banner would repeat "we told them" on every future
          visit; the button below (Change your response) already carries
          the confirmed state without needing to stay on screen. */}
      {confirmed && wedding.rsvp_enabled && (
        <div
          role="status"
          style={{
            position: 'fixed', left: 16, right: 16, bottom: showToast ? 16 : -100,
            zIndex: 50, maxWidth: 460, margin: '0 auto',
            display: 'flex', gap: 12, alignItems: 'flex-start', padding: 16,
            borderRadius: 16, background: '#ecfdf5', border: '1px solid #a7f3d0',
            boxShadow: '0 8px 24px rgba(16,185,129,0.18)',
            transition: 'bottom .35s ease, opacity .35s ease',
            opacity: showToast ? 1 : 0,
            pointerEvents: showToast ? 'auto' : 'none',
          }}
        >
          <CheckIcon />
          <div style={{ fontSize: 12, lineHeight: 1.5, color: '#047857', flex: 1 }}>
            We&apos;ve let {brideName} and {groomName} know.
            {deadline && <> You can change this until {deadline}.</>}
          </div>
          <button
            type="button"
            onClick={() => setShowToast(false)}
            aria-label="Dismiss"
            style={{ background: 'none', border: 'none', color: '#047857', opacity: 0.6, cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 2 }}
          >
            ×
          </button>
        </div>
      )}

      <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Details */}
        {hasDetails && (
          <div style={{ background: '#fff', border: '1px solid #fce7f3', borderRadius: 24, boxShadow: '0 1px 2px rgba(254,205,211,0.5)', padding: '4px 20px' }}>
            {ceremony && (
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '18px 0', borderBottom: '1px solid #f5f5f4' }}>
                <CalendarIcon />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={rowLabel}>Ceremony</div>
                  <div style={rowValue}>{ceremony}</div>
                </div>
              </div>
            )}

            {(wedding.venue_name || wedding.venue_address) && (
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '18px 0', borderBottom: wedding.dress_code ? '1px solid #f5f5f4' : 'none' }}>
                <PinIcon />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
                  <div style={rowLabel}>Venue</div>
                  {wedding.venue_name && <div style={rowValue}>{wedding.venue_name}</div>}
                  {wedding.venue_address && (
                    <div style={{ fontSize: 13, lineHeight: 1.5, color: '#57534e' }}>{wedding.venue_address}</div>
                  )}
                  <div style={{ display: 'flex', gap: 8, paddingTop: 8, flexWrap: 'wrap' }}>
                    {directionsUrl && (
                      <a href={directionsUrl} target="_blank" rel="noopener noreferrer" style={ghostBtn}>Open in Maps</a>
                    )}
                    <a href={`/api/calendar/${wedding.id}`} style={ghostBtn}>Add to calendar</a>
                  </div>
                </div>
              </div>
            )}

            {wedding.dress_code && (
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '18px 0' }}>
                <StarIcon />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={rowLabel}>Dress code</div>
                  <div style={rowValue}>{wedding.dress_code}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* The one rose action on the screen */}
        {wedding.rsvp_enabled && (
          confirmed ? (
            <a href={`/${slug}/rsvp`} style={{ ...ghostBtn, width: '100%', padding: '15px 20px', fontSize: 15, textAlign: 'center' }}>
              Change your response
            </a>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a
                href={`/${slug}/rsvp`}
                style={{
                  width: '100%', padding: '15px 20px', background: '#e11d48', color: '#fff',
                  fontSize: 15, fontWeight: 600, border: 'none', borderRadius: 12,
                  textAlign: 'center', textDecoration: 'none', display: 'block',
                }}
              >
                Confirm your attendance
              </a>
              {deadline && (
                <div style={{ textAlign: 'center', fontSize: 12, color: '#a8a29e' }}>Please reply by {deadline}</div>
              )}
            </div>
          )
        )}

        {/* Registry */}
        <div style={{ background: '#fff', border: '1px solid #fce7f3', borderRadius: 24, boxShadow: '0 1px 2px rgba(254,205,211,0.5)', padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
            <div className="font-serif" style={{ fontSize: 20, fontWeight: 600, lineHeight: 1.25, color: '#1c1917' }}>Gift registry</div>
            {registryRemaining > 0 && (
              <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: '#f5f5f4', color: '#57534e', whiteSpace: 'nowrap' }}>
                {registryRemaining} left
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: '#57534e' }}>
            Claimed gifts are held for 48 hours, and nobody else sees what you picked.
          </div>
          <Link href={`/${slug}/registry`} style={{ ...ghostBtn, alignSelf: 'flex-start', padding: '10px 18px', fontSize: 14 }}>
            Browse the registry
          </Link>
        </div>

        {/* Follow the couple */}
        {(wedding.bride_instagram || wedding.groom_instagram) && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '8px 0 4px' }}>
            <div style={rowLabel}>Follow the couple</div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
              {wedding.bride_instagram && (
                <a href={`https://instagram.com/${wedding.bride_instagram}`} target="_blank" rel="noopener noreferrer"
                   style={{ fontSize: 13, fontWeight: 500, color: '#fb7185', textDecoration: 'none' }}>
                  @{wedding.bride_instagram}
                </a>
              )}
              {wedding.groom_instagram && (
                <a href={`https://instagram.com/${wedding.groom_instagram}`} target="_blank" rel="noopener noreferrer"
                   style={{ fontSize: 13, fontWeight: 500, color: '#fb7185', textDecoration: 'none' }}>
                  @{wedding.groom_instagram}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', padding: '12px 0 4px', borderTop: '1px solid #f0eae5' }}>
          <div className="font-serif" style={{ fontSize: 14, color: '#57534e' }}>
            Made with <a href="https://nemiplanner.xyz" style={{ color: '#e11d48', textDecoration: 'none' }}>NemiPlanner</a>
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.6, color: '#a8a29e', paddingTop: 4 }}>
            Plan your own wedding — nemiplanner.xyz
          </div>
        </div>
      </div>
    </div>
  )
}
