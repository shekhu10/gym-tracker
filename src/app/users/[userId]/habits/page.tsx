import Link from "next/link";
import { notFound } from "next/navigation";
import { userDb } from "@/lib/db";

interface Props {
  params: { userId: string };
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { userId } = await params;
  const user = await userDb.findUnique(Number(userId));
  return { title: user ? `${user.name} – Habits` : "User not found" };
}

export default async function HabitsPage({ params }: Props) {
  const { userId } = await params;
  const user = await userDb.findUnique(Number(userId));
  if (!user) notFound();

  return (
    <main className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-2">
          {user.name}&apos;s Habits
        </h1>
        <p className="text-gray-300">Create, log, and view habit history</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href={`/users/${user.id}/habits/create`}
          className="card bg-gray-800 border border-gray-600 p-6 hover:bg-gray-700 transition-colors shadow-sm"
        >
          <h2 className="card-title mb-2 text-white">Create Habit</h2>
          <p className="text-gray-300">Add a new habit</p>
        </Link>

        <Link
          href={`/users/${user.id}/habits/logs`}
          className="card bg-gray-800 border border-gray-600 p-6 hover:bg-gray-700 transition-colors shadow-sm"
        >
          <h2 className="card-title mb-2 text-white">Log Habit</h2>
          <p className="text-gray-300">Record a habit entry</p>
        </Link>

        <Link
          href={`/users/${user.id}/habits/history`}
          className="card bg-gray-800 border border-gray-600 p-6 hover:bg-gray-700 transition-colors shadow-sm"
        >
          <h2 className="card-title mb-2 text-white">History</h2>
          <p className="text-gray-300">View habit logs</p>
        </Link>
      </div>
    </main>
  );
}


