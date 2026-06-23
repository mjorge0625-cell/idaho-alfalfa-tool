import { Link } from 'react-router-dom'
import OnboardingOverlay from '../components/OnboardingOverlay'

const TOOLS = [
  {
    to: '/farm-setup',
    icon: '🌾',
    title: 'Farm Setup',
    desc: 'Enter your crops, acres, baseline yields, and nearest AgriMet weather station.',
  },
  {
    to: '/yield',
    icon: '📉',
    title: 'Yield Calculator',
    desc: 'Estimate alfalfa yield loss from water cuts under moderate or severe drought stress.',
  },
  {
    to: '/water',
    icon: '💧',
    title: 'Water Strategy',
    desc: 'Compare triage, spread-thin, and partial-season irrigation allocation strategies.',
  },
  {
    to: '/revenue',
    icon: '💰',
    title: 'Revenue & Quality',
    desc: 'Find the breakeven for upgrading hay grade using Feuz et al. 2025 price structure.',
  },
  {
    to: '/cutting',
    icon: '✂️',
    title: 'Cutting Timing',
    desc: 'Get cut timing recommendations based on when drought hits and your priority.',
  },
  {
    to: '/dashboard',
    icon: '📊',
    title: 'Farm Dashboard',
    desc: 'See your whole operation under drought — all crops, input costs, and net revenue.',
  },
  {
    to: '/machinery',
    icon: '🚜',
    title: 'Machinery Costs',
    desc: 'Calculate per-acre ownership and operating costs for any power unit and implement pair.',
  },
]

const STEPS = [
  {
    n: '1',
    text: 'Start with <strong>Farm Setup</strong> to enter your crops, acres, and nearest AgriMet station. This data carries through all calculators.',
  },
  {
    n: '2',
    text: 'Use the <strong>Yield Calculator</strong> to see expected loss for different water cut scenarios.',
  },
  {
    n: '3',
    text: 'Compare allocation strategies in <strong>Water Strategy</strong>, then check grade tradeoffs in <strong>Revenue &amp; Quality</strong>.',
  },
  {
    n: '4',
    text: 'Review your whole operation in the <strong>Farm Dashboard</strong>.',
  },
]

export default function Home() {
  return (
    <div className="flex-1">
      <OnboardingOverlay />

      {/* Hero */}
      <div className="bg-[#1a3a0a] text-white px-4 py-14 sm:py-20">
        <div className="max-w-2xl mx-auto text-center space-y-5">
          <div className="inline-block border border-[#F1B300]/50 text-[#F1B300] text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-widest">
            University of Idaho Extension
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight">
            Know your numbers<br className="hidden sm:block" /> before drought hits.
          </h1>
          <p className="text-white/70 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Free decision tools for western U.S. crop producers — yield loss, water allocation,
            quality tradeoffs, and whole-farm net revenue.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              to="/farm-setup"
              className="bg-[#F1B300] text-[#1a3a0a] font-bold px-7 py-3 rounded-lg text-base hover:bg-[#C99700] transition-colors shadow-md"
            >
              Set Up My Farm →
            </Link>
            <a
              href="#tools"
              className="border-2 border-white/40 text-white font-semibold px-7 py-3 rounded-lg text-base hover:border-white hover:bg-white/5 transition-colors"
            >
              View Tools
            </a>
          </div>
        </div>
      </div>

      {/* Research disclaimer */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center">
        <p className="text-amber-800 text-xs">
          Based on peer-reviewed research (Feuz et al. 2025; Crookston et al. 2025; Montazar &amp; Putnam 2020, 2023).
          &nbsp;<strong>Does not replace agronomic consultation.</strong>
        </p>
      </div>

      {/* Tool cards */}
      <div id="tools" className="max-w-5xl mx-auto px-4 py-10">
        <h2 className="text-base font-semibold text-gray-500 uppercase tracking-widest mb-5">
          Available Calculators
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TOOLS.map(({ to, icon, title, desc }) => (
            <Link
              key={to}
              to={to}
              className="bg-white rounded-xl border border-gray-200 border-l-4 border-l-[#F1B300] shadow-sm p-5 hover:shadow-md hover:border-l-[#1a3a0a] transition-all flex flex-col gap-2.5 group"
            >
              <span className="text-2xl">{icon}</span>
              <h3 className="font-bold text-[#1a3a0a] text-base group-hover:text-[#F1B300] transition-colors">
                {title}
              </h3>
              <p className="text-gray-500 text-sm leading-snug">{desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-5xl mx-auto px-4 pb-12">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-[#1a3a0a] text-base mb-4 flex items-center gap-2">
            <span className="w-1 h-5 rounded-full bg-[#F1B300] inline-block"></span>
            How to use this tool
          </h2>
          <ol className="space-y-3">
            {STEPS.map(({ n, text }) => (
              <li key={n} className="flex gap-3 items-start">
                <span className="shrink-0 w-6 h-6 rounded-full bg-[#1a3a0a] text-white text-xs flex items-center justify-center font-bold mt-0.5">
                  {n}
                </span>
                <span
                  className="text-sm text-gray-600 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: text }}
                />
              </li>
            ))}
          </ol>
        </div>
      </div>

    </div>
  )
}
