import mixpanel from 'mixpanel-browser'

let initialized = false

export function initMixpanel() {
  if (initialized || typeof window === 'undefined') return
  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN
  if (!token || token === 'YOUR_TOKEN_HERE') return
  mixpanel.init(token, {
    debug: process.env.NODE_ENV === 'development',
    track_pageview: false,
    persistence: 'localStorage',
  })
  initialized = true
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  try {
    initMixpanel()
    mixpanel.track(event, properties)
  } catch { /* fail silently */ }
}

export function identify(userId: string) {
  if (typeof window === 'undefined') return
  try {
    initMixpanel()
    mixpanel.identify(userId)
  } catch { /* fail silently */ }
}

export function setUserProperties(properties: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  try {
    initMixpanel()
    mixpanel.people.set(properties)
  } catch { /* fail silently */ }
}
