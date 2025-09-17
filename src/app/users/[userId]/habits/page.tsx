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
        <p className="text-gray-300">
          This is a placeholder for managing habits. You can add more features
          here later.
        </p>
      </div>
    </main>
  );
}


