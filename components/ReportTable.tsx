type ReportTableProps = {
  title: string
  subtitle?: string
  headers: string[]
  rows: (string | number)[][]
}

export function ReportTable({ title, subtitle, headers, rows }: ReportTableProps) {
  return (
    <section className="bg-white border rounded-xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b bg-amber-50">
        <h2 className="text-lg font-semibold text-amber-900">{title}</h2>
        {subtitle && <p className="text-sm text-amber-800/70 mt-0.5">{subtitle}</p>}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left">
              {headers.map((header) => (
                <th key={header} className="px-5 py-3 font-medium text-gray-600">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="border-b last:border-b-0">
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className={`px-5 py-3 ${cellIndex === 0 ? 'font-medium text-gray-800' : 'text-gray-700 tabular-nums'}`}
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
