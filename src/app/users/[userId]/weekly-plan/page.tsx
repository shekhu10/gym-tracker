"use client"
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/Button'

const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const


interface Set {
  reps: number | ""
  weight: number | ""
}
interface Exercise {
  name: string
  sets: Set[]
}
interface Plan {
  workoutDay: string
  exercises: Exercise[]
}

export default function WeeklyPlanPage() {
  const params = useParams<{ userId: string }>()
  const userId = params.userId
  type PlanOrNull = Plan | null
const emptyPlan: Plan = { workoutDay: '', exercises: [] }
const [plans, setPlans] = useState<Record<string, PlanOrNull>>({})
  const [selected, setSelected] = useState<typeof dayKeys[number]>('mon')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAll() {
      setLoading(true)
      const out: Record<string, PlanOrNull> = {}
      await Promise.all(
        dayKeys.map(async (d) => {
          const res = await fetch(`/api/users/${userId}/plans/${d}`)
          out[d] = res.ok ? await res.json() : null
        }),
      )
      setPlans(out as Record<string, PlanOrNull>)
      setLoading(false)
    }
    if (userId) fetchAll()
  }, [userId])

  async function saveCurrent() {
    setLoading(true)
    setMessage(null)
    const body = plans[selected]
    const res = await fetch(`/api/users/${userId}/plans/${selected}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body ?? {}),
    })
    setLoading(false)
    if (res.ok) setMessage('Saved!')
    else setMessage('Error saving')
  }

  async function clearCurrent() {
    setLoading(true)
    await fetch(`/api/users/${userId}/plans/${selected}`, { method: 'DELETE' })
    setPlans((p) => ({ ...p, [selected]: null }))
    setLoading(false)
  }

  

  return (
    <div className="container-page">
      <h1 className="text-2xl font-bold mb-4">Weekly Plan</h1>
      {/* Day selector */}
      <div className="flex gap-2 mb-4">
        {dayKeys.map((d) => (
          <Button
            key={d}
            onClick={() => setSelected(d)}
            variant={selected === d ? 'primary' : 'secondary'}
            size="sm"
            className={selected === d ? '' : 'bg-gray-100 dark:bg-gray-800'}
          >
            {d.toUpperCase()}
          </Button>
        ))}
      </div>

      {/* Editor */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {/* Workout day name */}
          <div className="mb-2">
            <label className="block text-sm font-medium">Workout Day Name</label>
            <input
              type="text"
              value={plans[selected]?.workoutDay || ''}
              onChange={(e) =>
                setPlans((prev) => ({
                  ...prev,
                  [selected]: {
                    ...(prev[selected] ?? emptyPlan),
                    workoutDay: e.target.value,
                  },
                }))
              }
              className="w-full border rounded p-1"
            />
          </div>

          {/* Exercises */}
          <ExerciseList
            exercises={plans[selected]?.exercises || []}
            onChange={(updated) =>
              setPlans((prev) => ({ ...prev, [selected]: {
                  ...(prev[selected] ?? emptyPlan),
                  exercises: updated,
                } }))
            }
          />
          <div className="flex gap-2 mt-2">
            <Button onClick={saveCurrent} variant="primary">
              Save
            </Button>
            <Button onClick={clearCurrent} variant="secondary" className="bg-red-600 text-white hover:bg-red-700">
              Clear
            </Button>
          </div>
          {message && <p className="mt-2 text-green-600">{message}</p>}
        </>
      )}
    </div>
  )
}

// ---- Child components ----
function ExerciseList({
  exercises,
  onChange,
}: {
  exercises: Exercise[]
  onChange: (ex: Exercise[]) => void
}) {
  function updateExercise(idx: number, ex: Exercise) {
    const copy = [...exercises]
    copy[idx] = ex
    onChange(copy)
  }
  function addExercise() {
    onChange([...exercises, { name: '', sets: [] }])
  }
  function removeExercise(idx: number) {
    onChange(exercises.filter((_, i) => i !== idx))
  }
  return (
    <div>
      <h2 className="font-semibold mb-2">Exercises</h2>
      {exercises.map((ex, idx) => (
        <div key={idx} className="border p-2 mb-2 rounded">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={ex.name}
              placeholder="Exercise name"
              onChange={(e) => updateExercise(idx, { ...ex, name: e.target.value })}
              className="flex-1 border rounded p-1"
            />
            <Button onClick={() => removeExercise(idx)} size="sm" variant="secondary" className="text-red-600 text-sm">
              Remove
            </Button>
          </div>
          <SetList
            sets={ex.sets}
            onChange={(sets) => updateExercise(idx, { ...ex, sets })}
          />
        </div>
      ))}
      <Button onClick={addExercise} size="sm" variant="primary" className="px-3 py-1 bg-blue-500 text-white rounded text-sm">
        + Add Exercise
      </Button>
    </div>
  )
}

function SetList({ sets, onChange }: { sets: Set[]; onChange: (s: Set[]) => void }) {
  function updateSet(i: number, s: Set) {
    const copy = [...sets]
    copy[i] = s
    onChange(copy)
  }
  function addSet() {
    onChange([...sets, { reps: '', weight: '' }])
  }
  function removeSet(i: number) {
    onChange(sets.filter((_, idx) => idx !== i))
  }
  return (
    <div>
      <p className="font-medium mb-1">Sets</p>
      {sets.map((s, i) => (
        <div key={i} className="flex gap-2 mb-1 items-center">
          <input
            type="number"
            value={s.reps}
            placeholder="Reps"
            onChange={(e) => updateSet(i, { ...s, reps: Number(e.target.value) })}
            className="w-20 border rounded p-1"
          />
          <input
            type="number"
            value={s.weight}
            placeholder="Weight"
            onChange={(e) => updateSet(i, { ...s, weight: Number(e.target.value) })}
            className="w-24 border rounded p-1"
          />
          <Button onClick={() => removeSet(i)} size="sm" variant="secondary" className="text-red-500 text-xs">
            remove
          </Button>
        </div>
      ))}
      <Button onClick={addSet} size="sm" variant="primary" className="text-xs text-blue-600">
        + add set
      </Button>
    </div>
  )
}

