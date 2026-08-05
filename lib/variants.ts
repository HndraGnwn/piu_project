export const VARIANT_ORDER = [
  'Choco',
  'Matcha',
  'Strawberry',
  'Lotus Biscoff',
  'Nutella',
  'Ube',
] as const

export function displayVariantName(dbName: string): string {
  return dbName.replace(/^Dubai\s+/, '')
}

export function sortVariants<T extends { name: string }>(variants: T[]): T[] {
  return [...variants].sort(
    (a, b) => VARIANT_ORDER.indexOf(a.name as (typeof VARIANT_ORDER)[number])
      - VARIANT_ORDER.indexOf(b.name as (typeof VARIANT_ORDER)[number])
  )
}
