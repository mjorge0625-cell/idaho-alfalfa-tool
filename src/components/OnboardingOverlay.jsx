import { useState } from 'react'

const KEY = 'hasSeenOnboarding'

const STEPS = [
  'Start in Farm Setup — add each crop you grow, your acres, and your nearest weather station. You can add as many crops as you run.',
  'Each calculator then uses your farm data automatically — no re-entering numbers.',
  'The Farm Dashboard compiles everything: revenue, costs, and drought impact across your whole operation in one place.',
]

export default function OnboardingOverlay() {
  const [visible, setVisible] = useState(() => !localStorage.getItem(KEY))

  function dismiss() {
    localStorage.setItem(KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
        <h2 className="font-bold text-xl text-[#1a3a0a] leading-snug">
          Welcome to the Idaho Alfalfa Decision Tool
        </h2>
        <ol className="space-y-3">
          {STEPS.map((text, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="shrink-0 w-6 h-6 rounded-full bg-[#F1B300] text-[#1a3a0a] text-xs font-bold flex items-center justify-center mt-0.5">
                {i + 1}
              </span>
              <span className="text-sm text-gray-700 leading-snug">{text}</span>
            </li>
          ))}
        </ol>
        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={dismiss}
            className="w-full bg-[#F1B300] text-[#1a3a0a] font-bold py-2.5 rounded-lg text-sm hover:bg-[#C99700] transition-colors"
          >
            Got it, let's go
          </button>
          <button
            onClick={dismiss}
            className="text-gray-400 text-xs hover:text-gray-600 transition-colors py-1"
          >
            Skip and don't show again
          </button>
        </div>
      </div>
    </div>
  )
}
