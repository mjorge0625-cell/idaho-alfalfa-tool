import { useState } from 'react'
import { useFarm } from '../context/FarmContext'
import { getYieldLoss, GRADE_PRICES } from '../lib/yieldLoss'
import PageHeader from '../components/PageHeader'
import { Link } from 'react-router-dom'

// ── cost row definitions ──────────────────────────────────────────────────────

const COST_ROWS = [
  { key: 'seed',            label: 'Seed' },
  { key: 'fertN',           label: 'Fertilizer — N' },
  { key: 'fertPK',          label: 'Fertilizer — P/K' },
  { key: 'pesticide',       label: 'Pesticide / Herbicide' },
  { key: 'irrigationLabor', label: 'Irrigation Labor' },
  { key: 'machinery',       label: 'Machinery' },
  { key: 'customHire',      label: 'Custom Hire' },
]

function defaultCosts(crop) {
  return {
    seed:            Number(crop.seedCostPerAcre)       || 0,
    fertN:           Number(crop.fertilizerCostPerAcre) || 0,
    fertPK:          0,
    pesticide:       Number(crop.pesticideCostPerAcre)  || 0,
    irrigationLabor: 0,
    machinery:       Number(crop.machineryCoastPerAcre) || 0,
    customHire:      0,
  }
}

// ── per-crop section (JSX under 80 lines) ────────────────────────────────────

function CropCostSection({ crop, cropCosts, onChange, waterCut, stressLevel }) {
  const acres        = Number(crop.acres) || 0
  const baseline     = Number(crop.baselineYield) || 0
  const price        = Number(crop.pricePerUnit) || GRADE_PRICES.good
  const lossPct      = getYieldLoss(crop.cropType, waterCut, stressLevel)
  const droughtYield = baseline * (1 - lossPct / 100)

  const totalPerAcre = COST_ROWS.reduce((s, r) => s + (Number(cropCosts[r.key]) || 0), 0)
  const totalForCrop = totalPerAcre * acres
  const breakevenPrice = droughtYield > 0 ? totalPerAcre / droughtYield : null
  const belowBreakeven = breakevenPrice != null && price > 0 && price < breakevenPrice

  const inp = 'w-24 text-right border border-gray-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a3a0a]'

  return (
    <section className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className="bg-[#EFF5E8] px-5 py-3 flex flex-wrap justify-between items-center gap-2">
        <h2 className="font-bold text-[#1a3a0a] text-base">{crop.cropType}</h2>
        <span className="text-sm text-gray-500">
          {acres.toLocaleString()} ac &nbsp;·&nbsp; {baseline} {crop.unit}/ac baseline
          {lossPct > 0 && <span className="text-red-500 ml-2">({lossPct.toFixed(1)}% drought loss)</span>}
        </span>
      </div>

      <div className="p-5 space-y-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left pb-2 text-gray-500 font-medium">Cost Item</th>
              <th className="text-right pb-2 text-gray-500 font-medium">$/ac</th>
              <th className="text-right pb-2 text-gray-500 font-medium hidden sm:table-cell">Total ($)</th>
            </tr>
          </thead>
          <tbody>
            {COST_ROWS.map(({ key, label }) => (
              <tr key={key} className="border-b border-gray-50">
                <td className="py-1.5 text-gray-700">{label}</td>
                <td className="py-1.5 text-right">
                  <input
                    type="number" min={0} step={0.01}
                    value={cropCosts[key] ?? 0}
                    onChange={e => onChange(key, e.target.value)}
                    className={inp}
                  />
                </td>
                <td className="py-1.5 text-right text-gray-500 hidden sm:table-cell">
                  ${((Number(cropCosts[key]) || 0) * acres).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="grid grid-cols-3 gap-3 text-center pt-1">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-0.5">Total $/ac</p>
            <p className="text-lg font-bold text-[#1a3a0a]">${totalPerAcre.toFixed(2)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 mb-0.5">Total for Crop</p>
            <p className="text-lg font-bold text-[#1a3a0a]">
              ${totalForCrop.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className={`rounded-lg p-3 ${belowBreakeven ? 'bg-red-50 border border-red-200' : 'bg-[#EFF5E8]'}`}>
            <p className="text-xs text-gray-500 mb-0.5">Breakeven Price</p>
            <p className={`text-lg font-bold ${belowBreakeven ? 'text-red-600' : 'text-[#1a3a0a]'}`}>
              {breakevenPrice != null
                ? `$${breakevenPrice.toFixed(2)}/${crop.unit}`
                : <span className="text-gray-400 text-sm">enter yield</span>}
            </p>
            {belowBreakeven && (
              <p className="text-xs text-red-500 mt-0.5">below mkt price</p>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function InputCosts() {
  const { farm } = useFarm()
  const [waterCut, setWaterCut] = useState(25)
  const [stressLevel, setStressLevel] = useState('moderate')

  // costs keyed by crop.id; new crops default lazily in getCosts()
  const [costs, setCosts] = useState(() =>
    Object.fromEntries(farm.crops.map(c => [c.id, defaultCosts(c)]))
  )

  // Return stored costs for a crop, falling back to FarmContext defaults for new crops
  function getCosts(crop) {
    return costs[crop.id] || defaultCosts(crop)
  }

  function handleChange(cropId, key, raw) {
    const val = raw === '' ? 0 : Math.max(0, Number(raw))
    setCosts(prev => ({
      ...prev,
      [cropId]: { ...(prev[cropId] || {}), [key]: val },
    }))
  }

  const hasCrops = farm.crops.length > 0

  // Farm-level totals
  const farmTotals = farm.crops.reduce((acc, crop) => {
    const c = getCosts(crop)
    const acres        = Number(crop.acres) || 0
    const baseline     = Number(crop.baselineYield) || 0
    const price        = Number(crop.pricePerUnit) || GRADE_PRICES.good
    const lossPct      = getYieldLoss(crop.cropType, waterCut, stressLevel)
    const droughtYield = baseline * (1 - lossPct / 100)
    const totalPerAcre = COST_ROWS.reduce((s, r) => s + (Number(c[r.key]) || 0), 0)

    acc.inputCosts  += totalPerAcre * acres
    acc.revenue     += droughtYield * acres * price
    return acc
  }, { inputCosts: 0, revenue: 0 })

  const netIncome = farmTotals.revenue - farmTotals.inputCosts
  const fmt = n => n.toLocaleString('en-US', { maximumFractionDigits: 0 })

  return (
    <div className="flex-1">
      <PageHeader
        title="Input Cost Summary"
        subtitle="Full cost picture per crop — with breakeven price at drought-adjusted yield."
      />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {!hasCrops && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center space-y-3">
            <p className="text-amber-800 font-semibold">No crops in your operation yet.</p>
            <Link to="/farm-setup"
              className="inline-block bg-[#1a3a0a] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#27500A] transition-colors">
              Go to Farm Setup →
            </Link>
          </div>
        )}

        {hasCrops && (
          <>
            {/* Drought scenario */}
            <section className="bg-white rounded-xl shadow-sm p-5 space-y-4">
              <h2 className="font-bold text-[#1a3a0a] text-base">Drought Scenario</h2>
              <div>
                <label className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                  <span>Water Cut</span>
                  <span className="font-bold text-[#1a3a0a]">{waterCut}%</span>
                </label>
                <input type="range" min={0} max={60} step={5} value={waterCut}
                  onChange={e => setWaterCut(Number(e.target.value))}
                  className="w-full accent-[#1a3a0a]" />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>0% (full water)</span><span>60% cut</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stress Level</label>
                <div className="flex gap-3">
                  {['moderate', 'severe'].map(level => (
                    <button key={level} onClick={() => setStressLevel(level)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-colors capitalize ${
                        stressLevel === level
                          ? 'bg-[#1a3a0a] text-white border-[#1a3a0a]'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-[#1a3a0a]'
                      }`}>
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Per-crop cost sections */}
            {farm.crops.map(crop => (
              <CropCostSection
                key={crop.id}
                crop={crop}
                cropCosts={getCosts(crop)}
                onChange={(key, val) => handleChange(crop.id, key, val)}
                waterCut={waterCut}
                stressLevel={stressLevel}
              />
            ))}

            {/* Farm totals */}
            <section className="bg-[#1a3a0a] text-white rounded-xl p-5 space-y-4">
              <h2 className="font-bold text-base">Farm Total</h2>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/60 text-xs mb-0.5">Total Input Costs</p>
                  <p className="text-xl font-bold">${fmt(farmTotals.inputCosts)}</p>
                </div>
                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/60 text-xs mb-0.5">Expected Revenue</p>
                  <p className="text-xl font-bold">${fmt(farmTotals.revenue)}</p>
                  <p className="text-white/40 text-xs">{waterCut}% water cut</p>
                </div>
                <div className={`rounded-lg p-3 ${netIncome >= 0 ? 'bg-[#F1B300]' : 'bg-red-500'}`}>
                  <p className={`text-xs mb-0.5 ${netIncome >= 0 ? 'text-[#1a3a0a]/70' : 'text-white/70'}`}>
                    Net Farm Income
                  </p>
                  <p className={`text-xl font-bold ${netIncome >= 0 ? 'text-[#1a3a0a]' : 'text-white'}`}>
                    ${fmt(netIncome)}
                  </p>
                </div>
              </div>
            </section>

            {/* Note */}
            <p className="text-xs text-gray-500 leading-relaxed px-1">
              <strong>Breakeven price</strong> is the minimum price per unit you need to cover input
              costs at your drought-adjusted yield. If market price falls below this, that crop loses
              money this season. Breakeven cell turns red when your entered price is below it.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
