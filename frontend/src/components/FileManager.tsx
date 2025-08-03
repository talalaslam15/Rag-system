import { useState, useEffect, useRef } from "react";
import {
  Upload,
  File,
  Trash2,
  X,
  FileText,
  FileImage,
  AlertCircle,
} from "lucide-react";
import axios from "axios";

interface FileInfo {
  filename: string;
  size: number;
  upload_date: string;
  file_type: string;
}

interface FileManagerProps {
  onFilesChanged: () => void;
}

export default function FileManager({ onFilesChanged }: FileManagerProps) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFiles = async () => {
    try {
      const response = await axios.get("http://localhost:8000/files");
      setFiles(response.data.files);
    } catch (error) {
      console.error("Error loading files:", error);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "PDF":
        return <FileImage className="w-4 h-4 text-red-500" />;
      case "Word Document":
        return <FileText className="w-4 h-4 text-blue-500" />;
      case "Text File":
        return <File className="w-4 h-4 text-gray-500" />;
      default:
        return <File className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleFileUpload = async (uploadFiles: FileList) => {
    if (!uploadFiles.length) return;

    setUploading(true);
    const formData = new FormData();

    Array.from(uploadFiles).forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await axios.post(
        "http://localhost:8000/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.failed_files?.length > 0) {
        alert(
          `Some files failed to upload:\n${response.data.failed_files.join(
            "\n"
          )}`
        );
      }

      await loadFiles();
      onFilesChanged();
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Error uploading files. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteFile = async (filename: string) => {
    if (!confirm(`Delete ${filename}?`)) return;

    try {
      await axios.delete(`http://localhost:8000/files/${filename}`);
      await loadFiles();
      onFilesChanged();
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Error deleting file. Please try again.");
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Delete all files? This cannot be undone.")) return;

    try {
      await axios.post("http://localhost:8000/clear-files");
      await loadFiles();
      onFilesChanged();
    } catch (error) {
      console.error("Error clearing files:", error);
      alert("Error clearing files. Please try again.");
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
        {files.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.txt"
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
        />

        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-600 mb-2">
          Drag & drop files here, or{" "}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-600 hover:text-blue-700 font-medium"
            disabled={uploading}
          >
            browse
          </button>
        </p>
        <p className="text-xs text-gray-500">PDF, DOCX, TXT files up to 50MB</p>

        {uploading && (
          <div className="mt-3 flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Uploading...</span>
          </div>
        )}
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Uploaded Files ({files.length})
          </h3>
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.filename}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {getFileIcon(file.file_type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.filename}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {file.file_type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteFile(file.filename)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title={`Delete ${file.filename}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {files.length === 0 && !uploading && (
        <div className="mt-6 text-center">
          <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No documents uploaded yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Upload some documents to start asking questions
          </p>
        </div>
      )}
    </div>
  );
}
