# RAG System - Document-Based Q&A Application

A modern Retrieval-Augmented Generation (RAG) system that allows users to upload documents and ask questions about their content using AI. Built with FastAPI backend and React frontend.

## 🌟 Features

- **Document Upload**: Support for PDF, DOCX, and TXT files
- **AI-Powered Q&A**: Ask questions about uploaded documents using Google Gemini AI
- **Modern UI**: Clean, responsive React interface with Tailwind CSS
- **Real-time Status**: Monitor system status and document processing
- **File Management**: Upload, view, and delete documents with visual feedback
- **Drag & Drop**: Easy file upload with drag and drop functionality
- **Error Handling**: Comprehensive error handling with timeout management

## 🏗️ Architecture

### Backend (`/backend`)
- **FastAPI**: High-performance API framework
- **FAISS**: Vector similarity search for document retrieval
- **LangChain**: Document processing and AI integration
- **Google Gemini API**: Large language model for generating answers
- **Sentence Transformers**: Text embeddings for semantic search

### Frontend (`/frontend`)
- **React + TypeScript**: Modern, type-safe frontend
- **Vite**: Fast development and build tool
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful icon library
- **Axios**: HTTP client with timeout handling

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- Google AI API Key

### 1. Clone Repository
```bash
git clone https://github.com/talalaslam15/rag-system.git
cd rag-system
```

### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
# Create .env file and add:
GOOGLE_API_KEY=your_google_api_key_here

# Run the API server
python api.py
```

The backend will be available at `http://localhost:8000`

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 📁 Project Structure

```
rag-system/
├── backend/
│   ├── api.py              # FastAPI web server
│   ├── index.py            # RAG system implementation
│   ├── rag-chromadb.py     # Alternative ChromaDB implementation
│   ├── requirements.txt    # Python dependencies
│   ├── docs/              # Document upload directory
│   └── venv/              # Python virtual environment
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.tsx    # Chat UI component
│   │   │   ├── FileManager.tsx      # File upload/management
│   │   │   └── StatusBar.tsx        # System status display
│   │   ├── App.tsx         # Main application
│   │   └── main.tsx        # Application entry point
│   ├── package.json        # Node.js dependencies
│   └── vite.config.ts      # Vite configuration
└── README.md              # This file
```

## 🔧 API Endpoints

### Document Management
- `POST /upload` - Upload multiple files
- `GET /files` - List all uploaded files
- `DELETE /files/{filename}` - Delete a specific file
- `POST /clear-files` - Clear all uploaded files

### RAG System
- `POST /query` - Ask questions about documents
- `GET /status` - Get system status
- `POST /reinitialize` - Reinitialize the RAG system

### System
- `GET /health` - Health check
- `GET /` - API information

## 💡 Usage

1. **Upload Documents**: Drag and drop or click to upload PDF, DOCX, or TXT files
2. **Wait for Processing**: System will process documents and build vector embeddings
3. **Ask Questions**: Type questions about your documents in the chat interface
4. **Get AI Responses**: Receive contextual answers based on document content

## 🔧 Configuration

### Environment Variables
- `GOOGLE_API_KEY`: Required for Google Gemini AI integration
- `UPLOAD_DIR`: Directory for document storage (default: "docs")
- `MAX_FILE_SIZE`: Maximum file size in bytes (default: 50MB)

### Supported File Types
- PDF documents (.pdf)
- Word documents (.docx)
- Text files (.txt)

## 🚧 Known Limitations

- Large document processing can take time due to vector store rebuilding
- API calls may timeout for very large documents (60-second timeout)
- Currently supports only Google Gemini AI model

## 🔮 Pending Features

### 📋 Roadmap
- [ ] **Chat History**: Maintain conversation history across sessions
- [ ] **Multi-Model Support**: Add support for additional LLM providers
  - [ ] OpenAI GPT models
  - [ ] Anthropic Claude
  - [ ] Local models (Ollama)
- [ ] **Advanced Features**:
  - [ ] Document chunking strategies
  - [ ] Metadata filtering
  - [ ] Source attribution in responses
  - [ ] Export chat history
  - [ ] User authentication
  - [ ] Document collections/folders

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

**API Timeouts**
- Increase timeout values in frontend API clients
- Check server logs for processing errors
- Ensure documents aren't too large

**Document Processing Errors**
- Verify file format is supported
- Check file isn't corrupted
- Ensure sufficient disk space

**Connection Issues**
- Verify backend is running on port 8000
- Check CORS settings
- Ensure Google API key is valid

### Getting Help

1. Check the [Issues](https://github.com/talalaslam15/rag-system/issues) page
2. Review server logs in terminal
3. Check browser console for frontend errors

## 🏷️ Version History

- **v1.0.0** - Initial release with basic RAG functionality
- Features: Document upload, AI Q&A, file management, modern UI

---

Built with ❤️ using FastAPI, React, and AI technologies.
