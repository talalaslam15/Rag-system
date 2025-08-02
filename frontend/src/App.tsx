import { useState, useEffect } from "react";
import ChatInterface from "./components/ChatInterface";
import StatusBar from "./components/StatusBar";
import "./App.css";

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
    <div className="app">
      <StatusBar status={systemStatus} onRefresh={checkStatus} />
      <ChatInterface systemStatus={systemStatus} />
    </div>
  );
}

export default App;
