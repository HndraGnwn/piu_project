'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
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
    <main className="p-6 md:p-10 max-w-3xl mx-auto font-sans">
      <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block text-sm">
        &larr; Kembali ke Dashboard
      </Link>

      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Input Barang Masuk</h1>
        <p className="text-gray-500 text-sm mt-1 text-pretty">
          Isi jumlah stok yang masuk untuk setiap varian, lalu pilih tanggal kedatangan barang.
          Varian yang dikosongkan tidak akan disimpan.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="bg-white text-gray-900 p-5 rounded-xl shadow-sm border">
          <label htmlFor="entry-date" className="block text-sm font-medium mb-1">
            Tanggal Barang Masuk
          </label>
          <input
            id="entry-date"
            type="date"
            value={entryDate}
            max={todayInJakarta()}
            onChange={(e) => setEntryDate(e.target.value)}
            className="w-full sm:w-64 border p-2 rounded-lg"
            required
          />
          <p className="text-xs text-gray-500 mt-2">
            Tanggal ini dipakai untuk semua varian yang diisi di bawah.
          </p>
        </div>

        <div className="bg-white text-gray-900 rounded-xl shadow-sm border overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h2 className="font-semibold">Jumlah &amp; Harga Modal per Varian</h2>
          </div>

          {variants.length === 0 ? (
            <p className="px-5 py-6 text-sm text-gray-500">Memuat varian…</p>
          ) : (
            <ul className="divide-y">
              {variants.map((variant) => {
                const row = draft[variant.id] ?? { quantity: '', capitalPrice: '' }
                const qty = Number.parseInt(row.quantity, 10)
                const active = Number.isFinite(qty) && qty > 0

                return (
                  <li
                    key={variant.id}
                    className={`px-5 py-4 flex flex-col sm:flex-row sm:items-end gap-3 ${
                      active ? 'bg-amber-50' : ''
                    }`}
                  >
                    <span className="sm:w-40 font-medium text-sm">
                      {displayVariantName(variant.name)}
                    </span>

                    <div className="flex-1">
                      <label
                        htmlFor={`qty-${variant.id}`}
                        className="block text-xs text-gray-500 mb-1"
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
                        className="w-full border p-2 rounded-lg"
                      />
                    </div>

                    <div className="flex-1">
                      <label
                        htmlFor={`price-${variant.id}`}
                        className="block text-xs text-gray-500 mb-1"
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
                        className="w-full border p-2 rounded-lg"
                      />
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="bg-white text-gray-900 p-5 rounded-xl shadow-sm border flex flex-col gap-4">
          <dl className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-gray-500">Varian terisi:</dt>
              <dd className="font-semibold">{filledRows.length}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-500">Total masuk:</dt>
              <dd className="font-semibold">{totalPcs} pcs</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-gray-500">Total modal:</dt>
              <dd className="font-semibold">{rupiah.format(totalCost)}</dd>
            </div>
          </dl>

          {feedback && (
            <p
              role="status"
              className={`p-3 rounded-lg text-sm ${
                feedback.tone === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {feedback.text}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || filledRows.length === 0}
            className="w-full bg-amber-700 text-white p-3 rounded-lg font-semibold hover:bg-amber-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Menyimpan…' : 'Simpan Barang Masuk'}
          </button>
        </div>
      </form>
    </main>
  )
}
