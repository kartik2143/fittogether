import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useStreak } from '../hooks/useStreak'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'

export default function Profiles() {
  const { profile: me } = useAuth()
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url, is_coach, is_member, email')
      .order('display_name')
      .then(({ data }) => { setProfiles(data || []); setLoading(false) })
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Profiles</h1>

      {loading
        ? Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-100 dark:border-white/10 animate-pulse" />
          ))
        : profiles.map(p => (
            <ProfileCard key={p.user_id} profile={p} isMe={p.user_id === me?.user_id} />
          ))
      }
    </div>
  )
}

function ProfileCard({ profile, isMe }) {
  const { streak } = useStreak(profile.user_id)

  const roles = []
  if (profile.is_coach) roles.push({ label: 'Coach', variant: 'blue' })
  if (profile.is_member) roles.push({ label: 'Member', variant: 'green' })

  return (
    <Link to={`/profiles/${profile.user_id}`}>
      <Card className="p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors active:scale-95">
        <Avatar src={profile.avatar_url} name={profile.display_name} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 dark:text-white">{profile.display_name}</p>
            {isMe && <span className="text-xs text-gray-400 dark:text-gray-500">(you)</span>}
          </div>
          <div className="flex gap-1 mt-1 flex-wrap">
            {roles.map(r => <Badge key={r.label} variant={r.variant}>{r.label}</Badge>)}
          </div>
        </div>
        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
          <span className="text-base">🔥</span>
          <span className="text-sm font-bold text-orange-600 dark:text-orange-400">{streak}</span>
        </div>
      </Card>
    </Link>
  )
}
