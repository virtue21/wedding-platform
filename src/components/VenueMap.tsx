'use client'

import { useEffect, useRef } from 'react'

type Props = {
  lat: number
  lng: number
  venueName: string
}

export default function VenueMap({ lat, lng, venueName }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<import('leaflet').Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    async function init() {
      const L = (await import('leaflet')).default

      // Fix default marker icon paths broken by webpack
      // @ts-expect-error leaflet internal
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })

      const map = L.map(mapRef.current!, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: true,
        scrollWheelZoom: false,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      // Custom rose-tinted marker
      const icon = L.divIcon({
        html: `<div style="
          background:#f43f5e;
          width:32px;height:32px;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          border:3px solid white;
          box-shadow:0 2px 8px rgba(0,0,0,0.25);
        "></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        className: '',
      })

      L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`<strong>${venueName}</strong>`, { closeButton: false })
        .openPopup()

      mapInstance.current = map
    }

    init()

    return () => {
      mapInstance.current?.remove()
      mapInstance.current = null
    }
  }, [lat, lng, venueName])

  return (
    <div
      ref={mapRef}
      className="w-full h-56 rounded-2xl overflow-hidden border border-rose-100 z-0"
      style={{ background: '#f3f4f6' }}
    />
  )
}
