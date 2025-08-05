"use client"
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
interface SetTemplate {
  reps: number
  weight: number
}
interface ExerciseTemplate {
  name: string
  sets: SetTemplate[]
}
interface PlanTemplate {
  workoutDay: string
  exercises: ExerciseTemplate[]
}

interface SetLog extends SetTemplate {}
interface ExerciseLog {
  name: string
  sets: SetLog[]
}

type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'
const dayOrder: DayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const dayLabel: Record<DayKey, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}
const dateToDayKey = (iso: string): DayKey => {
  const idx = new Date(iso + 'T00:00:00').getDay()
  return dayOrder[(idx + 6) % 7] as DayKey
}

// ---------- main wizard component ----------
export default function LogWizardPage() {
  const params = useParams<{ userId: string }>()
  const userId = params.userId

  // base state
  const today = new Date().toISOString().slice(0, 10)
  const [logDate, setLogDate] = useState(today)
  const [dayKey, setDayKey] = useState<DayKey | null>(dateToDayKey(today))
  const [plan, setPlan] = useState<PlanTemplate | null>(null)
  const [entries, setEntries] = useState<ExerciseLog[]>([])
  const [message, setMessage] = useState('')

  // wizard step
  // 0: date/day, 1..n: each exercise, n+1: review
  const [step, setStep] = useState(0)

  // fetch plan when day changes
  useEffect(() => {
    if (!dayKey) return
    fetch(`/api/users/${userId}/plans/${dayKey}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((p: PlanTemplate | null) => {
          setPlan(p)
          if (p) {
            const init = p.exercises.map((ex) => ({
              name: ex.name,
              sets: ex.sets.map((s) => ({ ...s })),
            })) as ExerciseLog[]
            setEntries(init)
          }
        })
  }, [dayKey, userId])

  // helpers
  const maxStep = plan ? plan.exercises.length + 1 : 0
  const next = () => setStep((s) => Math.min(maxStep, s + 1))
  const back = () => setStep((s) => Math.max(0, s - 1))

  function updateExercise(idx: number, ex: ExerciseLog) {
    const copy = [...entries]
    copy[idx] = ex
    setEntries(copy)
  }

  async function submitLog() {
    if (!dayKey) return
    const res = await fetch(`/api/users/${userId}/logs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dayKey, entries, date: logDate }),
    })
    setMessage(res.ok ? 'Workout logged!' : 'Error saving log')
  }

  // ---------- per-step UI ----------
  let content: JSX.Element | null = null
  if (step === 0) {
    content = (
        <div>
          <label className="block mb-4">
            <span className="mr-2 font-medium">Date:</span>
            <input
                type="date"
                value={logDate}
                onChange={(e) => {
                  setLogDate(e.target.value)
                  setDayKey(dateToDayKey(e.target.value))
                }}
                className="border p-2 rounded"
            />
          </label>
          <select
              value={dayKey ?? ''}
              onChange={(e) => setDayKey(e.target.value as DayKey)}
              className="border p-2 rounded"
          >
            <option value="" disabled>
              Select workout day
            </option>
            {dayOrder.map((d) => (
                <option key={d} value={d}>
                  {dayLabel[d]}
                </option>
            ))}
          </select>
        </div>
    )
  } else if (plan && step >= 1 && step <= plan.exercises.length) {
    const idx = step - 1
    const tmpl = plan.exercises[idx]
    const exLog = entries[idx]
    content = (
        <div>
          <h2 className="text-xl font-semibold mb-2">
            Exercise {step} / {plan.exercises.length}: {tmpl.name}
          </h2>
          <SetLogList
              sets={exLog.sets}
              targetSets={tmpl.sets}
              prevSets={[]}
              onChange={(s) => updateExercise(idx, { ...exLog, sets: s })}
          />
        </div>
    )
  } else if (plan && step === plan.exercises.length + 1) {
    content = (
        <div>
          <h2 className="text-xl font-semibold mb-2">Review</h2>
          {entries.map((ex, i) => (
              <div key={i} className="mb-4">
                <h3 className="font-medium">{ex.name}</h3>
                <table className="text-sm">
                  <thead>
                  <tr>
                    <th className="pr-4">Set</th>
                    <th className="pr-4">Reps</th>
                    <th>Weight</th>
                  </tr>
                  </thead>
                  <tbody>
                  {ex.sets.map((s, j) => (
                      <tr key={j}>
                        <td className="pr-4">{j + 1}</td>
                        <td className="pr-4">{s.reps}</td>
                        <td>{s.weight}</td>
                      </tr>
                  ))}
                  </tbody>
                </table>
              </div>
          ))}
          <button
              onClick={submitLog}
              className="px-6 py-2 bg-green-600 text-white rounded"
          >
            Save Log
          </button>
          {message && <p className="mt-2 text-green-600">{message}</p>}
        </div>
    )
  }

  // ---------- wrapper ----------
  return (
      <div className="p-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Start Workout</h1>
        {content}
        <div className="mt-6 flex justify-between">
          {step > 0 && (
              <button onClick={back} className="px-4 py-2 bg-gray-300 rounded">
                Back
              </button>
          )}
          {step < maxStep && (
              <button
                  onClick={next}
                  className="px-4 py-2 bg-blue-600 text-white rounded"
              >
                Next
              </button>
          )}
        </div>
      </div>
  )
}

// ---------- SetLogList ----------
function SetLogList({
                      sets,
                      targetSets,
                      prevSets,
                      onChange,
                    }: {
  sets: SetLog[]
  targetSets: SetTemplate[]
  prevSets: SetLog[]
  onChange: (s: SetLog[]) => void
}) {
  function update(idx: number, field: keyof SetLog, value: number) {
    const copy = sets.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    onChange(copy)
  }
  function addSet() {
    onChange([...sets, { reps: 0, weight: 0 }])
  }
  function removeSet(idx: number) {
    onChange(sets.filter((_, i) => i !== idx))
  }
  return (
      <div>
        <table className="w-full text-sm">
          <thead>
          <tr className="text-left">
            <th className="pr-2">Set</th>
            <th className="pr-2">Reps</th>
            <th className="pr-2">Weight</th>
            <th className="pl-4 text-gray-600">Target</th>
            <th className="pl-4 text-gray-600">Prev</th>
            <th></th>
          </tr>
          </thead>
          <tbody>
          {sets.map((s, i) => (
              <tr key={i} className="border-t">
                <td className="pr-2 py-1">{i + 1}</td>
                <td className="pr-2 py-1">
                  <input
                      type="number"
                      value={s.reps}
                      onChange={(e) => update(i, 'reps', Number(e.target.value))}
                      className="w-16 border p-1 rounded"
                  />
                </td>
                <td className="pr-2 py-1">
                  <input
                      type="number"
                      value={s.weight}
                      onChange={(e) => update(i, 'weight', Number(e.target.value))}
                      className="w-20 border p-1 rounded"
                  />
                </td>
                <td className="pl-4 text-gray-600">
                  {targetSets[i] ? `${targetSets[i].reps}×${targetSets[i].weight}` : '-'}
                </td>
                <td className="pl-4 text-gray-600">
                  {prevSets[i] ? `${prevSets[i].reps}×${prevSets[i].weight}` : '-'}
                </td>
                <td className="pl-2 text-xs text-red-500">
                  <button onClick={() => removeSet(i)}>remove</button>
                </td>
              </tr>
          ))}
          </tbody>
        </table>
        <button onClick={addSet} className="text-xs text-blue-600 mt-1">
          + add set
        </button>
      </div>
  )
}