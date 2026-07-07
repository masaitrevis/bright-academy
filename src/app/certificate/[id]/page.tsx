"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Download,
  ArrowLeft,
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

    // Warm cream/parchment background
    pdf.setFillColor(248, 244, 232);
    pdf.rect(0, 0, pageW, pageH, "F");

    // Outer border (double line effect)
    pdf.setDrawColor(139, 111, 71); // antique gold
    pdf.setLineWidth(1.5);
    pdf.rect(margin, margin, innerW, innerH);
    pdf.setLineWidth(0.5);
    pdf.rect(margin + 3, margin + 3, innerW - 6, innerH - 6);

    // Inner gold border
    pdf.setDrawColor(184, 150, 80); // muted gold
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
      pdf.setFont("times", "bold");
      pdf.setFontSize(18);
      pdf.setTextColor(45, 35, 20);
      pdf.text("BA", pageW / 2, margin + 28, { align: "center" });
    }

    // Bright Academy text under logo
    pdf.setFont("times", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(45, 35, 20);
    pdf.text("BRIGHT ACADEMY", pageW / 2, margin + 48, { align: "center" });

    pdf.setFont("times", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(100, 90, 75);
    pdf.text("SECURING FUTURE", pageW / 2, margin + 54, { align: "center" });

    // Certificate title
    pdf.setFont("times", "bold");
    pdf.setFontSize(28);
    pdf.setTextColor(45, 35, 20);
    pdf.text("CERTIFICATE OF COMPLETION", pageW / 2, margin + 72, { align: "center" });

    // Decorative line under title
    pdf.setDrawColor(184, 150, 80);
    pdf.setLineWidth(0.8);
    const lineY = margin + 78;
    pdf.line(pageW / 2 - 60, lineY, pageW / 2 + 60, lineY);

    // "This certifies that" text
    pdf.setFont("times", "normal");
    pdf.setFontSize(14);
    pdf.setTextColor(80, 70, 55);
    pdf.text("This certifies that", pageW / 2, margin + 92, { align: "center" });

    // Recipient name
    pdf.setFont("times", "bold");
    pdf.setFontSize(32);
    pdf.setTextColor(30, 25, 15);
    pdf.text(certificate.userName, pageW / 2, margin + 110, { align: "center" });

    // "has successfully completed" text
    pdf.setFont("times", "normal");
    pdf.setFontSize(14);
    pdf.setTextColor(80, 70, 55);
    pdf.text("has successfully completed", pageW / 2, margin + 122, { align: "center" });

    // Training title
    pdf.setFont("times", "bolditalic");
    pdf.setFontSize(20);
    pdf.setTextColor(45, 35, 20);
    pdf.text(certificate.trainingTitle, pageW / 2, margin + 136, { align: "center" });

    // Course code
    pdf.setFont("times", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(100, 90, 75);
    pdf.text(`Course Code: ${certificate.trainingCode}`, pageW / 2, margin + 144, { align: "center" });

    // Date and verification row
    const bottomY = pageH - margin - 30;
    pdf.setFont("times", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(80, 70, 55);

    const dateStr = new Date(certificate.completedAt).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    pdf.text(`Completed: ${dateStr}`, margin + 20, bottomY);
    pdf.text("Verified by Bright Academy", pageW - margin - 20, bottomY, { align: "right" });

    // Signature line
    pdf.setDrawColor(80, 70, 55);
    pdf.setLineWidth(0.5);
    const sigY = pageH - margin - 14;
    pdf.line(pageW - margin - 70, sigY, pageW - margin - 10, sigY);
    pdf.setFontSize(9);
    pdf.text("Authorized Signature", pageW - margin - 40, sigY + 5, { align: "center" });

    // Footer
    pdf.setFontSize(9);
    pdf.setTextColor(130, 120, 105);
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
        {/* On-screen certificate display — warm cream parchment style */}
        <div
          className="border-8 border-double border-[#b8966b] p-12 text-center"
          style={{
            aspectRatio: "1.414/1",
            backgroundColor: "#f8f4e8",
            fontFamily: "var(--font-playfair), 'Playfair Display', Georgia, serif",
          }}
        >
          <div
            className="border-4 border-[#c9a96e] p-8 h-full flex flex-col justify-between"
            style={{ backgroundColor: "#f8f4e8" }}
          >
            <div>
              <div className="flex justify-center mb-4">
                <img
                  src="/bright-academy-logo.png"
                  alt="Bright Academy"
                  className="h-16 w-auto object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
              <h1
                className="text-4xl font-bold mb-2 tracking-wide"
                style={{
                  color: "#2d2314",
                  fontFamily: "var(--font-playfair), 'Playfair Display', Georgia, serif",
                }}
              >
                CERTIFICATE OF COMPLETION
              </h1>
              <p
                className="text-lg"
                style={{
                  color: "#5a4d3a",
                  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif",
                }}
              >
                This certifies that
              </p>
            </div>

            <div className="my-8">
              <h2
                className="text-3xl font-bold mb-4"
                style={{
                  color: "#1e1810",
                  fontFamily: "var(--font-playfair), 'Playfair Display', Georgia, serif",
                }}
              >
                {certificate.userName}
              </h2>
              <p
                className="text-lg"
                style={{
                  color: "#5a4d3a",
                  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif",
                }}
              >
                has successfully completed
              </p>
              <h3
                className="text-2xl font-bold mt-4 italic"
                style={{
                  color: "#2d2314",
                  fontFamily: "var(--font-playfair), 'Playfair Display', Georgia, serif",
                }}
              >
                {certificate.trainingTitle}
              </h3>
              <p
                className="text-sm mt-2"
                style={{
                  color: "#7a6e5a",
                  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif",
                }}
              >
                Course Code: {certificate.trainingCode}
              </p>
            </div>

            <div className="flex items-center justify-center space-x-8 text-sm" style={{ color: "#5a4d3a", fontFamily: "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif" }}>
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

            <div className="mt-8 pt-8 border-t" style={{ borderColor: "#c9a96e" }}>
              <p
                className="text-sm"
                style={{
                  color: "#8a7e6a",
                  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', Georgia, serif",
                }}
              >
                Bright Academy | A subsidiary of Bright Elite Tours & Travels
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
