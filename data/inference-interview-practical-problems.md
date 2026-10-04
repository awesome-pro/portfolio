# Inference Interview — Real-World Problem Bank (2026)

Companion to `inference-interview-prep-checklist.md`.

The first checklist is the syllabus. This file is the **live problems** interviewers actually use: a broken service, a capacity number that does not fit, a constraint that changes mid-answer. Concept questions are necessary. These are what decide senior offers.

**How to tick**
- Tick only after you answered **out loud, timed**, with numbers and a diagnosis order.
- A good answer names the metric you would look at first, the tradeoff you accept, and what you would *not* do.
- Do not tick from reading the “what they want” line.

**Shape of a strong answer**
1. Restate the constraint and the SLO that matters (TTFT vs ITL vs cost vs correctness).
2. Do the arithmetic before naming a tool.
3. Rank hypotheses by how cheap they are to check.
4. Propose one change, say what it breaks, say how you would know it worked.
5. Stop. Do not dump the whole stack.

---

## A. Live debugging (highest probability at labs and platforms)

These are the “tough” questions. Interviewer gives a symptom and keeps asking “then what?”

### A1. Throughput fell, GPU looks busy
- [ ] **Symptom.** vLLM cluster was doing ~X tokens/s/GPU. After a config change it does ~40% of that. `nvidia-smi` shows high GPU util. No OOMs. Error rate is flat.
  - What they want: outside-in debug. Distinguish SM-busy-but-useless (tiny kernels, launch bound, bad fusion) from real compute. Ask for `num_running`, batch-size histogram, prefill/decode mix, prefix-cache hit rate, graph-capture status. Do not start by rewriting a kernel.
- [ ] **Follow-up.** Util is 100% but power is half of TDP. What does that mean?
- [ ] **Follow-up.** Util is 30%. Where do you look next (CPU scheduler, tokenizer, queue, NCCL, Python)?

### A2. TTFT doubled, ITL flat
- [ ] **Symptom.** p99 time-to-first-token doubled this morning. Inter-token latency is unchanged. GPU memory is fine.
  - What they want: this is a *queue or prefill* problem, not a decode-kernel problem. Check arrival rate, prompt-length histogram, queue depth, chunked-prefill budget, a new long system prompt, a canary that disabled prefix cache.
- [ ] **Follow-up.** A customer launched a 32k-prompt agent. How do you protect everyone else in the next hour, and properly next week?

### A3. ITL doubled, TTFT flat
- [ ] **Symptom.** First token is fine. Streaming feels stuck. Concurrency is similar to yesterday.
  - What they want: decode slots collapsed. KV pressure, batch size dropped, preemption storm, a long CoT reasoning model eating the step, speculative decoding with a bad acceptance rate, CUDA graph disabled so launch overhead dominates.
- [ ] **Follow-up.** Memory util is 92% and preemption count is climbing. What do you change first: reject, swap, quantize KV, or cap max tokens?

### A4. Occasional gibberish, no crash
- [ ] **Symptom.** About 1 in 1000 requests returns nonsense. Temperature 0. Only under load. Reference HF generate is clean. No CUDA error.
  - What they want: correctness bug, not quality. Compare logprobs vs a reference. Check scheduler ordering (decode before prefill), stale KV after a weight update, block-table mixup, index overflow, wrong request id in a fused kernel. Reproduction trick: shrink GPU memory util so the bug becomes deterministic.
- [ ] **Follow-up.** It only happens after a hot weight update. What invariant did you break?

### A5. Prefix cache made things worse
- [ ] **Symptom.** You turned on automatic prefix caching. Tokens/s dropped. Hit rate looks “okay” in the metric.
  - What they want: hash overhead, eviction thrash, wrong block size, cache hits that are not actually shared (different chat templates), CPU-side radix lock, or hits on prefixes so short they do not pay for themselves. Also: stale hits after a LoRA or base-weight swap.
- [ ] **Follow-up.** Hit rate went from 57% to 73% but p99 ITL got worse. Explain a world where that is possible.

### A6. OOM only on reasoning traces
- [ ] **Symptom.** Chat traffic is fine. A reasoning model OOMs around 20–30k generated tokens even though weights fit easily.
  - What they want: KV grows with *output*, not just prompt. Do the bytes. Then: max-token cap, preemption, KV offload, KV quant, or a separate long-trace pool. Evicting tokens inside a paged block does **not** free the block until you compact.
- [ ] **Follow-up.** You evict 90% of tokens and VRAM barely moves. Why?

### A7. NCCL timeout after a deploy
- [ ] **Symptom.** TP=8 job. One node flapped. Remaining ranks hang. Clients see timeouts, not a clean 503.
  - What they want: failure domain of a TP group (one dead GPU kills the replica). Health checks, drain, process-group restart, not “retry the request on the same hung group.” Difference between NVLink-island failure and IB failure.
- [ ] **Follow-up.** How do you drain a replica that is mid-stream without corrupting the client token stream?

### A8. Quant “won” offline, lost online
- [ ] **Symptom.** AWQ INT4 beat FP16 on a 200-prompt GSM8K slice. Production tool-calling JSON validity dropped, and support tickets rose. Perplexity barely moved.
  - What they want: eval did not match the serving contract. Structured output, long context, rare tokens, calibration-set mismatch, LM head quantized by accident. Rollback path. What you would add to CI.
- [ ] **Follow-up.** Which tensors do you refuse to quantize, and how do you prove it?

### A9. Spec decoding regression
- [ ] **Symptom.** EAGLE-3 was a win on chat. On the code-agent traffic it *increased* TPOT and GPU memory.
  - What they want: acceptance-rate math. Draft cost + rejected tokens. Extra KV for draft tree. Interaction with grammar constraints. Disable per-route, do not globally.
- [ ] **Follow-up.** Acceptance is 0.55 and k=6. Is it faster? Write the inequality.

### A10. Cost spike with flat traffic
- [ ] **Symptom.** Request count is flat. GPU-hours up 2×. Token dashboards look normal if you only watch output tokens.
  - What they want: input-token explosion (agent loops resending full history), retry storms, missing prompt cache, a router that stopped sending repeats to the same replica, batch API accidentally on real-time pool.
- [ ] **Follow-up.** You already have prefix cache. Why can a multi-turn agent still 3× the bill?

---

## B. Capacity and arithmetic (they will make you compute)

Tick when you can do it on a blank page in under 5 minutes. Use KaTeX-style formulas in your notes:

$$
\text{KV per token} = 2 \times L \times n_{\text{kv}} \times d \times b
$$

$$
\text{max concurrent} \approx \frac{V_{\text{usable}} - W - A}{\text{KV per token} \times \text{avg len}}
$$

- [ ] **B1.** Llama-70B, GQA, FP16 weights, 8k context, 4× A100 80GB. Does it fit? What TP? How many concurrent decodes? State the assumptions you refuse to hide.
- [ ] **B2.** Same model, FP8 weights, 8× H100 80GB. What got cheaper: weight residency or KV?
- [ ] **B3.** Qwen-class 8B on one 80GB GPU. Product wants 128 concurrent users at 4k context. Possible? If not, what do you cut first?
- [ ] **B4.** A 32k-token chain-of-thought on a 32B model with 4-bit weights, 24GB GPU. Where does it die, and at roughly what token?
- [ ] **B5.** HBM bandwidth 3 TB/s. Decode moves ~2 bytes × params per token at batch 1. What is the roofline tokens/s? Why is real decode lower?
- [ ] **B6.** Prefix cache hit rate 70% on a workload whose prompts share a 2k system prompt and then diverge. How much prefill FLOP did you actually save?
- [ ] **B7.** Spec decoding: draft is 5× cheaper per token, acceptance 0.7, k=4. Speedup or not? Include the verify step.
- [ ] **B8.** 100k req/s of an 8B, average 200 in / 100 out. How many H100s at a stated tokens/s/GPU? Then add 50% headroom and a warm pool.
- [ ] **B9.** $/1M output tokens. One H100 at $3/hr fully loaded, 2k output tokens/s at your operating point, 60% of the hour busy. Compute it. Say what you left out (input tokens, networking, idle).
- [ ] **B10.** TP=4 vs 4 replicas of TP=1 for an 8B on a chat workload with p99 ITL < 30ms. Which wins, and why the answer flips if the model is 70B?

---

## C. Design problems that change halfway (onsite shape)

Do the full spine: requirements → math → engine → scheduler → failure → cost. Then answer the twist without restarting.

- [ ] **C1. Chat API, 70B, millions of daily users.** TTFT p99 < 500ms, ITL < 50ms, streaming.
  - Twist: prompt lengths suddenly include 32k agent traces. Do you disaggregate, isolate, or reject?
- [ ] **C2. 100k req/s of an 8B.** Mostly short.
  - Twist: 5% of traffic is a batch job that can wait 10 minutes. Do not put it on the same queue.
- [ ] **C3. Multi-tenant inference API.** Free, pro, enterprise. Shared GPU pool.
  - Twist: one tenant’s 100k-context job OOMs the node. What is the admission rule, and what is the blast radius?
- [ ] **C4. Anthropic-style batcher.** One GPU, up to 100 inputs, users wait synchronously. Maximize util without breaking latency.
  - Twist: arrivals are bursty, 80% of prompts share a system prefix.
- [ ] **C5. Serverless, 100 open models on one fleet.** Most are cold.
  - Twist: a launch spikes one model 50× for 20 minutes. GPU cold start is 5–15 min.
- [ ] **C6. Reasoning model service.** Outputs are 4k–32k. Users will pay for quality.
  - Twist: product also wants a “fast mode” on the same endpoint. How do queues, KV budgets, and pricing split?
- [ ] **C7. RL rollout fleet (your RolloutCore problem).** Training step every N minutes. Rollouts must be version-pure.
  - Twist: a prefix-cache hit from the previous policy would silently poison the batch. How do you make that impossible, not just unlikely?
- [ ] **C8. Long-context 200k.** Legal / repo QA.
  - Twist: interconnect is PCIe, not NVLink. Is PD-disagg still your answer?
- [ ] **C9. Multimodal chat.** Image-heavy, short answers.
  - Twist: vision encode is 40% of TTFT. Do you split an encoder tier?
- [ ] **C10. Regional failover for a streaming API.**
  - Twist: you cannot resume a decode on another region without the KV. What do you actually fail over?

---

## D. Production judgment (no single right architecture)

Interviewers score the tradeoff, not the keyword.

- [ ] **D1.** vLLM vs SGLang vs TensorRT-LLM for a team that ships new open models the day they drop, on H100s, with multi-turn agents. Pick one. Say what you give up.
- [ ] **D2.** Chunked prefill on or off for a voice agent with a 150ms TTFT budget and short prompts.
- [ ] **D3.** FP8 vs INT4 for a math/coding model on H100. Quality bar is “tool JSON must parse.”
- [ ] **D4.** A researcher wants a new CUDA graph per request shape. You want one frozen decode graph. Who wins, and how do you compromise?
- [ ] **D5.** Product wants p99. You can hit p50 easily and p99 only by holding 2× idle GPUs. What do you show them?
- [ ] **D6.** Semantic cache (cosine) vs a trained equivalence classifier vs exact prefix cache. A user asks “same question, different patient.” Which cache are you willing to trust?
- [ ] **D7.** Hot-swap LoRA in the serving process vs spin a replica per adapter. 200 adapters, 8B base, tight RAM.
- [ ] **D8.** Spot GPUs for the batch API. A spot kill hits mid-document. What did you checkpoint, and what does the client see?
- [ ] **D9.** You can cut cost 30% by dropping prefix cache affinity and packing GPUs tighter. Latency SLO is already green. Do you?
- [ ] **D10.** An engineer proposes writing a custom attention kernel before turning on chunked prefill and checking the length mix. What do you say?

---

## E. Incident stories they will push on *your* work

Rehearse with your real numbers. If you do not have the number, say so and give the measurement you would run.

- [ ] **E1.** MiniServe: 120-request shared-prefix workload, 97% prefill work saved. Interviewer asks: what if the shared prefix is 50 tokens, not 2k? Does the win survive?
- [ ] **E2.** MiniServe matched HF greedy to 6e-8 logit error. Interviewer asks: what does that *not* prove (sampling, batching numerics, long context, paged vs contiguous)?
- [ ] **E3.** HiQCache: 43.75% host KV cut, 1.78× L2 capacity, hit rate ~57% → ~73%. Interviewer asks: did GPU-side ITL move, or only host capacity? What accuracy check did you run after INT8 restore?
- [ ] **E4.** RolloutCore: 4.25s hot update vs 37s restart. Interviewer asks: what happens to in-flight requests during drain? Show the stale-cache experiment (32 wrong hits).
- [ ] **E5.** Browzer: ~3× cost/run on 700k calls via routing, compression, prompt cache. Interviewer asks: which lever was most of the 3×, and what broke when you compressed too hard?
- [ ] **E6.** Spec-decoding measurement that did not go as planned. Interviewer asks: what would you instrument next time before renting the GPU?
- [ ] **E7.** A SGLang/vLLM PR you opened. Interviewer asks: what invariant were you protecting, and how did CI fail to catch it before?

---

## F. Practical coding problems (not LeetCode)

Timed. Talk while you write. 25–40 minutes each.

- [ ] **F1.** Block allocator. `alloc(n_blocks) -> ids | None`, `free(ids)`, `fork(ids) -> ids` with refcount. Then: what fragmentation remains inside a block?
- [ ] **F2.** Continuous-batch scheduler. Requests arrive with prompt length and priority. Each step has a token budget. Mix waiting prefills and running decodes. No starvation.
- [ ] **F3.** Preemption. Memory is short. Pick a victim. Recompute vs swap. Do not preempt a request that is one token from EOS if a fairer victim exists. Explain the policy in one sentence.
- [ ] **F4.** Radix / prefix cache. Insert token sequences, longest-prefix lookup, LRU eviction in bytes not entries.
- [ ] **F5.** Streaming generator. Client reads slowly. Bound memory. Abort must free KV before the next step.
- [ ] **F6.** Toy speculative verify. Draft proposes k tokens, target returns k+1 logits, you accept a prefix. Return accepted ids. Handle rejection.
- [ ] **F7.** Multi-tenant token bucket plus a concurrency cap. Enterprise can preempt free. No deadlock if a preempted request is mid-prefill.
- [ ] **F8.** Given a length histogram and KV bytes/token, write the function that returns max admission length so p99 memory stays under a cap.
- [ ] **F9.** (Senior) Triton RMSNorm or numerically stable softmax, with a test against PyTorch.
- [ ] **F10.** (Senior) Explain a 30-line attention kernel someone else wrote. Point at the bank-conflict or the uncoalesced load without rewriting it.

---

## G. “What would you do on Monday” (hiring-manager practical)

- [ ] **G1.** You join a team serving an 8B on vLLM. p99 TTFT is 2s, target is 400ms. You have one week and one GPU node. Ordered plan.
- [ ] **G2.** Leadership wants to self-host a 70B instead of calling an API. Build the go / no-go: break-even QPS, quality, on-call, eval.
- [ ] **G3.** A new open MoE drops tonight. Product wants it in the API by tomorrow. What do you refuse to skip (correctness, quant, EP, load test)?
- [ ] **G4.** On-call page: error rate 0, latency 3×, GPU mem 96%. You have 15 minutes before you shed load. Actions, in order.
- [ ] **G5.** Two teams want the same 8×H100 box: training and online serving. How do you split, and what SLO did you refuse to share a GPU for?
- [ ] **G6.** Design the dashboard you would not ship without. Name 8 metrics and the alert on each.
- [ ] **G7.** A customer says “the model got dumber after your infra change.” GPU metrics are green. How do you prove or disprove it?
- [ ] **G8.** You must cut the GPU bill 25% this quarter without a model change. Rank levers: batching, quant, cache, routing, disagg, smaller draft, spot, reject long context.

---

## H. Twist follow-ups (practice these as interruptions)

Read the stem, answer, then force yourself to take the twist.

- [ ] **H1.** You chose PD-disagg. Twist: KV transfer is 80ms and your ITL budget is 40ms.
- [ ] **H2.** You chose TP=8. Twist: the node is PCIe, not NVLink.
- [ ] **H3.** You chose prefix cache. Twist: every request has a unique user id in the first message.
- [ ] **H4.** You chose INT4. Twist: the eval set was Wikipedia and the product is code.
- [ ] **H5.** You chose continuous batching. Twist: one request generates 16k tokens and never hits EOS.
- [ ] **H6.** You chose a warm pool. Twist: finance will not pay for idle GPUs above 20%.
- [ ] **H7.** You chose speculative decoding. Twist: the draft model’s chat template does not match.
- [ ] **H8.** You routed by least-loaded. Twist: 60% of prompts share a prefix and you just destroyed cache affinity.
- [ ] **H9.** You hot-swapped weights. Twist: 30 requests still hold KV from the old step.
- [ ] **H10.** You scaled on GPU util. Twist: util is 95% because of a stuck kernel, queue is empty.

---

## I. How to practice one problem (do not skip)

For each ticked item, keep a 10-line note:

- [ ] Symptom / ask
- [ ] Number you computed
- [ ] First metric you would open
- [ ] Top 3 hypotheses, ranked
- [ ] Change you ship
- [ ] What that change makes worse
- [ ] How you know it worked (metric + eval)
- [ ] What you explicitly will not do yet

Target: **12 problems out loud** before you call this bank done. Minimum mix: 4 from A, 3 from B, 3 from C, 2 from F.

---

## J. What the first checklist already covered

So you do not double-count:

- Concept modules (KV, paging, batching, quant, spec, MoE, PD-disagg, kernels) live in the syllabus file.
- Short design titles (70B chat, 100k QPS, multi-tenant) live there too.
- This file is the **scenario layer**: symptoms, twists, arithmetic under pressure, and your own projects under hostile follow-up.

If a mock interviewer only asks “what is PagedAttention,” you are in an easy screen. If they say “ITL doubled, TTFT flat, mem at 92%, what do you do,” you are in the round this file is for.
