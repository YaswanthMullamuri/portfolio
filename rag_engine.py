"""
RAG Engine — LangChain 1.x + ChromaDB
Currently configured for Claude (Anthropic) only.
"""

import os
import json
from datetime import datetime
from pathlib import Path

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough


# ── Monthly token budget (soft cap) ──────────────────────────────────────────
TOKEN_BUDGET = {
    "claude": 500_000,    # ~$0.15/month at Haiku pricing (~7000+ conversations)
}
USAGE_FILE = Path("token_usage.json")


def _get_usage() -> dict:
    if USAGE_FILE.exists():
        data = json.loads(USAGE_FILE.read_text())
        if data.get("month") != datetime.now().strftime("%Y-%m"):
            return {"month": datetime.now().strftime("%Y-%m"), "claude": 0}
        return data
    return {"month": datetime.now().strftime("%Y-%m"), "claude": 0}


def _record_usage(llm: str, tokens: int):
    usage = _get_usage()
    usage[llm] = usage.get(llm, 0) + tokens
    USAGE_FILE.write_text(json.dumps(usage))


def _budget_exceeded(llm: str) -> bool:
    budget = TOKEN_BUDGET.get(llm)
    if budget is None:
        return False
    return _get_usage().get(llm, 0) >= budget


# ── Resume knowledge base ─────────────────────────────────────────────────────
RESUME_CONTEXT = """
Venkata Yaswanth Mullamuri is a Computer Science Master's student at NC State University (Aug 2024 – May 2026),
specializing in Data Science, Software Security, Neural Networks, and AI Implementation. GPA: 3.4/4.0.

He completed his B.Tech in Computer Science from SRM University, Chennai (2019–2023) with a perfect 4.0 GPA.

CONTACT:
- Email: yaswanthmullamurijobs@gmail.com
- LinkedIn: linkedin.com/in/yaswanth-mullamuri
- GitHub: github.com/YaswanthMullamuri
- Phone: (919) 264-1489
- Location: Raleigh, NC, USA

SKILLS:
- Programming: Java, Python, C++, JavaScript, Dart
- AI/ML: RAG, LLM, MCP, OpenAI, HuggingFace, LangChain, Ollama, ChromaDB, Numpy, Pandas, Matplotlib
- Backend: SpringBoot, REST, Microservices, Kafka, Maven, Docker, Kubernetes, Azure, AWS
- Security: SAST, DAST, IAST, OWASP Top 10, ASVS, GDPR, NIST, ZAP, Snyk, SonarQube, Threat Modelling

WORK EXPERIENCE:
1. Research Engineer — Secure Computing Institute, NC State (Aug 2025 – Present)
   - Built RAG system using Llama 3.1 to automate P-SSCRM-scored assessments, achieving 5x efficiency gain
   - Developed evidence-seeking prompts increasing assessment clarity by 25%
   - Evaluated LLM-as-a-judge scoring: cut evaluation time 40%, reduced discrepancies 30%
   - Privacy-first design: all inference runs locally on-device

2. Software Engineer — Tata Consultancy Services (Aug 2023 – July 2024)
   - Led backend services of global ordering system in 50+ countries, 100K+ daily orders, 200+ hubs
   - 99.99% uptime with Spring Boot microservices on Azure
   - Kafka pipelines: 50K+ records/day, latency -35%, throughput +50%
   - 20+ RESTful APIs across 6+ microservices, 90%+ test coverage (JUnit, Mockito)
   - Docker + Kubernetes (AKS): zero-downtime rollouts, auto-scaling for 3x peak traffic
   - Cut engineer onboarding time by 80% via Confluence documentation

3. Machine Learning Mentee — Amazon (July–Aug 2022)
   - Intensive ML/AI modules; built classifiers and sequence models in Python
   - Delivered projects on model selection and error analysis

PROJECTS:
- Security Analyst on OpenEMR (Open Source Healthcare App):
  - Conducted SAST, DAST, IAST security assessments (OWASP Top 10 focus)
  - Enforced 12-character password policy: entropy +40%, credential risk -30%
  - Aligned with ASVS and GDPR standards
"""

SYSTEM_PROMPT = """You are Yaswanth's portfolio assistant — a professional AI that answers recruiter
and visitor questions about Venkata Yaswanth Mullamuri, based solely on the provided context.

Be concise, confident, and professional. Highlight quantified achievements when relevant.
If something isn't in the context, say: "I don't have that detail, but you can reach Yaswanth
directly at yaswanthmullamurijobs@gmail.com or (919) 264-1489."
Never fabricate information. Refer to him as "Yaswanth" or "he/him".

Context from resume:
{context}
"""


class RAGEngine:
    def __init__(self):
        self._vector_store = None
        self._build_vector_store()

    def _build_vector_store(self):
        splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
        docs = splitter.create_documents([RESUME_CONTEXT])

        embeddings = OpenAIEmbeddings(
            model="text-embedding-ada-002",
            openai_api_key=os.getenv("OPENAI_API_KEY")
        )

        self._vector_store = Chroma.from_documents(
            documents=docs,
            embedding=embeddings,
            collection_name="yaswanth_portfolio"
        )
        print("✅ Vector store ready")

    def _get_llm(self, llm: str):
        if llm == "claude":
            # ── Step 2: Add your Anthropic key in .env (used for Claude generation) ──
            return ChatAnthropic(
                model="claude-haiku-4-5-20251001",
                anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
                temperature=0.3,
                max_tokens=512,
            )
        else:
            raise ValueError(f"LLM '{llm}' is not currently enabled.")

    async def query(self, question: str, history: list[dict], llm: str = "claude") -> tuple[str, list[str]]:
        if _budget_exceeded(llm):
            return (
                "I'm temporarily offline to manage costs. "
                "Please reach Yaswanth at yaswanthmullamurijobs@gmail.com or (919) 264-1489!",
                []
            )

        llm_model = self._get_llm(llm)
        retriever = self._vector_store.as_retriever(search_kwargs={"k": 4})

        # Build chat history for the prompt
        chat_history = []
        for turn in history:
            if turn["role"] == "user":
                chat_history.append(HumanMessage(content=turn["content"]))
            elif turn["role"] == "assistant":
                chat_history.append(AIMessage(content=turn["content"]))

        # Retrieve relevant context
        docs = retriever.invoke(question)
        context = "\n\n".join(doc.page_content for doc in docs)

        # Build and invoke the chain using modern LangChain 1.x LCEL
        prompt = ChatPromptTemplate.from_messages([
            ("system", SYSTEM_PROMPT),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{question}"),
        ])

        chain = prompt | llm_model | StrOutputParser()

        answer = await chain.ainvoke({
            "context": context,
            "chat_history": chat_history,
            "question": question,
        })

        # Approximate token tracking (chars / 4 ≈ tokens)
        _record_usage(llm, (len(question) + len(answer)) // 4)

        sources = list({
            doc.metadata.get("source", "resume")
            for doc in docs
        })
        return answer, sources
