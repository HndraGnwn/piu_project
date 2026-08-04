import { isSupabaseConfigured, supabase } from '@/lib/supabase'
import { displayVariantName, sortVariants } from '@/lib/variants'
import { currentMonthInJakarta, formatMonthLabel, todayInJakarta, toJakartaDate, toJakartaMonth } from '@/lib/dates'

export type VariantReport = {
  id: string
  name: string
  totalEntry: number
  onlineToday: number
  onlineMonth: number
  offlineToday: number
  offlineMonth: number
  stockRemaining: number
}

export type DashboardData = {
  variants: VariantReport[]
  today: string
  month: string
  monthLabel: string
  salesTableReady: boolean
  supabaseReady: boolean
}

type InboundRow = { variant_id: string; quantity: number }
type SalesRow = { variant_id: string; quantity: number; channel: string; created_at: string }
type VariantRow = { id: string; name: string }

function sumByVariant(rows: { variant_id: string; quantity: number }[]): Map<string, number> {
  const totals = new Map<string, number>()
  for (const row of rows) {
    totals.set(row.variant_id, (totals.get(row.variant_id) ?? 0) + row.quantity)
  }
  return totals
}

export async function getDashboardData(): Promise<DashboardData> {
  const today = todayInJakarta()
  const month = currentMonthInJakarta()
  const monthLabel = formatMonthLabel(month)

  if (!isSupabaseConfigured || !supabase) {
    return { variants: [], today, month, monthLabel, salesTableReady: false, supabaseReady: false }
  }

  const [variantsResult, inboundResult, salesResult] = await Promise.all([
    supabase.from('variants').select('id, name'),
    supabase.from('inbound_logs').select('variant_id, quantity'),
    supabase.from('sales_logs').select('variant_id, quantity, channel, created_at'),
  ])

  if (variantsResult.error) throw variantsResult.error
  if (inboundResult.error) throw inboundResult.error

  const salesTableReady = !salesResult.error
  const inboundRows = (inboundResult.data ?? []) as InboundRow[]
  const salesRows = salesTableReady ? ((salesResult.data ?? []) as SalesRow[]) : []

  const totalEntry = sumByVariant(inboundRows)

  const onlineToday = new Map<string, number>()
  const onlineMonth = new Map<string, number>()
  const offlineToday = new Map<string, number>()
  const offlineMonth = new Map<string, number>()

  for (const sale of salesRows) {
    const isToday = toJakartaDate(sale.created_at) === today
    const isThisMonth = toJakartaMonth(sale.created_at) === month
    const mapToday = sale.channel === 'online' ? onlineToday : offlineToday
    const mapMonth = sale.channel === 'online' ? onlineMonth : offlineMonth

    if (isToday) {
      mapToday.set(sale.variant_id, (mapToday.get(sale.variant_id) ?? 0) + sale.quantity)
    }
    if (isThisMonth) {
      mapMonth.set(sale.variant_id, (mapMonth.get(sale.variant_id) ?? 0) + sale.quantity)
    }
  }

  // Total sold across all time, used to derive the remaining stock.
  const totalSold = sumByVariant(salesRows)

  const variants = sortVariants((variantsResult.data ?? []) as VariantRow[]).map((variant) => {
    const entry = totalEntry.get(variant.id) ?? 0

    return {
      id: variant.id,
      name: displayVariantName(variant.name),
      totalEntry: entry,
      onlineToday: onlineToday.get(variant.id) ?? 0,
      onlineMonth: onlineMonth.get(variant.id) ?? 0,
      offlineToday: offlineToday.get(variant.id) ?? 0,
      offlineMonth: offlineMonth.get(variant.id) ?? 0,
      // Derived from the logs rather than variants.stock_quantity, because
      // duplicate database triggers double-count every inbound row.
      stockRemaining: entry - (totalSold.get(variant.id) ?? 0),
    }
  })

  return { variants, today, month, monthLabel, salesTableReady, supabaseReady: true }
}
