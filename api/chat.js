import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function subtractDay(dateStr) {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() - 1)
  return d.toISOString().slice(0, 10)
}

// ── Tool definitions ──────────────────────────────────────────
const tools = [{
  functionDeclarations: [
    {
      name: 'list_members',
      description: 'List all members coached by this coach. Use this to find a member\'s user_id when the coach refers to them by name.',
      parameters: { type: 'OBJECT', properties: {}, required: [] },
    },
    {
      name: 'get_profile',
      description: 'Get profile details for a user: name, height, supplements list, coach info.',
      parameters: {
        type: 'OBJECT',
        properties: {
          user_id: { type: 'STRING' },
        },
        required: ['user_id'],
      },
    },
    {
      name: 'get_workout_plan',
      description: 'Get the workout plan and exercises for a specific user on a specific date.',
      parameters: {
        type: 'OBJECT',
        properties: {
          user_id: { type: 'STRING', description: 'The user_id to fetch plan for' },
          date: { type: 'STRING', description: 'Date in YYYY-MM-DD format' },
        },
        required: ['user_id', 'date'],
      },
    },
    {
      name: 'get_recent_workouts',
      description: 'Get the most recent workout plans for a user.',
      parameters: {
        type: 'OBJECT',
        properties: {
          user_id: { type: 'STRING' },
          days: { type: 'NUMBER', description: 'How many past days to look back' },
        },
        required: ['user_id', 'days'],
      },
    },
    {
      name: 'get_health_logs',
      description: 'Get recent health logs for a user: weight, sleep hours, sleep quality, supplements taken, activity notes.',
      parameters: {
        type: 'OBJECT',
        properties: {
          user_id: { type: 'STRING' },
          days: { type: 'NUMBER', description: 'How many past days to look back (default 14)' },
        },
        required: ['user_id'],
      },
    },
    {
      name: 'get_meal_plan',
      description: 'Get the meal plan (breakfast, lunch, dinner, snacks) for a user on a specific date.',
      parameters: {
        type: 'OBJECT',
        properties: {
          user_id: { type: 'STRING' },
          date: { type: 'STRING', description: 'YYYY-MM-DD' },
        },
        required: ['user_id', 'date'],
      },
    },
    {
      name: 'get_streak',
      description: 'Get the current health log streak (consecutive days logged) for a user.',
      parameters: {
        type: 'OBJECT',
        properties: {
          user_id: { type: 'STRING' },
        },
        required: ['user_id'],
      },
    },
    {
      name: 'log_health',
      description: 'Record or update a health log entry. Only pass the fields the user mentioned — existing fields not in the call will be preserved. Use this when the user says things like "record my weight as 82kg today" or "log that I took creatine and whey".',
      parameters: {
        type: 'OBJECT',
        properties: {
          user_id: { type: 'STRING' },
          date: { type: 'STRING', description: 'YYYY-MM-DD, defaults to today' },
          weight_kg: { type: 'NUMBER', description: 'Weight in kilograms' },
          sleep_hours: { type: 'NUMBER', description: 'Hours of sleep' },
          sleep_quality: { type: 'NUMBER', description: 'Sleep quality 1 (poor) to 5 (excellent)' },
          supplements: { type: 'ARRAY', items: { type: 'STRING' }, description: 'List of supplement names taken today' },
          activity_notes: { type: 'STRING', description: 'Summary of physical activity (walks, gym, etc.)' },
          health_notes: { type: 'STRING', description: 'Private health notes' },
        },
        required: ['user_id', 'date'],
      },
    },
    {
      name: 'create_workout_plan',
      description: 'Create a new workout plan for a user on a date. Returns the new plan id.',
      parameters: {
        type: 'OBJECT',
        properties: {
          for_user_id: { type: 'STRING' },
          date: { type: 'STRING', description: 'YYYY-MM-DD' },
          description: { type: 'STRING', description: 'Title/description of the session' },
          type: { type: 'STRING', description: '"individual" (exercises by section) or "full_body"' },
        },
        required: ['for_user_id', 'date', 'description'],
      },
    },
    {
      name: 'add_exercise',
      description: 'Add an exercise to an existing workout plan.',
      parameters: {
        type: 'OBJECT',
        properties: {
          plan_id: { type: 'STRING' },
          exercise_name: { type: 'STRING' },
          section: { type: 'STRING', description: '"warmup", "main", or "cooldown"' },
          target_sets: { type: 'NUMBER' },
          target_reps: { type: 'NUMBER' },
          target_weight_kg: { type: 'NUMBER' },
          notes: { type: 'STRING' },
        },
        required: ['plan_id', 'exercise_name', 'section', 'target_sets'],
      },
    },
    {
      name: 'update_exercise',
      description: 'Update an existing exercise (sets, reps, weight, notes, name).',
      parameters: {
        type: 'OBJECT',
        properties: {
          exercise_id: { type: 'STRING' },
          exercise_name: { type: 'STRING' },
          target_sets: { type: 'NUMBER' },
          target_reps: { type: 'NUMBER' },
          target_weight_kg: { type: 'NUMBER' },
          notes: { type: 'STRING' },
          section: { type: 'STRING' },
        },
        required: ['exercise_id'],
      },
    },
    {
      name: 'delete_exercise',
      description: 'Remove an exercise from a workout plan.',
      parameters: {
        type: 'OBJECT',
        properties: {
          exercise_id: { type: 'STRING' },
        },
        required: ['exercise_id'],
      },
    },
  ],
}]

// ── Server-side access control ────────────────────────────────
async function buildAllowedIds(userId) {
  const allowed = new Set([userId])
  const { data: members } = await supabase
    .from('profiles')
    .select('user_id')
    .eq('coach_id', userId)
  members?.forEach(m => allowed.add(m.user_id))
  return allowed
}

async function assertPlanAccess(planId, allowed) {
  const { data } = await supabase
    .from('workout_plans')
    .select('for_user_id')
    .eq('id', planId)
    .single()
  if (!data) return { error: 'Plan not found.' }
  if (!allowed.has(data.for_user_id)) return { error: 'Access denied.' }
  return null
}

async function assertExerciseAccess(exerciseId, allowed) {
  const { data } = await supabase
    .from('workout_exercises')
    .select('plan_id, workout_plans(for_user_id)')
    .eq('id', exerciseId)
    .single()
  if (!data) return { error: 'Exercise not found.' }
  const owner = data.workout_plans?.for_user_id
  if (!owner || !allowed.has(owner)) return { error: 'Access denied.' }
  return null
}

// ── Pre-load today's context for the requesting user ──────────
async function loadContext(userId, today) {
  const [
    { data: todayLog },
    { data: weightLogs },
    { data: todayWorkout },
    { data: suppList },
    { data: streakLogs },
    { data: todayMeal },
  ] = await Promise.all([
    supabase.from('health_logs')
      .select('weight_kg, sleep_hours, sleep_quality, supplements, activity_notes')
      .eq('user_id', userId).eq('date', today).maybeSingle(),
    supabase.from('health_logs')
      .select('date, weight_kg').eq('user_id', userId)
      .order('date', { ascending: false }).limit(14),
    supabase.from('workout_plans')
      .select('description, workout_exercises(exercise_name, target_sets, target_reps, target_weight_kg)')
      .eq('for_user_id', userId).eq('date', today).maybeSingle(),
    supabase.from('supplement_list')
      .select('name').eq('user_id', userId).order('order_index'),
    supabase.from('health_logs')
      .select('date').eq('user_id', userId)
      .order('date', { ascending: false }).limit(120),
    supabase.from('meal_plans')
      .select('breakfast, lunch, dinner, snacks')
      .eq('for_user_id', userId).eq('date', today).maybeSingle(),
  ])

  // Compute streak
  const dateSet = new Set(streakLogs?.map(r => r.date) || [])
  let streak = 0
  let cursor = today
  while (dateSet.has(cursor)) { streak++; cursor = subtractDay(cursor) }
  if (streak === 0) {
    cursor = subtractDay(today)
    while (dateSet.has(cursor)) { streak++; cursor = subtractDay(cursor) }
  }

  const lines = []

  // Health log
  if (todayLog) {
    const parts = []
    if (todayLog.weight_kg) parts.push(`weight ${todayLog.weight_kg}kg`)
    if (todayLog.sleep_hours) parts.push(`sleep ${todayLog.sleep_hours}h (quality ${todayLog.sleep_quality}/5)`)
    if (todayLog.supplements?.length) parts.push(`supplements taken: ${todayLog.supplements.join(', ')}`)
    if (todayLog.activity_notes) parts.push(`activity: "${todayLog.activity_notes}"`)
    lines.push(`Today's health log: ${parts.join(' | ')}`)
  } else {
    lines.push(`Today's health log: not logged yet`)
  }

  // Weight trend
  const recentWeights = (weightLogs || []).filter(l => l.weight_kg).slice(0, 7)
  if (recentWeights.length) {
    lines.push(`Weight trend (last ${recentWeights.length} entries): ${recentWeights.map(l => `${l.date} → ${l.weight_kg}kg`).join(', ')}`)
  }

  // Today's workout
  if (todayWorkout) {
    const exList = (todayWorkout.workout_exercises || [])
      .map(e => `${e.exercise_name} ${e.target_sets}×${e.target_reps || '?'}${e.target_weight_kg ? ` @${e.target_weight_kg}kg` : ''}`)
      .join(', ')
    lines.push(`Today's workout: ${todayWorkout.description || 'Untitled'} — ${exList || 'no exercises yet'}`)
  } else {
    lines.push(`Today's workout: none scheduled`)
  }

  // Today's meal plan
  if (todayMeal) {
    const meals = ['breakfast', 'lunch', 'dinner', 'snacks']
      .filter(k => todayMeal[k])
      .map(k => `${k}: ${todayMeal[k]}`)
      .join(' | ')
    if (meals) lines.push(`Today's meal plan: ${meals}`)
  } else {
    lines.push(`Today's meal plan: none set`)
  }

  lines.push(`Current streak: ${streak} day${streak !== 1 ? 's' : ''}`)

  const suppNames = (suppList || []).map(s => s.name)
  if (suppNames.length) lines.push(`Registered supplements: ${suppNames.join(', ')}`)

  return lines.join('\n')
}

// ── Tool executor ─────────────────────────────────────────────
async function runTool(name, args, requesterId, allowed) {
  switch (name) {
    case 'list_members': {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .eq('coach_id', requesterId)
      return { members: data || [] }
    }
    case 'get_profile': {
      if (!allowed.has(args.user_id)) return { error: 'Access denied.' }
      const [{ data: profile }, { data: supps }] = await Promise.all([
        supabase.from('profiles').select('display_name, is_coach, height_cm, date_of_birth').eq('user_id', args.user_id).single(),
        supabase.from('supplement_list').select('name').eq('user_id', args.user_id).order('order_index'),
      ])
      return { profile, supplements: supps?.map(s => s.name) || [] }
    }
    case 'get_workout_plan': {
      if (!allowed.has(args.user_id)) return { error: 'Access denied.' }
      const { data: plan } = await supabase
        .from('workout_plans')
        .select('*, workout_exercises(*)')
        .eq('for_user_id', args.user_id)
        .eq('date', args.date)
        .order('order_index', { referencedTable: 'workout_exercises' })
        .maybeSingle()
      return plan ? { plan } : { plan: null, message: 'No workout plan found for this date.' }
    }
    case 'get_recent_workouts': {
      if (!allowed.has(args.user_id)) return { error: 'Access denied.' }
      const since = new Date()
      since.setDate(since.getDate() - (args.days || 14))
      const dateStr = since.toISOString().slice(0, 10)
      const { data } = await supabase
        .from('workout_plans')
        .select('id, date, description, workout_exercises(exercise_name, section, target_sets, target_reps, target_weight_kg)')
        .eq('for_user_id', args.user_id)
        .gte('date', dateStr)
        .order('date', { ascending: false })
      return { plans: data || [] }
    }
    case 'get_health_logs': {
      if (!allowed.has(args.user_id)) return { error: 'Access denied.' }
      const since = new Date()
      since.setDate(since.getDate() - (args.days || 14))
      const dateStr = since.toISOString().slice(0, 10)
      const { data } = await supabase
        .from('health_logs')
        .select('date, weight_kg, sleep_hours, sleep_quality, supplements, activity_notes, health_notes')
        .eq('user_id', args.user_id)
        .gte('date', dateStr)
        .order('date', { ascending: false })
      return { logs: data || [] }
    }
    case 'get_meal_plan': {
      if (!allowed.has(args.user_id)) return { error: 'Access denied.' }
      const { data } = await supabase
        .from('meal_plans')
        .select('breakfast, breakfast_notes, lunch, lunch_notes, dinner, dinner_notes, snacks, snacks_notes')
        .eq('for_user_id', args.user_id)
        .eq('date', args.date)
        .maybeSingle()
      return data ? { meal_plan: data } : { meal_plan: null, message: 'No meal plan for this date.' }
    }
    case 'get_streak': {
      if (!allowed.has(args.user_id)) return { error: 'Access denied.' }
      const { data } = await supabase
        .from('health_logs')
        .select('date')
        .eq('user_id', args.user_id)
        .order('date', { ascending: false })
        .limit(120)
      const dateSet = new Set(data?.map(r => r.date) || [])
      const today = new Date().toISOString().slice(0, 10)
      let streak = 0
      let cursor = today
      while (dateSet.has(cursor)) { streak++; cursor = subtractDay(cursor) }
      if (streak === 0) {
        cursor = subtractDay(today)
        while (dateSet.has(cursor)) { streak++; cursor = subtractDay(cursor) }
      }
      return { streak, message: `${streak} day streak` }
    }
    case 'log_health': {
      if (!allowed.has(args.user_id)) return { error: 'Access denied.' }

      // Build only the fields the user mentioned
      const updates = {}
      if (args.weight_kg !== undefined) updates.weight_kg = args.weight_kg
      if (args.sleep_hours !== undefined) updates.sleep_hours = args.sleep_hours
      if (args.sleep_quality !== undefined) updates.sleep_quality = args.sleep_quality
      if (args.supplements !== undefined) updates.supplements = args.supplements
      if (args.activity_notes !== undefined) updates.activity_notes = args.activity_notes
      if (args.health_notes !== undefined) updates.health_notes = args.health_notes

      // Check if a log already exists for this date
      const { data: existing } = await supabase
        .from('health_logs')
        .select('id')
        .eq('user_id', args.user_id)
        .eq('date', args.date)
        .maybeSingle()

      let error
      if (existing) {
        ;({ error } = await supabase.from('health_logs').update(updates).eq('id', existing.id))
      } else {
        ;({ error } = await supabase.from('health_logs').insert({ user_id: args.user_id, date: args.date, ...updates }))
      }

      if (error) return { error: error.message }
      const summary = Object.entries(updates).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(', ')
      return { message: `Health log ${existing ? 'updated' : 'created'} for ${args.date}: ${summary}` }
    }
    case 'create_workout_plan': {
      if (!allowed.has(args.for_user_id)) return { error: 'Access denied.' }
      const { data, error } = await supabase
        .from('workout_plans')
        .insert({
          for_user_id: args.for_user_id,
          created_by: requesterId,
          date: args.date,
          description: args.description,
          type: args.type || 'individual',
        })
        .select('id')
        .single()
      if (error) return { error: error.message }
      return { plan_id: data.id, message: `Plan created for ${args.date}.` }
    }
    case 'add_exercise': {
      const deny = await assertPlanAccess(args.plan_id, allowed)
      if (deny) return deny

      const { data: existing } = await supabase
        .from('workout_exercises')
        .select('order_index')
        .eq('plan_id', args.plan_id)
        .order('order_index', { ascending: false })
        .limit(1)
      const nextOrder = existing?.[0]?.order_index != null ? existing[0].order_index + 1 : 0

      const { data, error } = await supabase
        .from('workout_exercises')
        .insert({
          plan_id: args.plan_id,
          exercise_name: args.exercise_name,
          section: args.section || 'main',
          target_sets: args.target_sets,
          target_reps: args.target_reps || null,
          target_weight_kg: args.target_weight_kg || null,
          notes: args.notes || null,
          order_index: nextOrder,
        })
        .select('id')
        .single()
      if (error) return { error: error.message }
      return { exercise_id: data.id, message: `Added ${args.exercise_name}.` }
    }
    case 'update_exercise': {
      const deny = await assertExerciseAccess(args.exercise_id, allowed)
      if (deny) return deny

      const updates = {}
      if (args.exercise_name !== undefined) updates.exercise_name = args.exercise_name
      if (args.target_sets !== undefined) updates.target_sets = args.target_sets
      if (args.target_reps !== undefined) updates.target_reps = args.target_reps
      if (args.target_weight_kg !== undefined) updates.target_weight_kg = args.target_weight_kg
      if (args.notes !== undefined) updates.notes = args.notes
      if (args.section !== undefined) updates.section = args.section
      const { error } = await supabase
        .from('workout_exercises')
        .update(updates)
        .eq('id', args.exercise_id)
      if (error) return { error: error.message }
      return { message: 'Exercise updated.' }
    }
    case 'delete_exercise': {
      const deny = await assertExerciseAccess(args.exercise_id, allowed)
      if (deny) return deny

      const { data: ex } = await supabase
        .from('workout_exercises')
        .select('exercise_name')
        .eq('id', args.exercise_id)
        .single()
      const { error } = await supabase
        .from('workout_exercises')
        .delete()
        .eq('id', args.exercise_id)
      if (error) return { error: error.message }
      return { message: `Removed ${ex?.exercise_name || 'exercise'}.` }
    }
    default:
      return { error: `Unknown tool: ${name}` }
  }
}

// ── Handler ───────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { messages, userId, userName, today } = req.body
  if (!messages || !userId) return res.status(400).json({ error: 'Missing required fields' })

  // Build access control + load today's context in parallel
  const [allowed, context] = await Promise.all([
    buildAllowedIds(userId),
    loadContext(userId, today),
  ])
  const isCoach = allowed.size > 1

  const systemPrompt = `You are FitTogether's AI fitness assistant — concise, practical, and action-oriented.

Today's date: ${today}
User: ${userName} (${isCoach ? 'Coach' : 'Member'}, user_id: ${userId})
${isCoach ? 'As a coach you can manage workout plans and read data for your members. Use list_members to find a member\'s user_id when they refer to someone by name.' : ''}

=== ${userName}'s snapshot for today ===
${context}
===

RULES — follow these strictly:
1. Data access: you can only read and write data for this user${isCoach ? ' and their members' : ''}. Never access or guess other users\' data.
2. No invention: never make up or assume any values (weights, foods, exercises, etc.). Only use data from the tools or explicitly stated by the user in this conversation.
3. Confirm before any write (log_health, create_workout_plan, add_exercise, update_exercise, delete_exercise): briefly state what you are about to do and ask for confirmation. Only execute after the user says yes. Exception: if the user's message itself is the explicit instruction ("record my weight as 82kg"), that counts as confirmation — proceed directly.
4. After every write, confirm in one short sentence what was saved.
5. Use the snapshot above to answer questions without calling extra tools when possible.

Keep responses short. No markdown headers. Bullet points are fine.`

  // Gemini requires history to start with a 'user' turn
  const allButLast = messages.slice(0, -1)
  const firstUserIdx = allButLast.findIndex(m => m.role === 'user')
  const history = (firstUserIdx === -1 ? [] : allButLast.slice(firstUserIdx))
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }))
  const lastMessage = messages[messages.length - 1].text

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.1-flash-lite',
      tools,
      systemInstruction: systemPrompt,
    })

    const chat = model.startChat({ history })

    let result = await chat.sendMessage(lastMessage)
    let iterations = 0

    while (iterations < 10) {
      const calls = result.response.functionCalls()
      if (!calls || calls.length === 0) break
      iterations++

      const toolResults = await Promise.all(
        calls.map(async call => ({
          functionResponse: {
            name: call.name,
            response: await runTool(call.name, call.args, userId, allowed),
          },
        }))
      )

      result = await chat.sendMessage(toolResults)
    }

    const text = result.response.text()
    res.status(200).json({ reply: text })
  } catch (err) {
    console.error('Chat error:', err)
    res.status(500).json({ error: err.message || 'Something went wrong' })
  }
}
