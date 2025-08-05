"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

// Import types from WeeklyPlanForm to maintain consistency
import { Plan, Exercise, SingleExercise, CircuitExercise, SetItem, NormalSet, StripSet } from "../plan/WeeklyPlanForm";

// Log-specific types that extend the plan types
export interface LogSet extends NormalSet {
  completed?: boolean;
}

export interface LogStripSet extends StripSet {
  actualSets: LogSet[];
  completed?: boolean;
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
  onChange: (log: WorkoutLog) => void;
}

export function WorkoutLogForm({ log, plan, onChange }: WorkoutLogFormProps) {
  const updateLog = (updates: Partial<WorkoutLog>) => {
    onChange({ ...log, ...updates });
  };

  const updateExercise = (index: number, exercise: LogExercise) => {
    const newExercises = [...log.exercises];
    newExercises[index] = exercise;
    updateLog({ exercises: newExercises });
  };

  return (
    <div className="space-y-6">
      {/* Workout metadata */}
      <div className="bg-black border border-gray-600 p-4 rounded-lg space-y-3 shadow-sm">
        <div>
          <label className="block text-sm font-medium mb-1 text-white">Workout Day</label>
          <input
            type="text"
            value={log.workoutDay}
            onChange={(e) => updateLog({ workoutDay: e.target.value })}
            className="w-full border rounded p-2"
            placeholder="e.g., Push Day, Legs, etc."
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-white">Start Time</label>
            <input
              type="time"
              value={log.startTime || ""}
              onChange={(e) => updateLog({ startTime: e.target.value })}
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-white">End Time</label>
            <input
              type="time"
              value={log.endTime || ""}
              onChange={(e) => updateLog({ endTime: e.target.value })}
              className="w-full border rounded p-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-white">Notes</label>
          <textarea
            value={log.notes || ""}
            onChange={(e) => updateLog({ notes: e.target.value })}
            className="w-full border rounded p-2"
            rows={2}
            placeholder="How did the workout feel? Any observations..."
          />
        </div>
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Exercises</h3>
        {log.exercises.map((exercise, index) => (
          <ExerciseLogEditor
            key={index}
            exercise={exercise}
            planExercise={plan?.exercises[index]}
            onChange={(updatedExercise) => updateExercise(index, updatedExercise)}
          />
        ))}
      </div>
    </div>
  );
}

interface ExerciseLogEditorProps {
  exercise: LogExercise;
  planExercise?: Exercise;
  onChange: (exercise: LogExercise) => void;
}

function ExerciseLogEditor({ exercise, planExercise, onChange }: ExerciseLogEditorProps) {
  const updateExercise = (updates: Partial<LogExercise>) => {
    onChange({ ...exercise, ...updates });
  };

  const toggleCompleted = () => {
    updateExercise({ completed: !exercise.completed });
  };

  if (exercise.type === "circuit") {
    return (
      <div className="border border-blue-400 rounded-lg p-4 bg-black shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-blue-300">Circuit: {exercise.name}</h4>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={exercise.completed || false}
                onChange={toggleCompleted}
              />
              Completed
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
          <div>
            <span className="text-gray-300">Target Rounds: </span>
            <span className="font-medium text-white">{exercise.rounds}</span>
          </div>
          <div>
            <span className="text-gray-300">Rest Between Rounds: </span>
            <input
              type="number"
              value={exercise.actualRestBetweenRounds || exercise.restBetweenRounds || ""}
              onChange={(e) => updateExercise({ actualRestBetweenRounds: Number(e.target.value) })}
              className="w-16 border rounded px-1"
              placeholder={exercise.restBetweenRounds?.toString()}
            />
            <span className="ml-1 text-gray-500">sec</span>
          </div>
        </div>

        <div className="space-y-2">
          {exercise.exercises.map((singleEx, index) => (
            <SingleExerciseLogEditor
              key={index}
              exercise={singleEx}
              planExercise={planExercise?.type === "circuit" ? planExercise.exercises[index] : undefined}
              onChange={(updated) => {
                const newExercises = [...exercise.exercises];
                newExercises[index] = updated;
                updateExercise({ exercises: newExercises });
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
      onChange={onChange}
    />
  );
}

interface SingleExerciseLogEditorProps {
  exercise: LogSingleExercise;
  planExercise?: Exercise;
  onChange: (exercise: LogSingleExercise) => void;
  isInCircuit?: boolean;
}

function SingleExerciseLogEditor({ exercise, planExercise, onChange, isInCircuit = false }: SingleExerciseLogEditorProps) {
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

  const toggleCompleted = () => {
    updateExercise({ completed: !exercise.completed });
  };

  const bgColor = isInCircuit ? "bg-gray-900" : "bg-black";
  const borderColor = exercise.completed ? "border-green-400" : "border-gray-600";

  return (
    <div className={`border rounded-lg p-4 ${bgColor} ${borderColor}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-white">{exercise.name}</h4>
        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={exercise.completed || false}
            onChange={toggleCompleted}
          />
          Completed
        </label>
      </div>

      {!isInCircuit && (
        <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
          <div>
            <span className="text-gray-300">Rest Between Sets: </span>
            <input
              type="number"
              value={exercise.actualRestBetweenSets || exercise.restBetweenSets || ""}
              onChange={(e) => updateExercise({ actualRestBetweenSets: Number(e.target.value) })}
              className="w-16 border rounded px-1"
              placeholder={exercise.restBetweenSets?.toString()}
            />
            <span className="ml-1 text-gray-500">sec</span>
          </div>
          <div>
            <span className="text-gray-300">Rest After Exercise: </span>
            <input
              type="number"
              value={exercise.actualRestAfterExercise || exercise.restAfterExercise || ""}
              onChange={(e) => updateExercise({ actualRestAfterExercise: Number(e.target.value) })}
              className="w-16 border rounded px-1"
              placeholder={exercise.restAfterExercise?.toString()}
            />
            <span className="ml-1 text-gray-500">sec</span>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {exercise.sets.map((set, index) => (
          <SetLogEditor
            key={index}
            set={set}
            planSet={planExercise?.type === "single" ? planExercise.sets[index] : undefined}
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
  onChange: (set: LogSetItem) => void;
  onRemove: () => void;
  setNumber: number;
}

function SetLogEditor({ set, planSet, onChange, onRemove, setNumber }: SetLogEditorProps) {
  if (set.type === "strip") {
    return (
      <div className="border border-orange-400 rounded p-3 bg-black shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium text-orange-300">Set {setNumber} - Strip Set</span>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 text-sm">
              <input
                type="checkbox"
                checked={set.completed || false}
                onChange={(e) => onChange({ ...set, completed: e.target.checked })}
              />
              Completed
            </label>
            <Button variant="secondary" size="sm" onClick={onRemove} className="text-red-600">
              Remove
            </Button>
          </div>
        </div>
        
        <div className="space-y-1">
          {set.actualSets.map((actualSet, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-sm w-8">{index + 1}:</span>
              <input
                type="number"
                value={actualSet.reps}
                onChange={(e) => {
                  const newActualSets = [...set.actualSets];
                  newActualSets[index] = { ...actualSet, reps: Number(e.target.value) };
                  onChange({ ...set, actualSets: newActualSets });
                }}
                className="w-16 border rounded px-1"
                placeholder="Reps"
              />
              <span className="text-sm">×</span>
              <input
                type="number"
                value={actualSet.weight}
                onChange={(e) => {
                  const newActualSets = [...set.actualSets];
                  newActualSets[index] = { ...actualSet, weight: Number(e.target.value) };
                  onChange({ ...set, actualSets: newActualSets });
                }}
                className="w-20 border border-gray-600 rounded px-1 bg-gray-800 text-white"
                placeholder="Weight"
              />
              <label className="flex items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  checked={actualSet.completed || false}
                  onChange={(e) => {
                    const newActualSets = [...set.actualSets];
                    newActualSets[index] = { ...actualSet, completed: e.target.checked };
                    onChange({ ...set, actualSets: newActualSets });
                  }}
                />
                ✓
              </label>
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
    <div className="flex items-center gap-3 p-2 border border-gray-600 rounded bg-gray-900">
      <span className="text-sm font-medium w-12 text-white">Set {setNumber}</span>
      <input
        type="number"
        value={set.reps}
        onChange={(e) => onChange({ ...set, reps: Number(e.target.value) })}
        className="w-16 border border-gray-600 rounded px-2 py-1 bg-gray-800 text-white"
        placeholder="Reps"
      />
      <span className="text-sm">×</span>
      <input
        type="number"
        value={set.weight}
        onChange={(e) => onChange({ ...set, weight: Number(e.target.value) })}
        className="w-20 border border-gray-600 rounded px-2 py-1 bg-gray-800 text-white"
        placeholder="Weight"
      />
      
      {planSet && planSet.type !== "strip" && (
        <div className="text-xs text-gray-400">
          Target: {planSet.reps}×{planSet.weight}
        </div>
      )}
      
      <div className="flex items-center gap-2 ml-auto">
        <label className="flex items-center gap-1 text-sm">
          <input
            type="checkbox"
            checked={set.completed || false}
            onChange={(e) => onChange({ ...set, completed: e.target.checked })}
          />
          ✓
        </label>
        <Button variant="secondary" size="sm" onClick={onRemove} className="text-red-600">
          Remove
        </Button>
      </div>
    </div>
  );
}
