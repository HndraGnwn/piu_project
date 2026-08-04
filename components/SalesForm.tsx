'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SUPABASE_SETUP_MESSAGE, supabase } from '@/lib/supabase'
import { displayVariantName, sortVariants } from '@/lib/variants'

type Variant = { id: string; name: string }
type Channel = 'online' | 'offline'

type SalesFormProps = {
  channel: Channel
  title: string
}

export function SalesForm({ channel, title }: SalesFormProps) {
  const [variants, setVariants] = useState<Variant[]>([])
  const [selectedVariant, setSelectedVariant] = useState('')
  const [quantity, setQuantity] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function fetchVariants() {
      if (!supabase) {
        setMessage(SUPABASE_SETUP_MESSAGE)
        return
      }
      const { data } = await supabase.from('variants').select('id, name')
      if (data) {
        const sorted = sortVariants(data)
        setVariants(sorted)
        if (sorted.length > 0) setSelectedVariant(sorted[0].id)
      }
    }
    fetchVariants()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!supabase) {
      setMessage(SUPABASE_SETUP_MESSAGE)
      return
    }

    setLoading(true)
    setMessage('')

    const { error } = await supabase.from('sales_logs').insert([
      {
        variant_id: selectedVariant,
        quantity: parseInt(quantity, 10),
        channel,
      },
    ])

    if (error) {
      const needsSetup = error.message.includes('sales_logs') || error.code === 'PGRST205'
      setMessage(
        needsSetup
          ? 'Tabel sales_logs belum ada. Jalankan supabase/schema.sql di Supabase SQL Editor.'
          : `Gagal menyimpan: ${error.message}`
      )
    } else {
      setMessage('Penjualan berhasil dicatat! Stok otomatis berkurang.')
      setQuantity('')
    }
    setLoading(false)
  }

  return (
    <main className="p-10 max-w-lg mx-auto font-sans">
      <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
        &larr; Kembali ke Dashboard
      </Link>

      <h1 className="text-2xl font-bold mb-6">{title}</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Varian</label>
          <select
            value={selectedVariant}
            onChange={(e) => setSelectedVariant(e.target.value)}
            className="w-full border p-2 rounded-lg"
            required
          >
            {variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {displayVariantName(variant.name)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Terjual (Pcs)</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full border p-2 rounded-lg"
            placeholder="Contoh: 10"
            required
            min="1"
          />
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${message.includes('Gagal') || message.includes('belum') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
          >
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-700 text-white p-2 rounded-lg font-semibold hover:bg-amber-800 disabled:bg-gray-400"
        >
          {loading ? 'Menyimpan...' : 'Simpan Penjualan'}
        </button>
      </form>
    </main>
  )
}
