from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn
from index import RAGSystem
import os

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

if __name__ == "__main__":
    # Run the server
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
