"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  WorkoutLogForm,
  WorkoutLog,
  LogExercise,
  LogSingleExercise,
} from "./WorkoutLogForm";
import {
  Plan,
  StripSet,
  Exercise,
  SingleExercise,
  SetItem,
} from "../plan/WeeklyPlanForm";

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
  const [selectedDay, setSelectedDay] = useState<DayKey>(
    dateToDayKey(emptyLog.date),
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Fetch plan and previous week's data when day changes
  useEffect(() => {
    if (!userId || !selectedDay) return;

    setLoading(true);

    // Fetch both plan and previous week's log data in parallel
    const planPromise = fetch(`/api/users/${userId}/plans/${selectedDay}`).then(
      (r) => (r.ok ? r.json() : null),
    );

    const dayName = dayLabels[selectedDay];
    // Convert full day name to short format for database query
    const shortDayName = dayName.substring(0, 3); // "Tuesday" -> "Tue"
    const previousWeekPromise = fetch(
      `/api/users/${userId}/logs?previousWeek=true&date=${currentLog.date}&day=${shortDayName}`,
    ).then((r) => (r.ok ? r.json() : null));

    Promise.all([planPromise, previousWeekPromise])
      .then(([planData, previousWeekData]) => {
        setPlan(planData);
        setPreviousWeekLog(previousWeekData);
        if (planData) {
          // Initialize log from plan template with max sets logic
          const logExercises: LogExercise[] = planData.exercises.map(
            (exercise: Exercise, exerciseIndex: number): LogExercise => {
              if (exercise.type === "circuit") {
                return {
                  type: "circuit" as const,
                  name: exercise.name,
                  rounds: exercise.rounds,
                  restBetweenExercises: exercise.restBetweenExercises,
                  restBetweenRounds: exercise.restBetweenRounds,
                  restAfterExercise: exercise.restAfterExercise,
                  exercises: exercise.exercises.map(
                    (
                      singleEx: any,
                      singleExIndex: number,
                    ): LogSingleExercise => {
                      // Get last week's data for this single exercise
                      const lastWeekSingleEx =
                        previousWeekData?.entries?.exercises?.[exerciseIndex]
                          ?.exercises?.[singleExIndex];
                      const targetSets = singleEx.sets.length;
                      const lastWeekSets = lastWeekSingleEx?.sets?.length || 0;
                      const maxSets = Math.max(targetSets, lastWeekSets);

                      // Create sets array with max number of sets
                      const sets = [];
                      for (let i = 0; i < maxSets; i++) {
                        if (i < singleEx.sets.length) {
                          // Use target set structure
                          const targetSet = singleEx.sets[i];
                          if ("stripSets" in targetSet) {
                            const stripSet = targetSet as unknown as StripSet;
                            // Check if there's last week data for this position
                            const lastWeekSet = lastWeekSingleEx?.sets?.[i];
                            sets.push({
                              ...stripSet,
                              actualSets: stripSet.stripSets.map((s: any) => ({
                                reps: 0,
                                weight: 0,
                                completed: false,
                              })),
                              completed: false,
                              // Include last week data if available
                              lastWeekData: lastWeekSet || undefined,
                            });
                          } else {
                            sets.push({
                              ...targetSet,
                              reps: 0,
                              weight: 0,
                              completed: false,
                            });
                          }
                        } else {
                          // Add extra set based on last week's data or create empty set
                          const lastWeekSet = lastWeekSingleEx?.sets?.[i];
                          if (lastWeekSet) {
                            if ("stripSets" in lastWeekSet) {
                              sets.push({
                                type: "strip" as const,
                                stripSets: lastWeekSet.stripSets || [],
                                actualSets: (
                                  lastWeekSet.actualSets ||
                                  lastWeekSet.stripSets ||
                                  []
                                ).map((s: any) => ({
                                  reps: 0,
                                  weight: 0,
                                  completed: false,
                                })),
                                completed: false,
                                // Preserve last week's data for display
                                lastWeekData: lastWeekSet,
                              });
                            } else {
                              sets.push({
                                ...lastWeekSet,
                                reps: 0,
                                weight: 0,
                                completed: false,
                                // Preserve last week's data for display
                                lastWeekData: lastWeekSet,
                              });
                            }
                          } else {
                            // Create empty set
                            sets.push({
                              reps: 0,
                              weight: 0,
                              completed: false,
                            });
                          }
                        }
                      }

                      return {
                        type: "single" as const,
                        name: singleEx.name,
                        restBetweenSets: 0,
                        restAfterExercise: 0,
                        sets,
                        completed: false,
                      };
                    },
                  ),
                  completed: false,
                };
              } else {
                // Single exercise
                // Get last week's data for this exercise
                const lastWeekEx =
                  previousWeekData?.entries?.exercises?.[exerciseIndex];
                const targetSets = exercise.sets.length;
                const lastWeekSets = lastWeekEx?.sets?.length || 0;
                const maxSets = Math.max(targetSets, lastWeekSets);

                // Create sets array with max number of sets
                const sets = [];
                for (let i = 0; i < maxSets; i++) {
                  if (i < exercise.sets.length) {
                    // Use target set structure
                    const targetSet = exercise.sets[i];
                    if ("stripSets" in targetSet) {
                      const stripSet = targetSet as unknown as StripSet;
                      // Check if there's last week data for this position
                      const lastWeekSet = lastWeekEx?.sets?.[i];
                      sets.push({
                        ...stripSet,
                        actualSets: stripSet.stripSets.map((s: any) => ({
                          reps: 0,
                          weight: 0,
                          completed: false,
                        })),
                        completed: false,
                        // Include last week data if available
                        lastWeekData: lastWeekSet || undefined,
                      });
                    } else {
                      sets.push({
                        ...targetSet,
                        reps: 0,
                        weight: 0,
                        completed: false,
                      });
                    }
                  } else {
                    // Add extra set based on last week's data or create empty set
                    const lastWeekSet = lastWeekEx?.sets?.[i];
                    if (lastWeekSet) {
                      if ("stripSets" in lastWeekSet) {
                        sets.push({
                          type: "strip" as const,
                          stripSets: lastWeekSet.stripSets || [],
                          actualSets: (
                            lastWeekSet.actualSets ||
                            lastWeekSet.stripSets ||
                            []
                          ).map((s: any) => ({
                            reps: 0,
                            weight: 0,
                            completed: false,
                          })),
                          completed: false,
                          // Preserve last week's data for display
                          lastWeekData: lastWeekSet,
                        });
                      } else {
                        sets.push({
                          ...lastWeekSet,
                          reps: 0,
                          weight: 0,
                          completed: false,
                          // Preserve last week's data for display
                          lastWeekData: lastWeekSet,
                        });
                      }
                    } else {
                      // Create empty set
                      sets.push({
                        reps: 0,
                        weight: 0,
                        completed: false,
                      });
                    }
                  }
                }

                return {
                  type: "single" as const,
                  name: exercise.name,
                  restBetweenSets: exercise.restBetweenSets,
                  restAfterExercise: exercise.restAfterExercise,
                  sets,
                  completed: false,
                };
              }
            },
          );

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
      // Filter out incomplete sets (0 or empty reps/weight) before saving
      const filteredLog = {
        ...currentLog,
        exercises: currentLog.exercises.map((exercise) => {
          if (exercise.type === "circuit") {
            return {
              ...exercise,
              exercises: exercise.exercises.map((singleEx) => ({
                ...singleEx,
                sets: singleEx.sets.filter((set) => {
                  if (set.type === "strip") {
                    // For strip sets, filter out if all actual sets are incomplete
                    // AND filter out individual sets within the strip set that are incomplete
                    const hasValidSets = set.actualSets.some(
                      (actualSet) =>
                        actualSet.reps &&
                        actualSet.reps > 0 &&
                        actualSet.weight &&
                        actualSet.weight > 0,
                    );

                    if (hasValidSets) {
                      // Filter out individual sets within the strip set that are incomplete
                      set.actualSets = set.actualSets.filter(
                        (actualSet) =>
                          actualSet.reps &&
                          actualSet.reps > 0 &&
                          actualSet.weight &&
                          actualSet.weight > 0,
                      );
                    }

                    return hasValidSets;
                  } else {
                    // For regular sets, filter out if reps or weight is 0 or empty
                    return (
                      set.reps && set.reps > 0 && set.weight && set.weight > 0
                    );
                  }
                }),
              })),
            };
          } else {
            // Single exercise
            return {
              ...exercise,
              sets: exercise.sets.filter((set) => {
                if (set.type === "strip") {
                  // For strip sets, filter out if all actual sets are incomplete
                  // AND filter out individual sets within the strip set that are incomplete
                  const hasValidSets = set.actualSets.some(
                    (actualSet) =>
                      actualSet.reps &&
                      actualSet.reps > 0 &&
                      actualSet.weight &&
                      actualSet.weight > 0,
                  );

                  if (hasValidSets) {
                    // Filter out individual sets within the strip set that are incomplete
                    set.actualSets = set.actualSets.filter(
                      (actualSet) =>
                        actualSet.reps &&
                        actualSet.reps > 0 &&
                        actualSet.weight &&
                        actualSet.weight > 0,
                    );
                  }

                  return hasValidSets;
                } else {
                  // For regular sets, filter out if reps or weight is 0 or empty
                  return (
                    set.reps && set.reps > 0 && set.weight && set.weight > 0
                  );
                }
              }),
            };
          }
        }),
        dayKey: selectedDay,
      };

      console.log("Saving filtered log:", JSON.stringify(filteredLog, null, 2));

      const res = await fetch(`/api/users/${userId}/logs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filteredLog),
      });

      setMessage(
        res.ok ? "Workout logged successfully!" : "Error saving workout log",
      );
    } catch (error) {
      setMessage("Error saving workout log");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-page pb-20">
      <h1 className="text-2xl font-bold mb-4">Workout Log</h1>

      {/* Date and Day Selection */}
      <div className="bg-black border border-gray-600 p-4 rounded-lg mb-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-white">
              Date
            </label>
            <input
              type="date"
              value={currentLog.date}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-white">
              Workout Day
            </label>
            <select
              value={selectedDay}
              disabled
              className="w-full border rounded p-2 bg-gray-700 text-gray-300 cursor-not-allowed"
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

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 mt-6 items-center">
            {message && (
              <span
                className={`text-sm text-center sm:text-left ${
                  message.includes("Error") ? "text-red-600" : "text-green-600"
                }`}
              >
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
