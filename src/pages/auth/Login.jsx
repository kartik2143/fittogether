import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'

export default function Login() {
  const navigate = useNavigate()

  const [step, setStep] = useState('email') // 'email' | 'otp'
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSendOtp(e) {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setError('Please enter a valid email address.')
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { shouldCreateUser: false },
    })
    setLoading(false)
    if (err) {
      setError(err.message === 'Signups not allowed for otp'
        ? 'No account found for this email. Please sign up first.'
        : err.message)
      return
    }
    setStep('otp')
  }

  async function handleVerifyOtp(e) {
    e.preventDefault()
    if (otp.length < 6) return setError('Enter the full code from your email.')
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: otp,
      type: 'email',
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    navigate('/')
  }

  // ── OTP step ──────────────────────────────────────────────────
  if (step === 'otp') {
    return (
      <div className="min-h-screen flex items-start justify-center bg-gray-50 px-4 pt-16">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <img src="/logo.svg" alt="FitTogether" className="w-16 h-16 mx-auto mb-4 shadow-soft rounded-[18px]" />
            <h1 className="text-[26px] font-extrabold text-gray-900 tracking-tight">Check your email</h1>
            <p className="text-gray-500 text-sm mt-2">
              We sent a 6-digit code to<br />
              <span className="font-medium text-gray-800">{email}</span>
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="bg-white rounded-3xl shadow-soft border border-gray-200/70 p-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700 text-center">Verification code</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={8}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="00000000"
                autoFocus
                className="w-full text-center text-3xl font-mono tracking-[0.6em] py-4 px-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-500 placeholder:tracking-[0.6em] placeholder:text-gray-300"
              />
            </div>

            <p className="text-xs text-gray-400 text-center">
              Check your spam folder if you don't see it within a minute.
            </p>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <Button type="submit" size="lg" loading={loading} className="w-full">
              Sign in
            </Button>

            <button
              type="button"
              onClick={() => { setStep('email'); setOtp(''); setError('') }}
              className="text-sm text-gray-500 hover:text-gray-700 text-center"
            >
              ← Use a different email
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Email step ────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-50 px-4 pt-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="FitTogether" className="w-16 h-16 mx-auto mb-4 shadow-soft rounded-[18px]" />
          <h1 className="text-[26px] font-extrabold text-gray-900 tracking-tight">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to FitTogether</p>
        </div>

        <form onSubmit={handleSendOtp} className="bg-white rounded-3xl shadow-soft border border-gray-200/70 p-6 flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button type="submit" size="lg" loading={loading} className="w-full mt-1">
            Send sign-in code
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          No account?{' '}
          <Link to="/signup" className="font-medium text-brand-600 hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
