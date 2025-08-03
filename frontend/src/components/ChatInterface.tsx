import { useState, useRef, useEffect } from "react";
import { Send, Loader } from "lucide-react";
import axios from "axios";

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
  "Can you summarize the key points from the uploaded documents?",
  "What are the main concepts covered in the documents?",
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[calc(100vh-200px)]">
      {messages.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="text-4xl mb-4">🤖</div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              RAG System Chat
            </h1>
            <p className="text-gray-600 mb-6">
              Ask questions about your documents and get AI-powered answers with
              source references.
            </p>

            {systemStatus.documents_loaded > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-gray-700">
                  Try these example queries:
                </h3>
                <div className="space-y-2">
                  {EXAMPLE_QUERIES.map((query, index) => (
                    <button
                      key={index}
                      className="w-full p-3 text-left text-sm bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleExampleClick(query)}
                      disabled={systemStatus.status !== "ready"}
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {systemStatus.documents_loaded === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800 text-sm">
                  📄 Upload some documents first to start asking questions
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-2xl ${
                message.type === "user"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-md"
                  : message.type === "assistant"
                  ? "bg-gray-50 border border-gray-200 text-gray-900 rounded-bl-md"
                  : "bg-amber-50 border border-amber-200 text-amber-800 mx-auto"
              }`}
            >
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.content}
              </div>
              <div
                className={`text-xs mt-2 ${
                  message.type === "user"
                    ? "text-blue-100"
                    : message.type === "assistant"
                    ? "text-gray-500"
                    : "text-amber-600"
                }`}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl rounded-bl-md">
              <div className="flex items-center gap-2 text-gray-600">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm italic">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleInputSubmit}
        className="p-6 border-t border-gray-200"
      >
        <div className="flex gap-3 items-end">
          <div className="flex-1">
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
              className="w-full p-4 border-2 border-gray-200 rounded-2xl resize-none focus:border-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
              style={{ minHeight: "56px", maxHeight: "120px" }}
            />
          </div>
          <button
            type="submit"
            disabled={
              !inputValue.trim() || systemStatus.status !== "ready" || isLoading
            }
            className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full flex items-center justify-center hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
