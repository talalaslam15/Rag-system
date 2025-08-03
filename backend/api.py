from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
import os
from pathlib import Path
import uuid
from datetime import datetime
from index import RAGSystem

# Initialize FastAPI app
app = FastAPI(
    title="RAG System API",
    description="A Retrieval-Augmented Generation system using Google Gemini API",
    version="1.0.0"
)

# Add CORS middleware to allow frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global RAG system instance
rag_system = None
rag_chain = None

# Pydantic models for request/response
class QueryRequest(BaseModel):
    question: str
    model_name: Optional[str] = "gemini-2.5-pro"

class QueryResponse(BaseModel):
    question: str
    answer: str
    status: str

class SystemStatus(BaseModel):
    status: str
    message: str
    documents_loaded: int
    vector_store_ready: bool

class FileInfo(BaseModel):
    filename: str
    size: int
    upload_date: str
    file_type: str

class UploadResponse(BaseModel):
    status: str
    message: str
    uploaded_files: List[FileInfo]
    failed_files: List[str]

@app.on_event("startup")
async def startup_event():
    """Initialize the RAG system on startup"""
    global rag_system, rag_chain
    
    try:
        print("Initializing RAG system...")
        rag_system = RAGSystem()
        print("RAGSystem instance created")
        
        print("Building RAG system...")
        rag_chain = rag_system.build_rag_system()
        print("RAG system build completed")
        
        if rag_chain:
            print("RAG system initialized successfully!")
        else:
            print("Warning: No documents found in the docs directory")
    except Exception as e:
        print(f"Error initializing RAG system: {e}")
        import traceback
        traceback.print_exc()

@app.get("/", response_model=dict)
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Welcome to the RAG System API",
        "docs": "/docs",
        "status": "/status",
        "query": "/query"
    }

@app.get("/status", response_model=SystemStatus)
async def get_status():
    """Get the current status of the RAG system"""
    global rag_system, rag_chain
    
    print(f"Status check - rag_system: {rag_system is not None}, rag_chain: {rag_chain is not None}")
    
    if not rag_system:
        return SystemStatus(
            status="initializing",
            message="RAG system is still initializing",
            documents_loaded=0,
            vector_store_ready=False
        )
    
    try:
        # Check if documents are loaded
        docs_dir = rag_system.docs_dir
        pdf_files = [f for f in os.listdir(docs_dir) if f.endswith('.pdf')] if os.path.exists(docs_dir) else []
        
        return SystemStatus(
            status="ready" if rag_chain else "no_documents",
            message="RAG system is ready" if rag_chain else "No documents found in docs directory",
            documents_loaded=len(pdf_files),
            vector_store_ready=rag_system.vector_store is not None if rag_system else False
        )
    except Exception as e:
        print(f"Error in status check: {e}")
        return SystemStatus(
            status="error",
            message=f"Error checking status: {str(e)}",
            documents_loaded=0,
            vector_store_ready=False
        )

@app.post("/query", response_model=QueryResponse)
async def process_query(request: QueryRequest):
    """Process a query through the RAG system"""
    global rag_system, rag_chain
    
    if not rag_system or not rag_chain:
        raise HTTPException(
            status_code=503, 
            detail="RAG system not initialized or no documents available"
        )
    
    try:
        # Process the query
        answer = rag_system.process_query(request.question, rag_chain)
        
        return QueryResponse(
            question=request.question,
            answer=answer,
            status="success"
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing query: {str(e)}"
        )

@app.post("/reinitialize")
async def reinitialize_system():
    """Reinitialize the RAG system (useful when new documents are added)"""
    global rag_system, rag_chain
    
    try:
        print("Reinitializing RAG system...")
        rag_system = RAGSystem()
        rag_chain = rag_system.build_rag_system()
        
        if rag_chain:
            return {"status": "success", "message": "RAG system reinitialized successfully"}
        else:
            return {"status": "warning", "message": "RAG system reinitialized but no documents found"}
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error reinitializing system: {str(e)}"
        )

@app.get("/health")
async def health_check():
    """Simple health check endpoint"""
    return {"status": "healthy", "service": "RAG System API"}

# File upload and management endpoints
ALLOWED_EXTENSIONS = {'.pdf', '.docx', '.txt'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
UPLOAD_DIR = "docs"

def get_file_type(filename: str) -> str:
    """Get file type from extension"""
    ext = Path(filename).suffix.lower()
    if ext == '.pdf':
        return 'PDF'
    elif ext == '.docx':
        return 'Word Document'
    elif ext == '.txt':
        return 'Text File'
    return 'Unknown'

def is_allowed_file(filename: str) -> bool:
    """Check if file extension is allowed"""
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS

def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal"""
    # Remove path components and invalid characters
    filename = Path(filename).name
    # Generate unique filename to avoid conflicts
    name, ext = os.path.splitext(filename)
    unique_id = str(uuid.uuid4())[:8]
    return f"{name}_{unique_id}{ext}"

@app.post("/upload", response_model=UploadResponse)
async def upload_files(files: List[UploadFile] = File(...)):
    """Upload multiple files to the RAG system"""
    global rag_system, rag_chain
    
    # Ensure upload directory exists
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    
    uploaded_files = []
    failed_files = []
    
    for file in files:
        try:
            # Validate file
            if not file.filename:
                failed_files.append("Empty filename")
                continue
                
            if not is_allowed_file(file.filename):
                failed_files.append(f"{file.filename}: Unsupported file type")
                continue
            
            # Check file size
            content = await file.read()
            if len(content) > MAX_FILE_SIZE:
                failed_files.append(f"{file.filename}: File too large (max 50MB)")
                continue
            
            # Save file
            safe_filename = sanitize_filename(file.filename)
            file_path = os.path.join(UPLOAD_DIR, safe_filename)
            
            with open(file_path, "wb") as buffer:
                buffer.write(content)
            
            # Get file info
            file_info = FileInfo(
                filename=safe_filename,
                size=len(content),
                upload_date=datetime.now().isoformat(),
                file_type=get_file_type(file.filename)
            )
            uploaded_files.append(file_info)
            
            print(f"Uploaded file: {safe_filename}")
            
        except Exception as e:
            failed_files.append(f"{file.filename}: {str(e)}")
    
    # Reinitialize RAG system if any files were uploaded
    if uploaded_files:
        try:
            print("Reinitializing RAG system with new files...")
            rag_system = RAGSystem(docs_dir=UPLOAD_DIR)
            rag_chain = rag_system.build_rag_system()
            print("RAG system reinitialized successfully")
        except Exception as e:
            print(f"Error reinitializing RAG system: {e}")
    
    return UploadResponse(
        status="success" if uploaded_files else "error",
        message=f"Uploaded {len(uploaded_files)} files successfully" if uploaded_files else "No files uploaded",
        uploaded_files=uploaded_files,
        failed_files=failed_files
    )

@app.get("/files")
async def list_files():
    """List all uploaded files"""
    if not os.path.exists(UPLOAD_DIR):
        return {"files": []}
    
    files = []
    for filename in os.listdir(UPLOAD_DIR):
        file_path = os.path.join(UPLOAD_DIR, filename)
        if os.path.isfile(file_path) and is_allowed_file(filename):
            stat = os.stat(file_path)
            files.append({
                "filename": filename,
                "size": stat.st_size,
                "upload_date": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "file_type": get_file_type(filename)
            })
    
    return {"files": files}

@app.delete("/files/{filename}")
async def delete_file(filename: str):
    """Delete a specific file"""
    global rag_system, rag_chain
    
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    try:
        os.remove(file_path)
        print(f"Deleted file: {filename}")
        
        # Reinitialize RAG system
        rag_system = RAGSystem(docs_dir=UPLOAD_DIR)
        rag_chain = rag_system.build_rag_system()
        
        return {"status": "success", "message": f"File {filename} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting file: {str(e)}")

@app.post("/clear-files")
async def clear_all_files():
    """Clear all uploaded files"""
    global rag_system, rag_chain
    
    if not os.path.exists(UPLOAD_DIR):
        return {"status": "success", "message": "No files to clear"}
    
    try:
        deleted_count = 0
        for filename in os.listdir(UPLOAD_DIR):
            file_path = os.path.join(UPLOAD_DIR, filename)
            if os.path.isfile(file_path) and is_allowed_file(filename):
                os.remove(file_path)
                deleted_count += 1
        
        # Reset RAG system
        rag_system = RAGSystem(docs_dir=UPLOAD_DIR)
        rag_chain = rag_system.build_rag_system()
        
        return {"status": "success", "message": f"Cleared {deleted_count} files"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing files: {str(e)}")

if __name__ == "__main__":
    # Run the server
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
