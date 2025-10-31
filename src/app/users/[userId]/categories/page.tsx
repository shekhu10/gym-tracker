import Link from "next/link";
import { notFound } from "next/navigation";
import { userDb, habitCategoriesDb } from "@/lib/db";
import CategoriesClient from "./CategoriesClient";

interface Props {
  params: { userId: string };
}

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { userId } = await params;
  const user = await userDb.findUnique(Number(userId));
  return { title: user ? `${user.name} – Categories` : "User not found" };
}

export default async function CategoriesPage({ params }: Props) {
  const { userId } = await params;
  const user = await userDb.findUnique(Number(userId));
  if (!user) notFound();

  const categories = await habitCategoriesDb.findMany(Number(userId));

  return (
    <main className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-2">
              Manage Categories
            </h1>
            <p className="text-gray-300">
              Create and organize your habit categories
            </p>
          </div>
          <Link
            href={`/users/${userId}/habits`}
            className="btn btn-sm bg-gray-700 hover:bg-gray-600"
          >
            Back to Habits
          </Link>
        </div>
      </div>

      <CategoriesClient userId={Number(userId)} initialCategories={categories} />
    </main>
  );
}

