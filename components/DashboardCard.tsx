'use client'

type DashboardCardProps = {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
}

export function DashboardCard({ title, subtitle, actions, children }: DashboardCardProps) {
  return (
    <section className="rounded-[28px] border border-slate-700 bg-slate-950/95 shadow-[0_30px_80px_rgba(15,23,42,0.75)] overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-slate-700 px-8 py-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-400/80">PIU POS</p>
          <h1 className="mt-2 text-3xl font-semibold text-white">{title}</h1>
          {subtitle && <p className="mt-2 max-w-2xl text-sm text-slate-400">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
      </div>
      <div className="px-8 py-6">{children}</div>
    </section>
  )
}
