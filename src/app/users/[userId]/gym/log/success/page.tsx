"use client";
import { useParams, useRouter } from "next/navigation";

export default function LogSuccessPage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();

  return (
    <div className="container-page py-16">
      <div className="max-w-lg mx-auto bg-black border border-green-600 rounded-lg p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-green-400 mb-3">
          Workout Saved!
        </h1>
        <p className="text-gray-200 mb-6">
          Your workout log has been saved successfully.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.push(`/users/${userId}/gym/history`)}
            className="px-4 py-2 rounded bg-green-600 hover:bg-green-500 text-white"
          >
            View History
          </button>
          <button
            onClick={() => router.push(`/users/${userId}/gym/log`)}
            className="px-4 py-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
          >
            Log Another Workout
          </button>
        </div>
      </div>
    </div>
  );
}
