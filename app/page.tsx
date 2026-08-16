import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { DeliveryTruck01Icon, ShoppingCart01Icon, Store01Icon } from '@hugeicons/core-free-icons'
import { ExportPdfButton } from '@/components/ExportPdfButton'
import { SignOutButton } from '@/components/SignOutButton'
import { getDashboardData } from '@/lib/dashboard'
import { displayVariantName } from '@/lib/variants'

export const dynamic = 'force-dynamic'

export default async function Home() {
  let data
  try {
    data = await getDashboardData()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return <div className="p-10">Error mengambil data: {message}</div>
  }

  const variantNames = data.variants.map((variant) => variant.name)

  const inventoryByDate = new Map<string, Map<string, number>>()
  for (const row of data.inboundDailyEntries) {
    if (!inventoryByDate.has(row.date)) inventoryByDate.set(row.date, new Map())
    const map = inventoryByDate.get(row.date)!
    map.set(row.variant, (map.get(row.variant) ?? 0) + row.quantity)
  }

  const inventoryRows = Array.from(inventoryByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({
      date,
      values: variantNames.map((variant) => counts.get(variant) ?? 0),
      subtotal: variantNames.reduce((sum, variant) => sum + (counts.get(variant) ?? 0), 0),
    }))

  const inventoryTotals = variantNames.map((variant) =>
    data.inboundDailyEntries.filter((row) => row.variant === variant).reduce((sum, row) => sum + row.quantity, 0)
  )
  const inventoryTotalAll = inventoryTotals.reduce((sum, value) => sum + value, 0)

  const offlineByDate = new Map<string, Map<string, number>>()
  const onlineByDate = new Map<string, Map<string, number>>()
  for (const row of data.offlineDailySales) {
    if (!offlineByDate.has(row.date)) offlineByDate.set(row.date, new Map())
    offlineByDate.get(row.date)!.set(row.variant, (offlineByDate.get(row.date)!.get(row.variant) ?? 0) + row.quantity)
  }
  for (const row of data.onlineDailySales) {
    if (!onlineByDate.has(row.date)) onlineByDate.set(row.date, new Map())
    onlineByDate.get(row.date)!.set(row.variant, (onlineByDate.get(row.date)!.get(row.variant) ?? 0) + row.quantity)
  }

  const salesDates = Array.from(new Set([...offlineByDate.keys(), ...onlineByDate.keys()])).sort((a, b) => a.localeCompare(b))

  const salesRows = salesDates.map((date) => {
    const offlineMap = offlineByDate.get(date) ?? new Map()
    const onlineMap = onlineByDate.get(date) ?? new Map()
    const values = variantNames.flatMap((variant) => [offlineMap.get(variant) ?? 0, onlineMap.get(variant) ?? 0])
    return {
      date,
      values,
      subtotal: values.reduce((sum, value) => sum + value, 0),
    }
  })

  const salesTotals = variantNames.flatMap((variant) => {
    const offlineSum = data.offlineDailySales.filter((row) => row.variant === variant).reduce((sum, row) => sum + row.quantity, 0)
    const onlineSum = data.onlineDailySales.filter((row) => row.variant === variant).reduce((sum, row) => sum + row.quantity, 0)
    return [offlineSum, onlineSum]
  })
  const salesTotalAll = salesTotals.reduce((sum, value) => sum + value, 0)

  const remainingValues = data.variants.map((variant) => variant.stockRemaining)
  const remainingTotal = remainingValues.reduce((sum, value) => sum + value, 0)

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-3xl bg-white/10">
              <Image
                src="/piu-logo.svg"
                alt="PIU logo"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-500">PIU</p>
              <h1 className="text-3xl font-semibold tracking-tight text-white">Dubai Chewy Cookie POS</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 no-print">
            <Link
              href="/barang-masuk"
              className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(249,115,22,0.35)] transition hover:bg-orange-400"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-white/15">
                <HugeiconsIcon icon={DeliveryTruck01Icon} size={18} color="currentColor" strokeWidth={1.5} />
              </span>
              Barang Masuk
            </Link>
            <Link
              href="/penjualan/online"
              className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(14,165,233,0.35)] transition hover:bg-sky-400"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-white/15">
                <HugeiconsIcon icon={ShoppingCart01Icon} size={18} color="currentColor" strokeWidth={1.5} />
              </span>
              Online Sales
            </Link>
            <Link
              href="/penjualan/offline"
              className="inline-flex items-center gap-2 rounded-2xl bg-lime-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-[0_12px_30px_rgba(132,204,22,0.35)] transition hover:bg-lime-400"
            >
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-white/15">
                <HugeiconsIcon icon={Store01Icon} size={18} color="currentColor" strokeWidth={1.5} />
              </span>
              Offline Sales
            </Link>
            <SignOutButton />
          </div>
        </div>

        <div className="mt-10 space-y-10">
          <section>
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-white">Inventory</h2>
                <div className="no-print">
                  <ExportPdfButton />
                </div>
              </div>
            <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/90">
              <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="text-left text-slate-400">
                    <th className="border-b border-slate-800 px-4 py-3">Tgl</th>
                    {variantNames.map((variant) => (
                      <th key={variant} className="border-b border-slate-800 px-4 py-3">{displayVariantName(variant)}</th>
                    ))}
                    <th className="border-b border-slate-800 px-4 py-3">Sub-Total</th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryRows.map((row) => (
                    <tr key={row.date} className="border-b border-slate-800 hover:bg-slate-900/60">
                      <td className="px-4 py-3 text-slate-200">{row.date}</td>
                      {row.values.map((value, index) => (
                        <td key={`${row.date}-${index}`} className="px-4 py-3 text-slate-200 text-center tabular-nums">
                          {value.toString().padStart(2, '0')}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-slate-100 font-semibold text-center tabular-nums">{row.subtotal.toString().padStart(2, '0')}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-900/70 text-slate-200">
                    <td className="px-4 py-3 font-semibold">Jumlah Total</td>
                    {inventoryTotals.map((value, index) => (
                      <td key={`total-${index}`} className="px-4 py-3 text-center tabular-nums">{value.toString().padStart(2, '0')}</td>
                    ))}
                    <td className="px-4 py-3 font-semibold text-center tabular-nums">{inventoryTotalAll.toString().padStart(2, '0')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold text-white">Sales</h2>
              <div className="no-print">
                <Link
                  href="/penjualan/manage"
                  className="inline-flex w-fit items-center gap-2 rounded-2xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-sky-500 hover:text-sky-300"
                >
                  Manage Sales
                </Link>
              </div>
            </div>
            <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/90">
              <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="text-left text-slate-400">
                    <th rowSpan={2} className="border-b border-slate-800 px-4 py-3 align-bottom">Tgl</th>
                    {variantNames.map((variant) => (
                      <th key={`header-${variant}`} colSpan={2} className="border-b border-slate-800 px-4 py-3 text-center">
                        {displayVariantName(variant)}
                      </th>
                    ))}
                    <th rowSpan={2} className="border-b border-slate-800 px-4 py-3 align-bottom">Sub-Total</th>
                  </tr>
                  <tr className="text-left text-slate-400">
                      {variantNames.map((variant) => (
                        <React.Fragment key={variant}>
                          <th key={`offline-${variant}`} className="border-b border-slate-800 px-4 py-3 text-center">Offline</th>
                          <th key={`online-${variant}`} className="border-b border-slate-800 px-4 py-3 text-center">Online</th>
                        </React.Fragment>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {salesRows.map((row) => (
                    <tr key={row.date} className="border-b border-slate-800 hover:bg-slate-900/60">
                      <td className="px-4 py-3 text-slate-200">{row.date}</td>
                      {row.values.map((value, index) => (
                        <td key={`${row.date}-${index}`} className="px-4 py-3 text-slate-200 text-center tabular-nums">
                          {value.toString().padStart(2, '0')}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-slate-100 font-semibold text-center tabular-nums">{row.subtotal.toString().padStart(2, '0')}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-900/70 text-slate-200">
                    <td className="px-4 py-3 font-semibold">Jumlah Total</td>
                    {salesTotals.map((value, index) => (
                      <td key={`sales-total-${index}`} className="px-4 py-3 text-center tabular-nums">{value.toString().padStart(2, '0')}</td>
                    ))}
                    <td className="px-4 py-3 font-semibold text-center tabular-nums">{salesTotalAll.toString().padStart(2, '0')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-6 text-xl font-semibold text-white">Remaining Stock (End of Month)</h2>
            <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/90">
              <table className="min-w-full border-separate border-spacing-0 text-sm">
                <thead>
                  <tr className="text-left text-slate-400">
                    <th className="border-b border-slate-800 px-4 py-3">Tgl</th>
                    {variantNames.map((variant) => (
                      <th key={`rem-${variant}`} className="border-b border-slate-800 px-4 py-3">{displayVariantName(variant)}</th>
                    ))}
                    <th className="border-b border-slate-800 px-4 py-3">Sub-Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-800 hover:bg-slate-900/60">
                    <td className="px-4 py-3 text-slate-200">{data.today}</td>
                    {remainingValues.map((value, index) => (
                      <td key={`rem-${index}`} className="px-4 py-3 text-slate-200 text-center tabular-nums">{value.toString().padStart(2, '0')}</td>
                    ))}
                    <td className="px-4 py-3 text-slate-100 font-semibold text-center tabular-nums">{remainingTotal.toString().padStart(2, '0')}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
