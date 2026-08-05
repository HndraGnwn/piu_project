type ReportTableProps = {
  title: string
  subtitle?: string
  headers: string[]
  rows: (string | number)[][]
}

export function ReportTable({ title, subtitle, headers, rows }: ReportTableProps) {
  return (
    <section className="bg-slate-950 border border-slate-700 rounded-3xl shadow-xl overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-700 bg-slate-900/90">
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700 bg-slate-950 text-left text-slate-300">
              {headers.map((header) => (
                <th key={header} className="px-6 py-3 font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b border-slate-800 last:border-b-0 hover:bg-slate-900/80">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`px-6 py-3 ${cellIndex === 0 ? 'font-semibold text-slate-100' : 'text-slate-300 tabular-nums'}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
