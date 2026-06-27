import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'

const NAV_LINKS = [
  { to: '/',            label: 'Home' },
  { to: '/farm-setup',  label: 'Farm Setup' },
  { to: '/yield',       label: 'Yield' },
  { to: '/water',       label: 'Water Strategy' },
  { to: '/revenue',     label: 'Revenue & Quality' },
  { to: '/cutting',     label: 'Cutting Timing' },
  { to: '/dashboard',   label: 'Dashboard' },
  { to: '/machinery',   label: 'Machinery Costs' },
  { to: '/costs',           label: 'Input Costs' },
  { to: '/drought-history', label: 'Drought History' },
  { to: '/quick',           label: '⚡ Quick Check' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  return (
    <nav className="bg-[#1a3a0a] text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo + wordmark */}
          <Link
            to="/"
            className="flex items-center gap-3 shrink-0"
            onClick={() => setOpen(false)}
          >
            <div className="w-10 h-10 rounded-md bg-[#F1B300] flex items-center justify-center font-extrabold text-[#1a3a0a] text-base select-none leading-none shadow-sm">
              UI
            </div>
            <div className="hidden sm:block leading-tight">
              <p className="font-bold text-white text-sm tracking-tight">Idaho Alfalfa</p>
              <p className="text-[#F1B300] text-xs font-normal tracking-wide">Drought Decision Tool</p>
            </div>
            <span className="sm:hidden font-semibold text-sm">Alfalfa Tool</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.slice(1).map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  pathname === to
                    ? 'bg-[#F1B300] text-[#1a3a0a] font-semibold'
                    : 'text-white/75 hover:text-white hover:bg-white/10'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden text-2xl leading-none px-2 py-1 rounded hover:bg-white/10 transition-colors"
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle navigation menu"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-white/10 bg-[#112a05]">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={`block px-5 py-3 text-sm border-b border-white/5 transition-colors ${
                pathname === to
                  ? 'text-[#F1B300] font-semibold bg-white/5'
                  : 'text-white/75 hover:text-white hover:bg-white/10'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
