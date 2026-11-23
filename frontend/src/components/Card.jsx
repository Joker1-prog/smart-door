const TONES = {
  emerald: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20',
  sky: 'bg-sky-400/10 text-sky-300 ring-sky-400/20',
  amber: 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
  rose: 'bg-rose-400/10 text-rose-300 ring-rose-400/20',
  slate: 'bg-slate-400/10 text-slate-300 ring-slate-400/20',
}

export function Card({ children, className = '' }) {
  return <section className={`card fade-up p-5 sm:p-6 ${className}`}>{children}</section>
}

export function CardHeader({ icon: HeaderIcon, title, subtitle, tone = 'emerald', right }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <span className={`inline-flex rounded-xl p-2.5 ring-1 ${TONES[tone]}`}>
          <HeaderIcon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-base font-semibold text-white sm:text-lg">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-slate-400 sm:text-sm">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  )
}
