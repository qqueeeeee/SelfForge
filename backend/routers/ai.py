from fastapi import APIRouter, Depends, HTTPException
from utils.productivity import get_user_productivity_data
from core.dependencies import get_db
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import glob
import os 
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_classic.chains.retrieval import create_retrieval_chain
from langchain_community.document_loaders import TextLoader
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from schemas.ai import AskResponse, AskRequest



NOTES_DIR = os.getenv("NOTES_DIR", "notes")
FAISS_DIR = "faiss_index"
vector_store = None
retriever = None


router = APIRouter()

def load_vector_store():
    """Lazy load vector store only when needed"""
    global vector_store, retriever

    if vector_store is not None:
        return vector_store

    try:
        from langchain_huggingface import HuggingFaceEmbeddings

        print("Initializing vector store...")
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )

        if os.path.exists(FAISS_DIR):
            vector_store = FAISS.load_local(
                FAISS_DIR,
                embeddings,
                allow_dangerous_deserialization=True,
            )
        else:
            documents = []
            if os.path.exists(NOTES_DIR):
                for path in glob.glob(f"{NOTES_DIR}/**/*.md", recursive=True):
                    documents.extend(TextLoader(path, encoding="utf-8").load())

            if not documents:
                print("No notes found, creating empty index")
                vector_store = FAISS.from_texts(["Empty knowledge base"], embeddings)
            else:
                splitter = RecursiveCharacterTextSplitter(
                    chunk_size=1000,
                    chunk_overlap=200,
                )
                splits = splitter.split_documents(documents)
                vector_store = FAISS.from_documents(splits, embeddings)
                vector_store.save_local(FAISS_DIR)

        retriever = vector_store.as_retriever(search_kwargs={"k": 5})
        print("✅ Vector store initialized")
        return vector_store
    except Exception as e:
        print(f"⚠️ Vector store initialization failed: {e}")
        return None

groq_api_key = os.getenv("GROQ_API_KEY")
ai_enabled = bool(groq_api_key)

if ai_enabled:
    try:
        llm = ChatGroq(
                api_key=groq_api_key, #type: ignore
            model="llama-3.1-8b-instant",
        )

        prompt = PromptTemplate.from_template(
            """
You are a personal productivity and self-improvement assistant with access to the user's comprehensive productivity data.

Recent productivity data (last 30 days):
{productivity_data}

Relevant notes from knowledge base:
{context}

User question:
{input}

Instructions:
- Analyze patterns in tasks, habits, goals, and timer sessions
- Provide actionable insights based on the data
- Suggest improvements for productivity and well-being
- Be specific and reference actual data points
- Offer practical next steps
- Be encouraging but honest about areas for improvement
"""
        )

        # Initialize vector store only when AI is enabled
        load_vector_store()

        if retriever is not None:
            document_chain = create_stuff_documents_chain(llm, prompt)
            rag_chain = create_retrieval_chain(retriever, document_chain)
            print("✅ AI features with knowledge base enabled")
        else:
            # Fallback to simple LLM without RAG
            rag_chain = None
            print("✅ AI features enabled (without knowledge base)")
    except Exception as e:
        print(f"⚠️ AI initialization failed: {e}")
        ai_enabled = False
        rag_chain = None
else:
    print("⚠️ GROQ_API_KEY not found - AI features disabled")
    rag_chain = None




@router.post("/ask", response_model=AskResponse)
def ask_ai(req: AskRequest, db: Session = Depends(get_db)):
    """ask the ai assistant with access to productivity data"""
    if not ai_enabled or not rag_chain:
        return AskResponse(
            response="ai features are currently disabled. please set groq_api_key environment variable to enable ai assistance.",
            context_used=req.include_context,
            timestamp=datetime.now(timezone.utc),
        )

    try:
        # get user's productivity data for context
        productivity_data = get_user_productivity_data(db, days=30)

        if rag_chain is not None:
            # use rag chain with knowledge base
            result = rag_chain.invoke(
                {
                    "input": req.question,
                    "productivity_data": productivity_data,
                }
            )
            response_text = result["answer"]
        else:
            # fallback to direct llm call without knowledge base
            prompt_text = f"""
you are a personal productivity assistant.

user's productivity data:
{productivity_data}

question: {req.question}

provide helpful insights based on the data above.
"""
            response_text = f"based on your productivity data, here's my analysis: {req.question}. (note: knowledge base unavailable, providing basic response.)"

        return AskResponse(
            response=response_text,
            context_used=req.include_context,
            timestamp=datetime.now(timezone.utc),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ai processing error: {str(e)}")


@router.post("/ask", response_model=AskResponse)
def ask(req: AskRequest):
    answer = ask_ai(req)
    return {"response": answer}


