"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface WorkoutLog {
  id: number;
  date: string;
  dayName: string;
  planName: string;
  entries: {
    exercises: any[];
    startTime?: string;
    endTime?: string;
    notes?: string;
  };
}

export default function HistoryPage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/users/${userId}/gym/logs`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      } else {
        const e = await res.json();
        setError(e.error || "Error loading logs");
      }
    })();
  }, [userId]);

  const handleDelete = async (logId: number) => {
    if (!confirm("Are you sure you want to delete this workout log?")) {
      return;
    }

    setDeleting(logId);
    try {
      const res = await fetch(`/api/users/${userId}/gym/logs/${logId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        // Remove the deleted log from the state
        setLogs(logs.filter((log) => log.id !== logId));
      } else {
        const errorData = await res.json();
        setError(errorData.error || "Failed to delete workout log");
      }
    } catch (err) {
      setError("Failed to delete workout log");
    } finally {
      setDeleting(null);
    }
  };

  // group logs by YYYY-MM-DD (date is already normalized by API)
  const grouped = logs.reduce<Record<string, WorkoutLog[]>>((acc, log) => {
    const key = log.date;
    (acc[key] = acc[key] || []).push(log);
    return acc;
  }, {});

  return (
    <div className="p-4 max-w-3xl mx-auto bg-black min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-white">Workout History</h1>
      {error && <p className="text-red-400 mb-4">{error}</p>}
      {Object.keys(grouped).length === 0 && (
        <p className="text-gray-300">No logs yet.</p>
      )}
      {Object.entries(grouped)
        .sort(([a], [b]) => (a > b ? -1 : 1))
        .map(([date, logs]) => (
          <div
            key={date}
            className="mb-6 bg-gray-900 p-4 rounded-lg border border-gray-600"
          >
            <h2 className="text-xl font-semibold mb-2 text-white">
              {formatDate(date)}
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-gray-600">
                  <th className="pr-2 py-1 text-gray-300">Plan</th>
                  <th className="pr-2 py-1 text-gray-300">Day</th>
                  <th className="pr-2 py-1 text-gray-300">Sets Logged</th>
                  <th className="py-1 text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-gray-700">
                    <td className="pr-2 py-1">
                      <a
                        href={`/users/${userId}/gym/history/${log.id}`}
                        className="text-blue-400 underline hover:text-blue-300"
                      >
                        {log.planName}
                      </a>
                    </td>
                    <td className="pr-2 py-1 text-gray-200">{log.dayName}</td>
                    <td className="pr-2 py-1 text-gray-200">
                      {totalSets(log.entries)}
                    </td>
                    <td className="py-1">
                      <button
                        onClick={() => handleDelete(log.id)}
                        disabled={deleting === log.id}
                        className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed"
                      >
                        {deleting === log.id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );
}

function formatDate(iso: string): string {
  // Build a local Date from components to avoid UTC parsing shifting the day
  const [y, m, d] = iso.split("-").map(Number);
  const local = new Date(y, (m || 1) - 1, d || 1);
  const weekday = local.toLocaleDateString("en-US", { weekday: "long" });
  return `${weekday}, ${iso}`; // e.g. Monday, 2025-08-03
}

function totalSets(entries: any): number {
  // Handle new structure where entries is an object with exercises array
  const exercises = entries?.exercises || entries;
  if (!Array.isArray(exercises)) return 0;

  let total = 0;
  for (const ex of exercises) {
    if (ex.type === "circuit" && Array.isArray(ex.exercises)) {
      // Count sets in circuit exercises
      for (const circuitEx of ex.exercises) {
        if (Array.isArray(circuitEx.sets)) total += circuitEx.sets.length;
      }
    } else if (Array.isArray(ex.sets)) {
      // Count sets in single exercises
      total += ex.sets.length;
    }
  }
  return total;
}
