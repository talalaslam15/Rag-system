import { useState, useRef, useEffect } from "react";
import { Send, Loader } from "lucide-react";
import axios from "axios";
import "./ChatInterface.css";

interface SystemStatus {
  status: string;
  message: string;
  documents_loaded: number;
  vector_store_ready: boolean;
}

interface Message {
  id: string;
  type: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  systemStatus: SystemStatus;
}

const EXAMPLE_QUERIES = [
  "What is the main topic discussed in the documents?",
  "Can you summarize the key points from the Microsoft annual report?",
  "What are the main concepts covered in You Don't Know JS Yet?",
];

export default function ChatInterface({ systemStatus }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (question: string) => {
    if (!question.trim() || isLoading) return;
    if (systemStatus.status !== "ready") {
      addMessage(
        "system",
        "System is not ready. Please wait for initialization to complete."
      );
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await axios.post("http://localhost:8000/query", {
        question: question,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: response.data.answer,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: unknown) {
      console.error("Error processing query:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "system",
        content:
          "Sorry, there was an error processing your question. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const addMessage = (type: "system", content: string) => {
    const message: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(inputValue);
    }
  };

  const handleExampleClick = (query: string) => {
    setInputValue(query);
    textareaRef.current?.focus();
  };

  return (
    <div className="chat-interface">
      {messages.length === 0 && (
        <div className="welcome-section">
          <div className="welcome-content">
            <h1>🤖 RAG System Chat</h1>
            <p>
              Ask questions about your documents and get AI-powered answers with
              source references.
            </p>

            <div className="example-queries">
              <h3>Try these example queries:</h3>
              <div className="example-grid">
                {EXAMPLE_QUERIES.map((query, index) => (
                  <button
                    key={index}
                    className="example-query"
                    onClick={() => handleExampleClick(query)}
                    disabled={systemStatus.status !== "ready"}
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className={`message message-${message.type}`}>
            <div className="message-content">
              <div className="message-text">{message.content}</div>
              <div className="message-timestamp">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message message-assistant">
            <div className="message-content">
              <div className="typing-indicator">
                <Loader className="spinner" size={16} />
                <span>Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleInputSubmit} className="input-form">
        <div className="input-container">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              systemStatus.status === "ready"
                ? "Ask a question about your documents..."
                : "Waiting for system to be ready..."
            }
            disabled={systemStatus.status !== "ready" || isLoading}
            rows={1}
            className="message-input"
          />
          <button
            type="submit"
            disabled={
              !inputValue.trim() || systemStatus.status !== "ready" || isLoading
            }
            className="send-button"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
