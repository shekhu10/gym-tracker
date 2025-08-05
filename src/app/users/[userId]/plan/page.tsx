"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { WeeklyPlanForm, Plan } from "./WeeklyPlanForm";

const dayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
const emptyPlan: Plan = { workoutDay: "", exercises: [] };

export default function WeeklyPlanPage() {
  const { userId } = useParams<{ userId: string }>();
  const [plans, setPlans] = useState<Record<string, Plan | null>>({});
  const [selected, setSelected] = useState<typeof dayKeys[number]>("mon");
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
        })
      );
      setPlans(obj);
      setLoading(false);
    })();
  }, [userId]);

  const currentPlan: Plan = plans[selected] ?? emptyPlan;
  const updateCurrent = (p: Plan) => setPlans((prev) => ({ ...prev, [selected]: p }));

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
      <div className="flex gap-2 mb-4">
        {dayKeys.map((d) => (
          <Button
            key={d}
            variant={selected === d ? "primary" : "secondary"}
            size="sm"
            onClick={() => setSelected(d)}
          >
            {d.toUpperCase()}
          </Button>
        ))}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <WeeklyPlanForm plan={currentPlan} onChange={updateCurrent} />
          <div className="flex gap-2 mt-4 items-center">
            <Button variant="primary" onClick={saveCurrent}>
              Save
            </Button>
            <Button variant="secondary" className="bg-red-600 text-white" onClick={clearCurrent}>
              Clear
            </Button>
            {message && <span className="text-green-600 ml-2 text-sm">{message}</span>}
          </div>
        </>
      )}
    </div>
  );
}
