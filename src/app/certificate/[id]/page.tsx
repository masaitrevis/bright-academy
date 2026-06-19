"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Download,
  ArrowLeft,
  Award,
  Calendar,
  User,
  FileCheck,
} from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function CertificatePage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState<any>(null);
  const certificateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const driver = JSON.parse(localStorage.getItem("driver") || "{}");

    if (!token || !driver.id) return;

    fetchCertificate(token, driver);
  }, [params.id]);

  const fetchCertificate = async (token: string, driver: any) => {
    try {
      const res = await fetch(`/api/trainings/${params.id}?driverId=${driver.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.training.enrollment?.passed) {
        setCertificate({
          driverName: driver.fullName,
          trainingTitle: data.training.title,
          trainingCode: data.training.code,
          completedAt: data.training.enrollment.completedAt || new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Failed to fetch certificate:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!certificateRef.current) return;

    const canvas = await html2canvas(certificateRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("l", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${certificate.trainingCode}-Certificate.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-700" />
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Certificate not found or exam not passed.</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
            <button
              onClick={downloadPDF}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div
          ref={certificateRef}
          className="bg-white border-8 border-double border-blue-900 p-12 text-center"
          style={{ aspectRatio: "1.414/1" }}
        >
          <div className="border-4 border-amber-500 p-8 h-full flex flex-col justify-between">
            <div>
              <Award className="w-16 h-16 text-amber-500 mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-blue-900 mb-2">CERTIFICATE OF COMPLETION</h1>
              <p className="text-lg text-gray-600">This certifies that</p>
            </div>

            <div className="my-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">{certificate.driverName}</h2>
              <p className="text-lg text-gray-600">has successfully completed</p>
              <h3 className="text-2xl font-bold text-blue-800 mt-4">{certificate.trainingTitle}</h3>
              <p className="text-sm text-gray-500 mt-2">Course Code: {certificate.trainingCode}</p>
            </div>

            <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>
                  Completed: {new Date(certificate.completedAt).toLocaleDateString("en-KE")}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <FileCheck className="w-4 h-4" />
                <span>Verified by Bright Academy</span>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-500">
                Bright Academy | A subsidiary of Bright Elite Tours & Travels
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
