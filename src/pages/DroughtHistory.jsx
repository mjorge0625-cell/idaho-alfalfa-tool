import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Cell } from 'recharts'
import { PDSI_DATA } from '../lib/pdsiData'
import { useFarm } from '../context/FarmContext'
import PageHeader from '../components/PageHeader'
import { Link } from 'react-router-dom'

const STATES = Object.keys(PDSI_DATA)
const STATE_LABELS = { NewMexico: 'New Mexico' }
const label = s => STATE_LABELS[s] ?? s

const ABBR_MAP = {
  ID: 'Idaho', CA: 'California', OR: 'Oregon', WA: 'Washington',
  MT: 'Montana', WY: 'Wyoming', CO: 'Colorado', UT: 'Utah',
  AZ: 'Arizona', NM: 'NewMexico',
}

function detectState(location = '') {
  for (const [abbr, name] of Object.entries(ABBR_MAP)) {
    if (location.includes(abbr) || location.toLowerCase().includes(name.toLowerCase())) return name
  }
  return 'Idaho'
}

function pdsiColor(v) {
  if (v >= 0)  return '#16a34a'
  if (v >= -1) return '#ca8a04'
  if (v >= -2) return '#ea580c'
  return '#dc2626'
}

function severityLabel(v) {
  if (v >= 0)  return 'Normal or wet'
  if (v >= -1) return 'Mild drought'
  if (v >= -2) return 'Moderate drought'
  if (v >= -3) return 'Severe drought'
  return 'Extreme drought'
}

function advice(v, stateName) {
  if (v >= -1) return 'This season is within normal range for your area. Standard irrigation management applies.'
  if (v >= -2) return 'Moderate drought conditions. Use the Yield Calculator to estimate impact on your operation.'
  if (v >= -3) return `Severe drought — conditions like these have historically reduced ${stateName} alfalfa yields 15–38%. Review your Water Strategy.`
  return 'Extreme drought — among the worst on record for your state. Triage strategy strongly recommended. See Farm Dashboard for full impact.'
}

function ordinal(n) {
  const s = ['th','st','nd','rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

export default function DroughtHistory() {
  const { farm } = useFarm()
  const [state, setState] = useState(() => detectState(farm.location))

  const data = PDSI_DATA[state] ?? []
  const currentYear = new Date().getFullYear()
  const currentEntry = data.find(d => d.year === currentYear) ?? [...data].sort((a,b) => b.year - a.year)[0]
  const currentPDSI = currentEntry?.pdsi ?? 0

  const sorted = [...data].filter(d => d.pdsi != null).sort((a, b) => a.pdsi - b.pdsi)
  const rank = sorted.findIndex(d => d.year === currentEntry?.year) + 1
  const driestYears = sorted.slice(0, 3)
  const drierCount = data.filter(d => d.pdsi != null && d.pdsi < currentPDSI).length
  const drierPct = Math.round((drierCount / data.filter(d => d.pdsi != null).length) * 100)

  const isWarning = currentPDSI < -2

  return (
    <div className="flex-1">
      <PageHeader
        title="Drought History"
        subtitle={`Historical PDSI drought data, 2000–2025 · ${label(state)}`}
      />

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* State selector */}
        <section className="bg-white rounded-xl shadow-sm p-5 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <select value={state} onChange={e => setState(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a3a0a]">
              {STATES.map(s => <option key={s} value={s}>{label(s)}</option>)}
            </select>
          </div>
          <p className="text-xs text-gray-400 pb-2">
            Growing-season (Apr–Sep) average PDSI · Source: NOAA/NCDC
          </p>
        </section>

        {/* Bar chart */}
        <section className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-bold text-[#1a3a0a] text-base mb-4">Annual PDSI (2000–2025)</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data} margin={{ top: 12, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} tickFormatter={v => `'${String(v).slice(2)}`} />
              <YAxis domain={[-9, 6]} tick={{ fontSize: 11 }} width={32} tickFormatter={v => v.toFixed(0)} />
              <Tooltip formatter={v => [v?.toFixed(2) ?? '—', 'PDSI']} labelFormatter={l => `Year: ${l}`} />
              <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 2" />
              <ReferenceLine y={-2} stroke="#ea580c" strokeDasharray="2 3" strokeOpacity={0.5} />
              <ReferenceLine y={-3} stroke="#dc2626" strokeDasharray="2 3" strokeOpacity={0.5} />
              {currentEntry && (
                <ReferenceLine x={currentEntry.year} stroke="#1a3a0a" strokeWidth={2}
                  label={{ value: String(currentEntry.year), position: 'top', fontSize: 10, fill: '#1a3a0a' }} />
              )}
              <Bar dataKey="pdsi" radius={[3, 3, 0, 0]} maxBarSize={28}>
                {data.map((entry, i) => <Cell key={i} fill={pdsiColor(entry.pdsi ?? 0)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3 flex-wrap">
            {[['#16a34a','Normal/Wet'],['#ca8a04','Mild drought'],['#ea580c','Moderate'],['#dc2626','Severe/Extreme']].map(([c,l]) => (
              <span key={l} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-3 h-3 rounded-sm inline-block shrink-0" style={{ background: c }} />{l}
              </span>
            ))}
          </div>
        </section>

        {/* Drought ranking */}
        <section className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <h2 className="font-bold text-[#1a3a0a] text-base">Drought Ranking</h2>
          <p className="text-sm text-gray-700">
            <strong>{currentEntry?.year}</strong> ranks as the{' '}
            <strong className="text-[#1a3a0a]">{ordinal(rank)} driest year</strong> in the last {data.length} years for {label(state)}.
            <span className="text-gray-500 ml-1">({drierPct}% of years on record were drier.)</span>
          </p>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">3 Worst Drought Years</p>
            <div className="space-y-1.5">
              {driestYears.map((d, i) => (
                <div key={d.year} className="flex items-center gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs flex items-center justify-center font-bold shrink-0">{i + 1}</span>
                  <span className="font-medium text-gray-800 w-12">{d.year}</span>
                  <span className="text-gray-500 w-20">PDSI {d.pdsi.toFixed(2)}</span>
                  <span className="text-xs text-red-600 font-medium">{severityLabel(d.pdsi)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What this means */}
        <section className={`rounded-xl p-5 space-y-3 ${isWarning ? 'bg-red-50 border border-red-200' : 'bg-[#EFF5E8] border border-[#1a3a0a]/20'}`}>
          <h2 className={`font-bold text-base ${isWarning ? 'text-red-800' : 'text-[#1a3a0a]'}`}>
            What this means for your operation
          </h2>
          <p className={`text-sm leading-relaxed ${isWarning ? 'text-red-900' : 'text-gray-700'}`}>
            <strong>{severityLabel(currentPDSI)}</strong> — {advice(currentPDSI, label(state))}
          </p>
          {currentPDSI < -1 && (
            <div className="flex flex-wrap gap-2 pt-1">
              <Link to="/yield" className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-[#1a3a0a] font-medium hover:border-[#1a3a0a] transition-colors">Yield Calculator →</Link>
              <Link to="/water" className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-[#1a3a0a] font-medium hover:border-[#1a3a0a] transition-colors">Water Strategy →</Link>
              <Link to="/dashboard" className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-[#1a3a0a] font-medium hover:border-[#1a3a0a] transition-colors">Farm Dashboard →</Link>
            </div>
          )}
        </section>

        <p className="text-xs text-gray-400 px-1">
          Palmer Drought Severity Index (PDSI): above 0 = normal/wet; 0 to −2 = mild to moderate drought; −2 to −3 = severe; below −3 = extreme.
          Growing-season average (Apr–Sep). Data from NOAA/NCDC via USDA research files.
        </p>

      </div>
    </div>
  )
}
