"use client";

import { useEffect, useState } from "react";

interface Category {
  id: number;
  userId: number;
  name: string;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function CategoriesClient({
  userId,
  initialCategories,
}: {
  userId: number;
  initialCategories: Category[];
}) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Create form
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3B82F6");

  // Edit form
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const predefinedColors = [
    { name: "Blue", value: "#3B82F6" },
    { name: "Green", value: "#10B981" },
    { name: "Yellow", value: "#F59E0B" },
    { name: "Red", value: "#EF4444" },
    { name: "Purple", value: "#8B5CF6" },
    { name: "Pink", value: "#EC4899" },
    { name: "Indigo", value: "#6366F1" },
    { name: "Teal", value: "#14B8A6" },
  ];

  async function fetchCategories() {
    setLoading(true);
    try {
      const res = await fetch(`/api/users/${userId}/categories`);
      const data = await res.json();
      setCategories(data);
    } catch (e) {
      console.error(e);
      setError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  async function createCategory() {
    if (!newName.trim()) {
      alert("Category name is required");
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          color: newColor,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to create category");
        return;
      }

      setNewName("");
      setNewColor("#3B82F6");
      fetchCategories();
    } catch (e) {
      console.error(e);
      alert("Failed to create category");
    }
  }

  function startEditing(category: Category) {
    setEditingId(category.id);
    setEditName(category.name);
    setEditColor(category.color || "#3B82F6");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditName("");
    setEditColor("");
  }

  async function saveEdit(id: number) {
    if (!editName.trim()) {
      alert("Category name is required");
      return;
    }

    try {
      const res = await fetch(`/api/users/${userId}/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          color: editColor,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to update category");
        return;
      }

      cancelEditing();
      fetchCategories();
    } catch (e) {
      console.error(e);
      alert("Failed to update category");
    }
  }

  async function deleteCategory(id: number) {
    if (
      !confirm(
        "Are you sure you want to delete this category? Habits in this category will become uncategorized.",
      )
    )
      return;

    try {
      const res = await fetch(`/api/users/${userId}/categories/${id}`, {
        method: "DELETE",
      });

      if (res.ok) fetchCategories();
    } catch (e) {
      console.error(e);
      alert("Failed to delete category");
    }
  }

  return (
    <div className="space-y-6">
      {/* Create New Category */}
      <div className="bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-sm">
        <h2 className="text-lg font-medium text-white mb-3">
          Create New Category
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1 text-white">
              Category Name *
            </label>
            <input
              type="text"
              className="w-full border rounded p-2"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., Study, Exercise, Food"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-white">
              Color
            </label>
            <select
              className="w-full border rounded p-2 bg-gray-700 text-gray-200"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
            >
              {predefinedColors.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button
          className="btn btn-primary mt-3"
          onClick={createCategory}
        >
          Create Category
        </button>
      </div>

      {/* Categories List */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-white">All Categories</h2>
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 bg-gray-800 border border-gray-600 rounded-lg">
            <p className="text-gray-400">No categories yet. Create one above!</p>
          </div>
        ) : (
          categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-gray-800 border border-gray-600 rounded-lg p-4"
            >
              {editingId === cat.id ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium mb-1 text-white">
                        Name *
                      </label>
                      <input
                        type="text"
                        className="w-full border rounded p-2"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-white">
                        Color
                      </label>
                      <select
                        className="w-full border rounded p-2 bg-gray-700 text-gray-200"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                      >
                        {predefinedColors.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => saveEdit(cat.id)}
                    >
                      Save
                    </button>
                    <button className="btn btn-sm" onClick={cancelEditing}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-6 h-6 rounded-full border-2 border-gray-600"
                      style={{ backgroundColor: cat.color || "#6B7280" }}
                    />
                    <div>
                      <div className="text-white font-medium">{cat.name}</div>
                      <div className="text-gray-400 text-xs">
                        Created {new Date(cat.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => startEditing(cat)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-error"
                      onClick={() => deleteCategory(cat.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

