const SKILLS = [
  {
    label: "ML & Retrieval",
    items: [
      "PyTorch",
      "Hugging Face",
      "SentenceTransformers",
      "FAISS",
      "Pinecone",
      "Qdrant",
      "Weaviate",
      "ChromaDB",
      "pgvector",
      "RAG",
      "Embeddings",
      "Classifier Training",
    ],
  },
  {
    label: "Agents & Frameworks",
    items: [
      "LangGraph",
      "OpenAI Agents SDK",
      "LangChain",
      "LlamaIndex",
      "Pydantic AI",
      "LiteLLM",
      "FastMCP",
      "CrewAI",
      "AutoGen",
      "ReAct",
      "CDP Browser Agents",
    ],
  },
  {
    label: "LLM Engineering",
    items: [
      "LoRA / QLoRA / PEFT",
      "DPO / GRPO / DAPO / PRM",
      "vLLM",
      "SGLang",
      "Ollama",
      "TGI",
      "AWQ / GPTQ / GGUF",
      "Context Engineering",
      "KV-Cache Strategies",
      "Streaming",
    ],
  },
  {
    label: "Observability & Eval",
    items: [
      "OpenTelemetry",
      "Langfuse",
      "Arize Phoenix",
      "LangSmith",
      "Pass-Rate Evaluation",
      "AIME / GPQA",
    ],
  },
  {
    label: "Cloud & Infra",
    items: ["Docker", "GCP / Vertex AI", "AWS", "Nginx", "Redis", "PostgreSQL", "MongoDB"],
  },
  {
    label: "Backend",
    items: ["FastAPI", "Nest.js", "Node.js", "GraphQL", "WebSockets", "REST", "SSE"],
  },
  {
    label: "Languages",
    items: ["Python", "TypeScript", "C++", "SQL", "Bash"],
  },
  {
    label: "Frontend",
    items: ["Next.js", "React", "Redux", "Turbopack", "Edge Runtime"],
  },
];

export default function Skills() {
  return (
    <section className="py-20 px-6 max-w-6xl mx-auto border-t border-border">
      <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink">
        What I work with
      </h2>

      <div className="flex flex-col gap-8 mt-12">
        {SKILLS.map((group, i) => (
          <div
            key={group.label}
            className={`flex flex-col sm:flex-row sm:gap-12 py-6 ${i !== 0 ? "border-t border-border" : ""}`}
          >
            <p className="text-xs font-semibold tracking-widest uppercase text-ink-faint mb-3 sm:mb-0 sm:w-48 shrink-0 pt-0.5">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.items.map((item) => (
                <span
                  key={item}
                  className="font-mono text-xs px-3 py-1.5 rounded-full bg-surface border border-border text-ink-muted"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
