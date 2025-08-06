import Link from 'next/link'
import { notFound } from 'next/navigation'
import { userDb } from '@/lib/db'

interface Props {
  params: { userId: string }
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props) {
  const user = await userDb.findUnique(Number(params.userId))
  return { title: user ? `${user.name} – User` : 'User not found' }
}

export default async function UserDetailPage({ params }: Props) {
  const user = await userDb.findUnique(Number(params.userId))
  if (!user) notFound()

  return (
    <main className="p-6 max-w-3xl mx-auto space-y-8">
      <h1 className="text-3xl font-semibold">{user.name}</h1>
      <p className="text-gray-500">{user.email}</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
        <Link href={`/users/${user.id}/plan`} className="card bg-base-200 p-6 hover:bg-base-300">
          <h2 className="card-title mb-2">Weekly Plan</h2>
          <p>View & edit {user.name}&apos;s weekly workout plan</p>
        </Link>

        <Link href={`/users/${user.id}/log`} className="card bg-base-200 p-6 hover:bg-base-300">
          <h2 className="card-title mb-2">Log Workout</h2>
          <p>Log workouts for {user.name}</p>
        </Link>

        <Link href={`/users/${user.id}/history`} className="card bg-base-200 p-6 hover:bg-base-300">
          <h2 className="card-title mb-2">History</h2>
          <p>View workout history</p>
        </Link>
      </div>
    </main>
  )
}
