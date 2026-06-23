import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getYieldLossPct } from '../lib/yieldLoss'
import { useFarm } from '../context/FarmContext'
import PageHeader from '../components/PageHeader'

export default function WaterStrategy() {
  const { farm } = useFarm()
  const alfalfa = farm.crops.find(c => c.cropType === 'Alfalfa')

  const [totalAcres, setTotalAcres] = useState(Number(alfalfa?.acres) || 200)
  const [baselineYield, setBaselineYield] = useState(Number(alfalfa?.baselineYield) || 7)
  const [price, setPrice] = useState(Number(alfalfa?.pricePerUnit) || 249)
  const [waterAvailPct, setWaterAvailPct] = useState(60)
  const [stressLevel, setStressLevel] = useState('moderate')

  // Strategy 1: Triage — irrigate waterAvailPct of acres fully, fallow the rest
  const triageAcres = Math.round(totalAcres * (waterAvailPct / 100))
  const triageRevenue = triageAcres * baselineYield * price

  // Strategy 2: Spread thin — all acres get waterAvailPct water
  const spreadCut = 100 - waterAvailPct
  const spreadLossPct = getYieldLossPct(spreadCut, stressLevel)
  const spreadYield = baselineYield * (1 - spreadLossPct / 100)
  const spreadRevenue = totalAcres * spreadYield * price

  // Strategy 3: Partial season — irrigate fully for first half, cut off second half
  const partialAcres = totalAcres
  const partialCut = 35
  const partialLoss = getYieldLossPct(partialCut, stressLevel)
  const partialYield = baselineYield * (1 - partialLoss / 100)
  const partialRevenue = partialAcres * partialYield * price

  const chartData = [
    { name: 'Triage\n(fewer acres)', revenue: Math.round(triageRevenue), fill: '#27500A' },
    { name: 'Spread thin\n(all acres)', revenue: Math.round(spreadRevenue), fill: '#F1B300' },
    { name: 'Partial season', revenue: Math.round(partialRevenue), fill: '#3a7010' },
  ]

  const best = chartData.reduce((a, b) => (b.revenue > a.revenue ? b : a))

  return (
    <div className="flex-1">
      <PageHeader
        title="Water Strategy"
        subtitle="Compare triage, spread-thin, and partial-season approaches under limited water."
      />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Inputs */}
        <section className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <h2 className="font-bold text-[#27500A] text-base">Inputs</h2>

          <div>
            <label className="flex justify-between text-sm font-medium text-gray-700 mb-1">
              <span>Water Available (% of normal)</span>
              <span className="font-bold text-[#27500A]">{waterAvailPct}%</span>
            </label>
            <input
              type="range" min={20} max={100} step={5}
              value={waterAvailPct}
              onChange={e => setWaterAvailPct(Number(e.target.value))}
              className="w-full accent-[#27500A]"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Total Acres</label>
              <input type="number" min={1} value={totalAcres}
                onChange={e => setTotalAcres(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#27500A]" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Baseline (t/ac)</label>
              <input type="number" min={0} step={0.1} value={baselineYield}
                onChange={e => setBaselineYield(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#27500A]" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Price ($/ton)</label>
              <input type="number" min={0} value={price}
                onChange={e => setPrice(Number(e.target.value))}
                className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#27500A]" />
            </div>
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

        {/* Best pick banner */}
        <div className="bg-[#27500A] text-white rounded-xl px-5 py-4 flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div>
            <p className="font-bold text-sm">Highest revenue: {best.name.replace('\n', ' ')}</p>
            <p className="text-white/80 text-xs">${best.revenue.toLocaleString()} estimated — based on your inputs and research yield-loss curves.</p>
          </div>
        </div>

        {/* Strategy comparison */}
        <section className="bg-white rounded-xl shadow-sm p-5 space-y-4">
          <h2 className="font-bold text-[#27500A] text-base">Strategy Comparison</h2>

          <div className="space-y-3">
            {[
              {
                name: 'Triage (fewer acres, full water)',
                acres: triageAcres,
                yield: baselineYield,
                revenue: triageRevenue,
                desc: `Irrigate ${triageAcres} of ${totalAcres} ac fully. Remaining acres fallowed.`,
              },
              {
                name: 'Spread thin (all acres, reduced water)',
                acres: totalAcres,
                yield: spreadYield,
                revenue: spreadRevenue,
                desc: `All ${totalAcres} ac receive ${waterAvailPct}% water. ${spreadLossPct.toFixed(1)}% yield loss expected.`,
              },
              {
                name: 'Partial season',
                acres: totalAcres,
                yield: partialYield,
                revenue: partialRevenue,
                desc: `Full water early season, cut off later (~35% overall water cut). ${partialLoss.toFixed(1)}% yield loss.`,
              },
            ].map(s => (
              <div key={s.name} className={`border rounded-lg p-4 ${s.revenue === best.revenue ? 'border-[#27500A] bg-[#EFF5E8]' : 'border-gray-200'}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-sm text-[#27500A]">{s.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className="font-bold text-[#27500A] text-base">${Math.round(s.revenue).toLocaleString()}</p>
                    <p className="text-xs text-gray-400">{s.yield.toFixed(2)} t/ac</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Chart */}
        <section className="bg-white rounded-xl shadow-sm p-5">
          <h2 className="font-bold text-[#27500A] text-base mb-4">Revenue by Strategy</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} width={48} />
              <Tooltip formatter={v => [`$${v.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>
    </div>
  )
}
