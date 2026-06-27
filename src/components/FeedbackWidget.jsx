import { useState } from 'react'

const INITIAL = { type: '', message: '', name: '' }

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(INITIAL)
  const [status, setStatus] = useState('idle') // idle | sending | success | error

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function submit(e) {
    e.preventDefault()
    setStatus('sending')
    try {
      const res = await fetch('https://formspree.io/f/mvzjaqdq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ type: form.type, message: form.message, name: form.name || 'Anonymous' }),
      })
      if (!res.ok) throw new Error()
      setStatus('success')
      setTimeout(() => { setOpen(false); setStatus('idle'); setForm(INITIAL) }, 3000)
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-3">
      {open && (
        <div className="bg-white rounded-xl shadow-2xl w-80 p-5 border border-gray-200">
          {status === 'success' ? (
            <p className="text-sm text-[#1a3a0a] font-medium text-center py-4">
              Thanks! Your feedback helps us build a better tool for Idaho producers.
            </p>
          ) : (
            <>
              <h3 className="font-bold text-[#1a3a0a] text-base">Share your feedback</h3>
              <p className="text-xs text-gray-500 mt-0.5 mb-4">Help us improve this tool for producers</p>

              <form onSubmit={submit} className="flex flex-col gap-3">
                <select
                  required
                  value={form.type}
                  onChange={set('type')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1a3a0a]"
                >
                  <option value="" disabled>What type of feedback?</option>
                  <option>Suggest a feature</option>
                  <option>Report something broken</option>
                  <option>Missing crop or data</option>
                  <option>General comment</option>
                </select>

                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={set('message')}
                  placeholder="What would make this tool more useful for your operation?"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-[#1a3a0a]"
                />

                <input
                  type="text"
                  value={form.name}
                  onChange={set('name')}
                  placeholder="Your name (optional)"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1a3a0a]"
                />

                {status === 'error' && (
                  <p className="text-xs text-red-600">
                    Couldn't send — please email your feedback to m.jorge0625@gmail.com
                  </p>
                )}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="bg-[#1a3a0a] hover:bg-[#2a5510] text-white font-semibold text-sm py-2 rounded-lg transition-colors disabled:opacity-60"
                >
                  {status === 'sending' ? 'Sending…' : 'Send feedback'}
                </button>
              </form>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => { setOpen(o => !o); setStatus('idle') }}
        className="bg-[#F1B300] hover:bg-[#d9a100] text-[#1a3a0a] font-semibold text-sm px-4 py-2.5 rounded-full shadow-lg transition-colors"
      >
        💬 Feedback
      </button>
    </div>
  )
}
