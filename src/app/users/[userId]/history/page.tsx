"use client"
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface WorkoutLog {
  id: number
  date: string
  dayName: string
  planName: string
  entries: any
}

export default function HistoryPage() {
  const params = useParams<{ userId: string }>()
  const userId = params.userId
  const [logs, setLogs] = useState<WorkoutLog[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    ;(async () => {
      const res = await fetch(`/api/users/${userId}/logs`)
      if (res.ok) {
        const data = await res.json()
        setLogs(data)
      } else {
        const e = await res.json()
        setError(e.error || 'Error loading logs')
      }
    })()
  }, [userId])

  // group logs by YYYY-MM-DD
  const grouped = logs.reduce<Record<string, WorkoutLog[]>>((acc, log) => {
    const d = new Date(log.date)
    const key = d.toISOString().slice(0, 10)
    ;(acc[key] = acc[key] || []).push(log)
    return acc
  }, {})

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Workout History</h1>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {Object.keys(grouped).length === 0 && <p>No logs yet.</p>}
      {Object.entries(grouped)
        .sort(([a], [b]) => (a > b ? -1 : 1))
        .map(([date, logs]) => (
          <div key={date} className="mb-6">
            <h2 className="text-xl font-semibold mb-2">{formatDate(date)}</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="pr-2 py-1">Plan</th>
                  <th className="pr-2 py-1">Day</th>
                  <th className="py-1">Sets Logged</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t">
                    <td className="pr-2 py-1">
                      <a href={`/users/${userId}/history/${log.id}`} className="text-blue-600 underline">
                        {log.planName}
                      </a>
                    </td>
                    <td className="pr-2 py-1">{log.dayName}</td>
                    <td className="py-1">{totalSets(log.entries)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' })
  return `${weekday}, ${iso}` // e.g. Monday, 2025-08-03
}

function totalSets(entries: any): number {
  if (!Array.isArray(entries)) return 0
  let total = 0
  for (const ex of entries) {
    if (Array.isArray(ex.sets)) total += ex.sets.length
  }
  return total
}
