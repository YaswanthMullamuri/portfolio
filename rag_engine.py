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
Venkata Yaswanth Mullamuri is a graduate student pursuing a Master of Science in Computer Science
at North Carolina State University (NC State), located in Raleigh, NC, USA. He started in August 2024
and is expected to graduate in May 2026. His GPA is 3.4 out of 4.0. His coursework focuses on
Data Science, Software Security, Independent Study in AI Implementation, and Neural Networks.

Prior to his Master's, Yaswanth completed a Bachelor of Technology in Computer Science from
SRM University in Chennai, India, from June 2019 to May 2023, graduating with a perfect GPA of 4.0
out of 4.0. His undergraduate coursework included Data Structures and Algorithms, Computer Networks,
and Network Security.

CONTACT INFORMATION:
- First Name: Venkata Yaswanth
- Last Name: Mullamuri
- Preferred First Name: Yaswanth
- Phone: (919) 264-1489
- Email: yaswanthmullamurijobs@gmail.com
- LinkedIn: linkedin.com/in/yaswanth-mullamuri
- GitHub: github.com/YaswanthMullamuri
- Location: Raleigh, NC, USA

TECHNICAL SKILLS:

Programming Languages:
Yaswanth is proficient in Java, Python, C++, JavaScript, and Dart. He has used Java extensively
for backend development at TCS, Python for machine learning and AI projects, and JavaScript for
full-stack development.

AI and Machine Learning:
Yaswanth has hands-on experience with Retrieval Augmented Generation (RAG), Agentic Systems,
Large Language Models (LLM), Model Context Protocol (MCP), OpenAI APIs, HuggingFace, LangChain,
Ollama, and Matplotlib. He has built production RAG pipelines using LangChain and ChromaDB,
and worked with local LLM inference using Ollama and Llama 3.1.

Technology and Frameworks:
He is skilled in SpringBoot, REST APIs, MicroServices architecture, Maven, New Relic for monitoring,
Docker for containerization, and Kubernetes for orchestration. He has deployed microservices on
Azure AKS with zero-downtime rollout strategies.

Databases and Cloud:
Yaswanth has experience with AWS, Azure, MySQL, MongoDB, SQLite, and ChromaDB. He has used
ChromaDB as a vector store for RAG systems and worked with relational and NoSQL databases in
production environments.

Security Tools and Practices:
He is knowledgeable in SAST (Static Application Security Testing), DAST (Dynamic Application
Security Testing), IAST (Interactive Application Security Testing), OWASP Top 10, ASVS
(Application Security Verification Standard), GDPR, NIST frameworks, ZAP, Snyk, SonarQube,
Threat Modelling, and Incident Response.

Other Tools:
Linux, Swagger, Kafka, Azure DevOps, Large Language Models, Retrieval Augmented Generation.

WORK EXPERIENCE:

Position 1: AI Engineer at North Carolina State University
Duration: August 2025 to Present
Location: Raleigh, NC, USA

In this role, Yaswanth is working as an AI Engineer at NC State University. He built a RAG-based
system using the Llama 3.1 model to automate P-SSCRM-scored security assessments. This system
replaced a 100% manual process and is targeting a 5x efficiency gain in security review cycles.
The RAG pipeline retrieves relevant knowledge and generates structured assessments automatically,
dramatically reducing the time security analysts spend on each review.

He developed evidence-seeking prompts that guide users toward providing detailed, non-binary
responses instead of simple yes/no answers. This enhanced the depth of assessments and increased
clarity of responses by 25%. The system is designed with a privacy-first approach, ensuring all
data and inference remains local to build user trust and maintain confidentiality.

Yaswanth evaluated LLM-as-a-judge scoring methods to automate the scoring of security assessment
responses. This reduced average human evaluation time by 40% and lowered scoring discrepancies
between different evaluators by 30%. All inference runs on local systems to maintain privacy.

He is also building a scalable prompt and knowledge base for assessor-style question and answer
interactions. This work targets a 35% improvement in assessment accuracy and a 30% reduction in
response latency. The knowledge base is curated specifically for secure, client-side deployment
so sensitive data never leaves the user's environment.

Position 2: Software Engineer at Tata Consultancy Services (TCS)
Duration: August 2023 to July 2024
Location: Chennai, India

At TCS, Yaswanth worked as a Software Engineer on a large-scale global ordering system. This
system is used in over 50 countries, processes more than 100,000 daily orders, and operates
across more than 200 hubs worldwide. He was responsible for backend development using Spring Boot
microservices deployed on Microsoft Azure, maintaining 99.99% uptime for a mission-critical system.

He built scalable data pipelines using Apache Kafka and Java to process over 50,000 records per day.
These pipelines reduced data processing latency by 35% and increased overall throughput by 50%,
making the ordering system significantly more efficient at scale.

Yaswanth developed over 20 RESTful APIs using Spring Boot across more than 6 microservices. He
achieved over 90% test coverage using JUnit and Mockito, which reduced post-release defects by 40%.
This high test coverage ensured reliability and stability of the APIs in production.

He significantly improved developer productivity by revamping Confluence documentation for the team.
This reduced onboarding time for new engineers by 80% and involved logging 100% of recurring
incidents and blockers for over 10 new engineers every year, making knowledge transfer seamless.

Yaswanth deployed microservices using Docker and Kubernetes on Azure AKS (Azure Kubernetes Service).
His deployment strategy enabled zero-downtime rollouts and auto-scaling capabilities that handled
up to 3x peak traffic during high demand periods without any service degradation.

Position 3: Machine Learning Mentee at Amazon
Duration: July 2022 to August 2022
Location: Chennai, India

Yaswanth completed an intensive mentorship program at Amazon focused on machine learning and
artificial intelligence. He completed modules covering core ML and AI concepts and built
classifiers and sequence models using Python. He delivered small projects demonstrating model
selection strategies and error analysis techniques.

PROJECTS:

Project: Security Analyst on OpenEMR Web Application
Yaswanth collaborated with OpenEMR, an open source healthcare web application, to conduct
comprehensive security assessments. He used advanced methodologies including SAST (Static
Application Security Testing), DAST (Dynamic Application Security Testing), and IAST (Interactive
Application Security Testing), with a strong focus on OWASP Top 10 vulnerabilities.

He ensured the application aligned with ASVS (Application Security Verification Standard) and
GDPR (General Data Protection Regulation) standards. He identified and addressed a critical
ASVS compliance gap by enforcing a 12-character minimum password policy across the application.
This change increased password strength entropy by 40% and reduced credential-related security
risks by 30%, significantly improving the application's overall security posture.

Project: Local AI Assistant using Ollama and LangChain
Yaswanth built a fully local AI assistant that runs entirely on-device without any external API
calls or internet connectivity. The assistant is powered by Ollama for local LLM inference and
LangChain for conversation management and retrieval logic. The motivation behind this project was
to explore privacy-preserving AI — building a capable chatbot that never sends user data to
external servers, making it suitable for sensitive personal or professional use cases.

The assistant supports multi-turn conversations with memory, meaning it retains context across
multiple exchanges in a session. Yaswanth integrated a local ChromaDB vector store so the assistant
can answer questions grounded in personal documents — essentially a personal RAG system running
fully offline. He experimented with multiple Ollama-supported models including Llama 3.1, Mistral,
and Phi-3, comparing their response quality and latency on consumer hardware.

This project deepened his understanding of how local inference differs from cloud-based LLM APIs
in terms of latency, quantization tradeoffs, and memory constraints. It also gave him practical
experience optimizing prompts for smaller, locally-run models which behave differently from
large cloud-hosted models like GPT-4 or Claude.

CAREER GOALS AND INTERESTS:
Yaswanth is actively seeking opportunities in AI Engineering, Machine Learning Engineering,
Software Engineering, and Security Engineering. He is passionate about building intelligent
systems that combine the power of LLMs with retrieval-based architectures (RAG), and is
particularly interested in privacy-preserving AI systems and secure software development.
He is open to full-time roles starting May 2026 upon completion of his Master's degree,
and is also open to internship opportunities.

HOW TO REACH YASWANTH:
Recruiters and hiring managers can reach Yaswanth at yaswanthmullamurijobs@gmail.com or
by calling (919) 264-1489. His LinkedIn profile is linkedin.com/in/yaswanth-mullamuri and
his GitHub is github.com/YaswanthMullamuri. He is based in Raleigh, NC and is open to
both local and remote opportunities.
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
