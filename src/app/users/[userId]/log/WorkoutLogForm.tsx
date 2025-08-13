"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

// Import types from WeeklyPlanForm to maintain consistency
import { Plan, Exercise, SingleExercise, CircuitExercise, SetItem, NormalSet, StripSet } from "../plan/WeeklyPlanForm";

// Log-specific types that extend the plan types
export interface LogSet extends NormalSet {
  completed?: boolean;
  lastWeekData?: any; // Store last week's data for display
}

export interface LogStripSet extends StripSet {
  actualSets: LogSet[];
  completed?: boolean;
  lastWeekData?: any; // Store last week's data for display
}

export type LogSetItem = LogSet | LogStripSet;

export interface LogSingleExercise {
  type: "single";
  name: string;
  restBetweenSets: number | "";
  restAfterExercise: number | "";
  sets: LogSetItem[];
  actualRestBetweenSets?: number;
  actualRestAfterExercise?: number;
  completed?: boolean;
}

export interface LogCircuitExercise {
  type: "circuit";
  name: string;
  rounds: number | "";
  restBetweenExercises: number | "";
  restBetweenRounds: number | "";
  restAfterExercise: number | "";
  exercises: LogSingleExercise[];
  actualRestBetweenRounds?: number;
  actualRestAfterCircuit?: number;
  completed?: boolean;
}

export type LogExercise = LogSingleExercise | LogCircuitExercise;

export interface WorkoutLog {
  workoutDay: string;
  exercises: LogExercise[];
  date: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
}

interface WorkoutLogFormProps {
  log: WorkoutLog;
  plan?: Plan; // Template plan for reference
  previousWeekLog?: any; // Previous week's log data for comparison
  onChange: (log: WorkoutLog) => void;
  onSave: () => void; // Callback to save the log when finished
}

export function WorkoutLogForm({ log, plan, previousWeekLog, onChange, onSave }: WorkoutLogFormProps) {
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0);
  const updateLog = (updates: Partial<WorkoutLog>) => {
    onChange({ ...log, ...updates });
  };

  const updateExercise = (index: number, exercise: LogExercise) => {
    const newExercises = [...log.exercises];
    newExercises[index] = exercise;
    updateLog({ exercises: newExercises });
  };

  const isLastExercise = currentExerciseIdx === log.exercises.length - 1;
  
  // Calculate progress
  const completedExercises = log.exercises.filter(ex => ex.completed).length;
  const progressPercentage = log.exercises.length > 0 ? (completedExercises / log.exercises.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Workout metadata */}
      <div className="bg-black border border-gray-600 p-4 rounded-lg space-y-3 shadow-sm">
        <div>
          <label className="block text-sm font-medium mb-1 text-white">Workout Day</label>
          <div className="w-full border rounded p-2 bg-gray-700 text-white">
            {log.workoutDay || "No workout day specified"}
          </div>
        </div>
      </div>

      {/* Exercise navigation dropdown */}
      {log.exercises.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2 text-white">Select Exercise</label>
          <select
            value={currentExerciseIdx}
            onChange={(e) => setCurrentExerciseIdx(Number(e.target.value))}
            className="w-full border border-gray-600 rounded-lg p-3 bg-gray-800 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {log.exercises.map((exercise, index) => (
              <option key={index} value={index} className="bg-gray-800 text-white">
                {index + 1}. {exercise.name} {exercise.completed ? '✓' : ''}
              </option>
            ))}
          </select>
          
          {/* Progress indicator below dropdown */}
          <div className="mt-3">
            <div className="flex justify-between text-sm text-gray-300 mb-2">
              <span>Progress: {completedExercises} of {log.exercises.length} exercises completed</span>
              <span>{Math.round(progressPercentage)}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Exercises */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Exercise {currentExerciseIdx + 1} of {log.exercises.length}</h3>
        {log.exercises.length > 0 ? (
          <ExerciseLogEditor
            key={currentExerciseIdx}
            exercise={log.exercises[currentExerciseIdx]}
            planExercise={plan?.exercises[currentExerciseIdx]}
            previousWeekExercise={previousWeekLog?.entries?.exercises?.[currentExerciseIdx]}
            onChange={(updatedExercise) => updateExercise(currentExerciseIdx, updatedExercise)}
          />
        ) : (
          <p className="text-gray-400">No exercises in this workout.</p>
        )}

        {/* Navigation Buttons */}
        {log.exercises.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentExerciseIdx((idx) => Math.max(0, idx - 1))}
              disabled={currentExerciseIdx === 0}
              className="w-full sm:w-auto"
            >
              Previous
            </Button>
            {!isLastExercise ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentExerciseIdx((idx) => Math.min(log.exercises.length - 1, idx + 1))}
                className="w-full sm:w-auto"
              >
                Next Exercise
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={onSave} className="w-full sm:w-auto">
                Save Workout Log
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ExerciseLogEditorProps {
  exercise: LogExercise;
  planExercise?: Exercise;
  previousWeekExercise?: any;
  onChange: (exercise: LogExercise) => void;
}

function ExerciseLogEditor({ exercise, planExercise, previousWeekExercise, onChange }: ExerciseLogEditorProps) {
  const updateExercise = (updates: Partial<LogExercise>) => {
    onChange({ ...exercise, ...updates });
  };

  const toggleCompleted = () => {
    updateExercise({ completed: !exercise.completed });
  };

  if (exercise.type === "circuit") {
    return (
      <div className="border border-blue-400 rounded-lg p-4 bg-black shadow-sm">
        <div className="mb-3 flex justify-between items-center">
          <h4 className="font-semibold text-blue-300">Circuit: {exercise.name}</h4>
          <button
            onClick={toggleCompleted}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              exercise.completed
                ? 'bg-green-600 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            {exercise.completed ? '✓ Completed' : 'Mark Complete'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 text-sm">
          <div>
            <span className="text-gray-300">Target Rounds: </span>
            <span className="font-medium text-white">{exercise.rounds}</span>
          </div>
          <div>
            <span className="text-gray-300">Rest Between Rounds: </span>
            <input
              type="number"
              value={exercise.actualRestBetweenRounds || ""}
              onChange={(e) => updateExercise({ actualRestBetweenRounds: Number(e.target.value) || 0 })}
              className="w-16 border rounded px-1"
              placeholder={exercise.restBetweenRounds?.toString()}
            />
            <span className="ml-1 text-gray-500">sec</span>
          </div>
        </div>

        <div className="space-y-2">
          {/* Sets summary for circuit */}
          <div className="bg-gray-800 border border-gray-600 rounded p-3 mb-3">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                <span className="text-gray-300">Target sets: {planExercise?.type === "circuit" ? planExercise.exercises.reduce((total: number, ex: any) => total + ex.sets.length, 0) : 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                <span className="text-gray-300">Last week sets: {previousWeekExercise?.exercises?.reduce((total: number, ex: any) => total + (ex.sets?.length || 0), 0) || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                <span className="text-gray-300">{exercise.exercises.reduce((total: number, ex: any) => total + ex.sets.length, 0)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 bg-green-400 rounded-full"></span>
                <span className="text-gray-300">Will save: {exercise.exercises.reduce((total: number, ex: any) => {
                  return total + ex.sets.filter((set: any) => {
                    if (set.type === "strip") {
                      return set.actualSets.some((actualSet: any) => 
                        actualSet.reps && actualSet.reps > 0 && actualSet.weight && actualSet.weight > 0
                      );
                    } else {
                      return set.reps && set.reps > 0 && set.weight && set.weight > 0;
                    }
                  }).length;
                }, 0)}</span>
              </div>
            </div>
          </div>
          
          {exercise.exercises.map((singleEx, index) => (
            <SingleExerciseLogEditor
              key={index}
              exercise={singleEx}
              planExercise={planExercise?.type === "circuit" ? {
                type: "single" as const,
                name: planExercise.exercises[index]?.name || "",
                restBetweenSets: "",
                restAfterExercise: "",
                sets: planExercise.exercises[index]?.sets || []
              } : undefined}
              previousWeekExercise={previousWeekExercise?.exercises?.[index]}
              onChange={(updated) => {
                const newExercises = [...exercise.exercises];
                newExercises[index] = updated;
                updateExercise({ ...exercise, exercises: newExercises });
              }}
              isInCircuit={true}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <SingleExerciseLogEditor
      exercise={exercise}
      planExercise={planExercise}
      previousWeekExercise={previousWeekExercise}
      onChange={onChange}
    />
  );
}

interface SingleExerciseLogEditorProps {
  exercise: LogSingleExercise;
  planExercise?: Exercise;
  previousWeekExercise?: any;
  onChange: (exercise: LogSingleExercise) => void;
  isInCircuit?: boolean;
}

function SingleExerciseLogEditor({ exercise, planExercise, previousWeekExercise, onChange, isInCircuit = false }: SingleExerciseLogEditorProps) {
  const updateExercise = (updates: Partial<LogSingleExercise>) => {
    onChange({ ...exercise, ...updates });
  };

  const updateSet = (index: number, set: LogSetItem) => {
    const newSets = [...exercise.sets];
    newSets[index] = set;
    updateExercise({ sets: newSets });
  };

  const addSet = () => {
    const newSet: LogSet = { reps: 0, weight: 0, completed: false };
    updateExercise({ sets: [...exercise.sets, newSet] });
  };

  const removeSet = (index: number) => {
    const newSets = exercise.sets.filter((_, i) => i !== index);
    updateExercise({ sets: newSets });
  };

  const bgColor = isInCircuit ? "bg-gray-900" : "bg-black";
  const borderColor = "border-gray-600";

  return (
    <div className={`border rounded-lg p-4 ${bgColor} ${borderColor}`}>
      <div className="mb-3 flex justify-between items-center">
        <h4 className="font-semibold text-white">{exercise.name}</h4>
        {!isInCircuit && (
          <button
            onClick={() => updateExercise({ completed: !exercise.completed })}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              exercise.completed
                ? 'bg-green-600 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            {exercise.completed ? '✓ Completed' : 'Mark Complete'}
          </button>
        )}
      </div>

      {!isInCircuit && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 text-sm">
          <div>
            <span className="text-gray-300">Rest Between Sets: </span>
            <span className="text-gray-400">
              {exercise.restBetweenSets || (planExercise && 'restBetweenSets' in planExercise ? planExercise.restBetweenSets : 'N/A')} sec
            </span>
          </div>
          <div>
            <span className="text-gray-300">Rest After Exercise: </span>
            <span className="text-gray-400">
              {exercise.restAfterExercise || (planExercise && 'restAfterExercise' in planExercise ? planExercise.restAfterExercise : 'N/A')} sec
            </span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {/* Sets summary */}
        <div className="bg-gray-800 border border-gray-600 rounded p-3 mb-3">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="text-gray-300">Target sets: {planExercise && 'sets' in planExercise ? planExercise.sets.length : 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              <span className="text-gray-300">Last week sets: {previousWeekExercise?.sets?.length || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
              <span className="text-gray-300">{exercise.sets.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-400 rounded-full"></span>
              <span className="text-gray-300">Will save: {exercise.sets.filter(set => {
                if (set.type === "strip") {
                  return set.actualSets.some(actualSet => 
                    actualSet.reps && actualSet.reps > 0 && actualSet.weight && actualSet.weight > 0
                  );
                } else {
                  return set.reps && set.reps > 0 && set.weight && set.weight > 0;
                }
              }).length}</span>
            </div>
          </div>
        </div>
        
        {exercise.sets.map((set, index) => (
          <SetLogEditor
            key={index}
            set={set}
            planSet={planExercise && 'sets' in planExercise ? planExercise.sets[index] : undefined}
            previousWeekSet={previousWeekExercise?.sets?.[index]}
            onChange={(updated) => updateSet(index, updated)}
            onRemove={() => removeSet(index)}
            setNumber={index + 1}
          />
        ))}
      </div>

      <Button
        variant="secondary"
        size="sm"
        onClick={addSet}
        className="mt-2"
      >
        + Add Set
      </Button>
    </div>
  );
}

interface SetLogEditorProps {
  set: LogSetItem;
  planSet?: SetItem;
  previousWeekSet?: any;
  onChange: (set: LogSetItem) => void;
  onRemove: () => void;
  setNumber: number;
}

function SetLogEditor({ set, planSet, previousWeekSet, onChange, onRemove, setNumber }: SetLogEditorProps) {
  if (set.type === "strip") {
    return (
      <div className="border border-orange-400 rounded p-3 bg-black shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-orange-300">Set {setNumber} - Strip Set</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onChange({ ...set, completed: !set.completed })}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                set.completed
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
              }`}
            >
              {set.completed ? '✓ Complete' : 'Complete'}
            </button>
            <Button variant="secondary" size="sm" onClick={onRemove} className="text-red-600">
              Remove
            </Button>
          </div>
        </div>
        
        <div className="space-y-1">
          {set.actualSets.map((actualSet, index) => (
            <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span className="text-sm w-8">Strip {index + 1}:</span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="number"
                  value={actualSet.reps || ""}
                  onChange={(e) => {
                    const newActualSets = [...set.actualSets];
                    newActualSets[index] = { ...actualSet, reps: Number(e.target.value) || 0 };
                    onChange({ ...set, actualSets: newActualSets });
                  }}
                  className="w-16 border rounded px-1"
                  placeholder="Reps"
                />
                <span className="text-sm">×</span>
                <input
                  type="number"
                  value={actualSet.weight || ""}
                  onChange={(e) => {
                    const newActualSets = [...set.actualSets];
                    newActualSets[index] = { ...actualSet, weight: Number(e.target.value) || 0 };
                    onChange({ ...set, actualSets: newActualSets });
                  }}
                  className="w-20 border border-gray-600 rounded px-1 bg-gray-800 text-white"
                  placeholder="Weight"
                />
              </div>
              
              {/* Show last week data for strip sets if available */}
              {set.lastWeekData?.actualSets?.[index] && (
                <div className="text-xs text-blue-400">
                  Last week: {set.lastWeekData.actualSets[index].reps}×{set.lastWeekData.actualSets[index].weight}
                </div>
              )}
              
              <button
                onClick={() => {
                  const newActualSets = [...set.actualSets];
                  newActualSets[index] = { ...actualSet, completed: !actualSet.completed };
                  onChange({ ...set, actualSets: newActualSets });
                }}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  actualSet.completed
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {actualSet.completed ? '✓' : 'Complete'}
              </button>
            </div>
          ))}
        </div>
        
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            const newActualSets = [...set.actualSets, { reps: 0, weight: 0, completed: false }];
            onChange({ ...set, actualSets: newActualSets });
          }}
          className="mt-2 text-xs"
        >
          + Add Strip
        </Button>
      </div>
    );
  }

  // Regular set
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 p-2 border border-gray-600 rounded bg-gray-900">
      <span className="text-sm font-medium w-12 text-white">Set {setNumber}</span>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <input
          type="number"
          value={set.reps || ""}
          onChange={(e) => onChange({ ...set, reps: Number(e.target.value) || 0 })}
          className="w-16 border border-gray-600 rounded px-2 py-1 bg-gray-800 text-white"
          placeholder="Reps"
        />
        <span className="text-sm">×</span>
        <input
          type="number"
          value={set.weight || ""}
          onChange={(e) => onChange({ ...set, weight: Number(e.target.value) || 0 })}
          className="w-20 border border-gray-600 rounded px-2 py-1 bg-gray-800 text-white"
          placeholder="Weight"
        />
      </div>
      
      <div className="flex flex-col gap-1 w-full sm:w-auto">
        {planSet && planSet.type !== "strip" && (
          <div className="text-xs text-gray-400">
            Target: {planSet.reps}×{planSet.weight}
          </div>
        )}
        {/* Show last week data from either previousWeekSet or lastWeekData */}
        {(previousWeekSet || set.lastWeekData) && (
          <div className="text-xs text-blue-400">
            Last week: {(previousWeekSet || set.lastWeekData)?.reps}×{(previousWeekSet || set.lastWeekData)?.weight}
          </div>
        )}
        
        {/* Show completion status */}
        {set.reps && set.reps > 0 && set.weight && set.weight > 0 ? (
          <div className="text-xs text-green-400">
            ✓ Will be saved
          </div>
        ) : (
          <div className="text-xs text-yellow-400">
            ⚠ Incomplete - won't be saved
          </div>
        )}
        
        {/* Show set source indicator */}
        {!planSet && (previousWeekSet || set.lastWeekData) && (
          <div className="text-xs text-orange-400">
            From last week
          </div>
        )}
        {!previousWeekSet && !set.lastWeekData && planSet && (
          <div className="text-xs text-green-400">
            Target set
          </div>
        )}
        {!planSet && !previousWeekSet && !set.lastWeekData && (
          <div className="text-xs text-gray-500">
            Extra set
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2 ml-auto w-full sm:w-auto justify-end sm:justify-start">
        <button
          onClick={() => onChange({ ...set, completed: !set.completed })}
          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
            set.completed
              ? 'bg-green-600 text-white'
              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
          }`}
        >
          {set.completed ? '✓' : 'Complete'}
        </button>
        <Button variant="secondary" size="sm" onClick={onRemove} className="text-red-600">
          Remove
        </Button>
      </div>
    </div>
  );
}
