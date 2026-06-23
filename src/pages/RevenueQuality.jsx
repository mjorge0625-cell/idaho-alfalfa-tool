import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { GRADE_PRICES, getYieldLossPct } from '../lib/yieldLoss'
import { useFarm } from '../context/FarmContext'
import PageHeader from '../components/PageHeader'

const GRADES = ['utility', 'good', 'premium', 'supreme']

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

  const currentPrice = GRADE_PRICES[currentGrade]
  const targetPrice = GRADE_PRICES[targetGrade]

  const lossPct = getYieldLossPct(waterCut, stressLevel)
  const droughtYield = baselineYield * (1 - lossPct / 100)

  const currentRevenue = droughtYield * acres * currentPrice
  const targetRevenue = droughtYield * acres * targetPrice
  const upgradeCost = upgradeCostPerAcre * acres
  const netUpgradeGain = targetRevenue - currentRevenue - upgradeCost

  const gradeChartData = GRADES.map(g => ({
    grade: g.charAt(0).toUpperCase() + g.slice(1),
    revenue: Math.round(droughtYield * acres * GRADE_PRICES[g]),
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
        {/* Grade prices reference */}
        <section className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-bold text-[#27500A] text-base mb-3">Alfalfa Grade Prices (Feuz et al. 2025)</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {GRADES.map(g => (
              <div key={g} className={`rounded-lg p-3 text-center border-2 ${
                g === currentGrade ? 'border-[#27500A] bg-[#EFF5E8]' : 'border-gray-100 bg-gray-50'
              }`}>
                <p className="text-xs text-gray-500 capitalize">{g}</p>
                <p className="text-lg font-bold text-[#27500A]">${GRADE_PRICES[g]}</p>
                <p className="text-xs text-gray-400">/ton</p>
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
                {GRADES.map(g => <option key={g} value={g} className="capitalize">{g.charAt(0).toUpperCase() + g.slice(1)} — ${GRADE_PRICES[g]}/ton</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Target Grade</label>
              <select value={targetGrade} onChange={e => setTargetGrade(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#27500A]">
                {GRADES.map(g => <option key={g} value={g} className="capitalize">{g.charAt(0).toUpperCase() + g.slice(1)} — ${GRADE_PRICES[g]}/ton</option>)}
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
