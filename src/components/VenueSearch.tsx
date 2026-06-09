'use client'

import { useState, useRef, useEffect } from 'react'

type NominatimResult = {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

const NIGERIA_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT — Abuja','Gombe',
  'Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos',
  'Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto',
  'Taraba','Yobe','Zamfara',
]

type Props = {
  defaultAddress?: string
  defaultLat?: number | null
  defaultLng?: number | null
  defaultState?: string
}

export default function VenueSearch({ defaultAddress = '', defaultLat, defaultLng, defaultState = '' }: Props) {
  const [query, setQuery] = useState(defaultAddress)
  const [state, setState] = useState(defaultState)
  const [results, setResults] = useState<NominatimResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounce = useRef<NodeJS.Timeout>()
  const wrapperRef = useRef<HTMLDivElement>(null)

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
        const stateClause = state === 'FCT — Abuja'
          ? ', Abuja, Nigeria'
          : state
          ? `, ${state} State, Nigeria`
          : ', Nigeria'
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value + stateClause)}&format=json&limit=6&addressdetails=1&countrycodes=ng`,
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
    document.getElementById('venue_address_hidden')?.setAttribute('value', result.display_name)
    document.getElementById('venue_lat_hidden')?.setAttribute('value', result.lat)
    document.getElementById('venue_lng_hidden')?.setAttribute('value', result.lon)
  }

  return (
    <div ref={wrapperRef} className="space-y-3">

      {/* Country + State — side by side */}
      <div className="grid grid-cols-2 gap-4">

        {/* Country — locked to Nigeria */}
        <div>
          <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">
            Country
          </label>
          <div className="relative">
            <input
              type="text"
              value="Nigeria"
              readOnly
              className="input bg-stone-50 text-stone-400 cursor-not-allowed select-none"
            />
            {/* Lock icon */}
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-300 text-xs select-none">
              🔒
            </span>
          </div>
          {/* Hidden — passes "Nigeria" to the server action */}
          <input type="hidden" name="venue_country" value="Nigeria" />
        </div>

        {/* State */}
        <div>
          <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">
            State <span className="text-rose-400">*</span>
          </label>
          <select
            name="venue_state"
            value={state}
            onChange={e => {
              setState(e.target.value)
              // Clear address when state changes — old result no longer relevant
              setQuery('')
              setResults([])
              setOpen(false)
              document.getElementById('venue_address_hidden')?.setAttribute('value', '')
              document.getElementById('venue_lat_hidden')?.setAttribute('value', '')
              document.getElementById('venue_lng_hidden')?.setAttribute('value', '')
            }}
            className="input"
          >
            <option value="">— Select state —</option>
            {NIGERIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Venue address — only active after a state is chosen */}
      <div className="relative">
        <label className="block text-xs font-medium text-stone-400 uppercase tracking-wide mb-1.5">
          Venue address
          {state && (
            <span className="ml-1.5 normal-case font-normal text-stone-300">
              — searching in {state === 'FCT — Abuja' ? 'Abuja (FCT)' : `${state} State`}
            </span>
          )}
        </label>

        {/* Hidden inputs carry coords + address to server action */}
        <input type="hidden" name="venue_address" id="venue_address_hidden" defaultValue={defaultAddress} />
        <input type="hidden" name="venue_lat"     id="venue_lat_hidden"     defaultValue={defaultLat ?? ''} />
        <input type="hidden" name="venue_lng"     id="venue_lng_hidden"     defaultValue={defaultLng ?? ''} />

        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => handleInput(e.target.value)}
            placeholder={state ? `Search address in ${state === 'FCT — Abuja' ? 'Abuja' : state}…` : 'Select a state first…'}
            disabled={!state}
            className={`input pr-8 ${!state ? 'bg-stone-50 text-stone-300 cursor-not-allowed' : ''}`}
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
    </div>
  )
}
