import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { getYieldLossPct, getYieldLossRange } from '../lib/yieldLoss'
import { useFarm } from '../context/FarmContext'
import PageHeader from '../components/PageHeader'

function getRecommendations(waterCut, stressLevel) {
  if (stressLevel === 'severe' || waterCut > 40) {
    return [
      'Critical shortage. Use the triage strategy — fully irrigate your best acres and fallow the rest.',
      'Do not spread water thin across all acres at this severity.',
      'Protect stand survival: monitor soil moisture at 45–120 cm depth.',
    ]
  }
  if (waterCut <= 10) {
    return [
      'Your yield impact is minimal. No major changes needed — maintain normal cutting schedule.',
    ]
  }
  if (waterCut <= 25) {
    return [
      'Prioritize full irrigation on cuts 1–3 (they represent 70%+ of your annual yield). Deficit irrigate cuts 5–7.',
      'Consider harvesting cut 4 slightly early to boost quality grade.',
    ]
  }
  // 25–40%, moderate
  return [
    'Run the Water Strategy calculator to decide whether triage (fallow some acres) or spread-thin makes more sense for your operation.',
    'Cutting early in the season at bud stage rather than 10% bloom can recover quality premiums even as tons drop.',
  ]
}

const CHART_DATA = Array.from({ length: 11 }, (_, i) => {
  const cut = i * 5
  const { moderate, severe } = getYieldLossRange(cut)
  return { cut, moderate: +moderate.toFixed(1), severe: +severe.toFixed(1) }
})

export default function YieldCalculator() {
  const { farm } = useFarm()
  const alfalfa = farm.crops.find(c => c.cropType === 'Alfalfa')

  const [waterCut, setWaterCut] = useState(25)
  const [stressLevel, setStressLevel] = useState('moderate')
  const [acres, setAcres] = useState(alfalfa?.acres || 100)
  const [baselineYield, setBaselineYield] = useState(alfalfa?.baselineYield || 7)
  const [price, setPrice] = useState(alfalfa?.pricePerUnit || 249)

  const lossPct = getYieldLossPct(waterCut, stressLevel)
  const yieldLoss = (baselineYield * lossPct) / 100
  const actualYield = baselineYield - yieldLoss
  const revenueLoss = yieldLoss * acres * price
  const totalRevenue = actualYield * acres * price

  return (
    <div className="flex-1">
      <PageHeader
        title="Yield Calculator"
        subtitle="Estimate alfalfa yield loss based on water cut percentage and drought stress level."
      />

      {!alfalfa && (
        <div className="max-w-2xl mx-auto px-4 pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
            No alfalfa entered in Farm Setup — using manual inputs below. Add alfalfa in Farm Setup to auto-populate.
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Inputs */}
        <section className="bg-white rounded-xl shadow-sm p-5 space-y-5">
          <h2 className="font-bold text-[#27500A] text-base">Inputs</h2>

          <div>
            <label className="flex justify-between text-sm font-medium text-gray-700 mb-1">
              <span>Water Cut</span>
              <span className="font-bold text-[#27500A]">{waterCut}%</span>
            </label>
            <input
              type="range" min={0} max={60} step={1}
              value={waterCut}
              onChange={e => setWaterCut(Number(e.target.value))}
              className="w-full accent-[#27500A]"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>0% (full water)</span><span>60% cut</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Drought Stress Level</label>
            <div className="flex gap-3">
              {['moderate', 'severe'].map(level => (
                <button
                  key={level}
                  onClick={() => setStressLevel(level)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold border-2 transition-colors capitalize ${
                    stressLevel === level
                      ? 'bg-[#27500A] text-white border-[#27500A]'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-[#27500A]'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Severe = deficit started early in the season or chronic; Moderate = late-season or partial-season deficit.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Acres</label>
              <input
                type="number" min={1} value={acres}
                onChange={e => setAcres(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#27500A]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Baseline Yield (ton/ac)</label>
              <input
                type="number" min={0} step={0.1} value={baselineYield}
                onChange={e => setBaselineYield(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#27500A]"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Price ($/ton)</label>
              <input
                type="number" min={0} step={1} value={price}
                onChange={e => setPrice(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#27500A]"
              />
            </div>
          </div>
        </section>

        {/* Results */}
        <section className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h2 className="font-bold text-[#27500A] text-base">Results</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Yield Loss', value: `${lossPct.toFixed(1)}%`, sub: 'of baseline' },
              { label: 'Actual Yield', value: `${actualYield.toFixed(2)} t/ac`, sub: `from ${baselineYield} t/ac` },
              { label: 'Revenue Loss', value: `$${revenueLoss.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, sub: `across ${acres} ac` },
              { label: 'Expected Revenue', value: `$${totalRevenue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, sub: 'this scenario' },
            ].map(({ label, value, sub }) => (
              <div key={label} className="bg-[#EFF5E8] rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-0.5">{label}</p>
                <p className="text-lg font-bold text-[#27500A]">{value}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400">
            Source: Crookston et al. 2025; Montazar &amp; Putnam 2020, 2023. Linear interpolation between research breakpoints.
          </p>
        </section>

        {/* What to do */}
        {(() => {
          const recs = getRecommendations(waterCut, stressLevel)
          const urgent = stressLevel === 'severe' || waterCut > 40
          return (
            <section className={`rounded-xl p-5 space-y-3 ${urgent ? 'bg-red-50 border border-red-200' : 'bg-[#EFF5E8] border border-[#27500A]/20'}`}>
              <h2 className={`font-bold text-base ${urgent ? 'text-red-800' : 'text-[#27500A]'}`}>
                {urgent ? '⚠ What to do now' : 'What to do'}
              </h2>
              <ul className="space-y-2">
                {recs.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className={`shrink-0 mt-0.5 font-bold ${urgent ? 'text-red-500' : 'text-[#27500A]'}`}>›</span>
                    <span className={urgent ? 'text-red-900' : 'text-gray-700'}>{rec}</span>
                  </li>
                ))}
              </ul>
            </section>
          )
        })()}

        {/* Chart */}
        <section className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-bold text-[#27500A] text-base mb-4">Yield Loss Curve</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={CHART_DATA} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="cut" tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} label={{ value: 'Water Cut %', position: 'insideBottom', offset: -2, fontSize: 11 }} />
              <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11 }} width={38} />
              <Tooltip formatter={(v) => [`${v}%`, '']} labelFormatter={l => `Water cut: ${l}%`} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="moderate" name="Moderate stress" stroke="#27500A" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="severe" name="Severe stress" stroke="#F1B300" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </section>
      </div>
    </div>
  )
}
