"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface SetLog {
  reps: number | "";
  weight: number | "";
  type?: "warmup" | "normal";
}

interface StripSet {
  type: "strip";
  stripSets: { reps: number; weight: number }[];
  actualSets?: SetLog[];
}

type SetItem = SetLog | StripSet;

interface SingleExercise {
  type: "single";
  name: string;
  sets: SetItem[];
  restBetweenSets?: number;
  restAfterExercise?: number;
}

interface CircuitExercise {
  type: "circuit";
  name: string;
  rounds: number;
  exercises: SingleExercise[];
  restBetweenExercises?: number;
  restBetweenRounds?: number;
  restAfterExercise?: number;
}

type Exercise = SingleExercise | CircuitExercise;

interface WorkoutLog {
  id: number;
  date: string;
  dayName: string;
  planName: string;
  entries: {
    exercises: Exercise[];
    startTime?: string;
    endTime?: string;
    notes?: string;
  };
}

export default function LogDetailPage() {
  const params = useParams<{ userId: string; logId: string }>();
  const router = useRouter();
  const { userId, logId } = params;
  const [log, setLog] = useState<WorkoutLog | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/users/${userId}/logs/${logId}`);
      if (res.ok) {
        const data = await res.json();
        setLog(data);
      } else {
        const e = await res.json();
        setError(e.error || "Error loading log");
      }
    })();
  }, [userId, logId]);

  if (error)
    return (
      <div className="p-4 bg-black min-h-screen">
        <p className="text-red-400">{error}</p>
      </div>
    );
  if (!log)
    return (
      <div className="p-4 bg-black min-h-screen">
        <p className="text-white">Loading...</p>
      </div>
    );

  return (
    <div className="p-4 max-w-2xl mx-auto bg-black min-h-screen">
      <button
        onClick={() => router.back()}
        className="text-blue-400 mb-4 underline hover:text-blue-300"
      >
        ← Back
      </button>
      <h1 className="text-2xl font-bold mb-2 text-white">{log.planName}</h1>
      <p className="mb-4 text-gray-300">
        {formatDateLong(log.date)}{` (${log.dayName})`}
      </p>

      {/* Workout timing and notes */}
      {(log.entries.startTime || log.entries.endTime || log.entries.notes) && (
        <div className="bg-gray-900 border border-gray-600 p-4 rounded mb-4">
          {log.entries.startTime && (
            <p className="text-sm mb-1 text-gray-200">
              <strong className="text-white">Start Time:</strong>{" "}
              {log.entries.startTime}
            </p>
          )}
          {log.entries.endTime && (
            <p className="text-sm mb-1 text-gray-200">
              <strong className="text-white">End Time:</strong>{" "}
              {log.entries.endTime}
            </p>
          )}
          {log.entries.notes && (
            <p className="text-sm text-gray-200">
              <strong className="text-white">Notes:</strong> {log.entries.notes}
            </p>
          )}
        </div>
      )}

      {/* Exercises */}
      {log.entries.exercises?.map((ex, i) => (
        <ExerciseDisplay key={i} exercise={ex} />
      ))}
    </div>
  );
}

function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const local = new Date(y, (m || 1) - 1, d || 1);
  return local.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
function ExerciseDisplay({ exercise }: { exercise: Exercise }) {
  if (exercise.type === "circuit") {
    return (
      <div className="border border-blue-400 p-4 rounded mb-4 bg-gray-900">
        <h3 className="font-medium mb-2 text-blue-300">
          Circuit: {exercise.name} ({exercise.rounds} rounds)
        </h3>
        <div className="space-y-3">
          {exercise.exercises.map((singleEx, idx) => (
            <div
              key={idx}
              className="bg-black p-3 rounded border border-gray-600"
            >
              <h4 className="font-medium mb-2 text-white">{singleEx.name}</h4>
              <SetsTable sets={singleEx.sets} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-blue-400 p-4 rounded mb-4 bg-gray-900">
      <h3 className="font-medium mb-2 text-blue-300">
          {exercise.name}
        </h3>
        <div className="space-y-3 bg-black p-3 rounded border border-gray-600">
          <SetsTable sets={exercise.sets} />
        </div>
    </div>
  );
}

function SetsTable({ sets }: { sets: SetItem[] }) {
  return (
    <table className="text-sm w-full">
      <thead>
        <tr className="text-left border-b border-gray-600">
          <th className="pr-2 py-1 text-gray-300">Set</th>
          <th className="pr-2 py-1 text-gray-300">Type</th>
          <th className="pr-2 py-1 text-gray-300">Reps</th>
          <th className="pr-2 py-1 text-gray-300">Weight</th>
        </tr>
      </thead>
      <tbody>
        {sets.map((set, idx) => {
          if (set.type === "strip") {
            return (
              <tr key={idx} className="border-t border-gray-700">
                <td className="pr-2 py-1 text-gray-200">{idx + 1}</td>
                <td className="pr-2 py-1 text-orange-400">Strip Set</td>
                <td className="pr-2 py-1 text-gray-200">
                  {set.actualSets
                    ? set.actualSets.map((s) => s.reps).join(", ")
                    : set.stripSets.map((s) => s.reps).join(", ")}
                </td>
                <td className="pr-2 py-1 text-gray-200">
                  {set.actualSets
                    ? set.actualSets.map((s) => s.weight).join(", ")
                    : set.stripSets.map((s) => s.weight).join(", ")}
                </td>
              </tr>
            );
          }

          return (
            <tr key={idx} className="border-t border-gray-700">
              <td className="pr-2 py-1 text-gray-200">{idx + 1}</td>
              <td className="pr-2 py-1">
                {set.type === "warmup" ? (
                  <span className="text-yellow-400">Warmup</span>
                ) : (
                  <span className="text-gray-300">Normal</span>
                )}
              </td>
              <td className="pr-2 py-1 text-gray-200">{set.reps}</td>
              <td className="pr-2 py-1 text-gray-200">{set.weight}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
