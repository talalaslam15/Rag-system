import { RefreshCw } from "lucide-react";
import "./StatusBar.css";

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
  const getStatusColor = () => {
    switch (status.status) {
      case "ready":
        return "status-ready";
      case "error":
        return "status-error";
      case "initializing":
        return "status-initializing";
      default:
        return "status-checking";
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

  return (
    <div className={`status-bar ${getStatusColor()}`}>
      <div className="status-content">
        <span className="status-icon">{getStatusIcon()}</span>
        <span className="status-text">
          {status.status === "ready"
            ? `System Ready • ${status.documents_loaded} documents loaded`
            : status.message}
        </span>
      </div>
      <button
        className="refresh-button"
        onClick={onRefresh}
        title="Refresh status"
      >
        <RefreshCw size={16} />
      </button>
    </div>
  );
}
