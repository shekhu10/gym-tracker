"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

export default function LogsClient({ userId, tasks }: { userId: number; tasks: Task[] }) {
  const router = useRouter();
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<number>(tasks[0]?.id ?? 0);
  const [status, setStatus] = useState<LogItem["status"]>("completed");
  const [quantity, setQuantity] = useState<string>("");
  const [unit, setUnit] = useState<string>("binary");
  const [durationSeconds, setDurationSeconds] = useState<string>("");
  const [occurredAt, setOccurredAt] = useState<string>(new Date().toISOString());
  const [note, setNote] = useState<string>("");

  async function fetchLogs() {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/habits/logs?taskId=${taskId}`);
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

  async function createLog() {
    try {
      const res = await fetch(`/api/users/${userId}/habits/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          status,
          quantity: quantity ? Number(quantity) : null,
          unit: unit || null,
          durationSeconds: durationSeconds ? Number(durationSeconds) : null,
          occurredAt,
          tz: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata',
          source: 'manual',
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
    } catch (e) {
      console.error(e);
      alert("Failed to create log");
    }
  }

  async function deleteLog(id: number) {
    try {
      const res = await fetch(`/api/users/${userId}/habits/logs/${id}`, { method: 'DELETE' });
      if (res.ok) fetchLogs();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-black border border-gray-600 p-4 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-white">Habit</label>
            <select className="w-full border rounded p-2 bg-gray-700 text-gray-200" value={taskId} onChange={(e) => setTaskId(Number(e.target.value))}>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>{t.taskName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-white">Status</label>
            <select className="w-full border rounded p-2 bg-gray-700 text-gray-200" value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="completed">Completed</option>
              <option value="skipped">Skipped</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-white">Occurred at</label>
            <input className="w-full border rounded p-2" type="datetime-local" value={occurredAt.slice(0,16)} onChange={(e) => setOccurredAt(new Date(e.target.value).toISOString())} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-white">Quantity</label>
            <input className="w-full border rounded p-2" type="number" step="0.001" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g., 2.5" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-white">Unit</label>
            <select className="w-full border rounded p-2 bg-gray-700 text-gray-200" value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="min">min</option>
              <option value="km">km</option>
              <option value="binary">binary</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-white">Duration (seconds)</label>
            <input className="w-full border rounded p-2" type="number" value={durationSeconds} onChange={(e) => setDurationSeconds(e.target.value)} />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-sm font-medium mb-1 text-white">Note</label>
            <textarea className="w-full border rounded p-2" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>

        <div className="mt-3">
          <button className="btn btn-primary" onClick={createLog}>Save Log</button>
        </div>
      </div>

      {loading ? (
        <p>Loading logs...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="space-y-3">
          {logs.map((l) => (
            <div key={l.id} className="bg-gray-800 border border-gray-600 rounded-lg p-4 flex items-center justify-between">
              <div>
                <div className="text-white text-sm">#{l.id} • {l.status} • {l.localDate}</div>
                <div className="text-gray-300 text-sm">
                  {l.quantity ?? ''} {l.unit ?? ''} {l.durationSeconds ? `• ${l.durationSeconds}s` : ''}
                </div>
                {l.note && <div className="text-gray-400 text-xs mt-1">{l.note}</div>}
              </div>
              <div className="flex gap-2">
                <button className="btn btn-sm btn-error" onClick={() => deleteLog(l.id)}>Delete</button>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-center py-8 text-gray-400">No logs yet</div>
          )}
        </div>
      )}
    </div>
  );
}


