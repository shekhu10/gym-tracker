import Link from "next/link";

export default function HabitLogSuccessPage() {
  return (
    <div className="container-page pb-20">
      <h1 className="text-2xl font-bold mb-4">Habit Logged</h1>

      <div className="bg-black border border-gray-600 p-6 rounded-lg shadow-sm">
        <p className="text-gray-200 mb-4">Your habit log has been saved.</p>
        <div className="flex gap-2">
          <Link href="../" className="btn">
            Back to Logs
          </Link>
          <Link href="../../" className="btn btn-primary">
            Back to Habits
          </Link>
        </div>
      </div>
    </div>
  );
}
