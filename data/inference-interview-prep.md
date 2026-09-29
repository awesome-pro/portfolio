# Inference Interview Prep Checklist (2026)

Use this as a living Notion page. Tick items only when you can **explain them out loud with numbers**, not when you have merely read them.

**How to use**
- Status: `0/…` at the top of each module — update the counts yourself.
- Tick a topic when you can teach it on a whiteboard in 5 minutes.
- Tick a question when you have answered it out loud (or written a tight answer) without notes.
- Tick a deliverable only when the artifact exists.

**Target loop this pack covers**
Recruiter → coding → project deep dive → inference systems design → GPU/domain → behavioral.

**Your existing proof (do not rebuild; defend)**
- MiniServe — from-scratch runtime
- HiQCache — INT8 hierarchical KV on SGLang
- RolloutCore — versioned RL rollouts on vLLM + NCCL hot weights
- Spec-decoding measurement (SGLang / EAGLE3)
- AgentFlow-Pro / SmartMemo / Browzer cost work
- PRs toward SGLang / vLLM

---

## 0. Meta — interview mechanics

### 0.1 Positioning
- [ ] One-sentence pitch: *I do RL post-training on reasoning models and build the inference systems that serve them*
- [ ] Why inference (not generic MLE / not research-only)
- [ ] Why this company type: lab vs inference platform vs product vs NVIDIA-style
- [ ] Level story: what you own end-to-end (correctness, perf, cost, incidents)
- [ ] Remote / relocation / India + foreign constraint, spoken cleanly
- [ ] Comp / visa / notice period answers without rambling
- [ ] “Why leave Browzer / why inference now”

### 0.2 Project stories (STAR + numbers)
Write and rehearse each. Tick only after a timed 8-minute telling + 10-minute hostile Q&A.

- [ ] **MiniServe** — continuous batching, chunked prefill, paged KV, prefix cache, preemption; 97% prefill work saved on shared-prefix workload; HF logit match ≤ 6e-8
- [ ] **HiQCache** — INT8 host-tier KV; 147,456 → 82,944 B/token (43.75%); 1.78× L2 capacity; hit rate ~57% → ~73%; L2-restored KV ~127K → ~168K
- [ ] **RolloutCore** — drain-before-mutate, NCCL hot install, cache invalidation, version binding; 4.25s vs 37.04s (~8.7×); 32 stale prefix hits when invalidation skipped
- [ ] **Spec decoding lab** — what you measured, what you failed to measure, what SGLang already had
- [ ] **Browzer** — ~3× cost / run on 700K+ calls; routing, prompt cache, compression
- [ ] **AgentFlow-Pro** — process-supervised RL, transfer of gains, eval numbers
- [ ] **SmartMemo** — why cosine is not enough; classifier vs embedding threshold
- [ ] One **failure story** per major project (what broke, how you knew, what shipped)

### 0.3 Recruiter / HM questions
- [ ] Walk me through your last 12 months
- [ ] What is an inference engineer vs ML engineer vs CUDA engineer?
- [ ] What would you do in the first 90 days on our serving stack?
- [ ] Tell me a performance win with before/after metrics
- [ ] Tell me a time you disagreed with a modeling / product decision
- [ ] How do you decide when *not* to optimize?

### 0.4 Deliverables
- [ ] 1-page formula sheet (printed / Notion toggle)
- [ ] 8 behavioral stories written
- [ ] Resume bullets each map to a defendable metric
- [ ] 10-minute MiniServe script
- [ ] 10-minute HiQCache script
- [ ] 10-minute RolloutCore script

---

## 1. Transformer execution on a GPU

### 1.1 Architecture you must derive, not recite
- [ ] Token embedding + unembedding / LM head
- [ ] Pre-norm vs post-norm; RMSNorm vs LayerNorm
- [ ] QKV projection, heads, head_dim
- [ ] MHA vs MQA vs GQA vs MLA (what changes in KV size)
- [ ] RoPE / relative positions at a working level
- [ ] FFN / SwiGLU: flop count vs attention flop count
- [ ] Residual stream; why precision of residuals matters
- [ ] Causal mask; sliding window / local attention (what it does to KV)
- [ ] MoE FFN vs dense FFN (pointer to Module 7)

### 1.2 Two-phase execution
- [ ] Prefill: all prompt tokens, high arithmetic intensity, compute-bound
- [ ] Decode: one token, weight + KV traffic, memory-bandwidth-bound
- [ ] TTFT vs ITL / TPOT vs E2E vs tokens/s vs requests/s
- [ ] Why batching helps decode more than people think (amortize weight reads)
- [ ] Why long prefill wrecks in-flight decode if they share an engine
- [ ] Activations vs weights vs KV: which dominates which phase

### 1.3 Hardware model
- [ ] GPU hierarchy: registers, shared memory / SRAM, L2, HBM
- [ ] HBM bandwidth as the decode ceiling
- [ ] Tensor cores vs CUDA cores (enough to talk FP8/FP4)
- [ ] Occupancy, warps, coalesced vs strided access
- [ ] Kernel launch overhead; why tiny decode steps hate launch-bound code
- [ ] CUDA graphs: what they freeze, when dynamism breaks them
- [ ] Streams / overlap of copy and compute
- [ ] PCIe vs NVLink vs NVSwitch vs IB / RDMA (latency + bandwidth order of magnitude)

### 1.4 Roofline and capacity math (memorize + derive)
- [ ] Weight bytes ≈ `P * b` (`b` = 2 FP16, 1 FP8, 0.5 INT4, …)
- [ ] KV per token ≈ `2 * n_layers * n_kv_heads * head_dim * bytes`
- [ ] Why GQA/MQA/MLA shrink that formula
- [ ] Max concurrent seqs ≈ `(VRAM_usable - weights - activations) / (KV_per_token * avg_len)`
- [ ] Decode time lower bound ≈ `bytes_moved / HBM_bw`
- [ ] Prefill time rough bound from FLOPs / peak FLOPs, then say why real is worse
- [ ] Usable VRAM ≠ advertised VRAM (allocator, fragmentation, CUDA context, graphs)

### 1.5 Must-run lab
- [ ] Profile one model: prefill vs decode time, SM util, HBM throughput
- [ ] Change batch size and context; plot TTFT, ITL, tokens/s
- [ ] Write the KV-capacity number for **Qwen3-8B** and **Llama-3-70B** on A100-80 and H100-80, FP16 and FP8

### 1.6 Questions
- [ ] Walk a transformer forward pass as it actually executes on a GPU
- [ ] Why is decode memory-bound and prefill compute-bound?
- [ ] Give KV bytes/token for Llama-3-70B GQA. Show the arithmetic
- [ ] How many concurrent 8k-context decodes fit on one H100 80GB at FP8?
- [ ] What happens to capacity if we switch MHA → GQA → MLA?
- [ ] Why does increasing batch size help tokens/s but hurt TTFT?
- [ ] Where do activations live during prefill of a 128k prompt?
- [ ] Why can tokenizer / CPU scheduling cap a “GPU-bound” server?

---

## 2. Serving engine internals

### 2.1 Batching
- [ ] Static batching (pad to max, wait for full batch)
- [ ] Dynamic / request-level batching
- [ ] Continuous / in-flight / iteration-level batching
- [ ] Two triggers: max batch size vs max wait window
- [ ] Token-budget scheduling vs request-count scheduling
- [ ] Heterogeneous sequence lengths; padding waste
- [ ] Stop conditions mixed in one batch (EOS vs max tokens vs abort)

### 2.2 Prefill policies
- [ ] Full prefill monopolizes the step
- [ ] Chunked prefill: prompt split across steps so decode stays live
- [ ] Chunk size vs TTFT vs ITL tradeoff
- [ ] Prefill-priority vs decode-priority vs hybrid
- [ ] Prompt-length classes (short / medium / long) and queue isolation

### 2.3 Paged KV / block manager
- [ ] Naive reservation of `max_seq_len` per request: internal + external fragmentation
- [ ] Block size (16 / 32 / 64 tokens): internal fragmentation vs pointer overhead
- [ ] Block table (logical token pages → physical GPU blocks)
- [ ] Copy-on-write / refcount when sequences fork (beam, speculative, parallel samples)
- [ ] Allocation failure: reject vs preempt vs wait
- [ ] What PagedAttention costs (indirection, gather)

### 2.4 Prefix / radix cache
- [ ] Exact prefix reuse vs block-hash reuse
- [ ] vLLM automatic prefix caching vs SGLang RadixAttention
- [ ] System-prompt sharing as the common win
- [ ] Multi-turn chat: what is reusable, what is not
- [ ] Cache eviction: LRU vs utility vs tenant quotas
- [ ] Correctness: **never reuse KV across weight versions** (tie to RolloutCore)
- [ ] Hash collisions / tokenizer mismatch / different sampling state

### 2.5 Preemption and admission
- [ ] Recompute preemption vs KV swap to host vs reject
- [ ] Your MiniServe recompute path: when it is cheaper than swap
- [ ] Head-of-line blocking
- [ ] Fairness vs throughput vs SLA
- [ ] Multi-priority queues (interactive vs batch vs RL rollout)
- [ ] Preemption storms under memory pressure

### 2.6 Runtime mechanics
- [ ] Request lifecycle: tokenize → wait → prefill → decode loop → stream → free KV
- [ ] CUDA graphs in decode; why chunked prefill / variable batch fights graphs
- [ ] Pinned memory, pageable copies, allocator (caching allocator vs custom pool)
- [ ] Tokenizer parallelism; detokenize-on-the-fly for streaming
- [ ] Structured output / grammar constraints inside the step
- [ ] Abort / cancel / client disconnect: freeing KV immediately

### 2.7 Engines — know *when*, not just names
- [ ] vLLM — PagedAttention, continuous batching, broad models, default OSS
- [ ] SGLang — radix cache, structured gen, multi-turn; your stack
- [ ] TensorRT-LLM — compiled engine, peak NVIDIA, slower day-0 models
- [ ] TGI — DX, usually not perf winner
- [ ] Triton Inference Server — multi-model / ensembles, not LLM-native scheduler
- [ ] Dynamo — cluster orchestration, PD pools, routing; not a kernel library
- [ ] llama.cpp / Ollama — local / edge, not the datacenter answer
- [ ] One-line rule for picking among vLLM / SGLang / TRT-LLM

### 2.8 Must-run lab
- [ ] Same model + same GPU: vLLM vs SGLang throughput and TTFT table
- [ ] Sweep `max_num_seqs`, chunked-prefill size, prefix-cache on/off
- [ ] Force memory pressure; watch preemption / reject behavior
- [ ] Reproduce a stale prefix-cache bug after a weight change (RolloutCore lesson)

### 2.9 Questions
- [ ] Explain PagedAttention and the fragmentation number it killed
- [ ] Continuous batching vs static batching, with a sketch of the step loop
- [ ] Design the scheduler for one GPU, 100-input max batch, synchronous users
- [ ] When does chunked prefill hurt TTFT enough that you would turn it off?
- [ ] How does a block allocator work? Implement the API on a whiteboard
- [ ] Prefix cache hit but wrong tokens — list causes
- [ ] vLLM vs SGLang vs TRT-LLM for a 70B chat API. Pick one and defend
- [ ] How do CUDA graphs interact with continuous batching?

---

## 3. Parallelism for inference

### 3.1 Axes
- [ ] Replicas / DP: copy the model, split requests
- [ ] Tensor parallel (TP): split mats inside a layer; AllReduce / AllGather
- [ ] Pipeline parallel (PP): split layers; bubbles; why inference PP is awkward
- [ ] Sequence / context parallel: split long context
- [ ] Expert parallel (EP): split MoE experts (see Module 7)
- [ ] How they compose: world size = DP × TP × PP × EP (as applicable)

### 3.2 TP details
- [ ] Column-parallel vs row-parallel linear
- [ ] What must be communicated each layer
- [ ] Attention under TP (split heads)
- [ ] Vocab-parallel LM head
- [ ] TP=2 vs 4 vs 8: comm vs memory vs latency
- [ ] NVLink island vs crossing PCIe / nodes

### 3.3 Placement
- [ ] Single GPU
- [ ] Single node 8× GPU
- [ ] Multi-node; NCCL over IB
- [ ] Why small TP + more replicas often beats huge TP for decode latency
- [ ] Shard weights vs replicate weights vs both (replicas of sharded groups)

### 3.4 Questions
- [ ] Serve Llama-70B FP16 on 4× A100 80GB. Pick TP and max concurrency
- [ ] When do you choose TP=2 over TP=4?
- [ ] What communication happens in one decode step at TP=8?
- [ ] Why is PP rarely the first knob for chat decode?
- [ ] How does GQA change the TP story for attention?
- [ ] NCCL AllReduce hangs at scale — what do you look at first?

---

## 4. Prefill–decode disaggregation (2026 core)

### 4.1 Why co-location fails
- [ ] Prefill wants compute; decode wants HBM + high batch of *slots*
- [ ] Long prefill steps inflate ITL of everyone else
- [ ] One SLO (TTFT) fights the other (ITL)
- [ ] Chunked prefill is a *mitigation*, not the same as disagg

### 4.2 Architecture
- [ ] Prefill pool vs decode pool (xPyD)
- [ ] Request path: router → P → transfer KV → D → stream
- [ ] Conditional disagg: short prompts stay on decode worker
- [ ] KV transfer: NVLink / RDMA / NIXL / Mooncake
- [ ] Bootstrap / handshake metadata (SGLang room_id style vs vLLM block ids)
- [ ] Non-blocking transfer overlapped with other work
- [ ] Independent autoscaling of P and D
- [ ] Heterogeneous SKUs: cheaper / older GPUs for prefill

### 4.3 Multimodal cousin
- [ ] Encode–prefill–decode (EPD) for vision tokens
- [ ] When a separate encoder tier helps TTFT
- [ ] When EPD is wasted complexity

### 4.4 When *not* to disagg
- [ ] Tiny cluster, weak interconnect
- [ ] Transfer time > saved queueing
- [ ] Almost all short prompts
- [ ] Batch / offline jobs where TTFT is irrelevant

### 4.5 Questions
- [ ] Design PD-disagg for a 70B chat service. Draw pools, router, KV path
- [ ] Estimate when KV transfer eats the win (order-of-magnitude)
- [ ] Chunked prefill vs disagg — when each
- [ ] How do you scale P vs D when traffic mix shifts to long prompts?
- [ ] What fails if the interconnect is only PCIe?
- [ ] How does Dynamo-style routing differ from a random (P, D) pair?

---

## 5. Quantization and numerics

### 5.1 Formats
- [ ] FP32 / FP16 / BF16
- [ ] FP8 (E4M3 / E5M2), hardware on Hopper+
- [ ] NVFP4 / MXFP4-class 4-bit (Blackwell-era talking point)
- [ ] INT8, INT4
- [ ] Weight-only vs weight+activation vs KV-only

### 5.2 Algorithms (what problem each solves)
- [ ] GPTQ
- [ ] AWQ
- [ ] SmoothQuant
- [ ] Bitsandbytes / NF4 / QLoRA (training vs serving)
- [ ] GGUF / llama.cpp family (edge, not datacenter default)
- [ ] Per-tensor vs per-channel vs per-block scales
- [ ] Outlier channels; why some tensors stay high precision
- [ ] LM head / norms / embeddings: what you often refuse to quantize

### 5.3 KV quantization (your HiQCache generalization)
- [ ] GPU L1 KV in BF16/FP8 vs host L2 in INT8
- [ ] Asymmetric compress on evict / decompress on restore
- [ ] Error accumulation across long decode
- [ ] Hierarchical cache capacity math (you already have 1.78× — defend it)
- [ ] When KV quant hurts reasoning / long-context more than chat

### 5.4 Eval of a quant change
- [ ] Perplexity is not enough
- [ ] Reasoning (AIME / GPQA), code, long-context needle
- [ ] Side-by-side token disagreement rate vs golden greedy
- [ ] Latency + VRAM + quality table on the *same* traces

### 5.5 Questions
- [ ] Fit 70B on one 80GB GPU. Which quant, what quality risk
- [ ] INT4 vs FP8 on H100 for a reasoning model
- [ ] Why per-tensor scales fail and per-block / per-channel help
- [ ] Walk HiQCache. What did you *not* quantize and why
- [ ] How do you know a quant did not silently break tool-calling JSON
- [ ] TRT-LLM compile-time quant vs vLLM runtime quant

---

## 6. Speculative decoding and test-time compute

### 6.1 Mechanisms
- [ ] Draft model proposes k tokens; target verifies in one forward
- [ ] Acceptance / rejection; leftover drafted tokens
- [ ] Tree / multi-candidate speculation
- [ ] Medusa-style extra heads
- [ ] EAGLE / EAGLE3
- [ ] MTP (multi-token prediction) heads
- [ ] Adaptive number of speculative tokens (your SGLang note)

### 6.2 Math
- [ ] Expected accepted tokens vs k
- [ ] Break-even: draft cost + verify cost < vanilla decode cost
- [ ] Why high-entropy tokens kill the win
- [ ] Why long reasoning traces change the bet

### 6.3 Production judgment
- [ ] When spec decoding is worth the complexity
- [ ] When it regresses TPOT
- [ ] Draft must match tokenizer + chat template + constrained decoding
- [ ] Interaction with prefix cache and CUDA graphs
- [ ] Interaction with grammar / JSON constrained decode

### 6.4 Reasoning-model serving
- [ ] Output length 4k–32k changes capacity (KV grows the whole time)
- [ ] Test-time compute: parallel samples, majority vote, longer traces
- [ ] Separate interactive vs “think hard” queues
- [ ] Cost per *correct* answer, not cost per token

### 6.5 Questions
- [ ] Walk speculative decoding and its limits
- [ ] Acceptance rate 0.6, k=5 — is it faster? Show the inequality
- [ ] Why code / math often accepts worse than chitchat
- [ ] Adaptive spec vs fixed k
- [ ] How would you serve a reasoning model with p99 ITL still tight
- [ ] What did your EAGLE3 / Triton measurement actually show

---

## 7. MoE serving

### 7.1 Architecture
- [ ] Routed experts vs shared experts
- [ ] Top-k routing; fine-grained experts (DeepSeek-style) vs Mixtral-style
- [ ] Active params vs total params
- [ ] Memory still holds *all* experts
- [ ] Gate / router flop is small; all-to-all is not

### 7.2 Expert parallelism
- [ ] Experts sharded across GPUs
- [ ] All-to-all token dispatch / combine
- [ ] Redundant replicas of hot experts
- [ ] Prefill EP width vs decode EP width (DeepSeek used very different widths)
- [ ] DP attention + EP experts, especially with MLA
- [ ] Load imbalance; capacity factor

### 7.3 Serving implications
- [ ] Decode wants huge aggregate batch so each expert sees a fat matmul
- [ ] Small interactive batch can make MoE *slower* than a dense model of similar active size
- [ ] Combining EP with PD-disagg
- [ ] Failure domain: one GPU owns experts many tokens need

### 7.4 Questions
- [ ] Sketch serving a ~671B MoE at low latency
- [ ] Why memory scales with total params but compute with active params
- [ ] TP vs EP vs DP for Mixtral-8x7B vs DeepSeek-V3-class
- [ ] What goes wrong at batch=1 on a sparse MoE
- [ ] How do you debug expert imbalance in production

---

## 8. Kernels, CUDA literacy, profiling

### 8.1 Reading level (required)
- [ ] What a GEMM kernel is doing in the decode path
- [ ] Fused RMSNorm + residual
- [ ] Softmax: numerically stable, online softmax idea
- [ ] Attention tiling intuition (FlashAttention): why you do not materialize S
- [ ] Why decode attention is often memory-bound even with FlashAttention
- [ ] FlashInfer as a serving-shaped attention library (name + why it exists)

### 8.2 Writing level (senior / lab / NVIDIA bar)
- [ ] Triton: fused RMSNorm
- [ ] Triton: softmax or simple attention tile
- [ ] Benchmark vs PyTorch eager; know when you lost
- [ ] CUDA streams + events
- [ ] Vectorized loads; bank conflicts at a talking level

### 8.3 Collectives
- [ ] AllReduce, AllGather, ReduceScatter, AllToAll
- [ ] NCCL topology; NVLink vs IB
- [ ] Common hang causes
- [ ] Overlap comm with compute (why it is hard in decode)

### 8.4 Profiling toolkit
- [ ] `nvidia-smi` (util vs power vs mem; why 100% util can still be wrong)
- [ ] PyTorch profiler
- [ ] Nsight Systems (timeline: CPU gaps, launch gaps, memcpy)
- [ ] Nsight Compute (kernel: bandwidth vs compute)
- [ ] Engine metrics: tokens/s/GPU, KV hit rate, batch size histogram, queue depth, preemptions
- [ ] Application metrics: p50/p99 TTFT, ITL, timeout rate, abort rate

### 8.5 Incident patterns
- [ ] Tokens/s cliff after “enabling prefix cache”
- [ ] TTFT doubled, ITL flat (queueing / prefill)
- [ ] ITL doubled, TTFT flat (KV pressure / batch collapse)
- [ ] GPU util high, tokens/s low (wrong kernel / no fusion / tiny batch)
- [ ] GPU util low (CPU scheduler, tokenizer, Python GIL, waiting on network)
- [ ] OOM after traffic mix shift to long context
- [ ] NCCL timeout after a node flap

### 8.6 Questions
- [ ] Read this 30-line Triton kernel and say what it does
- [ ] Optimize softmax on CPU or GPU (interview classic)
- [ ] How would you implement a tiny attention kernel
- [ ] Tokens/s dropped 40% after a config change — 10-minute debug
- [ ] Why is my decode kernel launch-bound?
- [ ] What does Nsight Systems show that `nvidia-smi` cannot?

---

## 9. Platform and LLM serving system design

Use this spine every time. Tick when you can run it cold in 45 minutes.

- [ ] 1. Frame: serving problem, not modeling problem
- [ ] 2. Requirements: QPS, TTFT, ITL, context mix, streaming, tenants
- [ ] 3. Capacity math on the whiteboard
- [ ] 4. Engine + precision + parallelism
- [ ] 5. Scheduler + KV + prefix / prompt / semantic cache
- [ ] 6. Routing (least-load, prefix-aware, KV-aware, model-tier)
- [ ] 7. Autoscaling (queue depth, warm pool, GPU cold start 5–30 min)
- [ ] 8. Reliability (OOM, replica death, partial deploys, drain)
- [ ] 9. Observability + SLOs + load tests
- [ ] 10. Cost ($/1M in, $/1M out, utilization, idle tax)
- [ ] 11. Security / isolation if multi-tenant
- [ ] 12. Rollout of new weights / new engine versions

### 9.1 Control plane
- [ ] API gateway / auth / quotas
- [ ] Request IDs, traces, token accounting
- [ ] Streaming (SSE / gRPC / websocket) and backpressure
- [ ] Hedging / retries without double-billing tokens
- [ ] Timeouts: queue timeout vs generation timeout
- [ ] Model routing: cheap vs smart vs constrained JSON vs embeddings
- [ ] Multi-LoRA: many adapters, one base
- [ ] Canary / shadow / percentage rollout of a new engine

### 9.2 Data plane caches
- [ ] Exact prompt cache
- [ ] Prefix cache (engine-level)
- [ ] Semantic cache (SmartMemo story: classifier not cosine)
- [ ] KV offload hierarchy: GPU → CPU → local SSD → remote
- [ ] Cross-replica cache affinity (route repeat prefixes together)

### 9.3 Tenancy
- [ ] Noisy neighbor on a shared GPU
- [ ] Per-tenant max concurrency and KV quota
- [ ] Priority + preemption policy
- [ ] Isolation: process vs MIG vs separate pools
- [ ] Rate limits: RPM, TPM in, TPM out

### 9.4 Designs to rehearse (timer on)
- [ ] Serve 70B chat for millions of daily requests
- [ ] 100k req/s of an 8B model
- [ ] Multi-tenant inference API with priority
- [ ] 200k-context serving
- [ ] Streaming server with slow clients
- [ ] Serverless many-model fleet on one GPU pool
- [ ] RL rollout fleet that must stay version-pure (RolloutCore)
- [ ] Batch API that can wait minutes for 10× cheaper tokens
- [ ] Multimodal chat (images) with tight TTFT

### 9.5 Questions
- [ ] Design an inference platform for 100k req/s of 8B
- [ ] Design serving for 70B with TTFT p99 < 500ms, ITL < 50ms
- [ ] How do you autoscale GPUs without missing SLOs during a spike
- [ ] Where do you put the queue — in front of P, D, or both
- [ ] How do you bill tokens accurately under abort / hedge
- [ ] How do you ship a new quantized checkpoint with no stale KV

---

## 10. Adjacent ML they still ask

Stay thin. Enough to not bounce a mixed loop.

### 10.1 Sampling and decoding
- [ ] Greedy, temperature, top-k, top-p, min-p
- [ ] Repetition / frequency penalty
- [ ] Beam search (rare in prod chat; know why)
- [ ] Stop strings / EOS
- [ ] Constrained decoding / grammars / JSON schema
- [ ] Logprobs for eval / routing / speculative verify

### 10.2 Adaptation
- [ ] Prompt vs RAG vs LoRA vs full FT — when each
- [ ] LoRA math at a talking level; merge vs dynamic
- [ ] Multi-LoRA serving (S-LoRA-style)
- [ ] QLoRA is a *training* trick; do not confuse with serving quant

### 10.3 Post-training map (you have AgentFlow-Pro)
- [ ] SFT
- [ ] DPO
- [ ] RLHF / PPO
- [ ] GRPO / DAPO-style
- [ ] Process reward models
- [ ] Why rollout infrastructure is part of inference (on-policy, version binding)

### 10.4 Evals (light for infra roles, required for AI-engineer loops)
- [ ] Golden set + CI gate
- [ ] Offline vs online
- [ ] pass@k vs single-shot
- [ ] LLM-as-judge and why it must be calibrated
- [ ] Separate retrieval quality vs generation quality if RAG appears
- [ ] Serving-change eval: same prompts, greedy + sampled, quality + latency

### 10.5 Questions
- [ ] RAG vs fine-tune vs prompt for a domain chatbot (if they ask)
- [ ] How would you eval that FP8 did not tank tool use
- [ ] Multi-LoRA: 200 adapters, one 8B base, tight RAM
- [ ] How do you keep RL rollouts on-policy while serving live traffic

---

## 11. Coding drills

Tick a problem only after solving **timed, out loud**, then comparing to a clean solution.

### 11.1 Serving primitives (priority)
- [ ] Continuous-batch scheduler: arrivals, max wait, max batch, token budget
- [ ] Priority scheduler with preemption
- [ ] Paged KV block allocator (alloc / free / refcount / fork)
- [ ] Prefix tree or radix cache (insert, longest prefix, evict LRU)
- [ ] Memory pool for variable-size KV
- [ ] Request state machine (waiting / prefilling / decoding / preempted / done)
- [ ] Streaming iterator with backpressure
- [ ] Token bucket + concurrency limiter
- [ ] Fair queue across tenants
- [ ] Simulate chunked prefill on a list of requests

### 11.2 PyTorch primitives
- [ ] Attention from scratch (mask + softmax + dropout off at infer)
- [ ] KV cache: allocate, write prefill, append decode
- [ ] GQA: repeat KV heads
- [ ] RMSNorm
- [ ] Rotary embedding apply
- [ ] Simple speculative verify loop
- [ ] LoRA: y = xW + (xA)B * scale
- [ ] Packing variable-length sequences

### 11.3 Classic (keep small)
- [ ] Heap / streaming top-k
- [ ] Intervals / merge
- [ ] LRU cache
- [ ] Rate limiter
- [ ] Graph BFS/DFS (dependency of agent tools / request DAG)
- [ ] Binary search on a latency SLO (capacity planning flavor)
- [ ] Producer-consumer / bounded queue
- [ ] ~25 LeetCode mediums so a generic screen does not kill you

### 11.4 Harder / senior
- [ ] Tiny Triton kernel + test
- [ ] Numerically stable softmax in C++ or Python
- [ ] Mock NCCL: sharded matmul + allreduce
- [ ] gRPC or SSE streaming endpoint with abort

---

## 12. Hardware and cost literacy

### 12.1 Cards you should not look surprised by
- [ ] A100 80GB — still common baseline in questions
- [ ] H100 80GB — FP8, faster HBM than A100
- [ ] H200 — more HBM; KV capacity story
- [ ] B200 / GB200 NVL72 class — rack-scale NVLink, wide EP decode
- [ ] Workstation: 4090 / A6000 (your possible lab boxes) vs datacenter
- [ ] AMD MI300 / MI355 at “I know they exist and SGLang/vLLM target them”
- [ ] CPU-only / Inferentia / TPU / LPU only if the company uses them

### 12.2 Cost model
- [ ] GPU-hour fully loaded (not list price)
- [ ] Tokens out per GPU-second at a stated concurrency
- [ ] Utilization and idle tax
- [ ] Input tokens vs output tokens cost asymmetry
- [ ] When a smaller model + router beats one 70B
- [ ] Batch API vs real-time price
- [ ] Reserved vs spot for offline

### 12.3 Questions
- [ ] H100 vs H200 for a long-context decode fleet — what actually changes
- [ ] Estimate $/1M output tokens for 8B on one H100 at 50% util
- [ ] When do you buy more GPUs vs quantize vs cache vs route to a smaller model

---

## 13. Observability, reliability, operations

- [ ] SLO vs SLA vs error budget for TTFT / ITL / availability
- [ ] RED metrics + GPU metrics + KV metrics together
- [ ] Per-request trace: queue, tokenize, prefill, transfer, decode steps
- [ ] Tail latency: p99 not mean
- [ ] Load test: replay production length mix, not random 128-token prompts
- [ ] Chaos: kill a replica mid-stream
- [ ] Drain for deploys (no new requests, finish decode, then swap weights)
- [ ] Weight update protocols: restart vs hot NCCL install vs rolling
- [ ] Config as code: engine flags that change quality are production incidents
- [ ] Runbooks: OOM, NCCL hang, TTFT spike, cache stampede
- [ ] Capacity planning from a length histogram, not from a single “avg tokens”

### 13.1 Questions
- [ ] What dashboards do you look at in the first 5 minutes of an incident
- [ ] How do you load-test a new scheduler without melting prod
- [ ] How do you roll TensorRT-LLM engine rebuilds
- [ ] How do you prove a “2× tokens/s” claim is not a measurement bug

---

## 14. Behavioral and collaboration

### 14.1 Stories to write
- [ ] Largest perf win (metrics + how measured)
- [ ] Time you stopped an optimization that would have looked good
- [ ] Conflict with research / product
- [ ] Production incident you owned
- [ ] Working with incomplete GPU access / budget
- [ ] Mentoring or writing (artifacts, YouTube, PRs)
- [ ] Cross-timezone collaboration
- [ ] Saying no to a model that could not meet SLO

### 14.2 Company-specific tone
- [ ] Lab (OpenAI / Anthropic / xAI / DeepMind): correctness, scale, first-principles
- [ ] Inference platform (Together / Fireworks / Baseten / Anyscale): multi-tenant, cost, SLOs
- [ ] NVIDIA: TRT-LLM, Dynamo, kernels, hardware features
- [ ] Product company: user latency, cost per action, evals
- [ ] India applied LLM teams: shipping, cost, Hindi/multilingual only if relevant

---

## 15. Target question bank (tick when answered out loud)

### 15.1 Always asked
- [ ] Walk a transformer step on GPU
- [ ] Prefill vs decode bottlenecks
- [ ] KV cache formula + capacity
- [ ] PagedAttention
- [ ] Continuous batching
- [ ] Serve 70B on 4×80GB
- [ ] Speculative decoding and limits
- [ ] Quantization tradeoffs
- [ ] vLLM vs TRT-LLM vs SGLang
- [ ] Estimate max throughput given X GPUs

### 15.2 Strong senior signal
- [ ] Design PD-disagg
- [ ] TP=2 vs TP=4
- [ ] MoE + EP serving sketch
- [ ] Hierarchical KV / offload
- [ ] Scheduler with preemption
- [ ] Prefix cache correctness after weight update
- [ ] Debug 40% tokens/s regression
- [ ] Multi-tenant noisy neighbor
- [ ] Reasoning-model long decode capacity
- [ ] Multi-LoRA serving

### 15.3 Coding prompts you should not see for the first time in the room
- [ ] Implement KV cache + greedy generate for a toy model
- [ ] Implement attention
- [ ] Implement a block allocator
- [ ] Implement a continuous-batch scheduler
- [ ] Implement LRU prefix cache
- [ ] Implement rate limiter + priority queue
- [ ] Stream tokens with client abort
- [ ] Triton RMSNorm

---

## 16. Labs and artifacts (this is the real “covered”)

Do not tick from reading.

- [ ] Formula sheet (1 page)
- [ ] KV capacity spreadsheet: 8B / 70B / MoE; A100 / H100 / H200; FP16 / FP8 / INT4
- [ ] vLLM vs SGLang bench writeup on one model
- [ ] Chunked-prefill sweep plot
- [ ] Prefix-cache on/off plot
- [ ] Quant quality + speed table
- [ ] Spec-decoding acceptance curve
- [ ] Nsight (or at least PyTorch profiler) screenshot + interpretation
- [ ] Triton kernel + benchmark
- [ ] 6 handwritten system-design notes
- [ ] MiniServe defense doc
- [ ] HiQCache defense doc
- [ ] RolloutCore defense doc
- [ ] One merged or close-to-merged upstream PR you can narrate
- [ ] 8+ mock hours logged (3 coding, 3 design, 2 project dive)

---

## 17. Suggested order (tick the week when planned work is actually done)

- [ ] **Week 1** — Modules 0–1; formula sheet; MiniServe defense; 3 coding primitives
- [ ] **Week 2** — Module 2–3; allocator + scheduler coding; engine comparison lab
- [ ] **Week 3** — Modules 5–6; quant + spec labs; HiQCache defense
- [ ] **Week 4** — Modules 4 + 7; PD-disagg + MoE sketches; 3 system designs
- [ ] **Week 5** — Module 8–9; Triton + profiling; 3 more designs; platform spine
- [ ] **Week 6** — Modules 10–14; mocks every other day; weak-spot repair
- [ ] **Ongoing** — keep one real OSS PR moving; do not start a fourth engine

---

## 18. Definition of ready

Tick this block last.

- [ ] I can do KV capacity math for 8B and 70B in under 3 minutes
- [ ] I can design continuous batching + paging + prefix cache without MiniServe as a crutch
- [ ] I can explain when PD-disagg and spec decoding each *hurt*
- [ ] I can pick vLLM / SGLang / TRT-LLM with a workload reason
- [ ] I can sketch MoE + EP + PD at a senior level
- [ ] I can debug a tokens/s regression with a concrete tool sequence
- [ ] I can defend MiniServe, HiQCache, and RolloutCore under hostile follow-ups
- [ ] I have timed mocks, not only notes
- [ ] I can tell 8 behavioral stories with numbers
- [ ] I would not be surprised by a 2026 question on Dynamo, FP8, EAGLE, or wide EP

If any box in this section is empty, you are not “100% ready” yet — you are still prepping, which is the point of this page.
