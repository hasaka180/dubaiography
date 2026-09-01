'use client'

import { useEffect, useRef } from 'react'
import type { Map as LMap, Marker, DivIcon } from 'leaflet'
import 'leaflet/dist/leaflet.css'

export type MapPoint = { slug: string; title: string; lat: number; lng: number }

/* Dubai centre, used when nothing has coordinates yet. */
const DUBAI: [number, number] = [25.2048, 55.2708]

const dotHtml = (active: boolean) =>
  `<span style="display:block;width:${active ? 18 : 12}px;height:${active ? 18 : 12}px;border-radius:50%;background:#e0703f;border:2px solid #fdf1d2;box-shadow:0 0 0 ${active ? 6 : 3}px rgba(224,112,63,.28),0 0 14px rgba(224,112,63,.7)"></span>`

export default function EventsMap({
  points,
  selected,
  onSelect,
}: {
  points: MapPoint[]
  selected: string | null
  onSelect: (slug: string) => void
}) {
  const elRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LMap | null>(null)
  const markersRef = useRef<Record<string, Marker>>({})
  const iconRef = useRef<((active: boolean) => DivIcon) | null>(null)
  // Keep the latest onSelect without re-initialising the map.
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  useEffect(() => {
    let cancelled = false
    let map: LMap | undefined
    ;(async () => {
      const L = (await import('leaflet')).default
      if (cancelled || !elRef.current || mapRef.current) return

      const icon = (active: boolean) =>
        L.divIcon({ className: '', html: dotHtml(active), iconSize: [18, 18], iconAnchor: [9, 9] })
      iconRef.current = icon

      map = L.map(elRef.current, { scrollWheelZoom: false, attributionControl: true })
      mapRef.current = map

      // Esri Dark Gray Canvas — free, no API key, matches the site's dark palette.
      const esri = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas'
      L.tileLayer(`${esri}/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}`, {
        attribution: 'Tiles &copy; Esri',
        maxZoom: 16,
      }).addTo(map)
      // Place and road labels on top of the base.
      L.tileLayer(`${esri}/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}`, {
        maxZoom: 16,
      }).addTo(map)

      const bounds: [number, number][] = []
      for (const p of points) {
        const marker = L.marker([p.lat, p.lng], { title: p.title, icon: icon(false) }).addTo(map)
        marker.bindPopup(p.title, { closeButton: false })
        marker.on('click', () => onSelectRef.current(p.slug))
        markersRef.current[p.slug] = marker
        bounds.push([p.lat, p.lng])
      }

      if (bounds.length === 1) map.setView(bounds[0], 13)
      else if (bounds.length) map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 })
      else map.setView(DUBAI, 11)

      // Tiles can lay out at the wrong size inside a freshly-mounted flex cell.
      setTimeout(() => map?.invalidateSize(), 120)
    })()

    return () => {
      cancelled = true
      map?.remove()
      mapRef.current = null
      markersRef.current = {}
      iconRef.current = null
    }
  }, [points])

  // Emphasise the selected marker, pan to it and open its label.
  useEffect(() => {
    const map = mapRef.current
    const icon = iconRef.current
    if (!map || !icon) return
    for (const [slug, marker] of Object.entries(markersRef.current)) {
      marker.setIcon(icon(slug === selected))
      marker.setZIndexOffset(slug === selected ? 1000 : 0)
    }
    if (selected && markersRef.current[selected]) {
      const marker = markersRef.current[selected]
      map.panTo(marker.getLatLng(), { animate: true })
      marker.openPopup()
    }
  }, [selected])

  return <div ref={elRef} style={{ width: '100%', height: '100%' }} />
}
