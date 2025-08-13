import UsersTable from './UsersTable'

export const metadata = {
  title: 'Users',
}

export default function UsersPage() {
  return (
    <main className="p-4 sm:p-6 max-w-3xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-semibold mb-4">Users</h1>
      <UsersTable />
    </main>
  )
}
