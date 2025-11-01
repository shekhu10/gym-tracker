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
  targetValue: number | null;
  targetUnit: string | null;
  currentProgress: number | null;
  targetAchieved: boolean | null;
  targetAchievedAt: string | null;
  categoryId: number | null;
  categoryName?: string | null;
  categoryColor?: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

interface Category {
  id: number;
  name: string;
  color: string | null;
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
  const [editStartDate, setEditStartDate] = useState("");
  const [editFrequencyOfTask, setEditFrequencyOfTask] = useState("");
  const [editRoutine, setEditRoutine] = useState("");
  const [editKind, setEditKind] = useState("");
  const [editDisplayOrder, setEditDisplayOrder] = useState<number>(0);
  const [editTargetValue, setEditTargetValue] = useState("");
  const [editTargetUnit, setEditTargetUnit] = useState("");
  const [editCategoryId, setEditCategoryId] = useState<string>("");

  // Categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(),
  );

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

  async function fetchCategories() {
    try {
      const res = await fetch(`/api/users/${userId}/categories`);
      const data = await res.json();
      setCategories(data);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    fetchHabits();
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    // Collapse all categories by default when habits are loaded
    const categoryKeys = new Set<string>();
    habits.forEach((habit) => {
      const categoryKey = habit.categoryId
        ? `cat-${habit.categoryId}`
        : "uncategorized";
      categoryKeys.add(categoryKey);
    });
    setCollapsedCategories(categoryKeys);
  }, [habits]);

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
    setEditStartDate(habit.startDate ? habit.startDate.split('T')[0] : "");
    setEditFrequencyOfTask(habit.frequencyOfTask || "1");
    setEditRoutine(habit.routine || "anytime");
    setEditKind(habit.kind || "binary");
    setEditDisplayOrder(habit.displayOrder || 0);
    setEditTargetValue(habit.targetValue ? String(habit.targetValue) : "");
    setEditTargetUnit(habit.targetUnit || "hours");
    setEditCategoryId(habit.categoryId ? String(habit.categoryId) : "");
  }

  function cancelEditingHabit() {
    setEditingHabitId(null);
    setEditTaskName("");
    setEditTaskDescription("");
    setEditStartDate("");
    setEditFrequencyOfTask("");
    setEditRoutine("");
    setEditKind("");
    setEditDisplayOrder(0);
    setEditTargetValue("");
    setEditTargetUnit("");
    setEditCategoryId("");
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
    if (!editStartDate) {
      alert("Start date is required");
      return;
    }

    try {
      // Set nextExecutionDate to startDate (not startDate + frequency)
      // This ensures the habit is "due" on its start date
      // After logging, the system will update it to startDate + frequency
      const nextExecutionDate = editStartDate; // YYYY-MM-DD

      const updateData: any = {
        taskName: editTaskName.trim(),
        taskDescription: editTaskDescription.trim() || null,
        startDate: editStartDate, // Store as-is without timezone conversion
        frequencyOfTask: editFrequencyOfTask,
        nextExecutionDate: nextExecutionDate,
        routine: editRoutine || null,
        kind: editKind || null,
        displayOrder: editDisplayOrder,
        categoryId: editCategoryId ? Number(editCategoryId) : null,
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

  // Group habits by category
  const groupedHabits: {
    [key: string]: { category: string; color: string | null; habits: HabitTask[] };
  } = {};

  habits.forEach((habit) => {
    const categoryKey = habit.categoryId
      ? `cat-${habit.categoryId}`
      : "uncategorized";
    const categoryName = habit.categoryName || "Uncategorized";
    const categoryColor = habit.categoryColor || null;

    if (!groupedHabits[categoryKey]) {
      groupedHabits[categoryKey] = {
        category: categoryName,
        color: categoryColor,
        habits: [],
      };
    }
    groupedHabits[categoryKey].habits.push(habit);
  });

  const sortedGroups = Object.entries(groupedHabits).sort((a, b) => {
    // Uncategorized last
    if (a[0] === "uncategorized") return 1;
    if (b[0] === "uncategorized") return -1;
    return a[1].category.localeCompare(b[1].category);
  });

  function toggleCategory(categoryKey: string) {
    setCollapsedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryKey)) {
        newSet.delete(categoryKey);
      } else {
        newSet.add(categoryKey);
      }
      return newSet;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Link
          href={`/users/${userId}/categories`}
          className="btn btn-sm bg-purple-600 hover:bg-purple-700 text-white"
        >
          Manage Categories
        </Link>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : sortedGroups.length === 0 ? (
        <div className="text-center py-8 text-gray-400">No habits yet</div>
      ) : (
        sortedGroups.map(([categoryKey, group]) => (
          <div key={categoryKey} className="space-y-3">
            {/* Category Header */}
            <div
              className="flex items-center gap-3 cursor-pointer p-3 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-750"
              onClick={() => toggleCategory(categoryKey)}
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: group.color || "#6B7280",
                }}
              />
              <h3 className="text-lg font-semibold text-white flex-1">
                {group.category} ({group.habits.length})
              </h3>
              <span className="text-gray-400">
                {collapsedCategories.has(categoryKey) ? "▼" : "▲"}
              </span>
            </div>

            {/* Habits in Category */}
            {!collapsedCategories.has(categoryKey) &&
              group.habits.map((h) => (
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
                        Start Date *
                      </label>
                      <input
                        type="date"
                        className="w-full border rounded p-2 text-sm"
                        value={editStartDate}
                        onChange={(e) => setEditStartDate(e.target.value)}
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
                    <div>
                      <label className="block text-sm font-medium mb-1 text-white">
                        Category (optional)
                      </label>
                      <select
                        className="w-full border rounded p-2 bg-gray-700 text-gray-200 text-sm"
                        value={editCategoryId}
                        onChange={(e) => setEditCategoryId(e.target.value)}
                      >
                        <option value="">None</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
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
          </div>
        ))
      )}
    </div>
  );
}
