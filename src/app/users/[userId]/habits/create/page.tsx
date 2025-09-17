import { notFound } from "next/navigation";
import { userDb } from "@/lib/db";
import CreateHabitForm from "./CreateHabitForm";

interface Props {
  params: { userId: string };
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { userId } = await params;
  const user = await userDb.findUnique(Number(userId));
  return { title: user ? `Create Habit – ${user.name}` : "User not found" };
}

export default async function CreateHabitPage({ params }: Props) {
  const { userId } = await params;
  const user = await userDb.findUnique(Number(userId));
  if (!user) notFound();

  return (
    <div className="container-page pb-20">
      <h1 className="text-2xl font-bold mb-4">Create Habit</h1>

      <div className="bg-black border border-gray-600 p-4 rounded-lg mb-6 shadow-sm">
        <p className="text-gray-200">
          Fill in the details to create a habit for {user.name}.
        </p>
      </div>

      <CreateHabitForm userId={user.id} />
    </div>
  );
}


