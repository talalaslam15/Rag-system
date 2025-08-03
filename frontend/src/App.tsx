import { useState, useEffect } from "react";
import ChatInterface from "./components/ChatInterface";
import StatusBar from "./components/StatusBar";
import FileManager from "./components/FileManager";

interface SystemStatus {
  status: string;
  message: string;
  documents_loaded: number;
  vector_store_ready: boolean;
}

function App() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    status: "checking",
    message: "Checking system status...",
    documents_loaded: 0,
    vector_store_ready: false,
  });

  const checkStatus = async () => {
    try {
      const response = await fetch("http://localhost:8000/status");
      const data = await response.json();
      setSystemStatus(data);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      setSystemStatus({
        status: "error",
        message: "Unable to connect to API",
        documents_loaded: 0,
        vector_store_ready: false,
      });
    }
  };

  useEffect(() => {
    checkStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <StatusBar status={systemStatus} onRefresh={checkStatus} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
          <div className="lg:col-span-1">
            <FileManager onFilesChanged={checkStatus} />
          </div>
          <div className="lg:col-span-3">
            <ChatInterface systemStatus={systemStatus} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
