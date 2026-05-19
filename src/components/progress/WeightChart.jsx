import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { formatDateShort } from '../../utils/dateUtils'

export function WeightChart({ logs }) {
  const data = [...logs]
    .filter(l => l.weight_kg)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(l => ({ date: formatDateShort(l.date), weight: parseFloat(l.weight_kg) }))

  if (data.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-6">No weight data yet.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis
          domain={['auto', 'auto']}
          tick={{ fontSize: 11 }}
          tickFormatter={v => `${v}kg`}
        />
        <Tooltip formatter={v => [`${v} kg`, 'Weight']} />
        <Line type="monotone" dataKey="weight" stroke="#16a34a" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
