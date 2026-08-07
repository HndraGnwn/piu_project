'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Feedback = {
  tone: 'error' | 'info'
  text: string
}

type LoginFormProps = {
  isUnauthorized: boolean
  nextPath: string
}

export function LoginForm({ isUnauthorized, nextPath }: LoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<Feedback | null>(
    isUnauthorized
      ? {
          tone: 'error',
          text: 'Akun ini belum masuk daftar user yang diizinkan.',
        }
      : null
  )

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setFeedback(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error) {
      setFeedback({ tone: 'error', text: 'Email atau password tidak cocok.' })
      setLoading(false)
      return
    }

    router.replace(nextPath || '/')
    router.refresh()
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-6 py-10 text-slate-100">
      <section className="w-full max-w-sm rounded-[28px] border border-slate-800 bg-slate-900 p-7 shadow-[0_30px_80px_rgba(2,6,23,0.45)]">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
            <Image src="/piu-logo.svg" alt="PIU logo" width={34} height={34} className="h-9 w-9 object-contain" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">PIU POS</p>
            <h1 className="text-xl font-semibold text-white">Staff Login</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-200">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-400"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-200">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-orange-400"
              required
            />
          </div>

          {feedback && (
            <p
              role="status"
              className={`rounded-2xl border px-4 py-3 text-sm ${
                feedback.tone === 'error'
                  ? 'border-red-700 bg-red-950 text-red-100'
                  : 'border-sky-700 bg-sky-950 text-sky-100'
              }`}
            >
              {feedback.text}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>
      </section>
    </main>
  )
}
