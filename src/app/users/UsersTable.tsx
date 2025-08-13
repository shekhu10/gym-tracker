"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface User {
  id: number;
  name: string;
  email: string;
}

export default function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // Edit form state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetCreateForm = () => {
    setName("");
    setEmail("");
  };

  const handleCreate = async () => {
    if (!name || !email) return;
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to create user");
        return;
      }
      resetCreateForm();
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to create user");
    }
  };

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setEditName(user.name);
    setEditEmail(user.email);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditEmail("");
  };

  const handleUpdate = async (id: number) => {
    // Validate input
    if (!editName.trim() || !editEmail.trim()) {
      alert("Name and email cannot be empty");
      return;
    }

    try {
      console.log("Updating user:", id, { name: editName, email: editEmail });

      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          email: editEmail.trim(),
        }),
      });

      console.log("Response status:", res.status);

      if (!res.ok) {
        const err = await res.json();
        console.error("API Error:", err);
        alert(err.error || `Failed to update (Status: ${res.status})`);
        return;
      }

      const updatedUser = await res.json();
      console.log("User updated successfully:", updatedUser);

      cancelEdit();
      fetchUsers();
    } catch (err) {
      console.error("Update error:", err);
      alert(
        `Failed to update user: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete user?")) return;
    try {
      const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to delete");
        return;
      }
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert("Failed to delete user");
    }
  };

  return (
    <div className="space-y-6">
      {/* Create user form */}
      <div className="flex flex-col sm:flex-row gap-2">
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

      {/* Users display - consistent card layout for all screen sizes */}
      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : (
        <div className="space-y-4">
          {users.map((u) => (
            <div
              key={u.id}
              className="bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium text-white">
                      {editingId === u.id ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="input input-sm w-full bg-gray-700 border-gray-600 text-white"
                          placeholder="Name"
                        />
                      ) : (
                        <Link
                          href={`/users/${u.id}`}
                          className="link link-primary text-blue-400"
                        >
                          {u.name}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm text-gray-300">Email:</div>
                  <div>
                    {editingId === u.id ? (
                      <input
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="input input-sm w-full bg-gray-700 border-gray-600 text-white"
                        placeholder="Email"
                      />
                    ) : (
                      <span className="text-sm text-gray-200">{u.email}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {editingId === u.id ? (
                    <>
                      <button
                        className="btn btn-sm btn-success flex-1"
                        onClick={() => handleUpdate(u.id)}
                      >
                        Save
                      </button>
                      <button
                        className="btn btn-sm flex-1"
                        onClick={() => cancelEdit}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className="btn btn-sm flex-1"
                        onClick={() => startEdit(u)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-error flex-1"
                        onClick={() => handleDelete(u.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <div className="text-center py-8 text-gray-400">No users</div>
          )}
        </div>
      )}
    </div>
  );
}
