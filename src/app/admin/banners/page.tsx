"use client";

import React, { useEffect, useState } from "react";
import { Megaphone, Plus, Trash2, Loader2, CheckCircle2, Sparkles } from "lucide-react";

const GRADIENT_PRESETS = [
  { label: "Emerald Teal", value: "from-emerald-800 via-emerald-600 to-teal-600" },
  { label: "Sunset Amber", value: "from-amber-600 via-orange-600 to-rose-600" },
  { label: "Ocean Blue", value: "from-blue-700 via-indigo-600 to-teal-600" },
  { label: "Purple Berry", value: "from-purple-800 via-pink-600 to-rose-500" },
];

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const [badge, setBadge] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [gradient, setGradient] = useState(GRADIENT_PRESETS[0].value);
  const [tag, setTag] = useState("");
  const [code, setCode] = useState("");

  const fetchBanners = async () => {
    try {
      const res = await fetch("/api/banners");
      const data = await res.json();
      if (data.success) {
        setBanners(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      const res = await fetch("/api/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badge, title, subtitle, gradient, tag, code }),
      });
      const data = await res.json();
      if (data.success) {
        setBanners([data.data, ...banners]);
        setBadge("");
        setTitle("");
        setSubtitle("");
        setTag("");
        setCode("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("Delete this banner?")) return;
    try {
      const res = await fetch(`/api/banners/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setBanners(banners.filter((b) => b._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Megaphone className="w-6 h-6 text-emerald-600" />
          Store Hero Banners & Announcements
        </h1>
        <p className="text-sm text-gray-500">
          Create dynamic hero sliders displayed on the customer store homepage
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Banner Form */}
        <form onSubmit={handleCreateBanner} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 h-fit">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-emerald-600" /> Add Hero Banner
          </h2>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Badge Text</label>
            <input
              type="text"
              required
              placeholder="e.g. 10-Minute Delivery"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs border-gray-300 text-gray-900 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Main Heading</label>
            <input
              type="text"
              required
              placeholder="e.g. Fresh Groceries & Daily Needs"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs border-gray-300 text-gray-900 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Subtitle</label>
            <textarea
              required
              rows={2}
              placeholder="Short description..."
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs border-gray-300 text-gray-900 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Background Gradient</label>
            <select
              value={gradient}
              onChange={(e) => setGradient(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl text-xs border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500"
            >
              {GRADIENT_PRESETS.map((g) => (
                <option key={g.value} value={g.value}>{g.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Tag Offer</label>
              <input
                type="text"
                required
                placeholder="Flat 25% OFF"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl text-xs border-gray-300 text-gray-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Promo Code</label>
              <input
                type="text"
                required
                placeholder="FLASH25"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border rounded-xl text-xs font-mono uppercase border-gray-300 text-gray-900 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-xs transition disabled:opacity-50"
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Publish Banner"}
          </button>
        </form>

        {/* Banners List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-base font-bold text-gray-900">Active Banners ({banners.length})</h2>

          {loading ? (
            <div className="flex justify-center py-16 bg-white rounded-2xl border border-gray-200">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            </div>
          ) : banners.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-gray-200 text-center">
              <Megaphone className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-800">No active custom banners</p>
              <p className="text-xs text-gray-400 mt-0.5">Add banners using the form to override default store sliders.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {banners.map((b) => (
                <div
                  key={b._id}
                  className={`p-6 rounded-2xl text-white bg-gradient-to-r ${b.gradient} shadow-sm relative flex flex-col justify-between`}
                >
                  <button
                    onClick={() => handleDeleteBanner(b._id)}
                    className="absolute top-4 right-4 bg-black/30 hover:bg-red-600 p-1.5 rounded-lg transition"
                    title="Delete Banner"
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </button>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full inline-block mb-2">
                      {b.badge}
                    </span>
                    <h3 className="text-lg font-black">{b.title}</h3>
                    <p className="text-xs text-white/90 mt-1 max-w-md">{b.subtitle}</p>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/20 text-xs">
                    <span className="bg-white text-gray-900 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" /> {b.tag}
                    </span>
                    <span className="bg-black/30 px-2.5 py-1 rounded-lg font-mono">
                      CODE: <strong>{b.code}</strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}