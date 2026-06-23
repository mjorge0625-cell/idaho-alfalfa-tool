export default function Footer() {
  return (
    <footer className="mt-auto bg-[#1a3a0a] text-white">
      <div className="h-px bg-[#F1B300] opacity-60" />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-2">
        <p className="font-bold text-white text-sm tracking-tight">University of Idaho Extension</p>
        <p className="text-white/60 text-xs leading-relaxed max-w-2xl">
          Built for University of Idaho Extension. Yield estimates based on peer-reviewed research
          (Feuz et al. 2025; Crookston et al. 2025; Montazar &amp; Putnam 2020, 2023).
        </p>
        <p className="text-white/60 text-xs">
          This tool does not replace agronomic consultation.
        </p>
      </div>
    </footer>
  )
}
