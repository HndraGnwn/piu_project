const JAKARTA = 'Asia/Jakarta'

export function todayInJakarta(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: JAKARTA }).format(new Date())
}

export function currentMonthInJakarta(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: JAKARTA,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date())

  const year = parts.find((p) => p.type === 'year')!.value
  const month = parts.find((p) => p.type === 'month')!.value
  return `${year}-${month}`
}

export function toJakartaDate(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: JAKARTA }).format(new Date(iso))
}

export function toJakartaMonth(iso: string): string {
  return toJakartaDate(iso).slice(0, 7)
}

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date)
}
