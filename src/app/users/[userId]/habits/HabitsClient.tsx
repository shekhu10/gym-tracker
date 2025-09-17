"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface HabitTask {
  id: number;
  userId: number;
  taskName: string;
  taskDescription: string | null;
  startDate: string | null;
  lastExecutionDate: string | null;
  nextExecutionDate: string | null;
  frequencyOfTask: string | null;
  routine: string | null;
  displayOrder: number | null;
  kind: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export default function HabitsClient({ userId }: { userId: number }) {
  const [habits, setHabits] = useState<HabitTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // create form
  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [frequencyOfTask, setFrequencyOfTask] = useState("1");
  const [routine, setRoutine] = useState("");
  const [startDate, setStartDate] = useState<string>(
    new Date().toLocaleDateString("en-CA"),
  );
  const [kind, setKind] = useState("binary");

  async function fetchHabits() {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/habits`, {
        cache: "no-store",
      });
      const data = await res.json();
      setHabits(data);
    } catch (e) {
      console.error(e);
      setError("Failed to load habits");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchHabits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function createHabit() {
    if (!taskName.trim()) return;
    try {
      const res = await fetch(`/api/users/${userId}/habits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskName: taskName.trim(),
          taskDescription: taskDescription.trim() || null,
          startDate,
          frequencyOfTask: frequencyOfTask.trim(),
          routine: routine || null,
          kind,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to create habit");
        return;
      }
      setTaskName("");
      setTaskDescription("");
      setFrequencyOfTask("");
      setRoutine("");
      setStartDate(new Date().toISOString().slice(0, 16));
      fetchHabits();
    } catch (e) {
      console.error(e);
      alert("Failed to create habit");
    }
  }

  async function deleteHabit(id: number) {
    try {
      const res = await fetch(`/api/users/${userId}/habits/${id}`, {
        method: "DELETE",
      });
      if (res.ok) fetchHabits();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/users/${userId}/habits/create`}
          className="btn btn-sm btn-primary"
        >
          Create Habit
        </Link>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          className="input input-bordered flex-1"
          placeholder="Habit name"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
        />
        <input
          className="input input-bordered flex-1"
          placeholder="Description (optional)"
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
        />
        <input
          type="date"
          className="input input-bordered"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <input
          type="number"
          min={1}
          className="input input-bordered w-36"
          placeholder="Days"
          value={frequencyOfTask}
          onChange={(e) => setFrequencyOfTask(e.target.value)}
        />
        <select
          className="select select-bordered"
          value={routine}
          onChange={(e) => setRoutine(e.target.value)}
        >
          <option value="">Anytime</option>
          <option value="morning">Morning</option>
          <option value="afternoon">Afternoon</option>
          <option value="evening">Evening</option>
        </select>
        <select
          className="select select-bordered"
          value={kind}
          onChange={(e) => setKind(e.target.value)}
        >
          <option value="binary">Binary</option>
          <option value="quantity">Quantity</option>
          <option value="timer">Timer</option>
        </select>
        <button className="btn btn-primary min-w-24" onClick={createHabit}>
          Add
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="space-y-3">
          {habits.map((h) => (
            <div
              key={h.id}
              className="bg-gray-800 border border-gray-600 rounded-lg p-4 flex items-start justify-between"
            >
              <div>
                <div className="font-medium text-white">{h.taskName}</div>
                {h.taskDescription && (
                  <div className="text-gray-300 text-sm">
                    {h.taskDescription}
                  </div>
                )}
                <div className="text-gray-400 text-xs mt-1">
                  {h.frequencyOfTask || "unspecified"}{" "}
                  {h.routine ? `• ${h.routine}` : ""}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-sm btn-error"
                  onClick={() => deleteHabit(h.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {habits.length === 0 && (
            <div className="text-center py-8 text-gray-400">No habits yet</div>
          )}
        </div>
      )}
    </div>
  );
}
