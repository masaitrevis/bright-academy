"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Plus,
  Loader2,
  ArrowLeft,
  Trash2,
  Edit3,
  BookOpen,
  FileText,
  Video,
  FileQuestion,
  Save,
  X,
  ChevronLeft,
  CheckCircle2,
  GripVertical,
} from "lucide-react";

interface ContentModule {
  id: string;
  title: string;
  type: "text" | "video" | "document";
  content: string;
}

interface Question {
  id: number;
  trainingId: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface Training {
  id: number;
  title: string;
  code: string;
  description: string;
  price: number;
  duration: string;
  level: string;
  content: ContentModule[];
  status: string;
  createdAt: string;
}

type View = "list" | "create" | "edit";
type Tab = "metadata" | "content" | "questions";

export default function AdminPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("list");
  const [activeTab, setActiveTab] = useState<Tab>("metadata");
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTraining, setSelectedTraining] = useState<Training | null>(null);
  const [saving, setSaving] = useState(false);

  // Create form state
  const [formData, setFormData] = useState({
    title: "",
    code: "",
    description: "",
    price: "",
    duration: "",
    level: "Beginner",
  });

  // Edit metadata state
  const [editData, setEditData] = useState({
    title: "",
    code: "",
    description: "",
    price: "",
    duration: "",
    level: "Beginner",
    status: "active",
  });

  // Content modules state
  const [modules, setModules] = useState<ContentModule[]>([]);
  const [newModule, setNewModule] = useState({
    title: "",
    type: "text" as "text" | "video" | "document",
    content: "",
  });

  // Questions state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState({
    question: "",
    option0: "",
    option1: "",
    option2: "",
    option3: "",
    correctAnswer: 0,
    explanation: "",
  });

  const [adminToken, setAdminToken] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    if (!token) {
      router.push("/admin/login");
      return;
    }
    setAdminToken(token);
    fetchTrainings(token);
  }, [router]);

  const fetchTrainings = async (token: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/trainings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setTrainings(data.trainings);
      } else if (res.status === 401) {
        localStorage.removeItem("admin_token");
        router.push("/admin/login");
      }
    } catch (error) {
      console.error("Failed to fetch trainings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;

    try {
      setSaving(true);
      const res = await fetch("/api/admin/trainings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          ...formData,
          price: parseInt(formData.price) || 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFormData({ title: "", code: "", description: "", price: "", duration: "", level: "Beginner" });
        setTrainings((prev) => [data.training, ...prev]);
        // Flow into content editor
        setSelectedTraining(data.training);
        setEditData({
          title: data.training.title,
          code: data.training.code,
          description: data.training.description || "",
          price: String(data.training.price),
          duration: data.training.duration || "",
          level: data.training.level || "Beginner",
          status: data.training.status || "active",
        });
        setModules(data.training.content || []);
        setQuestions([]);
        setView("edit");
        setActiveTab("content");
      } else {
        alert(data.error || "Failed to create training");
      }
    } catch (error: any) {
      alert(error.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = async (training: Training) => {
    setSelectedTraining(training);
    setEditData({
      title: training.title,
      code: training.code,
      description: training.description || "",
      price: String(training.price),
      duration: training.duration || "",
      level: training.level || "Beginner",
      status: training.status || "active",
    });
    setModules(training.content || []);

    // Fetch questions
    if (adminToken) {
      try {
        const res = await fetch(`/api/admin/trainings/${training.id}/questions`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        const data = await res.json();
        if (data.success) {
          setQuestions(data.questions);
        } else if (res.status === 401) {
          localStorage.removeItem("admin_token");
          router.push("/admin/login");
        }
      } catch (err) {
        console.error("Failed to fetch questions:", err);
      }
    }

    setView("edit");
    setActiveTab("metadata");
  };

  const handleUpdateMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !selectedTraining) return;

    try {
      setSaving(true);
      const res = await fetch("/api/admin/trainings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          id: selectedTraining.id,
          ...editData,
          price: parseInt(editData.price) || 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setTrainings((prev) =>
          prev.map((t) => (t.id === selectedTraining.id ? { ...t, ...data.training } : t))
        );
        setSelectedTraining(data.training);
        alert("Training updated successfully");
      } else {
        alert(data.error || "Failed to update training");
      }
    } catch (error: any) {
      alert(error.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTraining = async (id: number) => {
    if (!confirm("Are you sure you want to delete this training?")) return;
    if (!adminToken) return;

    try {
      const res = await fetch(`/api/admin/trainings?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setTrainings((prev) => prev.filter((t) => t.id !== id));
        if (selectedTraining?.id === id) {
          setView("list");
          setSelectedTraining(null);
        }
      } else {
        alert(data.error || "Failed to delete");
      }
    } catch (error: any) {
      alert(error.message || "Error");
    }
  };

  const handleAddModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !selectedTraining) return;

    const newModuleWithId: ContentModule = {
      ...newModule,
      id: `mod_${Date.now()}`,
    };
    const updatedModules = [...modules, newModuleWithId];

    try {
      setSaving(true);
      const res = await fetch(`/api/admin/trainings/${selectedTraining.id}/content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ modules: updatedModules }),
      });

      const data = await res.json();
      if (data.success) {
        setModules(updatedModules);
        setNewModule({ title: "", type: "text", content: "" });
        // Update trainings list too
        setTrainings((prev) =>
          prev.map((t) => (t.id === selectedTraining.id ? { ...t, content: updatedModules } : t))
        );
      } else {
        alert(data.error || "Failed to add module");
      }
    } catch (error: any) {
      alert(error.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Delete this module?")) return;
    if (!adminToken || !selectedTraining) return;

    try {
      const res = await fetch(`/api/admin/trainings/${selectedTraining.id}/content?moduleId=${moduleId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setModules(data.content);
        setTrainings((prev) =>
          prev.map((t) => (t.id === selectedTraining.id ? { ...t, content: data.content } : t))
        );
      } else {
        alert(data.error || "Failed to delete module");
      }
    } catch (error: any) {
      alert(error.message || "Error");
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken || !selectedTraining) return;

    const options = [newQuestion.option0, newQuestion.option1, newQuestion.option2, newQuestion.option3];

    try {
      setSaving(true);
      const res = await fetch(`/api/admin/trainings/${selectedTraining.id}/questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          question: newQuestion.question,
          options,
          correctAnswer: newQuestion.correctAnswer,
          explanation: newQuestion.explanation,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setQuestions((prev) => [...prev, data.question]);
        setNewQuestion({
          question: "",
          option0: "",
          option1: "",
          option2: "",
          option3: "",
          correctAnswer: 0,
          explanation: "",
        });
      } else {
        alert(data.error || "Failed to add question");
      }
    } catch (error: any) {
      alert(error.message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm("Delete this question?")) return;
    if (!adminToken || !selectedTraining) return;

    try {
      const res = await fetch(`/api/admin/trainings/${selectedTraining.id}/questions?questionId=${questionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      } else {
        alert(data.error || "Failed to delete question");
      }
    } catch (error: any) {
      alert(error.message || "Error");
    }
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
              <span className="text-xl font-bold text-gray-900">Bright Academy Admin</span>
            </div>
            <Link href="/dashboard" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* LIST VIEW */}
        {view === "list" && (
          <>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-gray-900">Trainings</h2>
              <button
                onClick={() => setView("create")}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Training</span>
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modules</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {trainings.map((training) => (
                    <tr key={training.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-blue-600">{training.code}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{training.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">KES {training.price}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{training.level}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          training.status === "active"
                            ? "text-green-700 bg-green-100"
                            : "text-gray-700 bg-gray-100"
                        }`}>
                          {training.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {(training.content || []).length}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEdit(training)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit & Manage"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTraining(training.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {trainings.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>No trainings yet. Click Add Training to create one.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* CREATE VIEW */}
        {view === "create" && (
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setView("list")}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back to list
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">New Training</h3>
              <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Title"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Code (e.g. ECCD-001)"
                  required
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <textarea
                  placeholder="Description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none md:col-span-2 resize-none"
                />
                <input
                  type="number"
                  placeholder="Price (KES)"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <input
                  type="text"
                  placeholder="Duration (e.g. 5 days)"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
                <select
                  value={formData.level}
                  onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
                <div className="flex space-x-3 md:col-span-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>Create & Add Content</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("list")}
                    className="px-6 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT VIEW */}
        {view === "edit" && selectedTraining && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setView("list")}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Back to list
              </button>
              <h2 className="text-lg font-bold text-gray-900">
                {selectedTraining.code} — {selectedTraining.title}
              </h2>
              <div className="w-24" />
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg mb-6 w-fit">
              {[
                { key: "metadata" as Tab, label: "Metadata", icon: FileText },
                { key: "content" as Tab, label: "Content Modules", icon: BookOpen },
                { key: "questions" as Tab, label: "Exam Questions", icon: FileQuestion },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* METADATA TAB */}
            {activeTab === "metadata" && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Training Details</h3>
                <form onSubmit={handleUpdateMetadata} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Title"
                    required
                    value={editData.title}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Code"
                    required
                    value={editData.code}
                    onChange={(e) => setEditData({ ...editData, code: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <textarea
                    placeholder="Description"
                    rows={3}
                    value={editData.description}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none md:col-span-2 resize-none"
                  />
                  <input
                    type="number"
                    placeholder="Price (KES)"
                    required
                    value={editData.price}
                    onChange={(e) => setEditData({ ...editData, price: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Duration"
                    value={editData.duration}
                    onChange={(e) => setEditData({ ...editData, duration: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                  <select
                    value={editData.level}
                    onChange={(e) => setEditData({ ...editData, level: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                  <div className="flex space-x-3 md:col-span-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>Save Changes</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* CONTENT MODULES TAB */}
            {activeTab === "content" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add Module Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Content Module</h3>
                  <form onSubmit={handleAddModule} className="space-y-4">
                    <input
                      type="text"
                      placeholder="Module Title"
                      required
                      value={newModule.title}
                      onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                    <select
                      value={newModule.type}
                      onChange={(e) => setNewModule({ ...newModule, type: e.target.value as "text" | "video" | "document" })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    >
                      <option value="text">Text Section</option>
                      <option value="video">Video (URL)</option>
                      <option value="document">Document (URL)</option>
                    </select>
                    {newModule.type === "text" ? (
                      <textarea
                        placeholder="Enter the text content here..."
                        rows={6}
                        required
                        value={newModule.content}
                        onChange={(e) => setNewModule({ ...newModule, content: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                      />
                    ) : (
                      <input
                        type="url"
                        placeholder={newModule.type === "video" ? "Video URL (e.g. YouTube, Vimeo)" : "Document URL"}
                        required
                        value={newModule.content}
                        onChange={(e) => setNewModule({ ...newModule, content: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      />
                    )}
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      <span>Add Module</span>
                    </button>
                  </form>
                </div>

                {/* Module List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Existing Modules ({modules.length})
                  </h3>
                  {modules.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p>No content modules yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {modules.map((mod, idx) => (
                        <div
                          key={mod.id}
                          className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          <div className="mt-0.5 text-gray-400">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                {idx + 1}
                              </span>
                              {mod.type === "text" && <FileText className="w-3.5 h-3.5 text-gray-500" />}
                              {mod.type === "video" && <Video className="w-3.5 h-3.5 text-gray-500" />}
                              {mod.type === "document" && <BookOpen className="w-3.5 h-3.5 text-gray-500" />}
                              <span className="text-xs font-medium text-gray-500 uppercase">{mod.type}</span>
                            </div>
                            <p className="text-sm font-medium text-gray-900 truncate">{mod.title}</p>
                            {mod.type === "text" ? (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{mod.content}</p>
                            ) : (
                              <p className="text-xs text-blue-600 mt-1 truncate">{mod.content}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteModule(mod.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                            title="Delete module"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* QUESTIONS TAB */}
            {activeTab === "questions" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Add Question Form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Exam Question</h3>
                  <form onSubmit={handleAddQuestion} className="space-y-4">
                    <textarea
                      placeholder="Question text"
                      rows={2}
                      required
                      value={newQuestion.question}
                      onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    />
                    <div className="grid grid-cols-1 gap-3">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            name="correct"
                            checked={newQuestion.correctAnswer === i}
                            onChange={() => setNewQuestion({ ...newQuestion, correctAnswer: i })}
                            className="w-4 h-4 text-blue-600"
                          />
                          <input
                            type="text"
                            placeholder={`Option ${String.fromCharCode(65 + i)}`}
                            required
                            value={(newQuestion as any)[`option${i}`]}
                            onChange={(e) =>
                              setNewQuestion({ ...(newQuestion as any), [`option${i}`]: e.target.value })
                            }
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                          />
                        </div>
                      ))}
                    </div>
                    <textarea
                      placeholder="Explanation (shown after answering)"
                      rows={2}
                      value={newQuestion.explanation}
                      onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      Select the radio button next to the correct answer.
                    </p>
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      <span>Add Question</span>
                    </button>
                  </form>
                </div>

                {/* Question List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Existing Questions ({questions.length})
                  </h3>
                  {questions.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <FileQuestion className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p>No questions yet. Add at least 15 for the exam.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                      {questions.map((q, idx) => (
                        <div
                          key={q.id}
                          className="p-4 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                Q{idx + 1}
                              </span>
                              {q.explanation && (
                                <span className="text-xs text-gray-400">has explanation</span>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="Delete question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-900 mb-2">{q.question}</p>
                          <div className="space-y-1">
                            {q.options.map((opt, oi) => (
                              <div
                                key={oi}
                                className={`flex items-center space-x-2 text-sm px-2 py-1 rounded ${
                                  oi === q.correctAnswer
                                    ? "bg-green-100 text-green-800"
                                    : "text-gray-600"
                                }`}
                              >
                                {oi === q.correctAnswer ? (
                                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                                ) : (
                                  <span className="w-3.5 h-3.5 flex-shrink-0 inline-block" />
                                )}
                                <span>
                                  {String.fromCharCode(65 + oi)}. {opt}
                                </span>
                              </div>
                            ))}
                          </div>
                          {q.explanation && (
                            <p className="text-xs text-gray-500 mt-2 italic">{q.explanation}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
