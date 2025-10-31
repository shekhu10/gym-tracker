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
  targetValue: number | null;
  targetUnit: string | null;
  currentProgress: number | null;
  targetAchieved: boolean | null;
  targetAchievedAt: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export default function HabitsClient({ userId }: { userId: number }) {
  const [habits, setHabits] = useState<HabitTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Target update form
  const [editingTargetId, setEditingTargetId] = useState<number | null>(null);
  const [newTargetValue, setNewTargetValue] = useState("");
  const [newTargetUnit, setNewTargetUnit] = useState("hours");

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

  async function setNewTarget(taskId: number) {
    if (!newTargetValue || Number(newTargetValue) <= 0) {
      alert("Please enter a valid target value");
      return;
    }
    try {
      const res = await fetch(`/api/users/${userId}/habits/${taskId}/target`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetValue: Number(newTargetValue),
          targetUnit: newTargetUnit,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to set new target");
        return;
      }
      setEditingTargetId(null);
      setNewTargetValue("");
      fetchHabits();
    } catch (e) {
      console.error(e);
      alert("Failed to set new target");
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
              className="bg-gray-800 border border-gray-600 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="font-medium text-white">{h.taskName}</div>
                    {h.targetAchieved && (
                      <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                        Target Achieved! 🎉
                      </span>
                    )}
                  </div>
                  {h.taskDescription && (
                    <div className="text-gray-300 text-sm mt-1">
                      {"Description: " + h.taskDescription}
                    </div>
                  )}
                  <div className="text-gray-400 text-xs mt-1">
                    {"• Frequency: " + h.frequencyOfTask || "unspecified"}
                  </div>
                  {h.routine && (
                    <div className="text-gray-400 text-xs">
                      {`• Routine: ${h.routine}`}
                    </div>
                  )}
                  {h.targetValue !== null && h.targetValue !== undefined && (
                    <div className="text-blue-400 text-sm mt-2 font-medium">
                      Progress: {h.currentProgress || 0} / {h.targetValue} {h.targetUnit}
                      <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                        <div
                          className={`h-2 rounded-full ${h.targetAchieved ? "bg-green-500" : "bg-blue-500"}`}
                          style={{
                            width: `${Math.min(100, ((h.currentProgress || 0) / h.targetValue) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  {h.targetAchieved && (
                    <button
                      className="btn btn-sm bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => {
                        setEditingTargetId(h.id);
                        setNewTargetValue("");
                        setNewTargetUnit(h.targetUnit || "hours");
                      }}
                    >
                      New Target
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-error"
                    onClick={() => deleteHabit(h.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>

              {editingTargetId === h.id && (
                <div className="mt-3 p-3 bg-gray-900 rounded border border-gray-600">
                  <div className="text-white text-sm font-medium mb-2">
                    Set New Target
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full border rounded p-2 text-sm"
                        placeholder="Target value"
                        value={newTargetValue}
                        onChange={(e) => setNewTargetValue(e.target.value)}
                      />
                    </div>
                    <div>
                      <select
                        className="w-full border rounded p-2 bg-gray-700 text-gray-200 text-sm"
                        value={newTargetUnit}
                        onChange={(e) => setNewTargetUnit(e.target.value)}
                      >
                        <option value="hours">hours</option>
                        <option value="km">km</option>
                        <option value="minutes">minutes</option>
                        <option value="days">days</option>
                        <option value="times">times</option>
                        <option value="reps">reps</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => setNewTarget(h.id)}
                    >
                      Save
                    </button>
                    <button
                      className="btn btn-sm"
                      onClick={() => setEditingTargetId(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
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
