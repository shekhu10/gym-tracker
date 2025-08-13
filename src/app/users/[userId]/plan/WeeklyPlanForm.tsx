"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export type SetStrip = { reps: number; weight: number };
export type NormalSet = {
  reps: number | "";
  weight: number | "";
  type?: "warmup" | "normal";
};
export type StripSet = {
  type: "strip";
  stripSets: SetStrip[];
};
export type SetItem = NormalSet | StripSet;

export interface SingleExercise {
  type: "single";
  name: string;
  restBetweenSets: number | "";
  sets: SetItem[];
  restAfterExercise: number | "";
}

export interface CircuitExercise {
  type: "circuit";
  name: string;
  rounds: number | "";
  restBetweenExercises: number | "";
  restBetweenRounds: number | "";
  exercises: {
    name: string;
    sets: NormalSet[];
  }[];
  restAfterExercise: number | "";
}

export type Exercise = SingleExercise | CircuitExercise;
export interface Plan {
  workoutDay: string;
  exercises: Exercise[];
}

export function WeeklyPlanForm({
  plan,
  onChange,
}: {
  plan: Plan;
  onChange: (p: Plan) => void;
}) {
  function update(field: Partial<Plan>) {
    onChange({ ...plan, ...field });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Workout Day Name
        </label>
        <input
          type="text"
          value={plan.workoutDay}
          onChange={(e) => update({ workoutDay: e.target.value })}
          className="w-full border rounded p-2"
        />
      </div>
      <ExerciseList
        exercises={plan.exercises}
        onChange={(ex) => update({ exercises: ex })}
      />
    </div>
  );
}

// ---------------- Exercise list ----------------
function ExerciseList({
  exercises,
  onChange,
}: {
  exercises: Exercise[];
  onChange: (e: Exercise[]) => void;
}) {
  function addExercise() {
    onChange([
      ...exercises,
      {
        type: "single",
        name: "",
        restBetweenSets: "",
        sets: [],
        restAfterExercise: "",
      } as SingleExercise,
    ]);
  }
  function updateExercise(idx: number, ex: Exercise) {
    const list = [...exercises];
    list[idx] = ex;
    onChange(list);
  }
  function removeExercise(idx: number) {
    onChange(exercises.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <h2 className="font-semibold mb-2">Exercises</h2>
      {exercises.map((ex, idx) => (
        <div key={idx} className="border rounded p-3 mb-3">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Exercise {idx + 1}</span>
            <Button
              variant="secondary"
              size="sm"
              className="text-red-600"
              onClick={() => removeExercise(idx)}
            >
              Remove
            </Button>
          </div>
          <ExerciseForm
            exercise={ex}
            onChange={(e) => updateExercise(idx, e)}
          />
        </div>
      ))}
      <Button variant="primary" size="sm" onClick={addExercise}>
        + Add Exercise
      </Button>
    </div>
  );
}

// ---------------- Exercise form ----------------
function ExerciseForm({
  exercise,
  onChange,
}: {
  exercise: Exercise;
  onChange: (e: Exercise) => void;
}) {
  function update(field: Partial<Exercise>) {
    onChange({ ...exercise, ...field } as Exercise);
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2 items-center">
        <label className="text-sm">Type</label>
        <select
          value={exercise.type}
          onChange={(e) => {
            const val = e.target.value as "single" | "circuit";
            if (val === "single") {
              update({
                type: "single",
                name: exercise.name,
                restBetweenSets: "",
                sets: [],
                restAfterExercise: "",
              } as SingleExercise);
            } else {
              update({
                type: "circuit",
                name: exercise.name,
                rounds: "",
                restBetweenExercises: "",
                restBetweenRounds: "",
                exercises: [],
                restAfterExercise: "",
              } as CircuitExercise);
            }
          }}
          className="border rounded p-1"
        >
          <option value="single">Single</option>
          <option value="circuit">Circuit</option>
        </select>
      </div>

      <div>
        <label className="block text-sm mb-1">Name</label>
        <input
          type="text"
          value={exercise.name}
          onChange={(e) => update({ name: e.target.value })}
          className="w-full border rounded p-1"
        />
      </div>

      {exercise.type === "single" ? (
        <SingleFields ex={exercise as SingleExercise} update={update} />
      ) : (
        <CircuitFields ex={exercise as CircuitExercise} update={update} />
      )}
    </div>
  );
}

// ---------------- Single exercise fields ----------------
function SingleFields({
  ex,
  update,
}: {
  ex: SingleExercise;
  update: (f: Partial<SingleExercise>) => void;
}) {
  function updateSet(idx: number, s: SetItem) {
    const list = [...ex.sets];
    list[idx] = s;
    update({ sets: list });
  }
  function addNormalSet() {
    update({ sets: [...ex.sets, { reps: "", weight: "", type: "normal" }] });
  }
  function addStripSet() {
    update({ sets: [...ex.sets, { type: "strip", stripSets: [] }] });
  }
  function removeSet(idx: number) {
    update({ sets: ex.sets.filter((_, i) => i !== idx) });
  }

  return (
    <div className="space-y-2 border-t pt-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm">Rest Between Sets (sec)</label>
        <input
          type="number"
          value={ex.restBetweenSets}
          onChange={(e) => update({ restBetweenSets: Number(e.target.value) })}
          className="border rounded p-1"
        />
        <label className="text-sm">Rest After Exercise (sec)</label>
        <input
          type="number"
          value={ex.restAfterExercise}
          onChange={(e) =>
            update({ restAfterExercise: Number(e.target.value) })
          }
          className="border rounded p-1"
        />
      </div>

      <div>
        <p className="font-medium">Sets</p>
        {ex.sets.map((s, idx) => (
          <div key={idx} className="border p-2 mb-2 rounded">
            {"type" in s && s.type === "strip" ? (
              <StripSetEditor
                strip={s}
                onChange={(val) => updateSet(idx, val)}
                onRemove={() => removeSet(idx)}
              />
            ) : (
              <NormalSetEditor
                set={s as NormalSet}
                onChange={(val) => updateSet(idx, val)}
                onRemove={() => removeSet(idx)}
              />
            )}
          </div>
        ))}
        <div className="flex gap-2 mt-1">
          <Button size="sm" variant="primary" onClick={addNormalSet}>
            + Normal
          </Button>
          <Button size="sm" variant="secondary" onClick={addStripSet}>
            + Strip
          </Button>
        </div>
      </div>
    </div>
  );
}

function NormalSetEditor({
  set,
  onChange,
  onRemove,
}: {
  set: NormalSet;
  onChange: (s: NormalSet) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-2 items-end">
      <input
        type="number"
        placeholder="Reps"
        value={set.reps}
        onChange={(e) => onChange({ ...set, reps: Number(e.target.value) })}
        className="w-20 border rounded p-1"
      />
      <input
        type="number"
        placeholder="Weight"
        value={set.weight}
        onChange={(e) => onChange({ ...set, weight: Number(e.target.value) })}
        className="w-24 border rounded p-1"
      />
      <select
        value={set.type}
        onChange={(e) => onChange({ ...set, type: e.target.value as any })}
        className="border rounded p-1"
      >
        <option value="warmup">Warmup</option>
        <option value="normal">Normal</option>
      </select>
      <Button
        size="sm"
        variant="secondary"
        className="text-red-600"
        onClick={onRemove}
      >
        X
      </Button>
    </div>
  );
}

function StripSetEditor({
  strip,
  onChange,
  onRemove,
}: {
  strip: StripSet;
  onChange: (s: StripSet) => void;
  onRemove: () => void;
}) {
  function updateStrip(idx: number, s: SetStrip) {
    const list = [...strip.stripSets];
    list[idx] = s;
    onChange({ ...strip, stripSets: list });
  }
  function addStrip() {
    onChange({
      ...strip,
      stripSets: [...strip.stripSets, { reps: 0, weight: 0 }],
    });
  }
  function removeStrip(idx: number) {
    onChange({
      ...strip,
      stripSets: strip.stripSets.filter((_, i) => i !== idx),
    });
  }
  return (
    <div>
      <p className="text-sm font-medium mb-1">Strip Sets</p>
      {strip.stripSets.map((ss, idx) => (
        <div key={idx} className="flex gap-2 items-end mb-1">
          <input
            type="number"
            placeholder="Reps"
            value={ss.reps}
            onChange={(e) =>
              updateStrip(idx, { ...ss, reps: Number(e.target.value) })
            }
            className="w-20 border rounded p-1"
          />
          <input
            type="number"
            placeholder="Weight"
            value={ss.weight}
            onChange={(e) =>
              updateStrip(idx, { ...ss, weight: Number(e.target.value) })
            }
            className="w-24 border rounded p-1"
          />
          <Button
            size="sm"
            variant="secondary"
            className="text-red-600"
            onClick={() => removeStrip(idx)}
          >
            remove
          </Button>
        </div>
      ))}
      <Button size="sm" variant="primary" onClick={addStrip}>
        + add strip
      </Button>
      <Button
        size="sm"
        variant="secondary"
        className="text-red-600 ml-2"
        onClick={onRemove}
      >
        delete group
      </Button>
    </div>
  );
}

// ---------------- Circuit exercise fields ----------------
function CircuitFields({
  ex,
  update,
}: {
  ex: CircuitExercise;
  update: (f: Partial<CircuitExercise>) => void;
}) {
  function updateNestedExercise(
    idx: number,
    e: { name: string; sets: NormalSet[] },
  ) {
    const list = [...ex.exercises];
    list[idx] = e;
    update({ exercises: list });
  }
  function addNestedExercise() {
    update({ exercises: [...ex.exercises, { name: "", sets: [] }] });
  }
  function removeNested(idx: number) {
    update({ exercises: ex.exercises.filter((_, i) => i !== idx) });
  }

  return (
    <div className="space-y-2 border-t pt-2">
      <div className="grid grid-cols-2 gap-2">
        <label className="text-sm">Rounds</label>
        <input
          type="number"
          value={ex.rounds}
          onChange={(e) => update({ rounds: Number(e.target.value) })}
          className="border rounded p-1"
        />
        <label className="text-sm">Rest Between Exercises (sec)</label>
        <input
          type="number"
          value={ex.restBetweenExercises}
          onChange={(e) =>
            update({ restBetweenExercises: Number(e.target.value) })
          }
          className="border rounded p-1"
        />
        <label className="text-sm">Rest Between Rounds (sec)</label>
        <input
          type="number"
          value={ex.restBetweenRounds}
          onChange={(e) =>
            update({ restBetweenRounds: Number(e.target.value) })
          }
          className="border rounded p-1"
        />
        <label className="text-sm">Rest After Exercise (sec)</label>
        <input
          type="number"
          value={ex.restAfterExercise}
          onChange={(e) =>
            update({ restAfterExercise: Number(e.target.value) })
          }
          className="border rounded p-1"
        />
      </div>

      <div>
        <p className="font-medium">Circuit Exercises</p>
        {ex.exercises.map((ce, idx) => (
          <div key={idx} className="border p-2 mb-2 rounded">
            <div className="flex gap-2 items-center mb-1">
              <input
                type="text"
                placeholder="Exercise name"
                value={ce.name}
                onChange={(e) =>
                  updateNestedExercise(idx, { ...ce, name: e.target.value })
                }
                className="flex-1 border rounded p-1"
              />
              <Button
                size="sm"
                variant="secondary"
                className="text-red-600"
                onClick={() => removeNested(idx)}
              >
                remove
              </Button>
            </div>
            {/* Nested sets (use NormalSetEditor) */}
            {ce.sets.map((ns, i) => (
              <NormalSetEditor
                key={i}
                set={ns}
                onChange={(val) => {
                  const setList = [...ce.sets];
                  setList[i] = val;
                  updateNestedExercise(idx, { ...ce, sets: setList });
                }}
                onRemove={() => {
                  updateNestedExercise(idx, {
                    ...ce,
                    sets: ce.sets.filter((_, k) => k !== i),
                  });
                }}
              />
            ))}
            <Button
              size="sm"
              variant="primary"
              onClick={() =>
                updateNestedExercise(idx, {
                  ...ce,
                  sets: [...ce.sets, { reps: "", weight: "", type: "normal" }],
                })
              }
            >
              + add set
            </Button>
          </div>
        ))}
        <Button size="sm" variant="primary" onClick={addNestedExercise}>
          + Add Circuit Exercise
        </Button>
      </div>
    </div>
  );
}
