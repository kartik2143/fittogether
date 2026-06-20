import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCoachRequests } from '../hooks/useCoachRequests'
import { useFriends } from '../hooks/useFriends'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card } from '../components/ui/Card'
import { Avatar } from '../components/ui/Avatar'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'

export default function Settings() {
  const { profile, refreshProfile } = useAuth()
  const { incoming, outgoing, sendRequest, respondToRequest, cancelRequest, loading: reqLoading } = useCoachRequests(profile?.user_id)
  const { friends, incoming: friendRequests, outgoing: friendOutgoing, sendRequest: sendFriendRequest, respondToRequest: respondFriend, cancelRequest: cancelFriendRequest, removeFriend } = useFriends(profile?.user_id)
  const [supplements, setSupplements] = useState([])
  const [newSupp, setNewSupp] = useState('')
  const [suppLoading, setSuppLoading] = useState(false)
  const [addCoachOpen, setAddCoachOpen] = useState(false)
  const [coachEmail, setCoachEmail] = useState('')
  const [coachMsg, setCoachMsg] = useState('')
  const [coachLoading, setCoachLoading] = useState(false)
  const [currentCoach, setCurrentCoach] = useState(null)
  const [addFriendOpen, setAddFriendOpen] = useState(false)
  const [friendEmail, setFriendEmail] = useState('')
  const [friendMsg, setFriendMsg] = useState('')
  const [friendLoading, setFriendLoading] = useState(false)

  useEffect(() => {
    if (!profile?.user_id) return
    fetchSupplements()
    if (profile.coach_id) fetchCoach()
  }, [profile?.user_id, profile?.coach_id])

  async function fetchSupplements() {
    const { data } = await supabase
      .from('supplement_list')
      .select('*')
      .eq('user_id', profile.user_id)
      .order('order_index')
    setSupplements(data || [])
  }

  async function fetchCoach() {
    const { data } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('user_id', profile.coach_id)
      .single()
    setCurrentCoach(data)
  }

  async function addSupplement() {
    if (!newSupp.trim()) return
    setSuppLoading(true)
    await supabase.from('supplement_list').insert({
      user_id: profile.user_id,
      name: newSupp.trim(),
      order_index: supplements.length,
    })
    setNewSupp('')
    await fetchSupplements()
    setSuppLoading(false)
  }

  async function deleteSupplement(id) {
    await supabase.from('supplement_list').delete().eq('id', id)
    fetchSupplements()
  }

  async function handleSendCoachRequest() {
    if (!coachEmail.trim()) return
    setCoachLoading(true)
    setCoachMsg('')
    const result = await sendRequest(coachEmail)
    if (result.error) {
      setCoachMsg(result.error)
    } else {
      setCoachMsg(`Request sent to ${result.coachName}!`)
      setCoachEmail('')
      setTimeout(() => setAddCoachOpen(false), 1500)
    }
    setCoachLoading(false)
  }

  async function handleRespond(requestId, memberId, accept) {
    await respondToRequest(requestId, memberId, accept)
    await refreshProfile()
  }

  async function handleSendFriendRequest() {
    if (!friendEmail.trim()) return
    setFriendLoading(true)
    setFriendMsg('')
    const result = await sendFriendRequest(friendEmail)
    if (result.error) {
      setFriendMsg(result.error)
    } else {
      setFriendMsg(`Friend request sent to ${result.friendName}!`)
      setFriendEmail('')
      setTimeout(() => setAddFriendOpen(false), 1500)
    }
    setFriendLoading(false)
  }

  async function handleRemoveCoach() {
    await supabase.from('profiles').update({ coach_id: null }).eq('user_id', profile.user_id)
    await refreshProfile()
    setCurrentCoach(null)
  }

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">⚙️ Settings</h1>

      {/* Incoming coach requests (for coaches) */}
      {incoming.length > 0 && (
        <Card className="p-4">
          <p className="font-semibold text-gray-800 mb-3">
            Pending coach requests
            <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{incoming.length}</span>
          </p>
          <div className="flex flex-col gap-3">
            {incoming.map(req => (
              <div key={req.id} className="flex items-center gap-3">
                <Avatar src={req.member?.avatar_url} name={req.member?.display_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{req.member?.display_name}</p>
                  <p className="text-xs text-gray-400">{req.member?.email}</p>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" onClick={() => handleRespond(req.id, req.member_id, true)}>Accept</Button>
                  <Button size="sm" variant="secondary" onClick={() => handleRespond(req.id, req.member_id, false)}>Deny</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* My coach */}
      <Card className="p-4">
        <p className="font-semibold text-gray-800 mb-3">My coach</p>
        {currentCoach ? (
          <div className="flex items-center gap-3">
            <Avatar src={currentCoach.avatar_url} name={currentCoach.display_name} size="md" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{currentCoach.display_name}</p>
              <Badge variant="blue">Coach</Badge>
            </div>
            <button onClick={handleRemoveCoach} className="text-xs text-red-400 hover:text-red-600 font-medium">
              Remove
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {outgoing.filter(r => r.status === 'pending').map(r => (
              <div key={r.id} className="flex items-center justify-between">
                <p className="text-sm text-gray-600">Request pending for <b>{r.coach?.display_name}</b></p>
                <button onClick={() => cancelRequest(r.id)} className="text-xs text-red-400 hover:text-red-600">Cancel</button>
              </div>
            ))}
            <button
              onClick={() => setAddCoachOpen(true)}
              className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-400 hover:border-brand-400 hover:text-brand-600 transition-colors"
            >
              + Add coach by email
            </button>
          </div>
        )}
      </Card>

      {/* Friends */}
      <Card className="p-4">
        <p className="font-semibold text-gray-800 mb-3">My friends</p>

        {/* Incoming friend requests */}
        {friendRequests.length > 0 && (
          <div className="flex flex-col gap-3 mb-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Requests received
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">{friendRequests.length}</span>
            </p>
            {friendRequests.map(req => (
              <div key={req.id} className="flex items-center gap-3">
                <Avatar src={req.requester?.avatar_url} name={req.requester?.display_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{req.requester?.display_name}</p>
                  <p className="text-xs text-gray-400">{req.requester?.email}</p>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" onClick={() => respondFriend(req.id, true)}>Accept</Button>
                  <Button size="sm" variant="secondary" onClick={() => respondFriend(req.id, false)}>Decline</Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Accepted friends */}
        {friends.length > 0 && (
          <div className="flex flex-col gap-3 mb-3">
            {friends.map(({ id, friend }) => (
              <div key={id} className="flex items-center gap-3">
                <Avatar src={friend?.avatar_url} name={friend?.display_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800">{friend?.display_name}</p>
                  <Badge variant="green">Friend</Badge>
                </div>
                <button onClick={() => removeFriend(id)} className="text-xs text-red-400 hover:text-red-600 font-medium">
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Outgoing pending */}
        {friendOutgoing.map(req => (
          <div key={req.id} className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Request pending for <b>{req.recipient?.display_name}</b></p>
            <button onClick={() => cancelFriendRequest(req.id)} className="text-xs text-red-400 hover:text-red-600">Cancel</button>
          </div>
        ))}

        <button
          onClick={() => setAddFriendOpen(true)}
          className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-sm text-gray-400 hover:border-brand-400 hover:text-brand-600 transition-colors"
        >
          + Add friend by email
        </button>
      </Card>

      {/* Supplement list */}
      <Card className="p-4">
        <p className="font-semibold text-gray-800 mb-3">My supplements</p>
        <div className="flex flex-col gap-2 mb-3">
          {supplements.map(s => (
            <div key={s.id} className="flex items-center justify-between py-1">
              <p className="text-sm text-gray-700">{s.name}</p>
              <button onClick={() => deleteSupplement(s.id)} className="text-xs text-red-400 hover:text-red-600">
                Remove
              </button>
            </div>
          ))}
          {supplements.length === 0 && (
            <p className="text-sm text-gray-400 italic">No supplements added yet.</p>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="e.g. Creatine"
            value={newSupp}
            onChange={e => setNewSupp(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSupplement())}
            className="flex-1"
          />
          <Button onClick={addSupplement} loading={suppLoading} variant="secondary">
            Add
          </Button>
        </div>
      </Card>

      {/* Add friend modal */}
      <Modal open={addFriendOpen} onClose={() => { setAddFriendOpen(false); setFriendMsg('') }} title="Add a friend">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">Enter their email address. They'll get a request to accept.</p>
          <Input
            label="Friend's email"
            type="email"
            value={friendEmail}
            onChange={e => setFriendEmail(e.target.value)}
            placeholder="friend@example.com"
          />
          {friendMsg && (
            <p className={`text-sm rounded-lg px-3 py-2 ${friendMsg.includes('sent') ? 'bg-sage-50 text-sage-700' : 'bg-red-50 text-red-600'}`}>
              {friendMsg}
            </p>
          )}
          <Button loading={friendLoading} onClick={handleSendFriendRequest} className="w-full">
            Send request
          </Button>
        </div>
      </Modal>

      {/* Add coach modal */}
      <Modal open={addCoachOpen} onClose={() => { setAddCoachOpen(false); setCoachMsg('') }} title="Add a coach">
        <div className="flex flex-col gap-4">
          <p className="text-sm text-gray-600">Enter your coach's email address. They'll get a request to accept.</p>
          <Input
            label="Coach's email"
            type="email"
            value={coachEmail}
            onChange={e => setCoachEmail(e.target.value)}
            placeholder="coach@example.com"
          />
          {coachMsg && (
            <p className={`text-sm rounded-lg px-3 py-2 ${coachMsg.includes('sent') ? 'bg-sage-50 text-sage-700' : 'bg-red-50 text-red-600'}`}>
              {coachMsg}
            </p>
          )}
          <Button loading={coachLoading} onClick={handleSendCoachRequest} className="w-full">
            Send request
          </Button>
        </div>
      </Modal>
    </div>
  )
}
