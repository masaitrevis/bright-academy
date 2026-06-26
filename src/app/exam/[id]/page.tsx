"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface Question {
  id: number;
  question: string;
  options: string[];
}

export default function ExamPage() {
  const params = useParams();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [examStarted, setExamStarted] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchQuestions(token);
  }, [params.id, router]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          if (!result && examStarted) {
            handleSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timeRemaining, examStarted, result]);

  const fetchQuestions = async (token: string) => {
    try {
      const res = await fetch(`/api/trainings/${params.id}/exam`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setQuestions(data.questions);
        setExamStarted(true);
        if (data.timeRemaining && data.timeRemaining > 0) {
          setTimeRemaining(data.timeRemaining);
        }
      } else if (data.error === "Time limit exceeded") {
        setResult({ score: 0, passed: false, locked: false, attempts: data.attempts, maxAttempts: data.maxAttempts, timeExpired: true });
      }
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: number, optionIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length < questions.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user") || "{}");

      const formattedAnswers = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
        questionId: parseInt(questionId),
        selectedAnswer,
      }));

      const res = await fetch(`/api/trainings/${params.id}/exam`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: user.id,
          answers: formattedAnswers,
        }),
      });

      const data = await res.json();
      if (data.success || data.error) {
        setResult(data);
      }
    } catch (error: any) {
      alert(error.message || "Failed to submit exam");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-[#e2e8f0]">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-[#1e293b] rounded-xl shadow-lg border border-[#334155] p-8 text-center">
            {result.timeExpired ? (
              <>
                <Clock className="w-16 h-16 text-[#d4af37] mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">Time's Up!</h1>
                <p className="text-[#94a3b8] mb-6">
                  The exam time limit was reached. Your attempt has been recorded.
                </p>
                <p className="text-[#94a3b8] mb-4">
                  Attempt {result.attempts} of {result.maxAttempts}.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-block mt-6 bg-[#d4af37] text-[#0f172a] px-8 py-3 rounded-lg font-semibold hover:bg-[#b8960b] transition-colors"
                >
                  Back to Dashboard
                </Link>
              </>
            ) : result.passed ? (
              <>
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">Congratulations!</h1>
                <p className="text-[#94a3b8] mb-6">
                  You passed with a score of {result.score}/{questions.length || 15}
                </p>
                <Link
                  href={`/certificate/${params.id}`}
                  className="inline-block bg-[#d4af37] text-[#0f172a] px-8 py-3 rounded-lg font-semibold hover:bg-[#b8960b] transition-colors"
                >
                  View Certificate
                </Link>
              </>
            ) : (
              <>
                <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">Exam Failed</h1>
                <p className="text-[#94a3b8] mb-2">
                  You scored {result.score}/{questions.length || 15}. Minimum passing score is {Math.ceil((questions.length || 15) * 0.7)}.
                </p>
                {result.locked ? (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mt-4">
                    <AlertCircle className="w-5 h-5 text-red-400 mx-auto mb-2" />
                    <p className="text-red-400 font-medium">
                      Maximum attempts reached. Training locked.
                    </p>
                  </div>
                ) : (
                  <p className="text-[#94a3b8] mt-4">
                    Attempt {result.attempts} of {result.maxAttempts}. You can retake the exam.
                  </p>
                )}
                <Link
                  href="/dashboard"
                  className="inline-block mt-6 text-[#d4af37] font-medium hover:underline"
                >
                  Back to Dashboard
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#e2e8f0]">
      <header className="bg-[#1e293b] border-b border-[#334155]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/dashboard" className="flex items-center text-[#94a3b8] hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Final Exam</h1>
            <p className="text-[#94a3b8] flex items-center mt-1">
              <Clock className="w-4 h-4 mr-1" />
              {questions.length} questions • Answer all to submit
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {timeRemaining !== null && timeRemaining > 0 && (
              <div className={`text-sm font-mono font-bold px-3 py-1 rounded-lg ${
                timeRemaining < 60 ? "bg-red-500/20 text-red-400" : "bg-[#d4af37]/10 text-[#d4af37]"
              }`}>
                {Math.floor(timeRemaining / 60)}:{String(timeRemaining % 60).padStart(2, "0")}
              </div>
            )}
            <div className="text-sm text-[#94a3b8]">
              Answered: {Object.keys(answers).length}/{questions.length}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((q, index) => (
            <div key={q.id} className="bg-[#1e293b] rounded-xl shadow-lg border border-[#334155] p-6">
              <div className="flex items-start space-x-3 mb-4">
                <span className="flex-shrink-0 w-8 h-8 bg-[#d4af37]/10 rounded-full flex items-center justify-center text-[#d4af37] font-medium text-sm">
                  {index + 1}
                </span>
                <h3 className="text-lg font-medium text-white pt-1">{q.question}</h3>
              </div>

              <div className="space-y-2 ml-11">
                {q.options.map((option, optIndex) => (
                  <button
                    key={optIndex}
                    onClick={() => handleAnswer(q.id, optIndex)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      answers[q.id] === optIndex
                        ? "border-[#d4af37] bg-[#d4af37]/10 text-[#d4af37]"
                        : "border-[#334155] hover:border-[#475569] text-[#e2e8f0]"
                    }`}
                  >
                    <span className="font-medium mr-2">{String.fromCharCode(65 + optIndex)}.</span>
                    {option}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={submitting || Object.keys(answers).length < questions.length}
            className="bg-[#d4af37] text-[#0f172a] px-8 py-3 rounded-lg font-semibold hover:bg-[#b8960b] transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Submitting...</span>
              </>
            ) : (
              <span>Submit Exam</span>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
