"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Lock,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Play,
  CreditCard,
} from "lucide-react";

interface Training {
  id: number;
  title: string;
  code: string;
  description: string;
  price: number;
  duration: string;
  level: string;
  content: any[];
  enrollment: {
    paid: boolean;
    passed: boolean;
    examAttempts: number;
    maxAttempts: number;
  } | null;
}

export default function TrainingPage() {
  const params = useParams();
  const router = useRouter();
  const [training, setTraining] = useState<Training | null>(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
      router.push("/login");
      return;
    }

    const userId = JSON.parse(user).id;
    fetchTraining(token, userId);
  }, [params.id, router]);

  const fetchTraining = async (token: string, userId: string) => {
    try {
      const res = await fetch(`/api/trainings/${params.id}?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setTraining(data.training);
      }
    } catch (error) {
      console.error("Failed to fetch training:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setPaying(true);
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const res = await fetch("/api/mpesa/stk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: phone.replace(/^0/, "254"),
          amount: training?.price,
          accountReference: `Training-${training?.code}`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("STK push sent! Check your phone to complete payment.");
        // Poll for payment confirmation (simplified)
        setTimeout(() => {
          enrollAfterPayment(data.checkoutRequestId);
        }, 30000);
      } else {
        alert(data.error || "Payment failed");
      }
    } catch (error: any) {
      alert(error.message || "Payment error");
    } finally {
      setPaying(false);
    }
  };

  const enrollAfterPayment = async (reference: string) => {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          trainingId: training?.id,
          paymentReference: reference,
        }),
      });

      const data = await res.json();
      if (data.success) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Enrollment error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  if (!training) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Training not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                {training.code}
              </span>
              <span className="text-sm text-gray-500">{training.level}</span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">{training.title}</h1>
            <p className="text-gray-600 mb-6">{training.description}</p>

            <div className="flex items-center space-x-6 text-sm text-gray-500 mb-8">
              <span>Duration: {training.duration}</span>
              <span>Price: KES {training.price}</span>
            </div>

            {!training.enrollment?.paid ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Lock className="w-6 h-6 text-amber-600" />
                  <h3 className="text-lg font-semibold text-amber-900">Training Locked</h3>
                </div>
                <p className="text-amber-700 mb-4">
                  Complete M-Pesa payment to unlock this training and exam.
                </p>
                <div className="flex items-center space-x-3">
                  <input
                    type="tel"
                    placeholder="M-Pesa number (e.g. 0712345678)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handlePayment}
                    disabled={paying || !phone}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                  >
                    {paying ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        <span>Pay KES {training.price}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 font-medium">Training Unlocked</span>
                </div>

                {/* Training Content */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Training Content</h3>
                  {training.content?.map((module: any, index: number) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-medium text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{module.title}</h4>
                          <p className="text-sm text-gray-500">{module.type}</p>
                        </div>
                        {module.type === "video" && <Play className="w-5 h-5 text-gray-400" />}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Take Exam */}
                {!training.enrollment?.passed && (
                  <div className="border-t border-gray-200 pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Final Exam</h3>
                        <p className="text-sm text-gray-500">
                          {training.enrollment?.examAttempts || 0} of {training.enrollment?.maxAttempts || 3} attempts used
                        </p>
                      </div>
                      <Link
                        href={`/exam/${training.id}`}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        {training.enrollment?.examAttempts > 0 ? "Retake Exam" : "Take Exam"}
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
