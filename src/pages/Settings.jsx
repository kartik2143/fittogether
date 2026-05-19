import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useCoachRequests } from '../hooks/useCoachRequests'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Avatar } from '../components/ui/Avatar'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'

export default function Settings() {
  const { profile, refreshProfile } = useAuth()
  const { incoming, outgoing, sendRequest, respondToRequest, cancelRequest, loading: reqLoading } = useCoachRequests(profile?.user_id)
  const [supplements, setSupplements] = useState([])
  const [newSupp, setNewSupp] = useState('')
  const [suppLoading, setSuppLoading] = useState(false)
  const [addCoachOpen, setAddCoachOpen] = useState(false)
  const [coachEmail, setCoachEmail] = useState('')
  const [coachMsg, setCoachMsg] = useState('')
  const [coachLoading, setCoachLoading] = useState(false)
  const [currentCoach, setCurrentCoach] = useState(null)

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

  async function handleRemoveCoach() {
    await supabase.from('profiles').update({ coach_id: null }).eq('user_id', profile.user_id)
    await refreshProfile()
    setCurrentCoach(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Settings</h1>

      {/* Incoming coach requests (for coaches) */}
      {incoming.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-center gap-2 px-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending Requests</p>
            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none">{incoming.length}</span>
          </div>
          <Card className="overflow-hidden divide-y divide-gray-100">
            {incoming.map(req => (
              <div key={req.id} className="flex items-center gap-3 px-4 py-3.5">
                <Avatar src={req.member?.avatar_url} name={req.member?.display_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{req.member?.display_name}</p>
                  <p className="text-xs text-gray-400">{req.member?.email}</p>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" onClick={() => handleRespond(req.id, req.member_id, true)}>Accept</Button>
                  <Button size="sm" variant="secondary" onClick={() => handleRespond(req.id, req.member_id, false)}>Deny</Button>
                </div>
              </div>
            ))}
          </Card>
        </section>
      )}

      {/* My coach */}
      <section className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">My Coach</p>
        <Card className="overflow-hidden">
          {currentCoach ? (
            <div className="flex items-center gap-3 px-4 py-3.5">
              <Avatar src={currentCoach.avatar_url} name={currentCoach.display_name} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{currentCoach.display_name}</p>
                <p className="text-xs text-brand-600 font-medium mt-0.5">Coach</p>
              </div>
              <button onClick={handleRemoveCoach} className="text-sm text-red-500 font-medium hover:text-red-700">
                Remove
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {outgoing.filter(r => r.status === 'pending').map(r => (
                <div key={r.id} className="flex items-center justify-between px-4 py-3.5">
                  <div>
                    <p className="text-xs text-gray-400">Request pending</p>
                    <p className="text-sm font-semibold text-gray-900">{r.coach?.display_name}</p>
                  </div>
                  <button onClick={() => cancelRequest(r.id)} className="text-sm text-red-500 font-medium hover:text-red-700">Cancel</button>
                </div>
              ))}
              <button
                onClick={() => setAddCoachOpen(true)}
                className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-brand-600">Add coach by email</span>
              </button>
            </div>
          )}
        </Card>
      </section>

      {/* Supplement list */}
      <section className="flex flex-col gap-2">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-1">Supplements</p>
        <Card className="overflow-hidden divide-y divide-gray-100">
          {supplements.map(s => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3.5">
              <p className="text-sm text-gray-900">{s.name}</p>
              <button onClick={() => deleteSupplement(s.id)} className="text-sm text-red-500 font-medium hover:text-red-700">
                Remove
              </button>
            </div>
          ))}
          {supplements.length === 0 && (
            <div className="px-4 py-3.5">
              <p className="text-sm text-gray-400">No supplements added yet</p>
            </div>
          )}
          <div className="flex items-center gap-2 px-4 py-3">
            <input
              className="flex-1 text-sm text-gray-900 outline-none placeholder:text-gray-400 bg-transparent"
              placeholder="Add supplement…"
              value={newSupp}
              onChange={e => setNewSupp(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSupplement())}
            />
            {newSupp.trim() && (
              <button
                onClick={addSupplement}
                disabled={suppLoading}
                className="text-sm font-semibold text-brand-600 disabled:opacity-50"
              >
                Add
              </button>
            )}
          </div>
        </Card>
      </section>

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
            <p className={`text-sm rounded-xl px-4 py-3 ${coachMsg.includes('sent') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
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
