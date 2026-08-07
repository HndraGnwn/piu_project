'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Delete02Icon,
  Edit02Icon,
  FloppyDiskIcon,
} from '@hugeicons/core-free-icons'
import { createClient } from '@/lib/supabase/client'
import { jakartaDateToTimestamp, toJakartaDate } from '@/lib/dates'
import { displayVariantName, sortVariants } from '@/lib/variants'

type Channel = 'online' | 'offline'

type Variant = {
  id: string
  name: string
}

type SalesRow = {
  id: string
  variant_id: string
  quantity: number
  channel: Channel
  created_at: string
}

type Draft = {
  variantId: string
  quantity: string
  channel: Channel
  date: string
}

type Feedback = {
  tone: 'success' | 'error'
  text: string
}

function rowToDraft(row: SalesRow): Draft {
  return {
    variantId: row.variant_id,
    quantity: String(row.quantity),
    channel: row.channel,
    date: toJakartaDate(row.created_at),
  }
}

export function SalesManager() {
  const supabase = useMemo(() => createClient(), [])
  const [variants, setVariants] = useState<Variant[]>([])
  const [sales, setSales] = useState<SalesRow[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  async function loadData({ showLoading = true } = {}) {
    if (showLoading) setLoading(true)
    setFeedback(null)

    const [variantsResult, salesResult] = await Promise.all([
      supabase.from('variants').select('id, name'),
      supabase
        .from('sales_logs')
        .select('id, variant_id, quantity, channel, created_at')
        .order('created_at', { ascending: false })
        .limit(200),
    ])

    if (variantsResult.error) {
      setFeedback({ tone: 'error', text: `Gagal memuat varian: ${variantsResult.error.message}` })
    } else {
      setVariants(sortVariants((variantsResult.data ?? []) as Variant[]))
    }

    if (salesResult.error) {
      setFeedback({ tone: 'error', text: `Gagal memuat penjualan: ${salesResult.error.message}` })
    } else {
      setSales((salesResult.data ?? []) as SalesRow[])
    }

    setLoading(false)
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData({ showLoading: false })
    }, 0)

    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function startEditing(row: SalesRow) {
    setEditingId(row.id)
    setDraft(rowToDraft(row))
    setFeedback(null)
  }

  function cancelEditing() {
    setEditingId(null)
    setDraft(null)
  }

  async function saveRow(row: SalesRow) {
    if (!draft) return

    const quantity = Number.parseInt(draft.quantity, 10)
    if (!Number.isFinite(quantity) || quantity <= 0) {
      setFeedback({ tone: 'error', text: 'Jumlah penjualan harus lebih dari 0.' })
      return
    }

    setSavingId(row.id)
    setFeedback(null)

    const { error } = await supabase
      .from('sales_logs')
      .update({
        variant_id: draft.variantId,
        quantity,
        channel: draft.channel,
        created_at: jakartaDateToTimestamp(draft.date),
      })
      .eq('id', row.id)

    if (error) {
      setFeedback({ tone: 'error', text: `Gagal menyimpan: ${error.message}` })
    } else {
      setFeedback({ tone: 'success', text: 'Penjualan berhasil diperbarui.' })
      setEditingId(null)
      setDraft(null)
      await loadData()
    }

    setSavingId(null)
  }

  async function deleteRow(row: SalesRow) {
    const confirmed = window.confirm('Hapus catatan penjualan ini? Stok akan dikoreksi otomatis.')
    if (!confirmed) return

    setSavingId(row.id)
    setFeedback(null)

    const { error } = await supabase.from('sales_logs').delete().eq('id', row.id)

    if (error) {
      setFeedback({ tone: 'error', text: `Gagal menghapus: ${error.message}` })
    } else {
      setFeedback({ tone: 'success', text: 'Penjualan berhasil dihapus.' })
      await loadData()
    }

    setSavingId(null)
  }

  function variantName(id: string) {
    return displayVariantName(variants.find((variant) => variant.id === id)?.name ?? 'Varian')
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/" className="mb-4 inline-block text-sm text-slate-400 transition hover:text-white">
              &larr; Kembali ke Dashboard
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight text-white">Kelola Penjualan</h1>
            <p className="mt-2 text-sm text-slate-400">
              Edit atau hapus catatan sales terbaru. Perubahan akan masuk ke laporan dashboard setelah refresh.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-slate-300">
            {loading ? 'Memuat...' : `${sales.length} catatan terbaru`}
          </div>
        </div>

        {feedback && (
          <p
            role="status"
            className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${
              feedback.tone === 'error'
                ? 'border-red-700 bg-red-950 text-red-100'
                : 'border-emerald-700 bg-emerald-950 text-emerald-100'
            }`}
          >
            {feedback.text}
          </p>
        )}

        <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/90">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="border-b border-slate-800 px-4 py-3">Tanggal</th>
                <th className="border-b border-slate-800 px-4 py-3">Varian</th>
                <th className="border-b border-slate-800 px-4 py-3">Channel</th>
                <th className="border-b border-slate-800 px-4 py-3 text-right">Jumlah</th>
                <th className="border-b border-slate-800 px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Memuat catatan penjualan...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    Belum ada catatan penjualan.
                  </td>
                </tr>
              ) : (
                sales.map((row) => {
                  const isEditing = editingId === row.id
                  const disabled = savingId === row.id

                  return (
                    <tr key={row.id} className="border-b border-slate-800 hover:bg-slate-900/60">
                      <td className="px-4 py-3">
                        {isEditing && draft ? (
                          <input
                            type="date"
                            value={draft.date}
                            onChange={(event) => setDraft({ ...draft, date: event.target.value })}
                            className="w-40 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                            required
                          />
                        ) : (
                          <span className="text-slate-200">{toJakartaDate(row.created_at)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing && draft ? (
                          <select
                            value={draft.variantId}
                            onChange={(event) => setDraft({ ...draft, variantId: event.target.value })}
                            className="w-48 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                          >
                            {variants.map((variant) => (
                              <option key={variant.id} value={variant.id}>
                                {displayVariantName(variant.name)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-slate-200">{variantName(row.variant_id)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing && draft ? (
                          <select
                            value={draft.channel}
                            onChange={(event) => setDraft({ ...draft, channel: event.target.value as Channel })}
                            className="w-32 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100"
                          >
                            <option value="online">Online</option>
                            <option value="offline">Offline</option>
                          </select>
                        ) : (
                          <span className={row.channel === 'online' ? 'text-sky-300' : 'text-lime-300'}>
                            {row.channel === 'online' ? 'Online' : 'Offline'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {isEditing && draft ? (
                          <input
                            type="number"
                            min="1"
                            inputMode="numeric"
                            value={draft.quantity}
                            onChange={(event) => setDraft({ ...draft, quantity: event.target.value })}
                            className="w-24 rounded-2xl border border-slate-700 bg-slate-950 px-3 py-2 text-right text-slate-100"
                            required
                          />
                        ) : (
                          <span className="tabular-nums text-slate-100">{row.quantity}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button
                                type="button"
                                onClick={() => saveRow(row)}
                                disabled={disabled}
                                title="Simpan"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white transition hover:bg-emerald-400 disabled:opacity-50"
                              >
                                <HugeiconsIcon icon={disabled ? FloppyDiskIcon : CheckmarkCircle01Icon} size={18} color="currentColor" strokeWidth={1.5} />
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditing}
                                disabled={disabled}
                                title="Batal"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-700 text-slate-200 transition hover:border-slate-500 hover:text-white disabled:opacity-50"
                              >
                                <HugeiconsIcon icon={Cancel01Icon} size={18} color="currentColor" strokeWidth={1.5} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => startEditing(row)}
                                disabled={Boolean(editingId) || disabled}
                                title="Edit"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-700 text-slate-200 transition hover:border-sky-500 hover:text-sky-300 disabled:opacity-40"
                              >
                                <HugeiconsIcon icon={Edit02Icon} size={18} color="currentColor" strokeWidth={1.5} />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteRow(row)}
                                disabled={Boolean(editingId) || disabled}
                                title="Hapus"
                                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-red-900/80 text-red-300 transition hover:border-red-500 hover:text-red-100 disabled:opacity-40"
                              >
                                <HugeiconsIcon icon={Delete02Icon} size={18} color="currentColor" strokeWidth={1.5} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
