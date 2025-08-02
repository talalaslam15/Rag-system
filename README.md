# RAG System with Google Gemini API

This project implements a Retrieval-Augmented Generation (RAG) system using the Google Gemini API for answering user queries based on the content of PDF documents. The system processes PDF files, extracts their content, and uses a language model to provide accurate and context-aware answers, including references to the source documents (file names and page numbers).

## Features

- **PDF Document Support**: Automatically loads and processes PDF files from the `docs` directory.
- **Chunking**: Splits documents into manageable chunks for efficient retrieval.
- **Vector Store Options**:
  - **FAISS**: Creates a vector store using FAISS for fast similarity search.
  - **ChromaDB**: Creates a vector store using ChromaDB for persistent and flexible similarity search.
- **Google Gemini API**: Uses the Gemini language model for generating responses.
- **Source References**: Includes file names and page numbers in the responses for better traceability.

## Prerequisites

- Python 3.8 or higher
- Google Gemini API key

## Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd <repository-folder>
   ```

2. Create and activate a virtual environment (recommended):

   **For Windows:**

   ```powershell
   # Create virtual environment
   python -m venv venv

   # Activate virtual environment
   .\venv\Scripts\Activate.ps1
   ```

   **For macOS/Linux:**

   ```bash
   # Create virtual environment
   python -m venv venv

   # Activate virtual environment
   source venv/bin/activate
   ```

3. Install the required dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Set up your environment variables:
   - Create a `.env` file in the root directory.
   - Add your Google Gemini API key:
     ```
     GOOGLE_API_KEY=your_api_key_here
     ```

## Usage

# FAISS-based RAG System

1. Place your PDF files in the `docs` directory.

2. Run the script:

   ```bash
   python index.py
   ```

3. Enter your queries in the terminal. The system will provide answers along with references to the source documents.

4. To exit, type `quit` or `exit`.

# ChromaDB-based RAG System

- same as above, just in step 2, run the following command instead:
  ```bash
  python rag-chromadb.py
  ```

## Project Structure

- `index.py`: Main script containing the RAG system implementation using FAISS.
- `rag-chromadb.py`: Main script for the ChromaDB-based RAG system.
- `docs/`: Directory to store PDF files for processing.
- `.env`: Environment file for storing API keys.
- `requirements.txt`: List of dependencies.

## Key Components

### RAGSystem Class

- **`load_documents`**: Loads PDF files from the `docs` directory.
- **`split_documents`**: Splits documents into smaller chunks for processing.
- **`create_vector_store`**: Creates a FAISS or ChromaDB
  vector store for similarity search.
- **`initialize_llm`**: Initializes the Google Gemini language model.
- **`setup_rag_pipeline`**: Sets up the RAG pipeline with retriever and prompt template.
- **`process_query`**: Processes user queries and generates responses.

## Example Query

After running the script, you can ask questions like:

```
Enter your question: What is the main topic of "You Don't Know JS Yet"?

Response:
The main topic of "You Don't Know JS Yet" is JavaScript fundamentals and advanced concepts. [Source: You Dont Know JS Yet Get Started (Kyle Simpson) (Z-Library).pdf, Page: 12]
```

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments

- [LangChain](https://github.com/hwchase17/langchain) for the RAG framework.
- [Google Gemini API](https://aistudio.google.com/) for the language model.
- [FAISS](https://github.com/facebookresearch/faiss) for vector similarity search.
