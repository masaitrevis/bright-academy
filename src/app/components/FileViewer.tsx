"use client";

import { useState, useEffect } from "react";
import { X, Loader2, FileText, AlertTriangle, FileSpreadsheet } from "lucide-react";

interface FileViewerProps {
  url: string;
  fileName?: string;
  fileType?: string;
  onClose: () => void;
}

export default function FileViewer({ url, fileName, fileType, onClose }: FileViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const isPdf = fileType === "application/pdf";
  const isOffice = fileType?.includes("presentation") || fileType?.includes("word") || fileType?.includes("officedocument");

  useEffect(() => {
    let objectUrl: string | null = null;

    const fetchFile = async () => {
      try {
        setLoading(true);
        setError(false);

        const res = await fetch(url);
        if (!res.ok) throw new Error("Failed to load file");

        const blob = await res.blob();
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
        setLoading(false);
      } catch (err) {
        console.error("File load error:", err);
        setError(true);
        setLoading(false);
      }
    };

    fetchFile();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

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

          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <p className="text-sm text-red-400">Failed to load document</p>
                <p className="text-xs text-[#64748b] mt-1">Try refreshing the page</p>
              </div>
            </div>
          )}

          {/* PDF: embed with toolbar hidden — forces inline viewing, no download button */}
          {blobUrl && isPdf && !error && (
            <embed
              src={`${blobUrl}#toolbar=0&navpanes=0&scrollbar=1`}
              type="application/pdf"
              width="100%"
              height="100%"
              className="border-0"
              title={fileName || "PDF Document"}
              onLoad={() => setLoading(false)}
            />
          )}

          {/* Office docs: cannot be rendered inline securely in browsers */}
          {blobUrl && isOffice && !error && (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="bg-[#1e293b] border border-orange-500/30 rounded-xl p-8 max-w-md text-center">
                <FileSpreadsheet className="w-12 h-12 text-orange-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  View-Only Not Available
                </h3>
                <p className="text-sm text-[#94a3b8] mb-4">
                  PowerPoint and Word files cannot be displayed securely in a web browser.
                  Browsers automatically download these file types instead of showing them inline.
                </p>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-4">
                  <p className="text-sm text-orange-300 font-medium mb-1">
                    For View-Only Training Materials:
                  </p>
                  <p className="text-sm text-[#94a3b8]">
                    Please convert this document to <strong className="text-white">PDF format</strong> and re-upload it.
                    PDFs can be displayed inline without downloading.
                  </p>
                </div>
                <p className="text-xs text-[#64748b]">
                  This protects your paid training content from being downloaded.
                </p>
              </div>
            </div>
          )}

          {/* Fallback for unknown file types */}
          {blobUrl && !isPdf && !isOffice && !error && (
            <div className="absolute inset-0 flex items-center justify-center p-8">
              <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-8 max-w-md text-center">
                <AlertTriangle className="w-12 h-12 text-[#94a3b8] mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  Unsupported File Type
                </h3>
                <p className="text-sm text-[#94a3b8]">
                  This file type cannot be displayed. Please upload PDF files for view-only training materials.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
