# System Design + DSA for Inference Teams (2026)

For Together, Baseten, Fireworks, Prime Intellect, Modal-class companies.
Not Google/Meta. Not “design Twitter.”

Companion to:
- `inference-interview-prep-checklist.md` — concepts
- `inference-interview-practical-problems.md` — broken-production scenarios and arithmetic

**Are these the same as the two lists?** No.

| You already have | This file |
|---|---|
| What KV / paging / spec decoding *are* | A 45–60 min design you can run cold |
| “Tokens/s fell, debug it” | Control plane: router, autoscaler, multi-tenant GPU pool, billing, cold start |
| A few design titles | Company-shaped prompts and the twist they add |
| Coding primitives (allocator, scheduler) | The DSA that still shows up on the phone screen, mapped to those primitives |

If you only prep the first two files, you can win the domain round and still miss the design round (no API, no failure domain, no cost) or the coding screen (intervals, heaps, concurrency).

**How these companies actually split the loop** (public candidate reports, 2025–2026, not a guarantee):

- **Together** — phone: one medium-hard coding problem, Python/C++/CUDA by role. Onsite: algorithms round + applied ML-systems coding + one design (“100+ open models, shared GPUs”). Kernel roles get a take-home.
- **Fireworks** — phone: medium DSA, sometimes systems-flavored (GPU idle intervals, scheduling). Onsite: coding + inference design (fastest 70B path, multi-tenant SLAs, spec decoding in the stack). Kernel track is CUDA, not LeetCode.
- **Baseten** — practical coding, not puzzle LeetCode: queue, rate limiter, streaming endpoint. Design: serve under burst, autoscale from queue depth, p99 spike with flat p50. Founder/goals chat is common.
- **Prime Intellect** — loop is not published. The inference MTS job is the spec: multi-tenant serving on their GPU fleet, GPU-aware placement, autoscaling, failover, vLLM/SGLang/TRT-LLM, disagg (Dynamo), and inference inside RL (`prime-rl`). Design prep should look like that job, not like a generic MLE loop.

Tick a design only after a **timed 45 min** whiteboard. Tick a DSA problem only after a **timed solve + complexity out loud**.

---

## 0. Design rubric (use every time)

Say this spine before you name vLLM.

- [ ] 1. Frame — interactive vs batch vs RL rollout vs serverless. Who is the user?
- [ ] 2. Numbers — QPS, TTFT, ITL, context mix, tenants, GPU type, budget
- [ ] 3. Request path — gateway → auth/quota → router → queue → engine → stream
- [ ] 4. Capacity math — weights, KV, concurrency, GPUs
- [ ] 5. Placement — replica vs TP vs PD-disagg vs EP; heterogeneous GPUs
- [ ] 6. Scheduler — continuous batch, priority, admission, preemption
- [ ] 7. State — KV, prefix cache, LoRA, what is sticky to a replica
- [ ] 8. Scale — queue depth, not CPU. Cold start. Warm pool
- [ ] 9. Fail — OOM, dead GPU, NCCL hang, region loss, client disconnect
- [ ] 10. Cost and isolation — noisy neighbor, TPM quota, bill per token
- [ ] 11. Rollout — new weights, new engine, drain
- [ ] 12. How you know — 6 metrics, 2 alerts

Stop at 35 minutes. Leave 10 for their twist.

---

## 1. Designs that are *not* already in the other files

The other files cover “serve 70B” and “100k QPS of 8B” as inference-engine sketches.
These are the **platform** prompts these companies actually use.

### 1.1 Multi-tenant open-model API (Together-shaped)
- [ ] Design an API that serves 100+ open models on one GPU fleet.
  - What they push: most models are cold; a few are hot; weights are 10–140GB; you cannot pin every model.
  - Cover: model registry, weight cache on local NVMe, admission by “model already resident,” bin-pack by VRAM, separate hot pool vs cold pool, load time in the SLO.
- [ ] Twist: a new 70B drops at 9am and 40 customers call it in the same minute.
- [ ] Twist: two customers must not share a prefix cache (data isolation). How do you key it?

### 1.2 Serverless inference + cold start (Baseten / Modal-shaped)
- [ ] Design scale-to-zero model serving. Idle models cost ~$0. A request may pay the cold start.
  - Cover: scale from queue depth and p99, not GPU util. Cold start = pull image + load weights + CUDA graph capture + first warmup. Concurrency target per replica. Min replicas for paid tiers.
- [ ] Twist: cold start is 45s, SLO is 2s TTFT. What do you pre-warm, and who pays?
- [ ] Twist: 500 custom fine-tunes, each used twice a day. You cannot keep them hot.

### 1.3 GPU autoscaler that does not thrash (Baseten-shaped)
- [ ] Design the scaler for a GPU inference service.
  - Signals: queue depth, oldest-item age, TTFT p99, in-flight tokens. Not CPU.
  - Cover: scale-up faster than scale-down, cooldown, max surge, model-load time, spot vs on-demand, what you do in the 8 minutes before the new node is ready (shed, degrade, queue).
- [ ] Twist: util is 95% because of a stuck kernel and the queue is empty. Your scaler must not add GPUs.

### 1.4 Fast path for one model (Fireworks-shaped)
- [ ] Design the serving path for a 70B with TTFT p99 < 200ms on H100s.
  - This is not “add more replicas.” Cover: chunked prefill vs PD-disagg, CUDA graphs, FP8, prefix cache for the system prompt, speculative decoding only if acceptance pays, regional PoP vs central cluster.
- [ ] Twist: interconnect is PCIe. Does disagg survive?
- [ ] Twist: they want the fastest *kernel* path. Where does the engine stop and a custom attention kernel start?

### 1.5 Multi-tenant GPU allocation with SLAs (Fireworks / Together)
- [ ] Design placement of many customers onto shared GPUs with per-tenant latency SLAs.
  - Cover: priority classes, KV quota per tenant, preemption, MIG / process isolation vs logical isolation, noisy-neighbor detection, chargeback.
- [ ] Twist: enterprise tenant buys reserved GPUs. Free tier is best-effort. A reserved box is idle. May free tier borrow it, and how do you evict in <1s?

### 1.6 LoRA / fine-tune hosting (Together + Baseten)
- [ ] Design a fine-tune service: customer uploads data, you train a LoRA, they call it on the shared base.
  - Cover: base model resident once, many adapters, hot-swap latency, adapter cache eviction, version pin, isolation of training GPUs from serving GPUs, eval gate before the adapter goes live.
- [ ] Twist: 2,000 adapters, 8B base, 80GB GPU. What is resident vs fetched per request?

### 1.7 Inference inside RL (Prime Intellect-shaped)
- [ ] Design the inference side of an RL post-training stack (rollouts at high concurrency, policy updates every few minutes).
  - Cover: vLLM (or SGLang) as the rollout engine, disagg when agent traces make E2E latency blow up, weight sync (NCCL hot update vs restart), **version-pure KV** (no cross-step prefix reuse), router replay / logprobs for training, KV offload GPU→CPU→disk, separate eval traffic from rollout traffic.
- [ ] Twist: a prefix-cache hit from step N-1 changes the sampled tokens at step N. How do you make that impossible?
- [ ] Twist: rollouts are 10k+ tokens (coding agents). Prefill and decode want different parallelism. Where do you split?

### 1.8 Heterogeneous GPU fleet + placement (Prime Intellect)
- [ ] Design scheduling across 4090s, A100s, H100s, and Blackwell in more than one datacenter.
  - Cover: model↔SKU fit (VRAM, FP8, NVLink island), bin-pack, data gravity of weights, failover when a site dies, cost-aware routing (cheap GPU if SLO allows).
- [ ] Twist: public-internet contributors with 100ms RTT. Pipeline parallel can work; tensor parallel will not. Say why.

### 1.9 Gateway: auth, streaming, billing (all of them)
- [ ] Design the front door of an OpenAI-compatible inference API.
  - Cover: API keys, RPM and TPM limits, streaming (SSE), cancel propagation so the GPU stops, idempotency, token accounting (input, output, cached input), retries that do not double-bill, hedge vs retry.
- [ ] Twist: client dies mid-stream. Who eats the generated tokens?
- [ ] Twist: a retry lands on a different replica and the user sees a different completion. Is that allowed?

### 1.10 Weight distribution and cold start (Prime Intellect / Together)
- [ ] Design how a 140GB checkpoint gets onto 200 GPUs without a 20-minute stampede on the object store.
  - Cover: P2P / torrent-style fanout inside the cluster, local NVMe cache, content-addressed blobs, pre-stage on the hot pool, health only after warmup tokens match a golden logprob.
- [ ] Twist: a bad quant slipped into the cache. How do you revoke it everywhere?

### 1.11 Region failover for streaming (Prime Inference-shaped)
- [ ] Design multi-datacenter failover for a streaming chat API.
  - Cover: you cannot move KV across regions cheaply. Failover = new request, or decode-affinity within a region and DNS/global router across regions. Health checks that understand “engine loaded” vs “process up.”
- [ ] Twist: one site has the only copy of a customer LoRA. Now what?

### 1.12 Batch API next to realtime (all of them)
- [ ] Design one control plane, two lanes: realtime (TTFT < 500ms) and batch (done within an hour, 5–10× cheaper).
  - Cover: separate queues, separate GPU pools or preemptible borrow, chunk size, progress API, exactly-once output write, spot kill recovery.
- [ ] Twist: batch is 80% of tokens and someone routes it onto the realtime pool “temporarily.”

### 1.13 Observability product (Baseten customer-facing)
- [ ] Design what a customer sees when their model is slow.
  - Cover: per-request trace (queue, load, prefill, decode), token usage, replica cold starts, error classes that are *their* prompt vs *your* GPU. Internal view adds NCCL, KV hit rate, preemptions.
- [ ] Twist: p99 spiked, p50 did not. Walk the trace. Do not say “scale out” first.

---

## 2. Company cheat-sheet (what to lean on)

- [ ] **Together** — many open models, shared GPUs, spec decoding, enterprise isolation, research + serving. Design 1.1, 1.5, 1.6.
- [ ] **Baseten** — productized inference, scale-to-zero, developer API, cost, p99 debugging. Design 1.2, 1.3, 1.9, 1.13. Coding is practical.
- [ ] **Fireworks** — speed, kernels, FireAttention-style fusion, multi-tenant SLAs. Design 1.4, 1.5. If the JD says kernel, DSA is secondary to CUDA/Triton.
- [ ] **Prime Intellect** — GPU cloud + RL stack + disagg inference (Dynamo, vLLM, Mooncake, NIXL). Design 1.7, 1.8, 1.10, 1.11. Your RolloutCore story maps directly.
- [ ] **Modal** — serverless containers, GPU snapshots, idle-to-zero. Design 1.2. Less “write a kernel,” more “lifecycle of a GPU function.”

Do not open these interviews with a recommendation-system design. They will redirect you, and you will have lost ten minutes.

---

## 3. DSA — the short list that matches these loops

Do **not** grind 200 LeetCode hards. Phone screens here are medium, or medium with a systems costume. Baseten may skip classic DSA entirely. Together/Fireworks still have one algorithms round.

Rule: if you can write the pattern cleanly in 25 minutes and state complexity, stop. Then do the “applied” variant, which is what the second coding round is.

### 3.1 Must (do all)

**Hashing / strings**
- [ ] Two sum / group anagrams — warmup only
- [ ] Longest substring without repeating characters
- [ ] Minimum window substring
- [ ] LRU cache (design + implement) — prefix-cache cousin
- [ ] Implement a trie, then longest common prefix

**Heaps / scheduling**
- [ ] K closest points, or top-k frequent — heap fluency
- [ ] Merge k sorted lists
- [ ] Task scheduler (cooldown)
- [ ] Meeting rooms II (min GPUs / rooms)
- [ ] Car pooling / capacity over a timeline
- [ ] Single-threaded CPU / least-interval scheduling
- [ ] IPO or “maximize capital” — only if heaps feel shaky

**Intervals (Fireworks has asked idle-interval style)**
- [ ] Merge intervals
- [ ] Insert interval
- [ ] Non-overlapping intervals
- [ ] Interval list intersections
- [ ] Employee free time (common free slots across calendars)
- [ ] Applied: global idle intervals across many GPUs, each with a busy list

**Queues / sliding window / binary search**
- [ ] Sliding window maximum
- [ ] Binary search on answer (min capacity to ship, koko eating bananas)
- [ ] Time-based key-value store
- [ ] Design hit counter / rate limiter (fixed window, then token bucket)

**Graphs (light)**
- [ ] Number of islands
- [ ] Course schedule (cycle) and course schedule II (topo order)
- [ ] Network delay time (Dijkstra)
- [ ] Applied: model-load dependency DAG, deploy order

**Concurrency / practical (Baseten-weighted — higher value than hard DP)**
- [ ] Bounded blocking queue
- [ ] Rate limiter safe under concurrent callers
- [ ] Token bucket + max in-flight
- [ ] Worker pool that batches up to N items or T milliseconds, whichever first
- [ ] Streaming reader with cancel: producer stops when consumer drops
- [ ] Applied: chunk a byte stream into fixed blocks and flush

**Systems-shaped coding (second round — do these even if DSA feels fine)**
- [ ] Continuous-batch scheduler with a token budget
- [ ] Block allocator with free list + refcount
- [ ] Priority queue of requests with preemption
- [ ] Radix / prefix map: insert, longest hit, evict by bytes
- [ ] Cancel a streaming generation without leaking the KV slot
- [ ] Fair queue across tenants (deficit round robin or weighted)
- [ ] Admission check: given KV bytes and free blocks, accept or reject

### 3.2 Nice, not required

- [ ] 10 classic DP problems only if a recruiter says “algorithms round, Facebook-style”: house robber, coin change, LCS, edit distance, longest increasing subsequence, word break, partition equal subset, unique paths, decode ways, maximal square
- [ ] Union-find (redundant connection) — rare here
- [ ] Binary indexed tree / segment tree — skip unless the JD says performance infra
- [ ] Hard graph (word ladder II, alien dictionary) — skip
- [ ] Monotonic stack (daily temperatures, largest rectangle) — one problem so you are not blank

### 3.3 Do not spend a week on

- [ ] Contest DP, digit DP, heavy string hashing
- [ ] 150 hard problems “for safety”
- [ ] SQL puzzles, unless the role is data platform
- [ ] Re-implementing a full inference engine in the interview window

### 3.4 CUDA / Triton track (only if the JD says kernel)

Fireworks and some Together roles. Skip for Baseten product/platform and for Prime Intellect inference-platform unless the posting says kernels.

- [ ] Numerically stable softmax
- [ ] Vector reduction in shared memory
- [ ] Triton RMSNorm or a fused add+norm
- [ ] Explain why a kernel is memory-bound from a profiler sketch
- [ ] Boundary threads, tail blocks, no out-of-range reads

---

## 4. How to practice a design (one sitting)

- [ ] Pick a prompt from section 1. Set a 45 min timer.
- [ ] First 5 min: questions you ask them (SLO, mix, hardware, tenants).
- [ ] Next 10 min: request path + one capacity number on the board.
- [ ] Next 15 min: scheduler, placement, failure.
- [ ] Last 10 min: invent the twist yourself from section 1 and answer it.
- [ ] Write 8 lines after: what you skipped, what they would have attacked.

Do 6 of these before you call design done. Minimum set: 1.1, 1.2, 1.3, 1.7, 1.9, and one of 1.4 or 1.8 depending on the company.

---

## 5. Definition of ready for *these* companies

- [ ] I can run the 12-step rubric without the inference syllabus in front of me
- [ ] I can design multi-model cold start and GPU autoscale from queue depth
- [ ] I can design RL rollout serving with versioned KV (Prime Intellect)
- [ ] I can design a streaming gateway that cancels GPU work and does not double-bill
- [ ] I can do merge-intervals, heap scheduling, LRU, rate limiter, and topo sort timed
- [ ] I can write a batching scheduler and a block allocator without looking at MiniServe
- [ ] I know which company wants kernels (Fireworks) vs practical Python (Baseten) vs RL+fleet (Prime Intellect) vs many-model serving (Together)
- [ ] I will not answer “design our API” with only “use vLLM and PagedAttention”
