import { RefreshCw } from "lucide-react";

interface SystemStatus {
  status: string;
  message: string;
  documents_loaded: number;
  vector_store_ready: boolean;
}

interface StatusBarProps {
  status: SystemStatus;
  onRefresh: () => void;
}

export default function StatusBar({ status, onRefresh }: StatusBarProps) {
  const getStatusStyles = () => {
    switch (status.status) {
      case "ready":
        return "bg-gradient-to-r from-green-500 to-emerald-600 text-white";
      case "error":
        return "bg-gradient-to-r from-red-500 to-rose-600 text-white";
      case "initializing":
        return "bg-gradient-to-r from-amber-500 to-orange-600 text-white";
      default:
        return "bg-gradient-to-r from-gray-500 to-slate-600 text-white";
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case "ready":
        return "✅";
      case "error":
        return "❌";
      case "initializing":
        return "⏳";
      default:
        return "🔄";
    }
  };

  const getStatusText = () => {
    if (status.status === "ready") {
      return `System Ready • ${status.documents_loaded} documents loaded`;
    }
    return status.message;
  };

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl shadow-sm transition-all duration-200 ${getStatusStyles()}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">{getStatusIcon()}</span>
        <span className="font-medium">{getStatusText()}</span>
      </div>
      <button
        onClick={onRefresh}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
        title="Refresh status"
      >
        <RefreshCw className="w-4 h-4" />
      </button>
    </div>
  );
}
