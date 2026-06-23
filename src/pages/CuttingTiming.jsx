import { useState } from 'react'
import PageHeader from '../components/PageHeader'

const DROUGHT_ONSET = [
  { value: 'early', label: 'Early season (pre-bud / 1st cut)', icon: '🌱' },
  { value: 'mid', label: 'Mid-season (2nd–3rd cut)', icon: '☀️' },
  { value: 'late', label: 'Late season (4th cut+)', icon: '🍂' },
]

const PRIORITY = [
  { value: 'quality', label: 'Maximize forage quality (RFV/RFQ)', icon: '⭐' },
  { value: 'yield', label: 'Maximize total yield / tonnage', icon: '📦' },
  { value: 'stand', label: 'Preserve stand for next year', icon: '🌿' },
]

const RECOMMENDATIONS = {
  early: {
    quality: {
      headline: 'Cut at early bud, skip 1st cut if severe',
      detail: 'Under early-season severe drought, delaying the first cut to early bud allows the plant to recover limited moisture. Prioritize quality cuts during any brief recovery windows. Expect 30–43% yield loss.',
      tips: [
        'Cut at 10% bloom or earlier to protect RFV',
        'Consider skipping a cut entirely if stand looks poor',
        'Scout for tip burn — severe stress signal',
        'Reduce cutting frequency (6-week intervals vs 4)',
      ],
    },
    yield: {
      headline: 'Allow plants to reach full bud before cutting',
      detail: 'Let plants accumulate as much dry matter as possible before each cut. Under early drought, accept quality penalty in exchange for higher tonnage.',
      tips: [
        'Cut at 50–100% bloom to maximize dry matter',
        'Reduce number of cuts from 4 to 3 if water limited',
        'Monitor for fall dormancy break when water resumes',
      ],
    },
    stand: {
      headline: 'Defer cutting to preserve root carbohydrates',
      detail: 'Root carbohydrate reserves are critical for regrowth and winter survival. Under early drought, allow plants to accumulate reserves by deferring cuts.',
      tips: [
        'Allow 60-day rest after last fall cut',
        'Do not cut within 6 weeks of killing frost',
        'Consider fallow if stand is < 4 plants/sq ft',
        'Test soil moisture at 3 ft depth before irrigating',
      ],
    },
  },
  mid: {
    quality: {
      headline: 'Cut on time despite drought — quality at stake',
      detail: 'Mid-season drought stress reduces NDF and increases ADF in delayed cuts. Cut on schedule or slightly early to protect quality. Expect 15–32% yield loss at 40% water cut.',
      tips: [
        'Maintain 28–35 day cutting intervals',
        'Pre-cut quality testing recommended if selling premium',
        'Swath when temps are moderate (avoid heat stress)',
      ],
    },
    yield: {
      headline: 'Extend intervals slightly — target full bud',
      detail: 'Allow slight maturity advance (10–25% bloom) during mid-season drought. This extends dry matter accumulation window without severe quality loss.',
      tips: [
        'Target 10% bloom vs. pre-bud',
        'Cut 3 times instead of 4 if water severely limited',
        'Save highest-quality water for the best-yielding fields',
      ],
    },
    stand: {
      headline: 'Balance stress — avoid cutting stressed stands short',
      detail: 'Mid-season drought already depletes root reserves. Cutting too low or too frequently during drought stresses the stand and risks winterkill.',
      tips: [
        'Raise cutting height to 3–4 inches',
        'Avoid cutting within 4 weeks of frost',
        'Consider fertility response — stress + low K = stand risk',
      ],
    },
  },
  late: {
    quality: {
      headline: 'Cut final crop at early flower for best quality',
      detail: 'Late-season drought typically causes less yield loss (6–18% at 25–40% water cut). The final cut quality is critical for winter feeding if hay is stored.',
      tips: [
        'Test RFQ before selling — late drought hay often grades higher',
        'Condition properly — stressed stems cure faster',
        'Target late September final cut in southern Idaho',
      ],
    },
    yield: {
      headline: 'Consider skipping final cut to save stand',
      detail: 'Under late-season drought, skipping the last cut allows root carbohydrate recovery and improves winter hardiness. Revenue loss from skipping is lower than stand replacement.',
      tips: [
        'Skip final cut if < 4 weeks before killing frost',
        'Irrigate post-cut if any water available — root recovery',
        'Calculate: skip-cut loss vs. stand reseeding cost ($300–500/ac)',
      ],
    },
    stand: {
      headline: 'Do NOT cut within 6 weeks of killing frost',
      detail: 'The most critical decision under late drought. Cutting removes carbohydrate reserves right before winter, maximizing stand loss risk. Yield of skipped cut is trivial vs. replanting cost.',
      tips: [
        'Hard rule: no cut within 6 weeks of first frost',
        'First frost date in southern Idaho: mid-October',
        'Leave 6+ inch stubble if you must cut',
        'Apply fall fertility (K, S) to support recovery',
      ],
    },
  },
}

export default function CuttingTiming() {
  const [drought, setDrought] = useState('mid')
  const [priority, setPriority] = useState('quality')

  const rec = RECOMMENDATIONS[drought][priority]

  return (
    <div className="flex-1">
      <PageHeader
        title="Cutting Timing"
        subtitle="Get cutting recommendations based on when drought hits and your operation's priority."
      />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Drought onset */}
        <section className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h2 className="font-bold text-[#27500A] text-base">When did/will drought start?</h2>
          <div className="space-y-2">
            {DROUGHT_ONSET.map(({ value, label, icon }) => (
              <button key={value} onClick={() => setDrought(value)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-colors ${
                  drought === value ? 'border-[#27500A] bg-[#EFF5E8]' : 'border-gray-200 hover:border-gray-300'
                }`}>
                <span className="text-xl">{icon}</span>
                <span className={`text-sm font-medium ${drought === value ? 'text-[#27500A]' : 'text-gray-700'}`}>{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Priority */}
        <section className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h2 className="font-bold text-[#27500A] text-base">What's your primary goal?</h2>
          <div className="space-y-2">
            {PRIORITY.map(({ value, label, icon }) => (
              <button key={value} onClick={() => setPriority(value)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-colors ${
                  priority === value ? 'border-[#F1B300] bg-amber-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                <span className="text-xl">{icon}</span>
                <span className={`text-sm font-medium ${priority === value ? 'text-amber-900' : 'text-gray-700'}`}>{label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Recommendation */}
        <section className="bg-[#27500A] text-white rounded-xl p-5 space-y-4">
          <div>
            <p className="text-white/60 text-xs uppercase tracking-wide mb-1">Recommendation</p>
            <h3 className="text-lg font-bold leading-snug">{rec.headline}</h3>
          </div>
          <p className="text-white/80 text-sm leading-relaxed">{rec.detail}</p>
          <div>
            <p className="text-[#F1B300] text-xs font-bold uppercase tracking-wide mb-2">Action Items</p>
            <ul className="space-y-1.5">
              {rec.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-white/90">
                  <span className="text-[#F1B300] mt-0.5 shrink-0">›</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* General guidelines */}
        <section className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h2 className="font-bold text-[#27500A] text-base">General Drought Cutting Guidelines</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex gap-2">
              <span className="text-[#27500A] font-bold shrink-0">↑</span>
              <span>Raise cutting height by 1–2 inches during drought stress to preserve more leaf area and speed regrowth.</span>
            </div>
            <div className="flex gap-2">
              <span className="text-[#27500A] font-bold shrink-0">⏱</span>
              <span>Extend rest periods by 5–10 days during severe heat or drought to allow carbohydrate recovery.</span>
            </div>
            <div className="flex gap-2">
              <span className="text-[#27500A] font-bold shrink-0">🌡</span>
              <span>Avoid cutting when air temps exceed 100°F — heat stress on fresh stubble multiplies drought damage.</span>
            </div>
            <div className="flex gap-2">
              <span className="text-[#27500A] font-bold shrink-0">💧</span>
              <span>If water is available after cutting, apply irrigation within 24–48 hours to promote fast regrowth.</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
