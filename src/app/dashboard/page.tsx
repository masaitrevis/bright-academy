"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  Award,
  Lock,
  CheckCircle,
  Loader2,
  LogOut,
  User,
} from "lucide-react";

interface Training {
  id: number;
  title: string;
  code: string;
  description: string;
  price: number;
  duration: string;
  level: string;
  isFree: boolean;
  timeLimit: number;
  enrollment: {
    paid: boolean;
    passed: boolean;
    examAttempts: number;
    maxAttempts: number;
  } | null;
}

interface UserData {
  id: string;
  fullName: string;
  email: string;
  classification: string | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/login");
      return;
    }

    setUser(JSON.parse(userData));
    fetchTrainings(token, JSON.parse(userData).id);
  }, [router]);

  const fetchTrainings = async (token: string, userId: string) => {
    try {
      const res = await fetch(`/api/trainings?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setTrainings(data.trainings);
      }
    } catch (error) {
      console.error("Failed to fetch trainings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#e2e8f0]">
      {/* Header */}
      <header className="bg-[#1e293b] border-b border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img
                src="/bright-academy-logo.png"
                alt="Bright Academy"
                className="h-8 w-auto object-contain"
              />
              <span className="text-xl font-bold text-white">Bright Academy</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-[#94a3b8]">
                <User className="w-4 h-4" />
                <span>{user?.fullName}</span>
                {user?.classification && (
                  <span className="text-xs bg-[#d4af37]/10 text-[#d4af37] px-2 py-0.5 rounded-full">
                    {user.classification}
                  </span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="text-[#94a3b8] hover:text-red-400 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1e293b] rounded-xl p-6 shadow-lg border border-[#334155]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#94a3b8]">Total Trainings</p>
                <p className="text-2xl font-bold text-white">{trainings.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-[#d4af37]" />
            </div>
          </div>
          <div className="bg-[#1e293b] rounded-xl p-6 shadow-lg border border-[#334155]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#94a3b8]">Completed</p>
                <p className="text-2xl font-bold text-green-400">
                  {trainings.filter((t) => t.enrollment?.passed).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="bg-[#1e293b] rounded-xl p-6 shadow-lg border border-[#334155]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#94a3b8]">Certificates</p>
                <p className="text-2xl font-bold text-[#d4af37]">
                  {trainings.filter((t) => t.enrollment?.passed).length}
                </p>
              </div>
              <Award className="w-8 h-8 text-[#d4af37]" />
            </div>
          </div>
        </div>

        {/* Trainings */}
        <h2 className="text-xl font-bold text-white mb-4">Available Trainings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainings.map((training) => (
            <div
              key={training.id}
              className="bg-[#1e293b] rounded-xl shadow-lg border border-[#334155] overflow-hidden hover:border-[#d4af37] transition-colors"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-[#d4af37] bg-[#d4af37]/10 px-2 py-1 rounded">
                    {training.code}
                  </span>
                  <div className="flex items-center space-x-2">
                    {training.isFree && (
                      <span className="text-xs font-medium text-green-400 bg-green-500/10 px-2 py-1 rounded-full">FREE</span>
                    )}
                    <span className="text-xs text-[#94a3b8]">{training.level}</span>
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{training.title}</h3>
                <p className="text-sm text-[#94a3b8] mb-4 line-clamp-2">{training.description}</p>
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-[#94a3b8]">{training.duration}</span>
                  <span className="font-semibold text-white">{training.isFree ? "Free" : `KES ${training.price}`}</span>
                </div>

                {training.enrollment?.passed ? (
                  <Link
                    href={`/certificate/${training.id}`}
                    className="block w-full text-center bg-[#22c55e] text-white py-2 rounded-lg font-semibold hover:bg-[#16a34a] transition-colors"
                  >
                    View Certificate
                  </Link>
                ) : training.enrollment?.paid || training.isFree ? (
                  <Link
                    href={`/training/${training.id}`}
                    className="block w-full text-center bg-[#d4af37] text-[#0f172a] py-2 rounded-lg font-semibold hover:bg-[#b8960b] transition-colors"
                  >
                    {(training.enrollment?.examAttempts ?? 0) > 0 ? "Retake Exam" : "Start Training"}
                  </Link>
                ) : (
                  <Link
                    href={`/training/${training.id}`}
                    className="block w-full text-center bg-[#d4af37]/10 text-[#d4af37] border border-[#d4af37]/30 py-2 rounded-lg font-semibold hover:bg-[#d4af37]/20 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Unlock Training</span>
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
