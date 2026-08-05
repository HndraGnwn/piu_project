'use client'

import Link from 'next/link'

type ActionTabsProps = {
  active: string
  items: { label: string; href: string; color: string }[]
}

export function ActionTabs({ active, items }: ActionTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            active === item.href
              ? `${item.color} text-white shadow-lg`
              : 'border border-white/20 text-white/80 hover:bg-white/10'
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  )
}
