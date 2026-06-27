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
  Eye,
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
  const [enrolling, setEnrolling] = useState(false);

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

  const handleFreeEnroll = async () => {
    if (!training?.isFree) return;
    setEnrolling(true);
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: user.id, trainingId: training.id }),
      });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      } else {
        alert(data.error || "Enrollment failed");
      }
    } catch (error: any) {
      alert(error.message || "Enrollment error");
    } finally {
      setEnrolling(false);
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
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  if (!training) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <p className="text-[#94a3b8]">Training not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#e2e8f0]">
      <header className="bg-[#1e293b] border-b border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/dashboard" className="flex items-center text-[#94a3b8] hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-[#1e293b] rounded-xl shadow-lg border border-[#334155] overflow-hidden">
          <div className="p-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-[#d4af37] bg-[#d4af37]/10 px-3 py-1 rounded-full">
                {training.code}
              </span>
              <span className="text-sm text-[#94a3b8]">{training.level}</span>
            </div>

            <h1 className="text-3xl font-bold text-white mb-4">{training.title}</h1>
            <p className="text-[#94a3b8] mb-6">{training.description}</p>

            <div className="flex items-center space-x-6 text-sm text-[#94a3b8] mb-8">
              <span>Duration: {training.duration}</span>
              <span>Price: {training.isFree ? "Free" : `KES ${training.price}`}</span>
              {training.timeLimit > 0 && (
                <span className="text-[#d4af37]">Exam Timer: {training.timeLimit} min</span>
              )}
            </div>

            {!training.enrollment?.paid && !training.isFree ? (
              <div className="bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Lock className="w-6 h-6 text-[#d4af37]" />
                  <h3 className="text-lg font-semibold text-[#d4af37]">Training Locked</h3>
                </div>
                <p className="text-[#94a3b8] mb-4">
                  Complete M-Pesa payment to unlock this training and exam.
                </p>
                <div className="flex items-center space-x-3">
                  <input
                    type="tel"
                    placeholder="M-Pesa number (e.g. 0712345678)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="flex-1 px-4 py-2 bg-[#0f172a] border border-[#475569] rounded-lg focus:ring-2 focus:ring-[#d4af37] focus:border-[#d4af37] text-white placeholder-[#64748b] transition-all"
                  />
                  <button
                    onClick={handlePayment}
                    disabled={paying || !phone}
                    className="bg-[#22c55e] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#16a34a] transition-colors disabled:opacity-50 flex items-center space-x-2"
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
            ) : !training.enrollment?.paid && training.isFree ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                  <h3 className="text-lg font-semibold text-green-400">Free Training</h3>
                </div>
                <p className="text-[#94a3b8] mb-4">
                  This training is free. Click below to enroll and start learning.
                </p>
                {training.timeLimit > 0 && (
                  <p className="text-sm text-[#d4af37] mb-4">
                    Note: The exam has a {training.timeLimit}-minute time limit.
                  </p>
                )}
                <button
                  onClick={handleFreeEnroll}
                  disabled={enrolling}
                  className="bg-[#d4af37] text-[#0f172a] px-6 py-2 rounded-lg font-semibold hover:bg-[#b8960b] transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  {enrolling ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <span>Enroll Now</span>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-semibold">Training Unlocked</span>
                </div>

                {/* Training Content */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Training Content</h3>
                  {training.content?.map((module: any, index: number) => (
                    <div key={index} className="border border-[#334155] rounded-lg p-4 bg-[#0f172a]">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-[#d4af37]/10 rounded-full flex items-center justify-center text-[#d4af37] font-medium text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium text-white">{module.title}</h4>
                          <p className="text-sm text-[#94a3b8]">
                            {module.type === "file" ? (module.fileName || "Uploaded File") : module.type}
                          </p>
                        </div>
                        {module.type === "video" && <Play className="w-5 h-5 text-[#94a3b8]" />}
                        {module.type === "file" && (
                          <a
                            href={`/api/view/file?trainingId=${training.id}&moduleId=${module.id}&token=${localStorage.getItem("token") || ""}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#d4af37] hover:text-[#b8960b] transition-colors"
                          >
                            <Eye className="w-5 h-5" />
                          </a>
                        )}
                      </div>

                      {module.type === "text" && (
                        <p className="text-sm text-[#94a3b8] mt-3 whitespace-pre-wrap">{module.content}</p>
                      )}
                      {module.type === "video" && (
                        <div className="mt-3">
                          <a
                            href={module.content}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#d4af37] hover:underline"
                          >
                            Watch Video →
                          </a>
                        </div>
                      )}
                      {module.type === "document" && (
                        <div className="mt-3">
                          <a
                            href={`/api/view/file?trainingId=${training.id}&moduleId=${module.id}&token=${localStorage.getItem("token") || ""}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#d4af37] hover:underline"
                          >
                            View Document →
                          </a>
                        </div>
                      )}
                      {module.type === "file" && (
                        <div className="mt-3 flex items-center space-x-3">
                          <a
                            href={`/api/view/file?trainingId=${training.id}&moduleId=${module.id}&token=${localStorage.getItem("token") || ""}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2 bg-[#d4af37] text-[#0f172a] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#b8960b] transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            <span>Open {module.fileName || "Document"}</span>
                          </a>
                          <span className="text-xs text-[#94a3b8]">
                            {module.fileType === "application/pdf" ? "PDF" :
                             module.fileType?.includes("presentation") ? "PowerPoint" :
                             module.fileType?.includes("word") ? "Word" : "Document"}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Take Exam */}
                {!training.enrollment?.passed && (
                  <div className="border-t border-[#334155] pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-white">Final Exam</h3>
                        <p className="text-sm text-[#94a3b8]">
                          {training.enrollment?.examAttempts || 0} of {training.enrollment?.maxAttempts || 3} attempts used
                        </p>
                        {training.timeLimit > 0 && (
                          <p className="text-xs text-[#d4af37] mt-1">
                            Time limit: {training.timeLimit} minutes
                          </p>
                        )}
                      </div>
                      <Link
                        href={`/exam/${training.id}`}
                        className="bg-[#d4af37] text-[#0f172a] px-6 py-2 rounded-lg font-semibold hover:bg-[#b8960b] transition-colors"
                      >
                        {(training.enrollment?.examAttempts ?? 0) > 0 ? "Retake Exam" : "Take Exam"}
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
