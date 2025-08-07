"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { WorkoutLogForm, WorkoutLog, LogExercise, LogSingleExercise } from "./WorkoutLogForm";
import { Plan, StripSet, Exercise, SingleExercise, SetItem } from "../plan/WeeklyPlanForm";

type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
const dayKeys: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const dayLabels: Record<DayKey, string> = {
  mon: "Monday",
  tue: "Tuesday", 
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

const dateToDayKey = (iso: string): DayKey => {
  const idx = new Date(iso + "T00:00:00").getDay();
  return dayKeys[(idx + 6) % 7];
};

const emptyLog: WorkoutLog = {
  workoutDay: "",
  exercises: [],
  date: new Date().toISOString().slice(0, 10),
};

export default function WorkoutLogPage() {
  const { userId } = useParams<{ userId: string }>();
  const [currentLog, setCurrentLog] = useState<WorkoutLog>(emptyLog);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [previousWeekLog, setPreviousWeekLog] = useState<any>(null);
  const [selectedDay, setSelectedDay] = useState<DayKey>(dateToDayKey(emptyLog.date));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Fetch plan and previous week's data when day changes
  useEffect(() => {
    if (!userId || !selectedDay) return;
    
    setLoading(true);
    
    // Fetch both plan and previous week's log data in parallel
    const planPromise = fetch(`/api/users/${userId}/plans/${selectedDay}`)
      .then((r) => (r.ok ? r.json() : null));
    
    const dayName = dayLabels[selectedDay];
    // Convert full day name to short format for database query
    const shortDayName = dayName.substring(0, 3); // "Tuesday" -> "Tue"
    const previousWeekPromise = fetch(`/api/users/${userId}/logs?previousWeek=true&date=${currentLog.date}&day=${shortDayName}`)
      .then((r) => (r.ok ? r.json() : null));
    
    Promise.all([planPromise, previousWeekPromise])
      .then(([planData, previousWeekData]) => {
        setPlan(planData);
        setPreviousWeekLog(previousWeekData);
        if (planData) {
          // Initialize log from plan template
          const logExercises: LogExercise[] = planData.exercises.map((exercise: Exercise) => {
            if (exercise.type === "circuit") {
              return {
                type: "circuit" as const,
                name: exercise.name,
                rounds: exercise.rounds,
                restBetweenExercises: exercise.restBetweenExercises,
                restBetweenRounds: exercise.restBetweenRounds,
                restAfterExercise: exercise.restAfterExercise,
                exercises: exercise.exercises.map((singleEx: any) => ({
                  type: "single" as const,
                  name: singleEx.name,
                  restBetweenSets: 0,
                  restAfterExercise: 0,
                  sets: singleEx.sets.map((set: SetItem) => {
                    if ('stripSets' in set) {
                      const stripSet = set as unknown as StripSet;
                      return {
                        ...stripSet,
                        actualSets: stripSet.stripSets.map((s: any) => ({ ...s, completed: false })),
                        completed: false,
                      };
                    } else {
                      return {
                        ...set,
                        completed: false,
                      };
                    }
                  }),
                  completed: false,
                })),
                completed: false,
              };
            } else {
              return {
                type: "single" as const,
                name: exercise.name,
                restBetweenSets: exercise.restBetweenSets,
                restAfterExercise: exercise.restAfterExercise,
                sets: exercise.sets.map((set: SetItem) => {
                  if ('stripSets' in set) {
                    const stripSet = set as unknown as StripSet;
                    return {
                      ...stripSet,
                      actualSets: stripSet.stripSets.map((s: any) => ({ ...s, completed: false })),
                      completed: false,
                    };
                  } else {
                    return {
                      ...set,
                      completed: false,
                    };
                  }
                }),
                completed: false,
              };
            }
          });
          
          setCurrentLog({
            workoutDay: planData.workoutDay,
            exercises: logExercises,
            date: currentLog.date,
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setMessage("Error loading plan");
      });
  }, [userId, selectedDay]);

  const handleDateChange = (date: string) => {
    const newDayKey = dateToDayKey(date);
    setCurrentLog({ ...currentLog, date });
    setSelectedDay(newDayKey);
  };

  const saveLog = async () => {
    if (!userId) return;
    
    setLoading(true);
    setMessage(null);
    
    try {
      const res = await fetch(`/api/users/${userId}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...currentLog,
          dayKey: selectedDay,
        }),
      });
      
      setMessage(res.ok ? "Workout logged successfully!" : "Error saving workout log");
    } catch (error) {
      setMessage("Error saving workout log");
    } finally {
      setLoading(false);
    }
  };

  const clearLog = () => {
    if (!confirm("Clear current workout log?")) return;
    setCurrentLog({ ...emptyLog, date: currentLog.date });
    setMessage(null);
  };

  return (
    <div className="container-page pb-20">
      <h1 className="text-2xl font-bold mb-4">Workout Log</h1>
      
      {/* Date and Day Selection */}
      <div className="bg-black border border-gray-600 p-4 rounded-lg mb-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-white">Date</label>
            <input
              type="date"
              value={currentLog.date}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-white">Workout Day</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value as DayKey)}
              className="w-full border rounded p-2"
            >
              {dayKeys.map((day) => (
                <option key={day} value={day}>
                  {dayLabels[day]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <p>Loading workout plan...</p>
      ) : plan ? (
        <>
          <WorkoutLogForm
            log={currentLog}
            plan={plan}
            previousWeekLog={previousWeekLog}
            onChange={setCurrentLog}
            onSave={saveLog}
          />
          
          <div className="flex gap-2 mt-6 items-center">
            <Button variant="secondary" onClick={clearLog}>
              Clear Log
            </Button>
            {message && (
              <span className={`ml-2 text-sm ${
                message.includes("Error") ? "text-red-600" : "text-green-600"
              }`}>
                {message}
              </span>
            )}
          </div>
        </>
      ) : (
        <div className="text-center py-8 bg-black border border-gray-600 rounded-lg">
          <p className="text-gray-200 mb-4">
            No workout plan found for {dayLabels[selectedDay]}.
          </p>
          <p className="text-sm text-gray-400">
            Create a plan first to start logging workouts.
          </p>
        </div>
      )}
    </div>
  );
}