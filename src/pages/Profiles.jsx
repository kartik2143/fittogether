import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useFriends } from '../hooks/useFriends'
import { useStreak } from '../hooks/useStreak'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'

export default function Profiles() {
  const { profile: me } = useAuth()
  const { friends, loading: friendsLoading } = useFriends(me?.user_id)
  const [coach, setCoach] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!me?.user_id) return
    async function load() {
      const promises = []
      if (me.coach_id) {
        promises.push(
          supabase.from('profiles').select('*').eq('user_id', me.coach_id).single()
            .then(({ data }) => setCoach(data))
        )
      }
      if (me.is_coach) {
        promises.push(
          supabase.from('profiles').select('*').eq('coach_id', me.user_id)
            .then(({ data }) => setMembers(data || []))
        )
      }
      await Promise.all(promises)
      setLoading(false)
    }
    load()
  }, [me?.user_id, me?.coach_id, me?.is_coach])

  const isLoading = loading || friendsLoading

  const Skeleton = () => (
    <div className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />
  )

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold text-gray-900">👥 Profiles</h1>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} />)}
        </div>
      ) : (
        <>
          {/* Yourself */}
          {me && (
            <Section label="You">
              <ProfileCard profile={me} isMe />
            </Section>
          )}

          {/* Coach */}
          {coach && (
            <Section label="My Coach">
              <ProfileCard profile={coach} />
            </Section>
          )}

          {/* Members (visible to coaches) */}
          {me?.is_coach && members.length > 0 && (
            <Section label={`Members (${members.length})`}>
              {members.map(p => <ProfileCard key={p.user_id} profile={p} />)}
            </Section>
          )}

          {/* Friends */}
          <Section label={friends.length ? `Friends (${friends.length})` : 'Friends'}>
            {friends.length > 0
              ? friends.map(({ friend, friend_id }) =>
                  friend ? <ProfileCard key={friend_id} profile={friend} /> : null
                )
              : (
                <p className="text-sm text-gray-400 italic px-1">
                  No friends added yet. Add friends in Settings.
                </p>
              )
            }
          </Section>
        </>
      )}
    </div>
  )
}

function Section({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1">{label}</p>
      {children}
    </div>
  )
}

function ProfileCard({ profile, isMe }) {
  const { streak } = useStreak(profile.user_id)

  const roles = []
  if (profile.is_coach)  roles.push({ label: 'Coach',  variant: 'blue' })
  if (profile.is_member) roles.push({ label: 'Member', variant: 'green' })

  return (
    <Link to={`/profiles/${profile.user_id}`}>
      <Card className="p-4 flex items-center gap-3 hover:bg-gray-50 transition-colors active:scale-95">
        <Avatar src={profile.avatar_url} name={profile.display_name} size="lg" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900">{profile.display_name}</p>
            {isMe && <span className="text-xs text-gray-400">(you)</span>}
          </div>
          <div className="flex gap-1 mt-1 flex-wrap">
            {roles.map(r => <Badge key={r.label} variant={r.variant}>{r.label}</Badge>)}
          </div>
        </div>
        <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
          <span className="text-base">🔥</span>
          <span className="text-sm font-bold text-orange-600">{streak}</span>
        </div>
      </Card>
    </Link>
  )
}
