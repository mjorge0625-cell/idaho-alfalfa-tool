import { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { GRADE_PRICES, getYieldLossPct } from '../lib/yieldLoss'
import { useFarm } from '../context/FarmContext'
import PageHeader from '../components/PageHeader'

const GRADES = ['utility', 'good', 'premium', 'supreme']

// ── Bundled USDA AMS prices (Idaho Direct Hay, AMS_3056) ──────────────────────
// Extracted from research/HAY_Idaho_*.xlsx; weighted avg over last 6 reporting
// periods (03/20/2026–05/29/2026). Used as fallback when API is unreachable.
const BUNDLED_PRICES = {
  utility: 149, good: 188, premium: 200, supreme: 235,
}
const BUNDLED_DATE = '05/29/2026'

// ── Live fetch helpers ─────────────────────────────────────────────────────────
const PROXY = 'https://api.allorigins.win/raw?url='
const AMS_URLS = [
  // A – national hay summary, alfalfa filter
  'https://marsapi.ams.usda.gov/services/v1.2/reports/2636?filters=commodity_desc:Alfalfa%20Hay',
  // B – Idaho Direct Hay Report (slug 3056)
  'https://marsapi.ams.usda.gov/services/v1.2/reports/3056',
  // C – national hay summary, all sections
  'https://marsapi.ams.usda.gov/services/v1.2/reports/2636?allSections=true',
]

// Actual AMS field names from the USDA data export:
//   grade column  → "quality"
//   price column  → "wtd_Avg_Price"
//   class column  → "class" (filter to "Alfalfa")
//   unit column   → "price_Unit" (filter to "Per Ton")
//   date column   → "report_end_date"
function gradeKey(q = '') {
  const d = q.toLowerCase()
  if (d.includes('supreme'))                       return 'supreme'
  if (d.includes('premium'))                       return 'premium'
  if (d.includes('good'))                          return 'good'
  if (d.includes('utility') || d.includes('fair')) return 'utility'
  return null
}

// Split blended grades like "Good/Premium" across both keys
function gradeKeys(q = '') {
  const keys = []
  const d = q.toLowerCase()
  if (d.includes('supreme')) keys.push('supreme')
  if (d.includes('premium')) keys.push('premium')
  if (d.includes('good'))    keys.push('good')
  if (d.includes('utility') || d.includes('fair')) keys.push('utility')
  return keys
}

function parseDate(s = '') {
  // Handles MM/DD/YYYY and YYYY-MM-DD
  if (!s) return 0
  const parts = s.includes('/') ? s.split('/') : s.split('-')
  return s.includes('/')
    ? new Date(+parts[2], +parts[0]-1, +parts[1]).getTime()
    : new Date(s).getTime()
}

function extractPrices(results) {
  const WESTERN = ['idaho','california','oregon','washington','utah','colorado',
                   'arizona','new mexico','wyoming','montana','nevada']

  const rows = Array.isArray(results) ? results : (results.results ?? [])
  if (!rows.length) throw new Error('empty results')

  // Filter to Alfalfa, Per Ton rows
  const alfalfa = rows.filter(r => {
    const cls  = (r.class ?? r.commodity ?? '').toLowerCase()
    const unit = (r.price_Unit ?? r.priceUnit ?? r.unit ?? '').toLowerCase()
    return cls.includes('alfalfa') && (unit.includes('ton') || unit === '')
  })
  const pool = alfalfa.length ? alfalfa : rows

  // Prefer Idaho rows, fall back to any western state
  const idaho = pool.filter(r =>
    WESTERN.slice(0,1).some(s =>
      (r.market_location_name ?? r.office_name ?? r.state_name ?? '').toLowerCase().includes(s)
    )
  )
  const western = pool.filter(r =>
    WESTERN.some(s =>
      (r.market_location_name ?? r.office_name ?? r.state_name ?? '').toLowerCase().includes(s)
    )
  )
  const working = idaho.length ? idaho : western.length ? western : pool
  const source  = idaho.length ? 'Idaho' : western.length ? 'Western US' : 'National'

  // Find the most recent report date
  const latest = working
    .map(r => r.report_end_date ?? r.report_date ?? r.published_date ?? '')
    .filter(Boolean)
    .sort((a,b) => parseDate(b) - parseDate(a))[0]
  if (!latest) throw new Error('no date')

  // Build weighted-avg price map for the most recent date
  const buckets = {}
  for (const r of working) {
    const d = r.report_end_date ?? r.report_date ?? r.published_date ?? ''
    if (d !== latest) continue
    const rawGrade = r.quality ?? r.grade_desc ?? r.class_desc ?? r.commodity_grade ?? ''
    const keys = gradeKeys(rawGrade)
    if (!keys.length) continue
    const price = parseFloat(r.wtd_Avg_Price ?? r.wtdAvgPrice ?? r.wtd_avg ?? r.price ?? '')
    const qty   = parseFloat(r.quantity ?? 1)
    if (isNaN(price) || price <= 0) continue
    const w = 1 / keys.length
    for (const k of keys) {
      if (!buckets[k]) buckets[k] = { sum: 0, qty: 0 }
      buckets[k].sum += price * qty * w
      buckets[k].qty += qty * w
    }
  }

  const prices = {}
  for (const [k, { sum, qty }] of Object.entries(buckets)) {
    prices[k] = Math.round(sum / qty)
  }
  if (!Object.keys(prices).length) throw new Error('no prices parsed')
  return { prices, reportDate: latest, source }
}

async function fetchAMSPrices() {
  let lastError, lastRaw
  for (const url of AMS_URLS) {
    try {
      const res = await fetch(PROXY + encodeURIComponent(url))
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      lastRaw = json
      if (import.meta.env.DEV) console.log('[AMS debug] URL:', url, '\nRaw:', json)
      const result = extractPrices(json)
      return { ...result, _raw: json, _url: url }
    } catch (e) {
      lastError = e
      if (import.meta.env.DEV) console.warn('[AMS debug] Failed URL:', url, e.message)
    }
  }
  throw Object.assign(lastError ?? new Error('all URLs failed'), { _raw: lastRaw })
}

export default function RevenueQuality() {
  const { farm } = useFarm()
  const alfalfa = farm.crops.find(c => c.cropType === 'Alfalfa')

  const [currentGrade, setCurrentGrade] = useState('good')
  const [targetGrade, setTargetGrade] = useState('premium')
  const [acres, setAcres] = useState(Number(alfalfa?.acres) || 150)
  const [baselineYield, setBaselineYield] = useState(Number(alfalfa?.baselineYield) || 7)
  const [waterCut, setWaterCut] = useState(25)
  const [stressLevel, setStressLevel] = useState('moderate')
  const [upgradeCostPerAcre, setUpgradeCostPerAcre] = useState(30)

  // Live price fetch
  const [livePrices, setLivePrices] = useState(null)
  const [priceDate, setPriceDate] = useState(null)
  const [priceSource, setPriceSource] = useState(null)
  const [priceStatus, setPriceStatus] = useState('loading') // loading | live | bundled | fallback
  const [debugRaw, setDebugRaw] = useState(null)

  const fetchPrices = useCallback(async () => {
    setPriceStatus('loading')
    try {
      const { prices, reportDate, source, _raw } = await fetchAMSPrices()
      setLivePrices(prices)
      setPriceDate(reportDate)
      setPriceSource(source)
      setDebugRaw(_raw)
      setPriceStatus('live')
    } catch (e) {
      // Fall back to bundled USDA AMS data from research/HAY_Idaho_*.xlsx
      setDebugRaw(e._raw ?? null)
      setLivePrices(BUNDLED_PRICES)
      setPriceDate(BUNDLED_DATE)
      setPriceSource('Idaho (bundled)')
      setPriceStatus('bundled')
    }
  }, [])

  useEffect(() => { fetchPrices() }, [fetchPrices])

  // Active prices: live API > bundled research data > Feuz hardcoded
  const gradePrices = { ...GRADE_PRICES, ...(livePrices ?? {}) }

  const currentPrice = gradePrices[currentGrade]
  const targetPrice = gradePrices[targetGrade]

  const lossPct = getYieldLossPct(waterCut, stressLevel)
  const droughtYield = baselineYield * (1 - lossPct / 100)

  const currentRevenue = droughtYield * acres * currentPrice
  const targetRevenue = droughtYield * acres * targetPrice
  const upgradeCost = upgradeCostPerAcre * acres
  const netUpgradeGain = targetRevenue - currentRevenue - upgradeCost

  const gradeChartData = GRADES.map(g => ({
    grade: g.charAt(0).toUpperCase() + g.slice(1),
    revenue: Math.round(droughtYield * acres * gradePrices[g]),
  }))

  const breakEvenYieldRatio = currentPrice / targetPrice
  const breakEvenYield = baselineYield * breakEvenYieldRatio

  // Price increase needed at drought yield to fully offset the tonnage lost
  // Derived from: droughtYield * (currentPrice + Y) = baselineYield * currentPrice
  const breakevenPriceDelta = lossPct > 0
    ? currentPrice * lossPct / (100 - lossPct)
    : 0
  const breakevenPricePct = lossPct > 0
    ? lossPct / (100 - lossPct) * 100
    : 0

  return (
    <div className="flex-1">
      <PageHeader
        title="Revenue & Quality"
        subtitle="Evaluate grade upgrades and see revenue impact across hay grades (Feuz et al. 2025)."
      />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Price status banner */}
        {priceStatus === 'loading' && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500">
            Loading current prices...
          </div>
        )}
        {priceStatus === 'live' && (
          <div className="bg-[#EFF5E8] border border-[#27500A]/20 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
            <span className="text-sm text-[#27500A]">
              <span className="font-semibold">📊 Prices updated weekly from USDA AMS Market News</span>
              {priceDate && <span className="text-[#27500A]/70 ml-2">· Report date: {priceDate}</span>}
              {priceSource && priceSource !== 'Idaho' && <span className="text-[#27500A]/60 ml-1">({priceSource} avg)</span>}
            </span>
            <button onClick={fetchPrices} title="Refresh prices" className="text-[#27500A] hover:text-[#1a3a0a] text-lg leading-none transition-colors">↻</button>
          </div>
        )}
        {priceStatus === 'bundled' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
            <span className="text-sm text-amber-800">
              <span className="font-semibold">📊 USDA AMS Idaho prices</span>
              <span className="font-normal ml-1">— last report: {priceDate} · live API unavailable, using research data</span>
            </span>
            <button onClick={fetchPrices} title="Retry live fetch" className="text-amber-600 hover:text-amber-800 text-lg leading-none transition-colors">↻</button>
          </div>
        )}
        {priceStatus === 'fallback' && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3">
            <span className="text-sm text-gray-500">Using research average prices (Feuz et al. 2025) — live data unavailable</span>
            <button onClick={fetchPrices} title="Retry" className="text-gray-400 hover:text-gray-600 text-lg leading-none transition-colors">↻</button>
          </div>
        )}

        {/* Dev debug panel */}
        {import.meta.env.DEV && (
          <details className="bg-gray-900 text-green-300 rounded-lg text-xs font-mono">
            <summary className="px-3 py-2 cursor-pointer text-gray-400 hover:text-white">
              [DEV] AMS price debug — status: {priceStatus}
            </summary>
            <div className="px-3 pb-3 space-y-1">
              <p>Grade prices in use: {JSON.stringify(gradePrices)}</p>
              <p>Report date: {priceDate} · Source: {priceSource}</p>
              <p>Raw API response:</p>
              <pre className="overflow-auto max-h-48 bg-gray-800 rounded p-2 mt-1">
                {debugRaw ? JSON.stringify(debugRaw, null, 2).slice(0, 2000) : 'null'}
              </pre>
            </div>
          </details>
        )}

        {/* Grade prices reference */}
        <section className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-bold text-[#27500A] text-base mb-3">
            {priceStatus === 'live'    ? 'Alfalfa Grade Prices (USDA AMS, current)'
           : priceStatus === 'bundled' ? 'Alfalfa Grade Prices (USDA AMS Idaho, research data)'
           :                            'Alfalfa Grade Prices (Feuz et al. 2025)'}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {GRADES.map(g => (
              <div key={g} className={`rounded-lg p-3 text-center border-2 ${
                g === currentGrade ? 'border-[#27500A] bg-[#EFF5E8]' : 'border-gray-100 bg-gray-50'
              }`}>
                <p className="text-xs text-gray-500 capitalize">{g}</p>
                <p className="text-lg font-bold text-[#27500A]">${gradePrices[g]}</p>
                <p className="text-xs text-gray-400">
                  {priceStatus === 'live'    ? 'USDA AMS live · /ton'
                 : priceStatus === 'bundled' ? 'USDA AMS Idaho · /ton'
                 :                            'research avg · /ton'}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Inputs */}
        <section className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <h2 className="font-bold text-[#27500A] text-base">Inputs</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Current Grade</label>
              <select value={currentGrade} onChange={e => setCurrentGrade(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#27500A] capitalize">
                {GRADES.map(g => <option key={g} value={g} className="capitalize">{g.charAt(0).toUpperCase() + g.slice(1)} — ${gradePrices[g]}/ton</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Target Grade</label>
              <select value={targetGrade} onChange={e => setTargetGrade(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#27500A]">
                {GRADES.map(g => <option key={g} value={g} className="capitalize">{g.charAt(0).toUpperCase() + g.slice(1)} — ${gradePrices[g]}/ton</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Acres</label>
              <input type="number" min={1} value={acres} onChange={e => setAcres(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#27500A]" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Baseline Yield (t/ac)</label>
              <input type="number" min={0} step={0.1} value={baselineYield} onChange={e => setBaselineYield(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#27500A]" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Upgrade Cost ($/ac)</label>
              <input type="number" min={0} value={upgradeCostPerAcre} onChange={e => setUpgradeCostPerAcre(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#27500A]" />
            </div>
          </div>

          <div>
            <label className="flex justify-between text-sm font-medium text-gray-700 mb-1">
              <span>Water Cut</span>
              <span className="font-bold text-[#27500A]">{waterCut}%</span>
            </label>
            <input type="range" min={0} max={60} step={1} value={waterCut} onChange={e => setWaterCut(Number(e.target.value))}
              className="w-full accent-[#27500A]" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stress Level</label>
            <div className="flex gap-3">
              {['moderate', 'severe'].map(level => (
                <button key={level} onClick={() => setStressLevel(level)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-colors capitalize ${
                    stressLevel === level ? 'bg-[#27500A] text-white border-[#27500A]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#27500A]'
                  }`}>
                  {level}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h2 className="font-bold text-[#27500A] text-base">Grade Upgrade Analysis</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Drought Yield', value: `${droughtYield.toFixed(2)} t/ac`, sub: `${lossPct.toFixed(1)}% loss at ${waterCut}% cut` },
              { label: 'Revenue Gain from Upgrade', value: `$${(targetRevenue - currentRevenue).toLocaleString('en-US', { maximumFractionDigits: 0 })}`, sub: `${currentGrade} → ${targetGrade}` },
              { label: 'Upgrade Cost', value: `$${upgradeCost.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, sub: `at $${upgradeCostPerAcre}/ac` },
              { label: 'Net Gain', value: `$${netUpgradeGain.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, sub: netUpgradeGain >= 0 ? '✓ Upgrade pays off' : '✗ Upgrade not worth it', highlight: netUpgradeGain >= 0 },
            ].map(({ label, value, sub, highlight }) => (
              <div key={label} className={`rounded-lg p-3 text-center ${highlight ? 'bg-[#EFF5E8] border border-[#27500A]' : 'bg-gray-50'}`}>
                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                <p className="text-base font-bold text-[#27500A]">{value}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom line */}
        <section className="bg-[#EFF5E8] border border-[#27500A]/20 rounded-xl p-5">
          <h2 className="font-bold text-[#27500A] text-base mb-2">Bottom line</h2>
          {lossPct === 0 ? (
            <p className="text-sm text-gray-700">
              No yield loss at this water cut — your revenue is unchanged regardless of grade.
            </p>
          ) : (
            <p className="text-sm text-gray-700 leading-relaxed">
              At current prices, you need a{' '}
              <strong className="text-[#27500A]">{breakevenPricePct.toFixed(1)}% quality upgrade</strong>
              {' '}or a{' '}
              <strong className="text-[#27500A]">${breakevenPriceDelta.toFixed(2)}/ton price increase</strong>
              {' '}to break even on the tonnage you'll lose at a {waterCut}% water cut
              ({stressLevel} stress).
              {netUpgradeGain >= 0
                ? ' Your selected upgrade clears this threshold.'
                : ' Your selected upgrade does not yet cover this gap — consider a higher target grade or lower upgrade cost.'}
            </p>
          )}
        </section>

        {/* Chart */}
        <section className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-bold text-[#27500A] text-base mb-4">Revenue by Grade (Drought Yield)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={gradeChartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={48} />
              <Tooltip formatter={v => [`$${v.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#27500A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>
    </div>
  )
}
