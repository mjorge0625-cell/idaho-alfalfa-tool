import { useState } from 'react'
import { Link } from 'react-router-dom'

const CROPS = ['Alfalfa','Corn','Wheat','Potatoes','Other']
const WATER = ['Full','Some','Very Little']
const r = (color, title, impact, bullets, link) => ({ color, title, impact, bullets, link })

const RECS = {
  'Alfalfa-Full':        r('green',  'Full production season',           '0–4% loss',    ['Irrigate to full ET; 5–6.6 in/ton in Idaho', 'Spring cuttings = 35–38% of annual yield', 'Scout for pests between cuttings'], '/yield'),
  'Alfalfa-Some':        r('yellow', 'Mild deficit — time it right',     '6–18% loss',   ['Focus water on 1st & 2nd cuttings', 'Each 1 in. below ET target ≈ 0.17 ton/acre loss', 'Delay last cutting to save water'], '/water'),
  'Alfalfa-Very Little': r('red',    'Triage — protect spring cuts',     '22–54% loss',  ['Fully irrigate through 2nd cutting, then cut off', 'Saves 1–2 ton/ac vs. starvation diet', 'Run full yield calc before skipping cuts'], '/water'),
  'Corn-Full':           r('green',  'Normal corn season',               '0–3% loss',    ['Full ET replacement; standard management', 'No yield impact expected', 'Monitor soil moisture weekly'], '/yield'),
  'Corn-Some':           r('orange', 'Critical-stage deficit risk',      '15–30% loss',  ['Never stress during silking (VT/R1)', 'Pre-tassel deficit OK; never at pollination', 'Drip/subsurface saves 15–25% water with < 5% loss'], '/yield'),
  'Corn-Very Little':    r('red',    'Severe stress risk',               '30–65% loss',  ['Protect pollination at all costs', 'Consider silage if grain crop looks to fail', 'Evaluate early termination if water < 40% of need'], '/dashboard'),
  'Wheat-Full':          r('green',  'Normal wheat season',              '0–3% loss',    ['Full ET; prioritize boot-to-soft-dough stage', 'No yield impact expected', 'Scout for aphids and fungal disease'], '/yield'),
  'Wheat-Some':          r('yellow', 'Protect heading and grain fill',   '10–25% loss',  ['Boot to heading is the most sensitive stage', 'Maintain 50%+ available soil moisture at heading', 'Moderate deficit at grain fill = 10–20% yield loss'], '/yield'),
  'Wheat-Very Little':   r('yellow', 'Concentrate water at heading',     '20–30% loss',  ['Skip pre-plant if soil profile is full', 'Apply all remaining water from boot to soft dough', 'Expect reduced test weight and protein'], '/yield'),
  'Potatoes-Full':       r('green',  'Normal potato season',             '0–3% loss',    ['Full ET; monitor at 8–12 in. soil depth', 'No deficit allowed at tuber initiation or bulking', 'Use canopy temp to detect early stress'], '/yield'),
  'Potatoes-Some':       r('orange', 'Tuber quality at high risk',       '25–45% loss',  ['Never stress during tuber initiation or bulking', 'Deficit at sizing = knobby tubers and quality dock', 'Check processing contract before reducing water'], '/dashboard'),
  'Potatoes-Very Little':r('red',    'Review processing contract now',   '40–60% loss',  ['Potatoes are highly sensitive to any deficit', 'Prioritize tuber initiation phase completely', 'Review crop insurance terms immediately'], '/dashboard'),
  'Other-Full':          r('green',  'Normal season',                    '0–3% loss',    ['Full ET replacement; standard management', 'No yield impact expected at full water', 'Monitor soil moisture weekly'], '/yield'),
  'Other-Some':          r('yellow', 'Moderate deficit planning',        '10–30% loss',  ['Use the full calculator for your specific crop', 'Apply water at most sensitive growth stages first', 'Contact your extension office for crop guidance'], '/dashboard'),
  'Other-Very Little':   r('orange', 'Severe deficit — full analysis',   '25–60% loss',  ['Open Farm Dashboard for multi-crop planning', 'Prioritize highest-value or contracted acres', 'Consider crop insurance implications early'], '/dashboard'),
}

const CHIP = { green: ['#16a34a','Low Risk'], yellow: ['#ca8a04','Caution'], orange: ['#c2410c','High Risk'], red: ['#dc2626','Critical'] }
const BG   = { green: '#f0fdf4', yellow: '#fefce8', orange: '#fff7ed', red: '#fef2f2' }
const BORDER = { green: '#86efac', yellow: '#fde047', orange: '#fdba74', red: '#fca5a5' }
const TEXT = { green: '#14532d', yellow: '#713f12', orange: '#7c2d12', red: '#7f1d1d' }

export default function QuickCheck() {
  const [crop, setCrop]   = useState(null)
  const [water, setWater] = useState(null)
  const rec = crop && water ? RECS[`${crop}-${water}`] : null

  return (
    <div className="min-h-screen bg-[#EFF5E8] flex flex-col items-center py-8 px-4">
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}.fade-up{animation:fadeUp .25s ease}`}</style>
      <div style={{ maxWidth: 400, width: '100%' }} className="space-y-5">

        <div className="text-center pb-1">
          <h1 className="text-2xl font-extrabold text-[#1a3a0a]">⚡ Quick Check</h1>
          <p className="text-sm text-gray-500 mt-1">Field drought decisions in seconds</p>
        </div>

        <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Water available this season?</p>
          <div className="grid grid-cols-3 gap-2">
            {WATER.map(w => (
              <button key={w} onClick={() => setWater(w)} style={{ minHeight: 56 }}
                className={`rounded-xl text-sm font-semibold transition-all ${water === w ? 'bg-[#1a3a0a] text-white shadow-md' : 'bg-gray-100 text-gray-700 active:bg-gray-200'}`}>
                {w}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Primary crop?</p>
          <div className="grid grid-cols-3 gap-2">
            {CROPS.map(c => (
              <button key={c} onClick={() => setCrop(c)} style={{ minHeight: 56 }}
                className={`rounded-xl text-sm font-semibold transition-all ${crop === c ? 'bg-[#F1B300] text-[#1a3a0a] shadow-md' : 'bg-gray-100 text-gray-700 active:bg-gray-200'}`}>
                {c}
              </button>
            ))}
          </div>
        </section>

        {rec && (
          <div key={`${crop}-${water}`} className="fade-up rounded-2xl border-2 p-5 space-y-3"
            style={{ background: BG[rec.color], borderColor: BORDER[rec.color] }}>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wide text-white px-2.5 py-1 rounded-full"
                style={{ background: CHIP[rec.color][0] }}>{CHIP[rec.color][1]}</span>
              <span className="text-xs font-semibold" style={{ color: TEXT[rec.color] }}>{rec.impact}</span>
            </div>
            <p className="font-bold text-base leading-snug" style={{ color: TEXT[rec.color] }}>{rec.title}</p>
            <ul className="space-y-1.5">
              {rec.bullets.map((b, i) => (
                <li key={i} className="text-sm flex gap-2" style={{ color: TEXT[rec.color] }}>
                  <span className="shrink-0 mt-0.5">•</span><span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-4 pt-2 items-center">
              <Link to={rec.link} className="text-sm font-bold text-[#1a3a0a] underline underline-offset-2">
                See full calculator →
              </Link>
              <button onClick={() => { setCrop(null); setWater(null) }} className="text-sm text-gray-400 hover:text-gray-600">
                Start over
              </button>
            </div>
          </div>
        )}

        {!rec && (
          <p className="text-center text-sm text-gray-400 pt-2">
            {!water && !crop ? 'Select water level and crop above' : !water ? 'Select water availability above' : 'Select your crop above'}
          </p>
        )}

      </div>
    </div>
  )
}
