'use client'

import { useState, useRef, useEffect } from 'react'

type NominatimResult = {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

type Props = {
  defaultAddress?: string
  defaultLat?: number | null
  defaultLng?: number | null
}

export default function VenueSearch({ defaultAddress = '', defaultLat, defaultLng }: Props) {
  const [query, setQuery] = useState(defaultAddress)
  const [results, setResults] = useState<NominatimResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounce = useRef<NodeJS.Timeout>()
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function handleInput(value: string) {
    setQuery(value)
    clearTimeout(debounce.current)
    if (value.length < 3) { setResults([]); setOpen(false); return }

    debounce.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5&addressdetails=1`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const data: NominatimResult[] = await res.json()
        setResults(data)
        setOpen(data.length > 0)
      } finally {
        setLoading(false)
      }
    }, 400)
  }

  function select(result: NominatimResult) {
    setQuery(result.display_name)
    setOpen(false)
    setResults([])
    // Hidden inputs carry the values to the server action
    document.getElementById('venue_address_hidden')?.setAttribute('value', result.display_name)
    document.getElementById('venue_lat_hidden')?.setAttribute('value', result.lat)
    document.getElementById('venue_lng_hidden')?.setAttribute('value', result.lon)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">Venue address</label>
      {/* Hidden inputs for form submission */}
      <input type="hidden" name="venue_address" id="venue_address_hidden" defaultValue={defaultAddress} />
      <input type="hidden" name="venue_lat" id="venue_lat_hidden" defaultValue={defaultLat ?? ''} />
      <input type="hidden" name="venue_lng" id="venue_lng_hidden" defaultValue={defaultLng ?? ''} />

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={e => handleInput(e.target.value)}
          placeholder="Search for venue address…"
          className="input pr-8"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-rose-300 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-rose-100 rounded-xl shadow-lg overflow-hidden">
          {results.map(r => (
            <li key={r.place_id}>
              <button
                type="button"
                onClick={() => select(r)}
                className="w-full text-left px-4 py-2.5 text-sm text-stone-700 hover:bg-rose-50 transition-colors border-b border-rose-50 last:border-0"
              >
                <span className="text-rose-400 mr-2">📍</span>
                {r.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
