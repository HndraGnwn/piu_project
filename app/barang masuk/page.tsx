'use client' // Menandakan ini adalah komponen interaktif (Client Component)

import { useState, useEffect } from 'react'
import { SUPABASE_SETUP_MESSAGE, supabase } from '@/lib/supabase'
import Link from 'next/link'
import { displayVariantName, sortVariants } from '@/lib/variants'

type Variant = {
  id: string
  name: string
}

export default function BarangMasuk() {
  const [variants, setVariants] = useState<Variant[]>([])
  const [selectedVariant, setSelectedVariant] = useState('')
  const [quantity, setQuantity] = useState('')
  const [capitalPrice, setCapitalPrice] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Mengambil daftar varian kue saat halaman dimuat untuk dropdown
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

  // Fungsi yang dijalankan saat tombol "Simpan" ditekan
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!supabase) {
      setMessage(SUPABASE_SETUP_MESSAGE)
      return
    }

    setLoading(true)
    setMessage('')

    // Menyimpan data ke tabel inbound_logs
    const { error } = await supabase.from('inbound_logs').insert([
      {
        variant_id: selectedVariant,
        quantity: parseInt(quantity),
        capital_price: parseInt(capitalPrice),
      },
    ])

    if (error) {
      setMessage(`Gagal menyimpan: ${error.message}`)
    } else {
      setMessage('Stok berhasil ditambahkan! Stok saat ini sudah otomatis ter-update.')
      setQuantity('') // Kosongkan input
      setCapitalPrice('') // Kosongkan input
    }
    setLoading(false)
  }

  return (
    <main className="p-10 max-w-lg mx-auto font-sans">
      <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
        &larr; Kembali ke Dashboard
      </Link>
      
      <h1 className="text-2xl font-bold mb-6">Input Barang Masuk</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
        {/* Dropdown Varian Kue */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Varian Kue</label>
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

        {/* Input Jumlah Masuk */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Masuk (Pcs)</label>
          <input 
            type="number" 
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full border p-2 rounded-lg"
            placeholder="Contoh: 50"
            required
            min="1"
          />
        </div>

        {/* Input Harga Modal (HPP) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Harga Modal Satuan (Rp)</label>
          <input 
            type="number" 
            value={capitalPrice}
            onChange={(e) => setCapitalPrice(e.target.value)}
            className="w-full border p-2 rounded-lg"
            placeholder="Contoh: 15000"
            required
            min="0"
          />
        </div>

        {/* Notifikasi Sukses/Error */}
        {message && (
          <div className={`p-3 rounded-lg text-sm ${message.includes('Gagal') || message.includes('belum') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {message}
          </div>
        )}

        {/* Tombol Simpan */}
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-amber-700 text-white p-2 rounded-lg font-semibold hover:bg-amber-800 disabled:bg-gray-400"
        >
          {loading ? 'Menyimpan...' : 'Simpan Barang Masuk'}
        </button>
      </form>
    </main>
  )
}
