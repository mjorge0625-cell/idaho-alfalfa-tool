import { useState, useEffect } from 'react'

export default function AgriMetStationSelector({ value, onChange }) {
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('https://corsproxy.io/?https://www.usbr.gov/pn/agrimet/agrimetmap/usbr_map.json')
      .then(r => r.json())
      .then(data => {
        const list = (data.features || []).map(f => ({
          id: f.properties.siteid,
          name: f.properties.title,
          state: f.properties.state,
        })).sort((a, b) => a.name.localeCompare(b.name))
        setStations(list)
        setLoading(false)
      })
      .catch(() => {
        setError('Could not load station list. Check your connection.')
        setLoading(false)
      })
  }, [])

  const filtered = stations.filter(s => {
    const q = search.toLowerCase()
    return (
      s.name.toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q) ||
      (s.state && s.state.toLowerCase().includes(q))
    )
  })

  if (loading) {
    return (
      <div className="text-sm text-gray-500 py-2 flex items-center gap-2">
        <span className="inline-block w-4 h-4 border-2 border-[#27500A] border-t-transparent rounded-full animate-spin"></span>
        Loading AgriMet stations…
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>
  }

  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="Search by station name or state…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#27500A]"
      />
      <div className="max-h-52 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 px-3 py-3">No stations match your search.</p>
        )}
        {filtered.map(s => (
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
        ))}
      </div>
      {value && (
        <p className="text-xs text-[#27500A] font-medium">
          Selected: {value.name} ({value.id}){value.state ? `, ${value.state}` : ''}
        </p>
      )}
    </div>
  )
}
