"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Loader2, Lock } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success && data.token) {
        localStorage.setItem("admin_token", data.token);
        router.push("/admin");
      } else {
        setError(data.error || "Invalid password");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-4">
      <div className="bg-[#1e293b] rounded-2xl shadow-2xl p-8 w-full max-w-md border border-[#334155]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#d4af37]/10 rounded-full mb-4 border border-[#d4af37]/30">
            <Shield className="w-8 h-8 text-[#d4af37]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Bright Academy Admin</h1>
          <p className="text-[#94a3b8] mt-1">Enter admin password to continue</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-1">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748b]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#0f172a] border border-[#475569] rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-[#d4af37] text-white placeholder-[#64748b] transition-all"
                placeholder="••••••••"
                autoFocus
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#d4af37] text-[#0f172a] py-2.5 rounded-lg font-semibold hover:bg-[#b8960b] transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Enter Admin Panel"}
          </button>
        </form>
      </div>
    </div>
  );
}
