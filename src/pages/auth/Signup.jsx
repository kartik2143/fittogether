import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { compressImage } from '../../utils/imageCompression'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Avatar } from '../../components/ui/Avatar'

export default function Signup() {
  const navigate = useNavigate()
  const { refreshProfile } = useAuth()
  const fileRef = useRef(null)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('member') // 'member' | 'coach'
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setError('Please enter a valid email address.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    setError('')
    setLoading(true)

    // 1. Sign up
    const { data: authData, error: authErr } = await supabase.auth.signUp({ email, password })
    if (authErr) { setError(authErr.message); setLoading(false); return }

    const userId = authData.user.id

    // 2. Upload avatar if provided
    let avatarUrl = null
    if (avatarFile) {
      try {
        const compressed = await compressImage(avatarFile)
        const ext = 'jpg'
        const path = `${userId}/avatar.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(path, compressed, { upsert: true, contentType: 'image/jpeg' })
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
          avatarUrl = urlData.publicUrl
        }
      } catch {
        // avatar upload failure is non-fatal
      }
    }

    // 3. Insert profile
    const { error: profileErr } = await supabase.from('profiles').insert({
      user_id: userId,
      email: email.toLowerCase().trim(),
      display_name: displayName.trim(),
      avatar_url: avatarUrl,
      is_coach: role === 'coach',
      is_member: role === 'member',
    })

    if (profileErr) { setError(profileErr.message); setLoading(false); return }

    await refreshProfile()
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="FitTogether" className="w-14 h-14 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
          <p className="text-gray-500 text-sm mt-1">Join FitTogether</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col gap-4">
          {/* Avatar picker */}
          <div className="flex flex-col items-center gap-2">
            <button type="button" onClick={() => fileRef.current?.click()}>
              <Avatar src={avatarPreview} name={displayName || '?'} size="xl" className="ring-2 ring-brand-100 hover:ring-brand-400 transition-all" />
            </button>
            <span className="text-xs text-gray-500">Tap to add photo (optional)</span>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
          </div>

          <Input
            label="Display name"
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            placeholder="e.g. Kartik"
            required
            maxLength={40}
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Min. 6 characters"
            required
            autoComplete="new-password"
          />

          {/* Role picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">I am a…</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'member', emoji: '🏃', label: 'Member', desc: 'I log my own data' },
                { value: 'coach', emoji: '🧑‍💼', label: 'Coach', desc: 'I write plans for others' },
              ].map(({ value, emoji, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  className={`
                    flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-sm transition-colors
                    ${role === value
                      ? 'border-brand-500 bg-brand-50 text-brand-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="text-2xl">{emoji}</span>
                  <span className="font-medium">{label}</span>
                  <span className="text-xs text-center text-gray-400">{desc}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button type="submit" size="lg" loading={loading} className="w-full mt-1">
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
