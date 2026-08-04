import Link from 'next/link'
import { ReportTable } from '@/components/ReportTable'
import { getDashboardData } from '@/lib/dashboard'

export const dynamic = 'force-dynamic'

export default async function Home() {
  let data
  try {
    data = await getDashboardData()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return <div className="p-10">Error mengambil data: {message}</div>
  }

  const stockRows = data.variants.map((v) => [v.name, v.totalEntry])
  const onlineRows = data.variants.map((v) => [v.name, v.onlineToday, v.onlineMonth])
  const offlineRows = data.variants.map((v) => [v.name, v.offlineToday, v.offlineMonth])
  const remainingRows = data.variants.map((v) => [v.name, v.stockRemaining])

  return (
    <main className="p-6 md:p-10 max-w-5xl mx-auto font-sans space-y-8">
      <header>
        <h1 className="text-3xl font-bold mb-2">Dubai Chewy Cookie POS</h1>
        <p className="text-gray-500">
          Laporan stok & penjualan — {data.today} · {data.monthLabel}
        </p>
      </header>

      {!data.supabaseReady && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl text-sm">
          Supabase belum terhubung di environment ini. Tambahkan{' '}
          <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_URL</code> dan{' '}
          <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> lewat menu
          Settings → Vars, lalu muat ulang halaman ini. Tabel laporan akan kosong sampai kredensial diisi.
        </div>
      )}

      {data.supabaseReady && !data.salesTableReady && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-xl text-sm">
          Tabel <code className="bg-amber-100 px-1 rounded">sales_logs</code> belum dibuat. Buka Supabase →
          SQL Editor, lalu jalankan file <code className="bg-amber-100 px-1 rounded">supabase/schema.sql</code>{' '}
          agar penjualan online/offline bisa dicatat.
        </div>
      )}

      <nav className="flex flex-wrap gap-3">
        <Link
          href="/barang-masuk"
          className="bg-amber-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-amber-800 text-sm"
        >
          + Barang Masuk
        </Link>
        <Link
          href="/penjualan/online"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 text-sm"
        >
          + Penjualan Online
        </Link>
        <Link
          href="/penjualan/offline"
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-700 text-sm"
        >
          + Penjualan Offline
        </Link>
      </nav>

      <ReportTable
        title="Stok — Total Entry"
        subtitle="Total barang masuk (semua waktu)"
        headers={['Varian', 'Total Entry (Pcs)']}
        rows={stockRows}
      />

      <ReportTable
        title="Penjualan Online"
        subtitle={`Hari ini (${data.today}) & akumulasi ${data.monthLabel}`}
        headers={['Varian', 'Hari Ini', 'Bulan Ini']}
        rows={onlineRows}
      />

      <ReportTable
        title="Penjualan Offline"
        subtitle={`Hari ini (${data.today}) & akumulasi ${data.monthLabel}`}
        headers={['Varian', 'Hari Ini', 'Bulan Ini']}
        rows={offlineRows}
      />

      <ReportTable
        title="Sisa Stok"
        subtitle="Total barang masuk dikurangi total penjualan (online + offline)"
        headers={['Varian', 'Sisa Stok (Pcs)']}
        rows={remainingRows}
      />
    </main>
  )
}
