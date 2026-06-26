"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/dashboard");
      } else {
        setError(data.error || "Login failed");
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
          <div className="flex justify-center mb-4">
            <img
              src="/bright-academy-logo.png"
              alt="Bright Academy"
              className="h-20 w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-white">Bright Academy</h1>
          <p className="text-[#94a3b8] mt-1">Professional Training Platform</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#475569] rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-[#d4af37] text-white placeholder-[#64748b] transition-all"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#94a3b8] mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-[#0f172a] border border-[#475569] rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-[#d4af37] text-white placeholder-[#64748b] transition-all"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#d4af37] text-[#0f172a] py-2.5 rounded-lg font-semibold hover:bg-[#b8960b] transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-[#64748b]">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#d4af37] font-medium hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}
