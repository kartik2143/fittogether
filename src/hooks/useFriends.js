import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useFriends(userId) {
  const [friends, setFriends] = useState([])   // accepted
  const [incoming, setIncoming] = useState([]) // pending where I'm recipient
  const [outgoing, setOutgoing] = useState([]) // pending where I'm requester
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!userId) return
    setLoading(true)

    const { data: all } = await supabase
      .from('friendships')
      .select('id, requester_id, recipient_id, status')
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)

    const accepted = (all || []).filter(f => f.status === 'accepted')
    const inc      = (all || []).filter(f => f.status === 'pending' && f.recipient_id === userId)
    const out      = (all || []).filter(f => f.status === 'pending' && f.requester_id === userId)

    const otherIds = [
      ...accepted.map(f => f.requester_id === userId ? f.recipient_id : f.requester_id),
      ...inc.map(f => f.requester_id),
      ...out.map(f => f.recipient_id),
    ]
    const uniqueIds = [...new Set(otherIds)]

    let profileMap = {}
    if (uniqueIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, email')
        .in('user_id', uniqueIds)
      profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p]))
    }

    setFriends(accepted.map(f => {
      const friendId = f.requester_id === userId ? f.recipient_id : f.requester_id
      return { id: f.id, friend_id: friendId, friend: profileMap[friendId] }
    }))
    setIncoming(inc.map(f => ({ id: f.id, requester_id: f.requester_id, requester: profileMap[f.requester_id] })))
    setOutgoing(out.map(f => ({ id: f.id, recipient_id: f.recipient_id, recipient: profileMap[f.recipient_id] })))
    setLoading(false)
  }, [userId])

  useEffect(() => { fetch() }, [fetch])

  async function sendRequest(friendEmail) {
    const { data: target } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .eq('email', friendEmail.trim().toLowerCase())
      .maybeSingle()

    if (!target) return { error: 'No user found with that email.' }
    if (target.user_id === userId) return { error: 'You cannot add yourself as a friend.' }

    // Check both directions for an existing row
    const { data: existing } = await supabase
      .from('friendships')
      .select('id, status')
      .or(
        `and(requester_id.eq.${userId},recipient_id.eq.${target.user_id}),` +
        `and(requester_id.eq.${target.user_id},recipient_id.eq.${userId})`
      )
      .maybeSingle()

    if (existing) {
      return existing.status === 'accepted'
        ? { error: 'You are already friends with this person.' }
        : { error: 'A friend request already exists with this person.' }
    }

    const { error: insertErr } = await supabase
      .from('friendships')
      .insert({ requester_id: userId, recipient_id: target.user_id })

    if (insertErr) return { error: insertErr.message }
    await fetch()
    return { friendName: target.display_name }
  }

  async function respondToRequest(requestId, accept) {
    if (accept) {
      await supabase.from('friendships').update({ status: 'accepted' }).eq('id', requestId)
    } else {
      await supabase.from('friendships').delete().eq('id', requestId)
    }
    await fetch()
  }

  async function cancelRequest(requestId) {
    await supabase.from('friendships').delete().eq('id', requestId)
    await fetch()
  }

  async function removeFriend(friendshipId) {
    await supabase.from('friendships').delete().eq('id', friendshipId)
    await fetch()
  }

  return { friends, incoming, outgoing, loading, sendRequest, respondToRequest, cancelRequest, removeFriend, refetch: fetch }
}
