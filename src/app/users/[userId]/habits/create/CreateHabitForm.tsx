"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CreateHabitForm({ userId }: { userId: number }) {
  const router = useRouter();
  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [startDate, setStartDate] = useState<string>(
    new Date().toLocaleDateString("en-CA"),
  );
  const [frequencyOfTask, setFrequencyOfTask] = useState("1");
  const [routine, setRoutine] = useState("anytime");
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [kind, setKind] = useState("binary");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!taskName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/users/${userId}/habits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskName: taskName.trim(),
          taskDescription: taskDescription.trim() || null,
          startDate,
          frequencyOfTask,
          routine,
          displayOrder,
          kind,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to create habit");
        return;
      }
      router.push(`/users/${userId}/habits`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="bg-black border border-gray-600 p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-white">
              Name
            </label>
            <input
              className="w-full border rounded p-2"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-white">
              Frequency (days)
            </label>
            <input
              type="number"
              min={1}
              className="w-full border rounded p-2"
              value={frequencyOfTask}
              onChange={(e) => setFrequencyOfTask(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-white">
              Start date
            </label>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-white">
              Routine
            </label>
            <select
              className="w-full border rounded p-2 bg-gray-700 text-gray-200"
              value={routine}
              onChange={(e) => setRoutine(e.target.value)}
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
              className="w-full border rounded p-2 bg-gray-700 text-gray-200"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              <option value="binary">Binary</option>
              <option value="quantity">Quantity</option>
              <option value="timer">Timer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-white">
              Display order
            </label>
            <input
              type="number"
              className="w-full border rounded p-2"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value))}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1 text-white">
              Description
            </label>
            <textarea
              className="w-full border rounded p-2"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 mt-2 items-center">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          Create
        </button>
        <button
          type="button"
          className="btn"
          onClick={() => history.back()}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
