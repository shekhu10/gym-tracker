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

  // Edit habit form
  const [editingHabitId, setEditingHabitId] = useState<number | null>(null);
  const [editTaskName, setEditTaskName] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [editFrequencyOfTask, setEditFrequencyOfTask] = useState("");
  const [editRoutine, setEditRoutine] = useState("");
  const [editKind, setEditKind] = useState("");
  const [editDisplayOrder, setEditDisplayOrder] = useState<number>(0);
  const [editTargetValue, setEditTargetValue] = useState("");
  const [editTargetUnit, setEditTargetUnit] = useState("");

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

  function startEditingHabit(habit: HabitTask) {
    setEditingHabitId(habit.id);
    setEditTaskName(habit.taskName);
    setEditTaskDescription(habit.taskDescription || "");
    setEditFrequencyOfTask(habit.frequencyOfTask || "1");
    setEditRoutine(habit.routine || "anytime");
    setEditKind(habit.kind || "binary");
    setEditDisplayOrder(habit.displayOrder || 0);
    setEditTargetValue(habit.targetValue ? String(habit.targetValue) : "");
    setEditTargetUnit(habit.targetUnit || "hours");
  }

  function cancelEditingHabit() {
    setEditingHabitId(null);
    setEditTaskName("");
    setEditTaskDescription("");
    setEditFrequencyOfTask("");
    setEditRoutine("");
    setEditKind("");
    setEditDisplayOrder(0);
    setEditTargetValue("");
    setEditTargetUnit("");
  }

  async function saveEditedHabit(taskId: number) {
    if (!editTaskName.trim()) {
      alert("Task name is required");
      return;
    }
    if (!editFrequencyOfTask || Number(editFrequencyOfTask) < 1) {
      alert("Frequency must be at least 1 day");
      return;
    }

    try {
      const updateData: any = {
        taskName: editTaskName.trim(),
        taskDescription: editTaskDescription.trim() || null,
        frequencyOfTask: editFrequencyOfTask,
        routine: editRoutine || null,
        kind: editKind || null,
        displayOrder: editDisplayOrder,
      };

      // Only include target fields if they're provided
      if (editTargetValue && Number(editTargetValue) > 0) {
        updateData.targetValue = Number(editTargetValue);
        updateData.targetUnit = editTargetUnit;
      }

      const res = await fetch(`/api/users/${userId}/habits/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to update habit");
        return;
      }

      cancelEditingHabit();
      fetchHabits();
    } catch (e) {
      console.error(e);
      alert("Failed to update habit");
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
                  {h.startDate && (
                    <div className="text-gray-400 text-xs">
                      {`• Start Date: ${h.startDate.split('T')[0]}`}
                    </div>
                  )}
                  {h.nextExecutionDate && (
                    <div className="text-gray-400 text-xs">
                      {`• Next Due: ${h.nextExecutionDate.split('T')[0]}`}
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
                    className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => startEditingHabit(h)}
                  >
                    Edit
                  </button>
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

              {editingHabitId === h.id && (
                <div className="mt-3 p-4 bg-gray-900 rounded border border-gray-600">
                  <div className="text-white text-lg font-medium mb-3">
                    Edit Habit
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-white">
                        Name *
                      </label>
                      <input
                        type="text"
                        className="w-full border rounded p-2 text-sm"
                        value={editTaskName}
                        onChange={(e) => setEditTaskName(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-white">
                        Frequency (days) *
                      </label>
                      <input
                        type="number"
                        min="1"
                        className="w-full border rounded p-2 text-sm"
                        value={editFrequencyOfTask}
                        onChange={(e) => setEditFrequencyOfTask(e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-white">
                        Routine
                      </label>
                      <select
                        className="w-full border rounded p-2 bg-gray-700 text-gray-200 text-sm"
                        value={editRoutine}
                        onChange={(e) => setEditRoutine(e.target.value)}
                      >
                        <option value="anytime">Anytime</option>
                        <option value="morning">Morning</option>
                        <option value="afternoon">Afternoon</option>
                        <option value="evening">Evening</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-white">
                        Kind
                      </label>
                      <select
                        className="w-full border rounded p-2 bg-gray-700 text-gray-200 text-sm"
                        value={editKind}
                        onChange={(e) => setEditKind(e.target.value)}
                      >
                        <option value="binary">Binary</option>
                        <option value="quantity">Quantity</option>
                        <option value="timer">Timer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-white">
                        Display Order
                      </label>
                      <input
                        type="number"
                        className="w-full border rounded p-2 text-sm"
                        value={editDisplayOrder}
                        onChange={(e) => setEditDisplayOrder(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-white">
                        Target Value
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full border rounded p-2 text-sm"
                        value={editTargetValue}
                        onChange={(e) => setEditTargetValue(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-white">
                        Target Unit
                      </label>
                      <select
                        className="w-full border rounded p-2 bg-gray-700 text-gray-200 text-sm"
                        value={editTargetUnit}
                        onChange={(e) => setEditTargetUnit(e.target.value)}
                      >
                        <option value="hours">hours</option>
                        <option value="km">km</option>
                        <option value="minutes">minutes</option>
                        <option value="days">days</option>
                        <option value="times">times</option>
                        <option value="reps">reps</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium mb-1 text-white">
                        Description
                      </label>
                      <textarea
                        className="w-full border rounded p-2 text-sm"
                        rows={3}
                        value={editTaskDescription}
                        onChange={(e) => setEditTaskDescription(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => saveEditedHabit(h.id)}
                    >
                      Save Changes
                    </button>
                    <button
                      className="btn btn-sm"
                      onClick={() => cancelEditingHabit()}
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
