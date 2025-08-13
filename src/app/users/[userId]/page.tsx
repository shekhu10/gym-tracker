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
  return { title: user ? `${user.name} – User` : "User not found" };
}

export default async function UserDetailPage({ params }: Props) {
  const { userId } = await params;
  const user = await userDb.findUnique(Number(userId));
  if (!user) notFound();

  return (
    <main className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 shadow-sm">
        <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-2">
          {user.name}
        </h1>
        <p className="text-gray-300">{user.email}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href={`/users/${user.id}/plan`}
          className="card bg-gray-800 border border-gray-600 p-6 hover:bg-gray-700 transition-colors shadow-sm"
        >
          <h2 className="card-title mb-2 text-white">Weekly Plan</h2>
          <p className="text-gray-300">
            View & edit {user.name}&apos;s weekly workout plan
          </p>
        </Link>

        <Link
          href={`/users/${user.id}/log`}
          className="card bg-gray-800 border border-gray-600 p-6 hover:bg-gray-700 transition-colors shadow-sm"
        >
          <h2 className="card-title mb-2 text-white">Log Workout</h2>
          <p className="text-gray-300">Log workouts for {user.name}</p>
        </Link>

        <Link
          href={`/users/${user.id}/history`}
          className="card bg-gray-800 border border-gray-600 p-6 hover:bg-gray-700 transition-colors shadow-sm"
        >
          <h2 className="card-title mb-2 text-white">History</h2>
          <p className="text-gray-300">View workout history</p>
        </Link>
      </div>
    </main>
  );
}
