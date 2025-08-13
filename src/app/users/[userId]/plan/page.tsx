"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { WeeklyPlanForm, Plan } from "./WeeklyPlanForm";

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

const emptyPlan: Plan = { workoutDay: "", exercises: [] };

export default function WeeklyPlanPage() {
  const { userId } = useParams<{ userId: string }>();
  const [plans, setPlans] = useState<Record<string, Plan | null>>({});
  const [selected, setSelected] = useState<DayKey>("mon");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      const obj: Record<string, Plan | null> = {} as any;
      await Promise.all(
        dayKeys.map(async (d) => {
          const res = await fetch(`/api/users/${userId}/plans/${d}`);
          obj[d] = res.ok ? await res.json() : null;
        }),
      );
      setPlans(obj);
      setLoading(false);
    })();
  }, [userId]);

  const currentPlan: Plan = plans[selected] ?? emptyPlan;
  const updateCurrent = (p: Plan) =>
    setPlans((prev) => ({ ...prev, [selected]: p }));

  const saveCurrent = async () => {
    setLoading(true);
    setMessage(null);
    const body = plans[selected] ?? emptyPlan;
    const res = await fetch(`/api/users/${userId}/plans/${selected}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setMessage(res.ok ? "Saved!" : "Error");
    setLoading(false);
  };

  const clearCurrent = async () => {
    if (!confirm("Clear this day's plan?")) return;
    setLoading(true);
    await fetch(`/api/users/${userId}/plans/${selected}`, { method: "DELETE" });
    setPlans((prev) => ({ ...prev, [selected]: null }));
    setLoading(false);
  };

  return (
    <div className="container-page pb-20">
      <h1 className="text-2xl font-bold mb-4">Weekly Plan</h1>

      {/* Day Selection */}
      <div className="bg-black border border-gray-600 p-4 rounded-lg mb-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-white">
              Selected Day
            </label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value as DayKey)}
              className="w-full border rounded p-2 bg-gray-800 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {dayKeys.map((day) => (
                <option key={day} value={day}>
                  {dayLabels[day]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-white">
              Current Plan
            </label>
            <div className="w-full border rounded p-2 bg-gray-700 text-white">
              {currentPlan.workoutDay || "No workout day specified"}
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-white">Loading plan...</p>
      ) : (
        <>
          <WeeklyPlanForm plan={currentPlan} onChange={updateCurrent} />
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 mt-6 items-center">
            <Button variant="primary" onClick={saveCurrent}>
              Save Plan
            </Button>
            <Button
              variant="secondary"
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={clearCurrent}
            >
              Clear Plan
            </Button>
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
      )}
    </div>
  );
}
