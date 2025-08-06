"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface SetLog {
  reps: number
  weight: number
}
interface ExerciseLog {
  name: string
  sets: SetLog[]
}
interface WorkoutLog {
  id: number
  date: string
  dayName: string
  planName: string
  entries: ExerciseLog[]
}

export default function LogDetailPage() {
  const params = useParams<{ userId: string; logId: string }>()
  const router = useRouter()
  const { userId, logId } = await params
  const [log, setLog] = useState<WorkoutLog | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      const res = await fetch(`/api/users/${userId}/logs/${logId}`)
      if (res.ok) setLog(await res.json())
      else {
        const e = await res.json()
        setError(e.error || 'Error loading log')
      }
    })()
  }, [userId, logId])

  if (error) return <p className="p-4 text-red-600">{error}</p>
  if (!log) return <p className="p-4">Loading...</p>

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <button onClick={() => router.back()} className="text-blue-600 mb-4 underline">
        ← Back
      </button>
      <h1 className="text-2xl font-bold mb-2">{log.planName}</h1>
      <p className="mb-4 text-gray-600">
        {new Date(log.date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })}
        {` (${log.dayName})`}
      </p>

      {log.entries.map((ex, i) => (
        <div key={i} className="border p-3 rounded mb-4">
          <h3 className="font-medium mb-2">{ex.name}</h3>
          <table className="text-sm w-full">
            <thead>
              <tr className="text-left border-b">
                <th className="pr-2 py-1">Set</th>
                <th className="pr-2 py-1">Reps</th>
                <th className="py-1">Weight</th>
              </tr>
            </thead>
            <tbody>
              {ex.sets.map((s, idx) => (
                <tr key={idx} className="border-t">
                  <td className="pr-2 py-1">{idx + 1}</td>
                  <td className="pr-2 py-1">{s.reps}</td>
                  <td className="py-1">{s.weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
