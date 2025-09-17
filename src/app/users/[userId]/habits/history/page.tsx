import { notFound } from "next/navigation";
import { userDb, tasksDb } from "@/lib/db";
import LogsHistoryClient from "./LogsHistoryClient";

interface Props {
  params: { userId: string };
}

export const dynamic = "force-dynamic";

export default async function HabitLogsHistoryPage({ params }: Props) {
  const { userId } = await params;
  const user = await userDb.findUnique(Number(userId));
  if (!user) notFound();
  const tasks = await tasksDb.findMany(Number(userId));
  return (
    <div className="container-page pb-20">
      <h1 className="text-2xl font-bold mb-4">Habit Log History</h1>
      <div className="bg-black border border-gray-600 p-4 rounded-lg mb-6 shadow-sm">
        <p className="text-gray-200">
          View all logs. Filter by habit if needed.
        </p>
      </div>
      <LogsHistoryClient userId={Number(userId)} tasks={tasks} />
    </div>
  );
}
