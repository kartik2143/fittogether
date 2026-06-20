import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { formatDateShort } from '../../utils/dateUtils'

const qualityColors = ['', '#d1453b', '#dd7a3a', '#d9a441', '#8aa05a', '#5f7850']

export function SleepChart({ logs }) {
  const data = [...logs]
    .filter(l => l.sleep_hours)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14)
    .map(l => ({
      date: formatDateShort(l.date),
      hours: parseFloat(l.sleep_hours),
      quality: l.sleep_quality ?? 3,
    }))

  if (data.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-6">No sleep data yet.</p>
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} />
        <YAxis domain={[0, 12]} tick={{ fontSize: 11 }} tickFormatter={v => `${v}h`} />
        <Tooltip formatter={v => [`${v}h`, 'Sleep']} />
        <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={qualityColors[entry.quality] || '#86efac'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
