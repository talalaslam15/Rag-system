import os
from dotenv import load_dotenv
from langchain_community.document_loaders import DirectoryLoader, PDFMinerLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema.runnable import RunnablePassthrough
from langchain.schema.output_parser import StrOutputParser

# Load environment variables (for API keys)
load_dotenv()

class RAGSystemChroma:
    def __init__(self, docs_dir="./docs", embedding_model="all-MiniLM-L6-v2"):
        self.docs_dir = docs_dir
        self.embedding_model = embedding_model
        self.vector_store = None
        self.llm = None
        
        # Create docs directory if it doesn't exist
        os.makedirs(self.docs_dir, exist_ok=True)
        
    def load_documents(self):
        """Load documents from the docs directory"""
        print("Loading documents...")
        try:
            loader = DirectoryLoader(self.docs_dir, glob="**/*.pdf", loader_cls=PDFMinerLoader)
            documents = loader.load()
            print(f"Loaded {len(documents)} documents")
            return documents
        except Exception as e:
            print(f"Error loading documents: {e}")
            return []
    
    def split_documents(self, documents, chunk_size=1000, chunk_overlap=200):
        """Split documents into chunks"""
        print("Splitting documents into chunks...")
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
        chunks = text_splitter.split_documents(documents)
        print(f"Created {len(chunks)} chunks")
        return chunks
    
    def create_vector_store(self, chunks):
        """Create a vector store from document chunks using ChromaDB"""
        print("Creating vector embeddings...")
        embeddings = HuggingFaceEmbeddings(model_name=self.embedding_model)
        vector_store = Chroma.from_documents(chunks, embeddings, persist_directory="./chromadb_store")
        self.vector_store = vector_store
        print("Vector store created successfully")
        return vector_store
    
    def initialize_llm(self, model_name="gemini-1.5-pro"):
        """Initialize the language model"""
        print(f"Initializing Gemini LLM with {model_name}...")
        self.llm = ChatGoogleGenerativeAI(model=model_name)
        
    def setup_rag_pipeline(self):
        """Set up the RAG pipeline with retriever and prompt template"""
        if not self.vector_store:
            raise ValueError("Vector store not created. Run create_vector_store first.")
        if not self.llm:
            raise ValueError("LLM not initialized. Run initialize_llm first.")
        
        retriever = self.vector_store.as_retriever(search_kwargs={"k": 3})
        
        template = """Answer the question based only on the following context:
        {context}
        
        Question: {question}

        Important: Include the relevant source document file names and page numbers in your answer.

        Answer:"""
        
        prompt = ChatPromptTemplate.from_template(template)
        
        # Create the RAG pipeline
        rag_chain = (
            {"context": retriever, "question": RunnablePassthrough()}
            | prompt
            | self.llm
            | StrOutputParser()
        )
        
        return rag_chain
        
    def process_query(self, query, rag_chain=None):
        """Process a query through the RAG system"""
        if not rag_chain:
            rag_chain = self.setup_rag_pipeline()
        
        print(f"Processing query: {query}")
        response = rag_chain.invoke(query)
        return response
        
    def build_rag_system(self, model_name="gemini-1.5-pro"):
        """Complete pipeline to build the RAG system"""
        documents = self.load_documents()
        if not documents:
            print("No documents found. Please add text files to the docs directory.")
            return None
            
        chunks = self.split_documents(documents)
        self.create_vector_store(chunks)
        self.initialize_llm(model_name)
        rag_chain = self.setup_rag_pipeline()
        return rag_chain
        
if __name__ == "__main__":
    rag = RAGSystemChroma()
    rag_chain = rag.build_rag_system()
    
    if rag_chain:
        while True:
            query = input("\nEnter your question (or 'quit' to exit): ")
            if query.lower() in ["quit", "exit", "q"]:
                break
                
            response = rag.process_query(query, rag_chain)
            print("\nResponse:")
            print(response)