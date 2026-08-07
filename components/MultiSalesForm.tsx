"use client"

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { DeliveryTruck01Icon, ShoppingCart01Icon, Store01Icon } from '@hugeicons/core-free-icons'
import { SUPABASE_SETUP_MESSAGE, supabase } from '@/lib/supabase'
import { displayVariantName, sortVariants } from '@/lib/variants'
import { jakartaDateToTimestamp, todayInJakarta, formatDateLabel } from '@/lib/dates'

type Variant = { id: string; name: string }
type EntryDraft = Record<string, { quantity: string }>
type Channel = 'online' | 'offline'

export function MultiSalesForm({ channel, title }: { channel: Channel; title: string }) {
  const [variants, setVariants] = useState<Variant[]>([])
  const [draft, setDraft] = useState<EntryDraft>({})
  const [entryDate, setEntryDate] = useState(todayInJakarta())
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const buttonClasses =
    channel === 'online'
      ? 'bg-sky-500 hover:bg-sky-400 text-white shadow-[0_12px_30px_rgba(14,165,233,0.35)]'
      : 'bg-lime-500 hover:bg-lime-400 text-slate-950 shadow-[0_12px_30px_rgba(132,204,22,0.35)]'
  const channelLabel = channel === 'online' ? 'Online' : 'Offline'

  useEffect(() => {
    async function fetchVariants() {
      if (!supabase) {
        setMessage(SUPABASE_SETUP_MESSAGE)
        return
      }

      const { data, error } = await supabase.from('variants').select('id, name')
      if (error) {
        setMessage(`Gagal memuat varian: ${error.message}`)
        return
      }
      const sorted = sortVariants(data ?? [])
      setVariants(sorted)
      setDraft(Object.fromEntries(sorted.map((v) => [v.id, { quantity: '' }])) as EntryDraft)
    }
    fetchVariants()
  }, [])

  function updateDraft(id: string, value: string) {
    setDraft((prev) => ({ ...prev, [id]: { quantity: value } }))
  }

  const filledRows = useMemo(
    () =>
      variants
        .map((v) => ({ variant: v, quantity: Number.parseInt(draft[v.id]?.quantity ?? '', 10) }))
        .filter((r) => Number.isFinite(r.quantity) && r.quantity > 0),
    [variants, draft]
  )

  const totalPcs = filledRows.reduce((s, r) => s + r.quantity, 0)

  function resetDraft() {
    setDraft(Object.fromEntries(variants.map((v) => [v.id, { quantity: '' }])) as EntryDraft)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!supabase) {
      setMessage(SUPABASE_SETUP_MESSAGE)
      return
    }
    if (filledRows.length === 0) {
      setMessage('Isi minimal satu varian terjual sebelum menyimpan.')
      return
    }

    setLoading(true)
    setMessage('')

    const createdAt = jakartaDateToTimestamp(entryDate)
    const { error } = await supabase.from('sales_logs').insert(
      filledRows.map((row) => ({ variant_id: row.variant.id, quantity: row.quantity, channel, created_at: createdAt }))
    )

    if (error) {
      const needsSetup = error.message.includes('sales_logs') || error.code === 'PGRST205'
      setMessage(needsSetup ? 'Tabel sales_logs belum ada. Jalankan supabase/schema.sql.' : `Gagal menyimpan: ${error.message}`)
    } else {
      setMessage(`Tersimpan: ${filledRows.length} varian (${totalPcs} pcs) pada ${formatDateLabel(entryDate)}.`)
      resetDraft()
    }

    setLoading(false)
  }

  return (
    <main className="p-6 md:p-10 max-w-4xl mx-auto font-sans">
      <Link href="/" className="text-slate-400 hover:text-white mb-4 inline-block text-sm">
        &larr; Kembali ke Dashboard
      </Link>

      <div className="rounded-[28px] border border-slate-700 bg-slate-950/95 shadow-[0_30px_80px_rgba(15,23,42,0.75)] overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-700">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-white">{title}</h1>
              <p className="mt-2 text-sm text-slate-400 max-w-2xl">
                Masukkan penjualan untuk beberapa varian sekaligus — pilih tanggal penjualan, lalu isi jumlah per varian.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/barang-masuk"
                className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(249,115,22,0.35)] transition hover:bg-orange-400"
              >
                <HugeiconsIcon icon={DeliveryTruck01Icon} size={18} color="currentColor" strokeWidth={1.5} />
                Barang Masuk
              </Link>
              <span className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold ${buttonClasses}`}>
                <HugeiconsIcon
                  icon={channel === 'online' ? ShoppingCart01Icon : Store01Icon}
                  size={18}
                  color="currentColor"
                  strokeWidth={1.5}
                />
                {channel === 'online' ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-700 p-5 rounded-3xl">
            <label htmlFor="sale-date" className="block text-sm font-medium text-slate-200 mb-1">
              Tanggal Penjualan
            </label>
            <input
              id="sale-date"
              type="date"
              value={entryDate}
              max={todayInJakarta()}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full sm:w-64 border border-slate-700 bg-slate-950 text-slate-100 p-2 rounded-2xl"
              required
            />
          </div>

          <div className="bg-slate-900 rounded-3xl border border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700">
              <h2 className="font-semibold text-white">Jumlah Terjual per Varian</h2>
            </div>

          {variants.length === 0 ? (
            <p className="px-6 py-6 text-sm text-slate-500">Memuat varian…</p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {variants.map((variant) => {
                const row = draft[variant.id] ?? { quantity: '' }
                const qty = Number.parseInt(row.quantity, 10)
                const active = Number.isFinite(qty) && qty > 0

                return (
                  <li key={variant.id} className={`px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-end ${active ? 'bg-emerald-500/10' : ''}`}>
                    <span className="sm:w-44 font-medium text-slate-100">{displayVariantName(variant.name)}</span>

                    <div className="flex-1">
                      <label htmlFor={`qty-${variant.id}`} className="block text-xs text-slate-400 mb-1">
                        Jumlah Terjual (Pcs)
                      </label>
                      <input id={`qty-${variant.id}`} type="number" inputMode="numeric" min="0" value={row.quantity} onChange={(e) => updateDraft(variant.id, e.target.value)} placeholder="0" className="w-full border border-slate-700 bg-slate-950 text-slate-100 p-2 rounded-2xl" />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-700 p-5 rounded-3xl flex flex-col gap-4">
          <dl className="grid gap-4 sm:grid-cols-2 text-sm text-slate-300">
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
              <dt className="text-xs uppercase tracking-[0.25em] text-slate-500">Varian terisi</dt>
              <dd className="mt-2 text-lg font-semibold text-white">{filledRows.length}</dd>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
              <dt className="text-xs uppercase tracking-[0.25em] text-slate-500">Total terjual</dt>
              <dd className="mt-2 text-lg font-semibold text-white">{totalPcs} pcs</dd>
            </div>
          </dl>

          {message && (
            <p
              role="status"
              className={`p-3 rounded-2xl text-sm ${
                message.includes('Gagal') || message.includes('belum')
                  ? 'bg-red-900/80 text-red-200 border border-red-700'
                  : 'bg-emerald-900/80 text-emerald-200 border border-emerald-700'
              }`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || filledRows.length === 0}
            className={`w-full ${buttonClasses} p-3 rounded-3xl font-semibold transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40`}
          >
            {loading ? 'Menyimpan…' : `Simpan Penjualan ${channelLabel}`}
          </button>
        </div>
      </form>
    </div>
  </main>
)
}
