"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Task {
  id: number;
  taskName: string;
  targetValue?: number | null;
  targetUnit?: string | null;
  currentProgress?: number | null;
  targetAchieved?: boolean | null;
  categoryId?: number | null;
  categoryName?: string | null;
  categoryColor?: string | null;
  frequencyOfTask?: string;
  routine?: string | null;
}

interface LogItem {
  id: number;
  habitName: string;
  userId: number;
  taskId: number;
  status: "completed" | "skipped" | "failed";
  quantity: number | null;
  unit: string | null;
  durationSeconds: number | null;
  occurredAt: string; // ISO
  tz: string;
  localDate: string; // YYYY-MM-DD
  source: "manual" | "reminder" | "import" | "automation";
  note: string | null;
  metadata: any;
  createdAt: string;
}

export default function LogsClient({
  userId,
  tasks,
}: {
  userId: number;
  tasks: Task[];
}) {
  const router = useRouter();
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableTasks, setAvailableTasks] = useState<Task[]>(tasks);
  const [taskId, setTaskId] = useState<number | null>(null);
  const [status, setStatus] = useState<LogItem["status"]>("completed");
  const [habitName, setHabitName] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [unit, setUnit] = useState<string>("binary");
  const [durationSeconds, setDurationSeconds] = useState<string>("");
  const [occurredAt, setOccurredAt] = useState<string>(() => {
    // Get current local date in YYYY-MM-DD format
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [note, setNote] = useState<string>("");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  async function fetchLogs() {
    if (!taskId) {
      setLogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/users/${userId}/habits/logs?taskId=${taskId}`,
      );
      const data = await res.json();
      setLogs(data);
    } catch (e) {
      console.error(e);
      setError("Failed to load logs");
    } finally {
      setLoading(false);
    }
  }

  async function fetchDueTasks() {
    try {
      // occurredAt is already in YYYY-MM-DD format, so use it directly
      const res = await fetch(
        `/api/users/${userId}/habits?asOf=${occurredAt}`,
      );
      const data = await res.json();
      setAvailableTasks(data);
      // If current taskId is not in the new list, clear the selection (close popup)
      if (taskId && data.length > 0 && !data.find((t: Task) => t.id === taskId)) {
        setTaskId(null);
      }
    } catch (e) {
      console.error(e);
      setError("Failed to load due tasks");
    }
  }

  useEffect(() => {
    fetchLogs();
  }, [userId, taskId]);

  useEffect(() => {
    fetchDueTasks();
  }, [occurredAt]);

  // Update habit name when task is selected
  useEffect(() => {
    const selectedTask = availableTasks.find(task => task.id === taskId);
    if (selectedTask) {
      setHabitName(selectedTask.taskName);
    }
  }, [taskId, availableTasks]);

  useEffect(() => {
    // Collapse all categories by default when tasks are loaded
    const categoryKeys = new Set<string>();
    availableTasks.forEach((task) => {
      const categoryKey = task.categoryId
        ? `cat-${task.categoryId}`
        : "uncategorized";
      categoryKeys.add(categoryKey);
    });
    setCollapsedCategories(categoryKeys);
  }, [availableTasks]);

  async function createLog() {
    try {
      // Convert date-only format to ISO string for the API
      const occurredAtDate = occurredAt; // already "YYYY-MM-DD"

      
      const res = await fetch(`/api/users/${userId}/habits/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          status,
          habitName,
          quantity: quantity ? Number(quantity) : null,
          unit: unit || null,
          durationSeconds: durationSeconds ? Number(durationSeconds) : null,
          occurredAt: occurredAtDate,
          tz:
            Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata",
          source: "manual",
          note: note || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to create log");
        return;
      }
      router.push(`/users/${userId}/habits/logs/success`);
      setQuantity("");
      setUnit("");
      setDurationSeconds("");
      setNote("");
      fetchLogs();
      fetchDueTasks(); // Refresh to get updated progress
    } catch (e) {
      console.error(e);
      alert("Failed to create log");
    }
  }

  async function deleteLog(id: number) {
    try {
      const res = await fetch(`/api/users/${userId}/habits/logs/${id}`, {
        method: "DELETE",
      });
      if (res.ok) fetchLogs();
    } catch (e) {
      console.error(e);
    }
  }

  // Group tasks by category
  const groupedTasks: Record<
    string,
    { category: string; color: string | null; tasks: Task[] }
  > = {};

  availableTasks.forEach((task) => {
    const categoryKey = task.categoryId
      ? `cat-${task.categoryId}`
      : "uncategorized";
    const categoryName = task.categoryName || "Uncategorized";
    const categoryColor = task.categoryColor || null;

    if (!groupedTasks[categoryKey]) {
      groupedTasks[categoryKey] = {
        category: categoryName,
        color: categoryColor,
        tasks: [],
      };
    }
    groupedTasks[categoryKey].tasks.push(task);
  });

  const sortedGroups = Object.entries(groupedTasks).sort((a, b) => {
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

  function selectTask(task: Task) {
    setTaskId(task.id);
    setHabitName(task.taskName);
  }

  const selectedTask = availableTasks.find((t) => t.id === taskId);

  return (
    <div className="space-y-6">
      {/* Popup Banner Overlay */}
      {selectedTask && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setTaskId(null)}
          />
          
          {/* Popup Banner */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-900 to-blue-800 border-2 border-blue-600 p-6 rounded-xl shadow-2xl m-4">
              {/* Header with close button */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="text-3xl">📝</span>
                  Log: {selectedTask.taskName}
                </h2>
                <button
                  onClick={() => setTaskId(null)}
                  className="text-white hover:text-gray-300 text-3xl leading-none"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
              
              {/* Display current task progress */}
              {selectedTask.targetValue !== null &&
                selectedTask.targetValue !== undefined && (
                  <div className="mb-4 p-3 bg-blue-950 rounded border border-blue-700">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-white text-sm font-medium">
                        Current Progress
                      </div>
                      {selectedTask.targetAchieved && (
                        <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                          Target Achieved! 🎉
                        </span>
                      )}
                    </div>
                    <div className="text-blue-300 text-sm">
                      {selectedTask.currentProgress || 0} / {selectedTask.targetValue}{" "}
                      {selectedTask.targetUnit}
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                      <div
                        className={`h-2 rounded-full ${selectedTask.targetAchieved ? "bg-green-500" : "bg-blue-400"}`}
                        style={{
                          width: `${Math.min(100, ((selectedTask.currentProgress || 0) / selectedTask.targetValue) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">
                    Status
                  </label>
                  <select
                    className="w-full border rounded p-2 bg-gray-700 text-gray-200"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                  >
                    <option value="completed">Completed</option>
                    <option value="skipped">Skipped</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">
                    Quantity
                  </label>
                  <input
                    className="w-full border rounded p-2 bg-gray-700 text-white"
                    type="number"
                    step="0.001"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g., 2.5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">
                    Unit
                  </label>
                  <select
                    className="w-full border rounded p-2 bg-gray-700 text-gray-200"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  >
                    <option value="min">min</option>
                    <option value="km">km</option>
                    <option value="binary">binary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">
                    Duration (seconds)
                  </label>
                  <input
                    className="w-full border rounded p-2 bg-gray-700 text-white"
                    type="number"
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(e.target.value)}
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="block text-sm font-medium mb-1 text-white">
                    Note
                  </label>
                  <textarea
                    className="w-full border rounded p-2 bg-gray-700 text-white"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold shadow-lg transition-all hover:scale-105"
                  onClick={createLog}
                >
                  💾 Save Log
                </button>
                <button
                  className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all"
                  onClick={() => setTaskId(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Occurred Date Selector */}
      <div className="bg-gray-800 border border-gray-600 p-4 rounded-lg">
        <label className="block text-sm font-medium mb-2 text-white">
          Select Date to Log
        </label>
        <input
          className="w-full border rounded p-2 bg-gray-700 text-white"
          type="date"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
        />
      </div>

      {/* Category-Grouped Habit Selection */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Select Habit to Log</h2>
        {availableTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No habits due for {occurredAt}
          </div>
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
                  {group.category} ({group.tasks.length})
                </h3>
                <span className="text-gray-400">
                  {collapsedCategories.has(categoryKey) ? "▼" : "▲"}
                </span>
              </div>

              {/* Tasks in Category */}
              {!collapsedCategories.has(categoryKey) &&
                group.tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => selectTask(task)}
                    className={`bg-gray-800 border rounded-lg p-4 cursor-pointer transition-all ${
                      taskId === task.id
                        ? "border-blue-500 shadow-lg shadow-blue-500/20"
                        : "border-gray-600 hover:border-gray-500"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-white">{task.taskName}</div>
                          {task.targetAchieved && (
                            <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                              Target Achieved! 🎉
                            </span>
                          )}
                        </div>
                        <div className="text-gray-400 text-xs mt-1">
                          {task.frequencyOfTask && `• Frequency: ${task.frequencyOfTask} days`}
                          {task.routine && ` • Routine: ${task.routine}`}
                        </div>
                        {task.targetValue !== null && task.targetValue !== undefined && (
                          <div className="text-blue-400 text-sm mt-2 font-medium">
                            Progress: {task.currentProgress || 0} / {task.targetValue} {task.targetUnit}
                            <div className="w-full bg-gray-700 rounded-full h-2 mt-1">
                              <div
                                className={`h-2 rounded-full ${task.targetAchieved ? "bg-green-500" : "bg-blue-500"}`}
                                style={{
                                  width: `${Math.min(100, ((task.currentProgress || 0) / task.targetValue) * 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      {taskId === task.id && (
                        <div className="ml-4 text-blue-500">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          ))
        )}
      </div>

      {/* Log History */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Log History</h2>
        {loading ? (
          <p className="text-gray-400">Loading logs...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <div className="space-y-3">
            {logs.map((l) => (
              <div
                key={l.id}
                className="bg-gray-800 border border-gray-600 rounded-lg p-4 flex items-center justify-between"
              >
                <div>
                  <div className="text-white text-sm font-medium">
                    {l.habitName || "Unknown Habit"}
                  </div>
                  <div className="text-gray-400 text-xs mt-1">
                    #{l.id} • {l.status} • {l.localDate}
                  </div>
                  <div className="text-gray-300 text-sm mt-1">
                    {l.quantity ?? ""} {l.unit ?? ""}{" "}
                    {l.durationSeconds ? `• ${l.durationSeconds}s` : ""}
                  </div>
                  {l.note && (
                    <div className="text-gray-400 text-xs mt-1 italic">{l.note}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
                    onClick={() => deleteLog(l.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-center py-8 text-gray-400">No logs for this habit yet</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
