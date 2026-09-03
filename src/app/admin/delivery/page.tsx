"use client";

import React, { useState, useEffect } from "react";
import {
  Bike,
  Plus,
  Loader2,
  CheckCircle2,
  Mail,
  Phone,
  Lock,
  Store,
  Edit2,
  Trash2,
  X,
} from "lucide-react";

export default function AdminPersonnelManagerPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Create Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"delivery" | "staff">("delivery");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Edit Modal State
  const [editingAgent, setEditingAgent] = useState<any | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState<"delivery" | "staff">("delivery");
  const [editPassword, setEditPassword] = useState("");
  const [editError, setEditError] = useState("");

  const fetchAgents = async () => {
    try {
      const res = await fetch("/api/admin/delivery");
      const data = await res.json();
      if (data.success) {
        setAgents(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleCreatePersonnel = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/delivery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone, role }),
      });

      const data = await res.json();

      if (data.success) {
        setAgents([data.data, ...agents]);
        setName("");
        setEmail("");
        setPassword("");
        setPhone("");
        setSuccess(`${role === "staff" ? "Store Staff" : "Delivery Partner"} created!`);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.error || "Failed to create account");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (agent: any) => {
    setEditingAgent(agent);
    setEditName(agent.name);
    setEditEmail(agent.email);
    setEditPhone(agent.phone || "");
    setEditRole(agent.role);
    setEditPassword("");
    setEditError("");
  };

  const handleUpdatePersonnel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;
    setIsSubmitting(true);
    setEditError("");

    try {
      const res = await fetch("/api/admin/delivery", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingAgent._id,
          name: editName,
          email: editEmail,
          phone: editPhone,
          role: editRole,
          password: editPassword,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setAgents((prev) =>
          prev.map((a) => (a._id === editingAgent._id ? data.data : a))
        );
        setEditingAgent(null);
        setSuccess("Personnel details updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setEditError(data.error || "Failed to update account");
      }
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePersonnel = async (id: string, agentName: string) => {
    if (!window.confirm(`Are you sure you want to delete ${agentName}?`)) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/delivery?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        setAgents((prev) => prev.filter((a) => a._id !== id));
        setSuccess("Account deleted successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        alert(data.error || "Failed to delete account");
      }
    } catch (err: any) {
      alert("Error deleting account: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bike className="w-6 h-6 text-emerald-600" />
          Operations & Staff Credentials
        </h1>
        <p className="text-sm text-gray-500">
          Create, modify, and delete credentials for Store Staff and Delivery Partners
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Personnel Form */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-fit">
          <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-emerald-600" /> Add New Account
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> {success}
            </div>
          )}

          <form onSubmit={handleCreatePersonnel} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Select Module / Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-xl text-xs border-gray-300 text-gray-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="delivery">Delivery Partner (Rider)</option>
                <option value="staff">Store Staff (Picker & Packer)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Suresh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-xs border-gray-300 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Login Email</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="staff@flashkart.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border rounded-xl text-xs border-gray-300 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border rounded-xl text-xs border-gray-300 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number (Optional)</label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border rounded-xl text-xs border-gray-300 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition shadow-sm flex items-center justify-center disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
            </button>
          </form>
        </div>

        {/* Existing Accounts List with Edit & Delete */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-base font-bold text-gray-900">Active Personnel ({agents.length})</h2>

          {loading ? (
            <div className="flex justify-center py-16 bg-white rounded-2xl border border-gray-200">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            </div>
          ) : agents.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center">
              <p className="text-gray-600 font-semibold text-sm">No personnel accounts found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {agents.map((agent) => (
                <div
                  key={agent._id}
                  className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center shrink-0 ${
                            agent.role === "staff"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {agent.role === "staff" ? (
                            <Store className="w-5 h-5 text-blue-700" />
                          ) : (
                            <Bike className="w-5 h-5 text-amber-700" />
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <h3 className="text-sm font-bold text-gray-900 truncate">{agent.name}</h3>
                          <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-gray-400 shrink-0" />
                            {agent.email}
                          </p>
                          {agent.phone && (
                            <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-gray-400 shrink-0" />
                              {agent.phone}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action Icons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(agent)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition"
                          title="Edit Account"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeletePersonnel(agent._id, agent.name)}
                          disabled={deletingId === agent._id}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                          title="Delete Account"
                        >
                          {deletingId === agent._id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px]">
                    <span
                      className={`font-bold px-2 py-0.5 rounded border capitalize ${
                        agent.role === "staff"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {agent.role === "staff" ? "Store Staff" : "Delivery Partner"}
                    </span>
                    <span className="text-emerald-600 font-semibold">Active</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingAgent && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <h3 className="font-bold text-gray-900 text-sm">Edit Account Credentials</h3>
              <button
                onClick={() => setEditingAgent(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editError && (
              <div className="mb-3 p-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-semibold">
                {editError}
              </div>
            )}

            <form onSubmit={handleUpdatePersonnel} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Role / Module</label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-xl text-xs border-gray-300 text-gray-900 bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="delivery">Delivery Partner (Rider)</option>
                  <option value="staff">Store Staff (Picker & Packer)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs border-gray-300 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Login Email</label>
                <input
                  type="email"
                  required
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs border-gray-300 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Reset Password <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
                </label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs border-gray-300 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs border-gray-300 text-gray-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingAgent(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}