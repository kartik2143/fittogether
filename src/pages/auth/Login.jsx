import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-50 dark:bg-black px-4 pt-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="FitTogether" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Welcome back</h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1.5">Sign in to FitTogether</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 overflow-hidden">
            <label className="flex flex-col px-4 py-3.5 focus-within:bg-brand-50/40 dark:focus-within:bg-brand-900/20 transition-colors cursor-text">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Email</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className="text-base text-gray-900 dark:text-white outline-none bg-transparent placeholder:text-gray-300 dark:placeholder:text-gray-600"
              />
            </label>
            <div className="h-px bg-gray-100 dark:bg-white/10 mx-4" />
            <label className="flex flex-col px-4 py-3.5 focus-within:bg-brand-50/40 dark:focus-within:bg-brand-900/20 transition-colors cursor-text">
              <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Password</span>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="text-base text-gray-900 dark:text-white outline-none bg-transparent placeholder:text-gray-300 dark:placeholder:text-gray-600"
              />
            </label>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-3">{error}</p>
          )}

          <Button type="submit" size="lg" loading={loading} className="w-full">
            Sign in
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          No account?{' '}
          <Link to="/signup" className="font-medium text-brand-600 dark:text-brand-400 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
