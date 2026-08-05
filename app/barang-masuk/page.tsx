'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import { DeliveryTruck01Icon, ShoppingCart01Icon, Store01Icon } from '@hugeicons/core-free-icons'
import { SUPABASE_SETUP_MESSAGE, supabase } from '@/lib/supabase'
import { displayVariantName, sortVariants } from '@/lib/variants'
import { formatDateLabel, jakartaDateToTimestamp, todayInJakarta } from '@/lib/dates'

type Variant = {
  id: string
  name: string
}

/** Quantity + capital price keyed by variant id, kept as strings for the inputs. */
type EntryDraft = Record<string, { quantity: string; capitalPrice: string }>

type Feedback = { tone: 'success' | 'error'; text: string }

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export default function BarangMasukPage() {
  const [variants, setVariants] = useState<Variant[]>([])
  const [draft, setDraft] = useState<EntryDraft>({})
  const [entryDate, setEntryDate] = useState(todayInJakarta())
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  useEffect(() => {
    async function fetchVariants() {
      if (!supabase) {
        setFeedback({ tone: 'error', text: SUPABASE_SETUP_MESSAGE })
        return
      }

      const { data, error } = await supabase.from('variants').select('id, name')

      if (error) {
        setFeedback({ tone: 'error', text: `Gagal memuat varian: ${error.message}` })
        return
      }

      const sorted = sortVariants(data ?? [])
      setVariants(sorted)
      setDraft(
        Object.fromEntries(sorted.map((v) => [v.id, { quantity: '', capitalPrice: '' }])) as EntryDraft
      )
    }

    fetchVariants()
  }, [])

  function updateDraft(id: string, field: 'quantity' | 'capitalPrice', value: string) {
    setDraft((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  // Only variants with a positive quantity are saved, so partial entry is fine.
  const filledRows = useMemo(
    () =>
      variants
        .map((variant) => {
          const row = draft[variant.id]
          const quantity = Number.parseInt(row?.quantity ?? '', 10)
          const capitalPrice = Number.parseInt(row?.capitalPrice ?? '', 10)
          return { variant, quantity, capitalPrice }
        })
        .filter((row) => Number.isFinite(row.quantity) && row.quantity > 0),
    [variants, draft]
  )

  const totalPcs = filledRows.reduce((sum, row) => sum + row.quantity, 0)
  const totalCost = filledRows.reduce(
    (sum, row) => sum + row.quantity * (Number.isFinite(row.capitalPrice) ? row.capitalPrice : 0),
    0
  )

  function resetDraft() {
    setDraft(
      Object.fromEntries(
        variants.map((v) => [v.id, { quantity: '', capitalPrice: '' }])
      ) as EntryDraft
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!supabase) {
      setFeedback({ tone: 'error', text: SUPABASE_SETUP_MESSAGE })
      return
    }

    if (filledRows.length === 0) {
      setFeedback({ tone: 'error', text: 'Isi jumlah minimal satu varian sebelum menyimpan.' })
      return
    }

    const missingPrice = filledRows.find(
      (row) => !Number.isFinite(row.capitalPrice) || row.capitalPrice < 0
    )
    if (missingPrice) {
      setFeedback({
        tone: 'error',
        text: `Harga modal untuk ${displayVariantName(missingPrice.variant.name)} belum diisi.`,
      })
      return
    }

    setLoading(true)
    setFeedback(null)

    const createdAt = jakartaDateToTimestamp(entryDate)
    const { error } = await supabase.from('inbound_logs').insert(
      filledRows.map((row) => ({
        variant_id: row.variant.id,
        quantity: row.quantity,
        capital_price: row.capitalPrice,
        created_at: createdAt,
      }))
    )

    if (error) {
      setFeedback({ tone: 'error', text: `Gagal menyimpan: ${error.message}` })
    } else {
      setFeedback({
        tone: 'success',
        text: `${filledRows.length} varian (${totalPcs} pcs) tersimpan untuk ${formatDateLabel(entryDate)}.`,
      })
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
              <h1 className="text-3xl font-semibold text-white">Input Barang Masuk</h1>
              <p className="mt-2 text-sm text-slate-400 max-w-2xl">
                Isi jumlah stok yang masuk untuk setiap varian, lalu pilih tanggal kedatangan barang.
                Varian yang dikosongkan tidak akan disimpan.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/penjualan/online"
                className="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(14,165,233,0.35)] transition hover:bg-sky-400"
              >
                <HugeiconsIcon icon={ShoppingCart01Icon} size={18} color="currentColor" strokeWidth={1.5} />
                Online Sales
              </Link>
              <Link
                href="/penjualan/offline"
                className="inline-flex items-center gap-2 rounded-2xl bg-lime-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-[0_12px_30px_rgba(132,204,22,0.35)] transition hover:bg-lime-400"
              >
                <HugeiconsIcon icon={Store01Icon} size={18} color="currentColor" strokeWidth={1.5} />
                Offline Sales
              </Link>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-6 flex flex-col gap-6">
          <div className="bg-slate-900 border border-slate-700 p-5 rounded-3xl">
            <label htmlFor="entry-date" className="block text-sm font-medium text-slate-200 mb-1">
              Tanggal Barang Masuk
            </label>
            <input
              id="entry-date"
              type="date"
              value={entryDate}
              max={todayInJakarta()}
              onChange={(e) => setEntryDate(e.target.value)}
              className="w-full sm:w-64 border border-slate-700 bg-slate-950 text-slate-100 p-2 rounded-lg"
              required
            />
            <p className="text-xs text-slate-500 mt-2">
              Tanggal ini dipakai untuk semua varian yang diisi di bawah.
            </p>
          </div>

          <div className="bg-slate-900 rounded-3xl border border-slate-700 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-700">
              <h2 className="font-semibold text-white">Jumlah &amp; Harga Modal per Varian</h2>
            </div>

          {variants.length === 0 ? (
            <p className="px-6 py-6 text-sm text-slate-500">Memuat varian…</p>
          ) : (
            <ul className="divide-y divide-slate-800">
              {variants.map((variant) => {
                const row = draft[variant.id] ?? { quantity: '', capitalPrice: '' }
                const qty = Number.parseInt(row.quantity, 10)
                const active = Number.isFinite(qty) && qty > 0

                return (
                  <li
                    key={variant.id}
                    className={`px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-end ${
                      active ? 'bg-emerald-500/10' : ''
                    }`}
                  >
                    <span className="sm:w-44 font-medium text-slate-100">
                      {displayVariantName(variant.name)}
                    </span>

                    <div className="flex-1">
                      <label
                        htmlFor={`qty-${variant.id}`}
                        className="block text-xs text-slate-400 mb-1"
                      >
                        Jumlah (Pcs)
                      </label>
                      <input
                        id={`qty-${variant.id}`}
                        type="number"
                        inputMode="numeric"
                        min="0"
                        value={row.quantity}
                        onChange={(e) => updateDraft(variant.id, 'quantity', e.target.value)}
                        placeholder="0"
                        className="w-full border border-slate-700 bg-slate-950 text-slate-100 p-2 rounded-2xl"
                      />
                    </div>

                    <div className="flex-1">
                      <label
                        htmlFor={`price-${variant.id}`}
                        className="block text-xs text-slate-400 mb-1"
                      >
                        Harga Modal Satuan (Rp)
                      </label>
                      <input
                        id={`price-${variant.id}`}
                        type="number"
                        inputMode="numeric"
                        min="0"
                        value={row.capitalPrice}
                        onChange={(e) => updateDraft(variant.id, 'capitalPrice', e.target.value)}
                        placeholder="Contoh: 15000"
                        required={active}
                        className="w-full border border-slate-700 bg-slate-950 text-slate-100 p-2 rounded-2xl"
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-700 p-5 rounded-3xl flex flex-col gap-4">
          <dl className="grid gap-4 sm:grid-cols-3 text-sm text-slate-300">
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
              <dt className="text-xs uppercase tracking-[0.25em] text-slate-500">Varian terisi</dt>
              <dd className="mt-2 text-lg font-semibold text-white">{filledRows.length}</dd>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
              <dt className="text-xs uppercase tracking-[0.25em] text-slate-500">Total masuk</dt>
              <dd className="mt-2 text-lg font-semibold text-white">{totalPcs} pcs</dd>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-4">
              <dt className="text-xs uppercase tracking-[0.25em] text-slate-500">Total modal</dt>
              <dd className="mt-2 text-lg font-semibold text-white">{rupiah.format(totalCost)}</dd>
            </div>
          </dl>

          {feedback && (
            <p
              role="status"
              className={`p-3 rounded-2xl text-sm ${
                feedback.tone === 'error'
                  ? 'bg-red-900/80 text-red-200 border border-red-700'
                  : 'bg-emerald-900/80 text-emerald-200 border border-emerald-700'
              }`}
            >
              {feedback.text}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || filledRows.length === 0}
            className="w-full bg-linear-to-r from-amber-500 to-orange-500 text-slate-950 p-3 rounded-3xl font-semibold shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? 'Menyimpan…' : 'Simpan Barang Masuk'}
          </button>
        </div>
      </form>
    </main>
  )
}
