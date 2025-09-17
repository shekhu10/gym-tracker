"use client";

import { useEffect, useState } from "react";

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
                <div className="font-medium text-white">{ h.taskName}</div>
                {h.taskDescription && (
                  <div className="text-gray-300 text-sm">
                    {"Description: " + h.taskDescription}
                  </div>
                )}
                <div className="text-gray-400 text-xs mt-1">
                  {"• Frequency: " + h.frequencyOfTask || "unspecified"}{" "}
                </div>
                <div className="text-gray-400 text-xs mt-1">
                  {h.routine ? `• Routine: ${h.routine}` : ""}
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
