import { notFound } from "next/navigation";
import { userDb, tasksDb } from "@/lib/db";
import LogsClient from "./LogsClient";

interface Props {
  params: { userId: string };
}

export const dynamic = "force-dynamic";

export default async function HabitLogsPage({ params }: Props) {
  const { userId } = await params;
  const user = await userDb.findUnique(Number(userId));
  if (!user) notFound();
  const tasks = await tasksDb.findDue(Number(userId));
  return (
    <div className="container-page pb-20">
      <h1 className="text-2xl font-bold mb-4">Habit Logs</h1>
      <div className="bg-black border border-gray-600 p-4 rounded-lg mb-6 shadow-sm">
        <p className="text-gray-200">Create and view logs for your habits.</p>
      </div>
      <LogsClient userId={Number(userId)} tasks={tasks} />
    </div>
  );
}
