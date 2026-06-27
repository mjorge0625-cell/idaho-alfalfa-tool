import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getYieldLoss, GRADE_PRICES } from '../lib/yieldLoss'
import { getCropDroughtAdvice, RISK_STYLES } from '../lib/cropAdvice'
import { useFarm } from '../context/FarmContext'
import PageHeader from '../components/PageHeader'
import { Link } from 'react-router-dom'

function money(n) {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function AdviceCard({ cropType, acres, advice }) {
  const s = RISK_STYLES[advice.riskLevel] || RISK_STYLES.low
  return (
    <div className={`border-l-4 ${s.border} ${s.bg} rounded-lg p-4 space-y-1.5`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-sm text-gray-800">
          {cropType} <span className="text-gray-400 font-normal">({acres} ac)</span>
        </span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide shrink-0 ${s.badge}`}>
          {s.label}
        </span>
      </div>
      <p className="text-sm font-medium text-gray-800">{advice.topAction}</p>
      <p className="text-xs text-gray-600 leading-relaxed">{advice.details}</p>
    </div>
  )
}

export default function FarmDashboard() {
  const { farm: contextFarm } = useFarm()
  const [waterCut, setWaterCut] = useState(25)
  const [stressLevel, setStressLevel] = useState('moderate')
  const [isSharedView, setIsSharedView] = useState(false)
  const [sharedFarm, setSharedFarm] = useState(null)
  const [toast, setToast] = useState(false)

  // Load shared farm data from URL param (display-only, does not overwrite localStorage)
  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get('farm')
    if (!param) return
    try {
      const data = JSON.parse(decodeURIComponent(atob(param)))
      setSharedFarm(data)
      setIsSharedView(true)
    } catch { /* malformed param — ignore */ }
  }, [])

  const farm = sharedFarm ?? contextFarm

  function handleShare() {
    const encoded = btoa(encodeURIComponent(JSON.stringify(farm)))
    const url = `${window.location.origin}${window.location.pathname}?farm=${encoded}`
    navigator.clipboard.writeText(url).then(() => {
      setToast(true)
      setTimeout(() => setToast(false), 3500)
    })
  }

  const hasCrops = farm.crops.length > 0

  const cropResults = farm.crops.map(crop => {
    const acres        = Number(crop.acres) || 0
    const baseline     = Number(crop.baselineYield) || 0
    const price        = Number(crop.pricePerUnit) || GRADE_PRICES.good
    const lossPct      = getYieldLoss(crop.cropType, waterCut, stressLevel)
    const droughtYield = baseline * (1 - lossPct / 100)

    const baselineRevenue = baseline * acres * price
    const grossRevenue    = droughtYield * acres * price

    const inputCostPerAcre =
      Number(crop.machineryCoastPerAcre  || 0) +
      Number(crop.fertilizerCostPerAcre  || 0) +
      Number(crop.pesticideCostPerAcre   || 0) +
      Number(crop.seedCostPerAcre        || 0)
    const totalInputCosts = acres * inputCostPerAcre
    const netRevenue      = grossRevenue - totalInputCosts

    return {
      ...crop,
      lossPct,
      droughtYield,
      baselineRevenue,
      grossRevenue,
      totalInputCosts,
      netRevenue,
      revenueLoss: baselineRevenue - grossRevenue,
    }
  })

  const totalAcres          = cropResults.reduce((s, c) => s + (Number(c.acres) || 0), 0)
  const totalBaselineRevenue = cropResults.reduce((s, c) => s + c.baselineRevenue, 0)
  const totalGrossRevenue   = cropResults.reduce((s, c) => s + c.grossRevenue, 0)
  const totalInputCosts     = cropResults.reduce((s, c) => s + c.totalInputCosts, 0)
  const totalNetRevenue     = cropResults.reduce((s, c) => s + c.netRevenue, 0)
  const totalRevenueLoss    = totalBaselineRevenue - totalGrossRevenue

  const chartData = cropResults.map(c => ({
    name: `${c.cropType} (${c.acres} ac)`,
    'Gross Revenue':  Math.round(c.grossRevenue),
    'Input Costs':    Math.round(c.totalInputCosts),
    'Net Revenue':    Math.round(c.netRevenue),
  }))

  return (
    <div className="flex-1">
      {/* Print stylesheet */}
      <style>{`
        @media print {
          nav, footer, .no-print { display: none !important; }
          .fixed { display: none !important; }
          .print-header { display: block !important; }
          body { font-size: 12px; color: #000; }
          * { box-shadow: none !important; }
        }
        .print-header { display: none; }
      `}</style>

      {/* Print-only header */}
      <div className="print-header px-6 pt-4 pb-2 border-b border-gray-300 mb-4">
        <p className="font-bold text-lg">Idaho Alfalfa Decision Tool — Farm Summary</p>
        <p className="text-sm text-gray-600">
          {farm.farmerName || 'My Farm'}{farm.location ? ` · ${farm.location}` : ''} · {new Date().toLocaleDateString()}
        </p>
      </div>

      <PageHeader
        title="Farm Dashboard"
        subtitle="Whole-farm drought impact summary across all crops."
      />

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* Toolbar */}
        <div className="flex justify-end gap-2 no-print">
          <button onClick={handleShare}
            className="text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800 transition-colors">
            🔗 Share
          </button>
          <button onClick={() => window.print()}
            className="text-sm font-medium px-3 py-1.5 rounded-lg border border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-800 transition-colors">
            🖨️ Print Summary
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className="no-print fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#1a3a0a] text-white text-sm px-5 py-3 rounded-xl shadow-lg">
            Link copied! Anyone with this link can view your farm summary.
          </div>
        )}

        {/* Shared-view banner */}
        {isSharedView && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3 no-print">
            <span className="text-sm text-amber-800">
              You are viewing a shared farm summary — go to{' '}
              <Link to="/farm-setup" className="font-semibold underline">Farm Setup</Link>{' '}
              to enter your own data.
            </span>
          </div>
        )}

        {/* Farm info banner */}
        <div className="bg-[#27500A] text-white rounded-xl p-4 flex flex-wrap gap-4 items-center">
          <div>
            <p className="text-white/60 text-xs">Operation</p>
            <p className="font-bold">{farm.farmerName || 'My Farm'}</p>
          </div>
          {farm.location && (
            <div>
              <p className="text-white/60 text-xs">Location</p>
              <p className="font-semibold text-sm">{farm.location}</p>
            </div>
          )}
          {farm.agriMetStation && (
            <div>
              <p className="text-white/60 text-xs">AgriMet Station</p>
              <p className="font-semibold text-sm">{farm.agriMetStation.name} ({farm.agriMetStation.id})</p>
            </div>
          )}
          <div>
            <p className="text-white/60 text-xs">Total Acres</p>
            <p className="font-bold">{totalAcres.toLocaleString()} ac</p>
          </div>
        </div>

        {!hasCrops && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center space-y-3">
            <p className="text-amber-800 font-semibold">No crops in your operation yet.</p>
            <p className="text-amber-700 text-sm">Add your crops in Farm Setup to see your whole-farm drought summary here.</p>
            <Link to="/farm-setup"
              className="inline-block bg-[#27500A] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#3a7010] transition-colors">
              Go to Farm Setup →
            </Link>
          </div>
        )}

        {hasCrops && (
          <>
            {/* Drought scenario controls */}
            <section className="bg-white rounded-xl shadow-sm p-5 space-y-4 no-print">
              <h2 className="font-bold text-[#27500A] text-base">Drought Scenario</h2>
              <div>
                <label className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                  <span>Water Cut (all crops)</span>
                  <span className="font-bold text-[#27500A]">{waterCut}%</span>
                </label>
                <input type="range" min={0} max={60} step={5} value={waterCut}
                  onChange={e => setWaterCut(Number(e.target.value))}
                  className="w-full accent-[#27500A]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stress Level</label>
                <div className="flex gap-3">
                  {['moderate', 'severe'].map(level => (
                    <button key={level} onClick={() => setStressLevel(level)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-colors capitalize ${
                        stressLevel === level
                          ? 'bg-[#27500A] text-white border-[#27500A]'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-[#27500A]'
                      }`}>
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-[#EFF5E8] rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-0.5">Gross Revenue</p>
                <p className="text-xl font-bold text-[#27500A]">${money(totalGrossRevenue)}</p>
                <p className="text-xs text-gray-400">{waterCut}% water cut</p>
              </div>
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-0.5">Total Input Costs</p>
                <p className="text-xl font-bold text-orange-700">${money(totalInputCosts)}</p>
                <p className="text-xs text-gray-400">all crops</p>
              </div>
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 mb-0.5">Drought Loss</p>
                <p className="text-xl font-bold text-red-600">${money(totalRevenueLoss)}</p>
                <p className="text-xs text-gray-400">vs. baseline</p>
              </div>
              <div className="bg-[#27500A] rounded-xl p-4 text-center">
                <p className="text-xs text-white/60 mb-0.5">Net Revenue</p>
                <p className="text-xl font-bold text-white">${money(totalNetRevenue)}</p>
                <p className="text-xs text-white/50">after input costs</p>
              </div>
            </div>

            {/* Per-crop breakdown */}
            <section className="bg-white rounded-xl shadow-sm p-5 space-y-3">
              <h2 className="font-bold text-[#27500A] text-base">Per-Crop Breakdown</h2>
              <div className="space-y-2">
                {cropResults.map(crop => (
                  <div key={crop.id} className="border border-gray-100 rounded-lg p-3 space-y-2">
                    <div className="flex justify-between items-baseline">
                      <div>
                        <span className="font-semibold text-sm text-[#27500A]">{crop.cropType}</span>
                        <span className="text-xs text-gray-400 ml-2">
                          {crop.acres} ac · {crop.baselineYield} {crop.unit}/ac baseline
                        </span>
                      </div>
                      {crop.lossPct > 0 && (
                        <span className="text-xs text-red-500 shrink-0 ml-2">
                          {crop.lossPct.toFixed(1)}% yield loss
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-[#EFF5E8] rounded-md py-1.5 px-2">
                        <p className="text-xs text-gray-500">Gross Revenue</p>
                        <p className="text-sm font-bold text-[#27500A]">${money(crop.grossRevenue)}</p>
                      </div>
                      <div className="bg-orange-50 rounded-md py-1.5 px-2">
                        <p className="text-xs text-gray-500">Input Costs</p>
                        <p className="text-sm font-bold text-orange-700">
                          {crop.totalInputCosts > 0 ? `$${money(crop.totalInputCosts)}` : '—'}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-md py-1.5 px-2">
                        <p className="text-xs text-gray-500">Net Revenue</p>
                        <p className={`text-sm font-bold ${crop.netRevenue >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                          ${money(crop.netRevenue)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Farm total row */}
                <div className="border-2 border-[#27500A] rounded-lg p-3 space-y-2">
                  <span className="font-bold text-sm text-[#27500A]">Farm Total</span>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-[#EFF5E8] rounded-md py-1.5 px-2">
                      <p className="text-xs text-gray-500">Gross Revenue</p>
                      <p className="text-sm font-bold text-[#27500A]">${money(totalGrossRevenue)}</p>
                    </div>
                    <div className="bg-orange-50 rounded-md py-1.5 px-2">
                      <p className="text-xs text-gray-500">Input Costs</p>
                      <p className="text-sm font-bold text-orange-700">${money(totalInputCosts)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-md py-1.5 px-2">
                      <p className="text-xs text-gray-500">Net Revenue</p>
                      <p className={`text-sm font-bold ${totalNetRevenue >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                        ${money(totalNetRevenue)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Input costs = machinery + fertilizer + pesticide + seed ($/ac × acres).
              </p>
            </section>

            {/* Drought guidance */}
            <section className="bg-white rounded-xl shadow-sm p-5 space-y-3">
              <h2 className="font-bold text-[#27500A] text-base">Drought Guidance</h2>
              <p className="text-xs text-gray-400">
                Crop-specific advice based on current water cut and stress level.
              </p>
              <div className="space-y-3">
                {farm.crops.map(crop => (
                  <AdviceCard
                    key={crop.id}
                    cropType={crop.cropType}
                    acres={crop.acres}
                    advice={getCropDroughtAdvice(crop.cropType, waterCut, stressLevel)}
                  />
                ))}
              </div>
            </section>

            {/* Chart */}
            <section className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-bold text-[#27500A] text-base mb-4">Revenue by Crop</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={48} />
                  <Tooltip formatter={v => [`$${v.toLocaleString()}`, '']} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Gross Revenue" fill="#27500A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Input Costs"   fill="#f97316" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Net Revenue"   fill="#F1B300" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>

            {/* Total farm net revenue */}
            <div className="bg-[#27500A] text-white rounded-xl p-5">
              <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Total Farm Net Revenue</p>
              <p className="text-4xl font-bold">${money(totalNetRevenue)}</p>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-white/70">
                <span>Gross revenue: <span className="text-white font-medium">${money(totalGrossRevenue)}</span></span>
                <span>Input costs: <span className="text-white font-medium">−${money(totalInputCosts)}</span></span>
                <span>Drought loss vs. baseline: <span className="text-white font-medium">−${money(totalRevenueLoss)}</span></span>
              </div>
            </div>

            {/* Disclaimer */}
            <p className="text-xs text-gray-400 px-1">
              Alfalfa yield estimates based on Crookston et al. (2025) and Montazar &amp; Putnam (2023).
              All other crop estimates use USDA Idaho state averages and should be verified with your local extension office.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
