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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetchQuestions(token);
  }, [params.id, router]);

  const fetchQuestions = async (token: string) => {
    try {
      const res = await fetch(`/api/trainings/${params.id}/exam`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setQuestions(data.questions);
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
      const driver = JSON.parse(localStorage.getItem("driver") || "{}");

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
          driverId: driver.id,
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
            {result.passed ? (
              <>
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h1>
                <p className="text-gray-600 mb-6">
                  You passed with a score of {result.score}/15
                </p>
                <Link
                  href={`/certificate/${params.id}`}
                  className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  View Certificate
                </Link>
              </>
            ) : (
              <>
                <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Exam Failed</h1>
                <p className="text-gray-600 mb-2">
                  You scored {result.score}/15. Minimum passing score is 10/15.
                </p>
                {result.locked ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                    <AlertCircle className="w-5 h-5 text-red-600 mx-auto mb-2" />
                    <p className="text-red-700 font-medium">
                      Maximum attempts reached. Training locked.
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 mt-4">
                    Attempt {result.attempts} of {result.maxAttempts}. You can retake the exam.
                  </p>
                )}
                <Link
                  href="/dashboard"
                  className="inline-block mt-6 text-blue-600 font-medium hover:underline"
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Final Exam</h1>
            <p className="text-gray-500 flex items-center mt-1">
              <Clock className="w-4 h-4 mr-1" />
              15 questions • Answer all to submit
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Answered: {Object.keys(answers).length}/{questions.length}
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((q, index) => (
            <div key={q.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start space-x-3 mb-4">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-medium text-sm">
                  {index + 1}
                </span>
                <h3 className="text-lg font-medium text-gray-900 pt-1">{q.question}</h3>
              </div>

              <div className="space-y-2 ml-11">
                {q.options.map((option, optIndex) => (
                  <button
                    key={optIndex}
                    onClick={() => handleAnswer(q.id, optIndex)}
                    className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${
                      answers[q.id] === optIndex
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 hover:border-gray-300"
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
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
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
