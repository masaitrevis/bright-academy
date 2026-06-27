"use client";

import { useState } from "react";
import { X, Loader2, FileText, AlertTriangle } from "lucide-react";

interface FileViewerProps {
  url: string;
  fileName?: string;
  fileType?: string;
  onClose: () => void;
}

export default function FileViewer({ url, fileName, fileType, onClose }: FileViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const isPdf = fileType === "application/pdf";
  const isOffice = fileType?.includes("presentation") || fileType?.includes("word");

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#1e293b] rounded-xl w-full max-w-5xl h-[90vh] flex flex-col border border-[#334155] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#334155]">
          <div className="flex items-center space-x-3">
            <FileText className="w-5 h-5 text-[#d4af37]" />
            <span className="text-sm font-medium text-white truncate max-w-md">
              {fileName || "Document"}
            </span>
            {isPdf && (
              <span className="text-xs bg-[#d4af37]/10 text-[#d4af37] px-2 py-0.5 rounded-full">PDF</span>
            )}
            {isOffice && (
              <span className="text-xs bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded-full">Office</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-[#334155] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[#94a3b8]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 relative overflow-hidden bg-[#0f172a]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#d4af37] mx-auto mb-3" />
                <p className="text-sm text-[#94a3b8]">Loading document...</p>
              </div>
            </div>
          )}

          {isOffice && (
            <div className="absolute top-0 left-0 right-0 bg-orange-500/10 border-b border-orange-500/20 p-3">
              <div className="flex items-center space-x-2 text-orange-400 text-sm">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>
                  PowerPoint/Word documents require a desktop viewer. The file will open in your browser's default application.
                </span>
              </div>
            </div>
          )}

          <iframe
            src={url}
            className={`w-full h-full border-0 ${isOffice ? "mt-14" : ""}`}
            onLoad={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setError(true);
            }}
            title={fileName || "Document"}
          />

          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <p className="text-sm text-red-400">Failed to load document</p>
                <p className="text-xs text-[#64748b] mt-1">Try refreshing the page</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
