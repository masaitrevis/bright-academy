"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Download,
  ArrowLeft,
  Award,
  Calendar,
  FileCheck,
} from "lucide-react";
import jsPDF from "jspdf";

export default function CertificatePage() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [certificate, setCertificate] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (!token || !user.id) return;

    fetchCertificate(token, user);
  }, [params.id]);

  const fetchCertificate = async (token: string, user: any) => {
    try {
      const res = await fetch(`/api/trainings/${params.id}?userId=${user.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.training.enrollment?.passed) {
        setCertificate({
          userName: user.fullName,
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
    if (!certificate) return;

    const pdf = new jsPDF("l", "mm", "a4");
    const pageW = pdf.internal.pageSize.getWidth();  // 297mm
    const pageH = pdf.internal.pageSize.getHeight(); // 210mm
    const margin = 15;
    const innerW = pageW - margin * 2;
    const innerH = pageH - margin * 2;

    // Background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageW, pageH, "F");

    // Outer border (double line effect)
    pdf.setDrawColor(0, 51, 102); // dark blue
    pdf.setLineWidth(1.5);
    pdf.rect(margin, margin, innerW, innerH);
    pdf.setLineWidth(0.5);
    pdf.rect(margin + 3, margin + 3, innerW - 6, innerH - 6);

    // Inner gold border
    pdf.setDrawColor(218, 165, 32); // gold/amber
    pdf.setLineWidth(2);
    pdf.rect(margin + 6, margin + 6, innerW - 12, innerH - 12);

    // Try to load logo image
    try {
      const logoData = await fetch("/bright-academy-logo.png").then(r => r.blob()).then(b => new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(b);
      }));
      pdf.addImage(logoData, "PNG", pageW / 2 - 15, margin + 14, 30, 30);
    } catch {
      // Fallback: draw text logo
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.setTextColor(0, 51, 102);
      pdf.text("BA", pageW / 2, margin + 28, { align: "center" });
    }

    // Bright Academy text under logo
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(0, 51, 102);
    pdf.text("BRIGHT ACADEMY", pageW / 2, margin + 48, { align: "center" });

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(120, 120, 120);
    pdf.text("SECURING FUTURE", pageW / 2, margin + 54, { align: "center" });

    // Certificate title
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(28);
    pdf.setTextColor(0, 51, 102);
    pdf.text("CERTIFICATE OF COMPLETION", pageW / 2, margin + 72, { align: "center" });

    // Decorative line under title
    pdf.setDrawColor(218, 165, 32);
    pdf.setLineWidth(0.8);
    const lineY = margin + 78;
    pdf.line(pageW / 2 - 60, lineY, pageW / 2 + 60, lineY);

    // "This certifies that" text
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(14);
    pdf.setTextColor(80, 80, 80);
    pdf.text("This certifies that", pageW / 2, margin + 92, { align: "center" });

    // Recipient name
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(32);
    pdf.setTextColor(0, 0, 0);
    pdf.text(certificate.userName, pageW / 2, margin + 110, { align: "center" });

    // "has successfully completed" text
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(14);
    pdf.setTextColor(80, 80, 80);
    pdf.text("has successfully completed", pageW / 2, margin + 122, { align: "center" });

    // Training title
    pdf.setFont("helvetica", "bolditalic");
    pdf.setFontSize(20);
    pdf.setTextColor(0, 51, 102);
    pdf.text(certificate.trainingTitle, pageW / 2, margin + 136, { align: "center" });

    // Course code
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Course Code: ${certificate.trainingCode}`, pageW / 2, margin + 144, { align: "center" });

    // Date and verification row
    const bottomY = pageH - margin - 30;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(80, 80, 80);

    const dateStr = new Date(certificate.completedAt).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    pdf.text(`Completed: ${dateStr}`, margin + 20, bottomY);
    pdf.text("Verified by Bright Academy", pageW - margin - 20, bottomY, { align: "right" });

    // Signature line
    pdf.setDrawColor(80, 80, 80);
    pdf.setLineWidth(0.5);
    const sigY = pageH - margin - 14;
    pdf.line(pageW - margin - 70, sigY, pageW - margin - 10, sigY);
    pdf.setFontSize(9);
    pdf.text("Authorized Signature", pageW - margin - 40, sigY + 5, { align: "center" });

    // Footer
    pdf.setFontSize(9);
    pdf.setTextColor(150, 150, 150);
    pdf.text("Bright Academy | A subsidiary of Bright Elite Tours & Travels", pageW / 2, pageH - margin - 4, { align: "center" });

    pdf.save(`${certificate.trainingCode}-Certificate.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#d4af37]" />
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#94a3b8] mb-4">Certificate not found or exam not passed.</p>
          <Link href="/dashboard" className="text-[#d4af37] hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#e2e8f0]">
      <header className="bg-[#1e293b] border-b border-[#334155]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/dashboard" className="flex items-center text-[#94a3b8] hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
            <button
              onClick={downloadPDF}
              className="flex items-center space-x-2 bg-[#d4af37] text-[#0f172a] px-4 py-2 rounded-lg font-semibold hover:bg-[#b8960b] transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* On-screen certificate display */}
        <div className="bg-[#1e293b] border-8 border-double border-[#d4af37] p-12 text-center" style={{ aspectRatio: "1.414/1" }}>
          <div className="border-4 border-[#d4af37] p-8 h-full flex flex-col justify-between">
            <div>
              <div className="flex justify-center mb-4">
                <img
                  src="/bright-academy-logo.png"
                  alt="Bright Academy"
                  className="h-16 w-auto object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
              <h1 className="text-4xl font-bold text-[#d4af37] mb-2">CERTIFICATE OF COMPLETION</h1>
              <p className="text-lg text-[#94a3b8]">This certifies that</p>
            </div>

            <div className="my-8">
              <h2 className="text-3xl font-bold text-white mb-4">{certificate.userName}</h2>
              <p className="text-lg text-[#94a3b8]">has successfully completed</p>
              <h3 className="text-2xl font-bold text-[#d4af37] mt-4">{certificate.trainingTitle}</h3>
              <p className="text-sm text-[#94a3b8] mt-2">Course Code: {certificate.trainingCode}</p>
            </div>

            <div className="flex items-center justify-center space-x-8 text-sm text-[#94a3b8]">
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

            <div className="mt-8 pt-8 border-t border-[#334155]">
              <p className="text-sm text-[#94a3b8]">
                Bright Academy | A subsidiary of Bright Elite Tours & Travels
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
