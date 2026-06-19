import Link from "next/link";
import { GraduationCap, BookOpen, Award, Shield, CreditCard, Users } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <header className="bg-gradient-to-br from-blue-900 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <GraduationCap className="w-10 h-10" />
              <span className="text-2xl font-bold">Bright Academy</span>
            </div>
            <Link
              href="/login"
              className="bg-white text-blue-900 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Sign In
            </Link>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Professional Driver Training & Certification
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Elevate your driving career with certified training programs from Bright Elite Tours & Travels.
            </p>
            <Link
              href="/login"
              className="inline-block bg-amber-500 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-amber-600 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose Bright Academy?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
              <BookOpen className="w-10 h-10 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Expert Training</h3>
              <p className="text-gray-500">
                Comprehensive courses designed by industry professionals for all skill levels.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
              <CreditCard className="w-10 h-10 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">M-Pesa Payments</h3>
              <p className="text-gray-500">
                Easy and secure payment via M-Pesa STK push directly from your phone.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
              <Award className="w-10 h-10 text-amber-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Certified</h3>
              <p className="text-gray-500">
                Earn recognized certificates upon successful completion of exams.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: Users, title: "Register", desc: "Sign up as a driver on Bright Elite Tours & Travels" },
              { icon: Shield, title: "Enroll", desc: "Choose a training program and complete M-Pesa payment" },
              { icon: BookOpen, title: "Learn", desc: "Study the training materials at your own pace" },
              { icon: Award, title: "Certify", desc: "Pass the exam and download your certificate" },
            ].map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-8 h-8 text-blue-700" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            © 2024 Bright Academy. A subsidiary of Bright Elite Tours & Travels.
          </p>
        </div>
      </footer>
    </div>
  );
}
