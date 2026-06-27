import { useState, useEffect } from 'react'

const FALLBACK_STATIONS = [
  { id: 'TWFI', name: 'Twin Falls',    state: 'ID' },
  { id: 'BOGI', name: 'Boise',         state: 'ID' },
  { id: 'ABEI', name: 'Aberdeen',      state: 'ID' },
  { id: 'HEEI', name: 'Heyburn',       state: 'ID' },
  { id: 'MRSI', name: 'Morris',        state: 'ID' },
  { id: 'OKLI', name: 'Oakley',        state: 'ID' },
  { id: 'PICI', name: 'Picabo',        state: 'ID' },
  { id: 'RRII', name: 'Richfield',     state: 'ID' },
  { id: 'SVDI', name: 'Sun Valley',    state: 'ID' },
  { id: 'BNDI', name: 'Burley',        state: 'ID' },
  { id: 'CRVO', name: 'Corvallis',     state: 'OR' },
  { id: 'KTLO', name: 'Klamath Falls', state: 'OR' },
  { id: 'MALO', name: 'Malheur',       state: 'OR' },
  { id: 'PARO', name: 'Parker',        state: 'OR' },
  { id: 'PRNO', name: 'Prineville',    state: 'OR' },
  { id: 'WSCO', name: 'Wasco',         state: 'OR' },
  { id: 'CDAW', name: 'Wenatchee',     state: 'WA' },
  { id: 'OMAW', name: 'Omak',          state: 'WA' },
  { id: 'PROW', name: 'Prosser',       state: 'WA' },
  { id: 'YRUW', name: 'Yakima',        state: 'WA' },
]

const AGRIMET_URLS = [
  'https://corsproxy.io/?https://www.usbr.gov/pn/agrimet/agrimetmap/usbr_map.json',
  'https://corsproxy.io/?https://www.usbr.gov/pn/agrimet/agrimap/usbr_map.json',
]

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])
}

async function tryFetchLive() {
  for (const url of AGRIMET_URLS) {
    try {
      const res = await withTimeout(fetch(url), 6000)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      const list = (data.features ?? [])
        .map(f => ({
          id:    f.properties?.siteid ?? '',
          name:  f.properties?.title  ?? '',
          state: f.properties?.state  ?? '',
        }))
        .filter(s => s.id && s.name)
        .sort((a, b) => a.name.localeCompare(b.name))
      if (list.length > 0) return list
    } catch {
      // try next URL
    }
  }
  return null
}

export default function AgriMetStationSelector({ value, onChange }) {
  // Start with fallback immediately — user can always select a station
  const [stations, setStations]      = useState(FALLBACK_STATIONS)
  const [usingFallback, setFallback] = useState(true)
  const [search, setSearch]          = useState('')

  useEffect(() => {
    // Try to upgrade to full live list in background
    tryFetchLive().then(live => {
      if (live) {
        setStations(live)
        setFallback(false)
      }
    })
  }, [])

  const filtered = stations.filter(s => {
    const q = search.toLowerCase()
    return (
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      s.state.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-2">
      {usingFallback && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1.5">
          Showing 20 common ID/OR/WA stations — loading full list in background.
        </p>
      )}
      <input
        type="text"
        placeholder="Search by name, station ID, or state…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#27500A]"
      />
      <div className="max-h-52 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 px-3 py-3">No stations match your search.</p>
        ) : (
          filtered.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => onChange(s)}
              className={`w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-[#EFF5E8] ${
                value?.id === s.id ? 'bg-[#EFF5E8] font-semibold text-[#27500A]' : 'text-gray-700'
              }`}
            >
              <span className="font-medium">{s.name}</span>
              <span className="ml-2 text-xs text-gray-400 uppercase">{s.id}</span>
              {s.state && <span className="ml-1 text-xs text-gray-400">· {s.state}</span>}
            </button>
          ))
        )}
      </div>
      {value && (
        <p className="text-xs text-[#27500A] font-medium">
          Selected: {value.name} ({value.id}){value.state ? `, ${value.state}` : ''}
        </p>
      )}
    </div>
  )
}
