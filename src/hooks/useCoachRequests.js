import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useCoachRequests(userId) {
  const [incoming, setIncoming] = useState([]) // requests where I am the coach
  const [outgoing, setOutgoing] = useState([]) // requests I sent as member
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    const [{ data: inc }, { data: out }] = await Promise.all([
      supabase
        .from('coach_requests')
        .select('*, member:member_id(display_name, avatar_url, email)')
        .eq('coach_id', userId)
        .eq('status', 'pending'),
      supabase
        .from('coach_requests')
        .select('*, coach:coach_id(display_name, avatar_url)')
        .eq('member_id', userId),
    ])

    setIncoming(inc || [])
    setOutgoing(out || [])
    setLoading(false)
  }, [userId])

  useEffect(() => { fetch() }, [fetch])

  async function sendRequest(coachEmail) {
    // Look up coach by email
    const { data: coachProfile, error } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .eq('email', coachEmail.trim().toLowerCase())
      .maybeSingle()

    if (error || !coachProfile) return { error: 'No user found with that email.' }
    if (coachProfile.user_id === userId) return { error: 'You cannot add yourself as a coach.' }

    const { error: insertErr } = await supabase
      .from('coach_requests')
      .insert({ member_id: userId, coach_id: coachProfile.user_id })

    if (insertErr) {
      if (insertErr.code === '23505') return { error: 'You already have a pending request to this coach.' }
      return { error: insertErr.message }
    }

    await fetch()
    return { coachName: coachProfile.display_name }
  }

  async function respondToRequest(requestId, memberId, accept) {
    const status = accept ? 'accepted' : 'denied'

    const { error: updateErr } = await supabase
      .from('coach_requests')
      .update({ status })
      .eq('id', requestId)

    if (updateErr) return { error: updateErr.message }

    if (accept) {
      // Link member → this coach
      await supabase
        .from('profiles')
        .update({ coach_id: userId, is_member: true })
        .eq('user_id', memberId)

      // Ensure current user is flagged as coach
      await supabase
        .from('profiles')
        .update({ is_coach: true })
        .eq('user_id', userId)
    }

    await fetch()
    return {}
  }

  async function cancelRequest(requestId) {
    await supabase.from('coach_requests').delete().eq('id', requestId)
    await fetch()
  }

  return { incoming, outgoing, loading, sendRequest, respondToRequest, cancelRequest, refetch: fetch }
}
