export default function PageHeader({ title, subtitle }) {
  return (
    <div className="bg-white border-b border-gray-200 px-4 py-6">
      <div className="max-w-5xl mx-auto flex items-start gap-3">
        <div className="w-1 self-stretch rounded-full bg-[#F1B300] shrink-0" />
        <div>
          <h1 className="text-2xl font-bold text-[#1a3a0a] tracking-tight">{title}</h1>
          {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}
