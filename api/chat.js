import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@supabase/supabase-js'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ── Tool definitions ──────────────────────────────────────────
const tools = [{
  functionDeclarations: [
    {
      name: 'list_members',
      description: 'List all members coached by this coach. Use this to find a member\'s user_id when the coach refers to them by name.',
      parameters: { type: 'OBJECT', properties: {}, required: [] },
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
      name: 'create_workout_plan',
      description: 'Create a new workout plan for a user on a date. Returns the new plan id.',
      parameters: {
        type: 'OBJECT',
        properties: {
          for_user_id: { type: 'STRING' },
          created_by: { type: 'STRING', description: 'The coach or user creating this plan' },
          date: { type: 'STRING', description: 'YYYY-MM-DD' },
          description: { type: 'STRING', description: 'Title/description of the session' },
          type: { type: 'STRING', description: '"individual" (exercises by section) or "full_body"' },
        },
        required: ['for_user_id', 'created_by', 'date', 'description'],
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

// ── Tool executor ─────────────────────────────────────────────
async function runTool(name, args, coachId) {
  switch (name) {
    case 'list_members': {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .eq('coach_id', coachId)
      return { members: data || [] }
    }
    case 'get_workout_plan': {
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
    case 'create_workout_plan': {
      const { data, error } = await supabase
        .from('workout_plans')
        .insert({
          for_user_id: args.for_user_id,
          created_by: args.created_by,
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
      // Get current max order_index
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

  const { messages, userId, userName, isCoach, today } = req.body
  if (!messages || !userId) return res.status(400).json({ error: 'Missing required fields' })

  const systemPrompt = `You are FitTogether's AI fitness assistant — concise, practical, and action-oriented.

Today's date: ${today}
User: ${userName} (${isCoach ? 'Coach' : 'Member'}, user_id: ${userId})
${isCoach ? `As a coach you can manage workout plans for your members. Use list_members to find member user_ids when they refer to someone by name.` : ''}

When asked to add, change, or remove exercises, use the tools immediately — don't ask for confirmation unless something is genuinely ambiguous. After making changes, give a brief confirmation of exactly what you did.

Keep responses short. No markdown headers. Bullet points are fine.`

  // Convert our simple message format to Gemini history format
  const history = messages.slice(0, -1).map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }],
  }))
  const lastMessage = messages[messages.length - 1].text

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      tools,
      systemInstruction: systemPrompt,
    })

    const chat = model.startChat({ history })

    // Agentic loop — keep running tool calls until Gemini returns text
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
            response: await runTool(call.name, call.args, userId),
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
