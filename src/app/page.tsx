import Link from "next/link";
import { GraduationCap, BookOpen, Award, Shield, CreditCard, Users } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-[#e2e8f0]">
      {/* Hero */}
      <header className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] border-b border-[#334155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <GraduationCap className="w-10 h-10 text-[#d4af37]" />
              <span className="text-2xl font-bold text-white">Bright Academy</span>
            </div>
            <Link
              href="/login"
              className="bg-[#d4af37] text-[#0f172a] px-6 py-2 rounded-lg font-semibold hover:bg-[#b8960b] transition-colors"
            >
              Sign In
            </Link>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Professional Driver Training & Certification
            </h1>
            <p className="text-xl text-[#94a3b8] mb-8">
              Elevate your driving career with certified training programs from Bright Elite Tours & Travels.
            </p>
            <Link
              href="/login"
              className="inline-block bg-[#d4af37] text-[#0f172a] px-8 py-3 rounded-lg font-semibold text-lg hover:bg-[#b8960b] transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="py-16 bg-[#0f172a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Why Choose Bright Academy?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#1e293b] rounded-xl p-6 shadow-lg border border-[#334155] text-center hover:border-[#d4af37] transition-colors">
              <BookOpen className="w-10 h-10 text-[#d4af37] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Expert Training</h3>
              <p className="text-[#94a3b8]">
                Comprehensive courses designed by industry professionals for all skill levels.
              </p>
            </div>
            <div className="bg-[#1e293b] rounded-xl p-6 shadow-lg border border-[#334155] text-center hover:border-[#d4af37] transition-colors">
              <CreditCard className="w-10 h-10 text-[#22c55e] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">M-Pesa Payments</h3>
              <p className="text-[#94a3b8]">
                Easy and secure payment via M-Pesa STK push directly from your phone.
              </p>
            </div>
            <div className="bg-[#1e293b] rounded-xl p-6 shadow-lg border border-[#334155] text-center hover:border-[#d4af37] transition-colors">
              <Award className="w-10 h-10 text-[#d4af37] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Certified</h3>
              <p className="text-[#94a3b8]">
                Earn recognized certificates upon successful completion of exams.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 bg-[#1e293b]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-white mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: Users, title: "Register", desc: "Sign up as a driver on Bright Elite Tours & Travels" },
              { icon: Shield, title: "Enroll", desc: "Choose a training program and complete M-Pesa payment" },
              { icon: BookOpen, title: "Learn", desc: "Study the training materials at your own pace" },
              { icon: Award, title: "Certify", desc: "Pass the exam and download your certificate" },
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-[#0f172a] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#334155]">
                  <step.icon className="w-8 h-8 text-[#d4af37]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-[#94a3b8] text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0f172a] border-t border-[#334155] text-[#94a3b8] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            © 2024 Bright Academy. A subsidiary of Bright Elite Tours & Travels.
          </p>
        </div>
      </footer>
    </div>
  );
}
