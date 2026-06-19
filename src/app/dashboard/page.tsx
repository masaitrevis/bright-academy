"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
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
  enrollment: {
    paid: boolean;
    passed: boolean;
    examAttempts: number;
    maxAttempts: number;
  } | null;
}

interface Driver {
  id: string;
  fullName: string;
  email: string;
  classification: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const driverData = localStorage.getItem("driver");

    if (!token || !driverData) {
      router.push("/login");
      return;
    }

    setDriver(JSON.parse(driverData));
    fetchTrainings(token, JSON.parse(driverData).id);
  }, [router]);

  const fetchTrainings = async (token: string, driverId: string) => {
    try {
      const res = await fetch(`/api/trainings?driverId=${driverId}`, {
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
    localStorage.removeItem("driver");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <GraduationCap className="w-8 h-8 text-blue-700" />
              <span className="text-xl font-bold text-gray-900">Bright Academy</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{driver?.fullName}</span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-red-600 transition-colors"
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
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Trainings</p>
                <p className="text-2xl font-bold text-gray-900">{trainings.length}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {trainings.filter((t) => t.enrollment?.passed).length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Certificates</p>
                <p className="text-2xl font-bold text-amber-600">
                  {trainings.filter((t) => t.enrollment?.passed).length}
                </p>
              </div>
              <Award className="w-8 h-8 text-amber-600" />
            </div>
          </div>
        </div>

        {/* Trainings */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">Available Trainings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trainings.map((training) => (
            <div
              key={training.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {training.code}
                  </span>
                  <span className="text-xs text-gray-500">{training.level}</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{training.title}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{training.description}</p>
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-gray-500">{training.duration}</span>
                  <span className="font-semibold text-gray-900">KES {training.price}</span>
                </div>

                {training.enrollment?.passed ? (
                  <Link
                    href={`/certificate/${training.id}`}
                    className="block w-full text-center bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    View Certificate
                  </Link>
                ) : training.enrollment?.paid ? (
                  <Link
                    href={`/training/${training.id}`}
                    className="block w-full text-center bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    {training.enrollment?.examAttempts > 0 ? "Retake Exam" : "Start Training"}
                  </Link>
                ) : (
                  <Link
                    href={`/training/${training.id}`}
                    className="block w-full text-center bg-amber-500 text-white py-2 rounded-lg font-medium hover:bg-amber-600 transition-colors flex items-center justify-center space-x-2"
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
