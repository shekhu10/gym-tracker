'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface User {
  id: number
  name: string
  email: string
}

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Create form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  // Edit form state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/users')
      const data = await res.json()
      setUsers(data)
    } catch (err) {
      console.error(err)
      setError('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const resetCreateForm = () => {
    setName('')
    setEmail('')
  }

  const handleCreate = async () => {
    if (!name || !email) return
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to create user')
        return
      }
      resetCreateForm()
      fetchUsers()
    } catch (err) {
      console.error(err)
      alert('Failed to create user')
    }
  }

  const startEdit = (user: User) => {
    setEditingId(user.id)
    setEditName(user.name)
    setEditEmail(user.email)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditName('')
    setEditEmail('')
  }

  const handleUpdate = async (id: number) => {
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, email: editEmail }),
      })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to update')
        return
      }
      cancelEdit()
      fetchUsers()
    } catch (err) {
      console.error(err)
      alert('Failed to update user')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete user?')) return
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const err = await res.json()
        alert(err.error || 'Failed to delete')
        return
      }
      fetchUsers()
    } catch (err) {
      console.error(err)
      alert('Failed to delete user')
    }
  }

  return (
    <div className="space-y-6">
      {/* Create user form */}
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Name"
          className="input input-bordered flex-1"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          className="input input-bordered flex-1"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button onClick={handleCreate} className="btn btn-primary min-w-24">
          Add
        </button>
      </div>

      {/* Users table */}
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <table className="table w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th className="w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t">
                <td>{u.id}</td>
                <td>
                  {editingId === u.id ? (
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="input input-sm w-full"
                    />
                  ) : (
                    <Link href={`/users/${u.id}`} className="link link-primary">{u.name}</Link>
                  )}
                </td>
                <td>
                  {editingId === u.id ? (
                    <input
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="input input-sm w-full"
                    />
                  ) : (
                    u.email
                  )}
                </td>
                <td className="flex gap-2">
                  {editingId === u.id ? (
                    <>
                      <button className="btn btn-sm btn-success" onClick={() => handleUpdate(u.id)}>
                        Save
                      </button>
                      <button className="btn btn-sm" onClick={cancelEdit}>
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="btn btn-sm" onClick={() => startEdit(u)}>
                        Edit
                      </button>
                      <button className="btn btn-sm btn-error" onClick={() => handleDelete(u.id)}>
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-4">
                  No users
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
