"use client";

import { useEffect, useState } from "react";

interface Task { id: number; taskName: string }

interface LogItem {
  id: number;
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

export default function LogsHistoryClient({ userId, tasks }: { userId: number; tasks: Task[] }) {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<number>(0);

  async function fetchLogs() {
    setLoading(true);
    try {
      const url = new URL(`/api/users/${userId}/habits/logs`, window.location.origin);
      if (taskId) url.searchParams.set("taskId", String(taskId));
      url.searchParams.set("limit", "200");
      const res = await fetch(url.toString());
      const data = await res.json();
      setLogs(data);
    } catch (e) {
      console.error(e);
      setError("Failed to load logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLogs(); }, [userId, taskId]);

  return (
    <div className="space-y-6">
      <div className="bg-black border border-gray-600 p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-white">Habit</label>
            <select className="w-full border rounded p-2 bg-gray-700 text-gray-200" value={taskId} onChange={(e) => setTaskId(Number(e.target.value))}>
              <option value={0}>All habits</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>{t.taskName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <p>Loading logs...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="space-y-3">
          {logs.map((l) => (
            <div key={l.id} className="bg-gray-800 border border-gray-600 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="text-white text-sm">#{l.id} • {l.status} • {l.localDate}</div>
                <div className="text-gray-400 text-xs">{l.source}</div>
              </div>
              <div className="text-gray-300 text-sm mt-1">
                {l.quantity ?? ''} {l.unit ?? ''} {l.durationSeconds ? `• ${l.durationSeconds}s` : ''}
              </div>
              {l.note && <div className="text-gray-400 text-xs mt-1">{l.note}</div>}
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-center py-8 text-gray-400">No logs found</div>
          )}
        </div>
      )}
    </div>
  );
}



