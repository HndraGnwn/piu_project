'use client'

export function ExportPdfButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700"
    >
      Export PDF
    </button>
  )
}
