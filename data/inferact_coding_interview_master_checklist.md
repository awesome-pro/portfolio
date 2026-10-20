# Inferact MTS Inference — Coding Interview Master Checklist

**Prepared:** 20 October 2026  
**Purpose:** Track mastery by implementation, testing and timed mock interview, not by watching videos or reading docs.  
**Status markers:** `[ ]` not passed; `[x]` demonstrated in a practical assessment.  
**Priorities:** **P0** essential for the inference role; **P1** high value; **P2** conditional/deeper.  
**Note:** These are tailored practice exercises, not a verified list of Inferact interview questions. The recruiter guide confirms CoderPad, independent coding, code quality, Triton for kernel-focus, PyTorch for inference-focus, and a preferred language for distributed/general questions.

## Passing rule

A checkbox is **passed** only if you can, unaided: (1) explain input/output and constraints; (2) implement it from a blank editor; (3) test edge cases; (4) give complexity or performance reasoning; (5) handle one change request. Mark topics 'studied' in notes, not as checked, if you only read them.

For timed work, use a 35–45-minute clock per medium exercise and 60 minutes for larger model/kernel implementations. These are preparation targets, not company-specific time limits.

---

## 0. Interview setup and coding habits — P0

- [ ] **S01** Confirm recruiter-provided coding track (inference/PyTorch; kernel/Triton; distributed/general), duration, and whether GPU execution is available. Until confirmed, prepare all tracks to baseline.
- [ ] **S02** Try a real CoderPad practice session; verify editing, running, library imports, testing and debugging behavior.
- [ ] **S03** Independently code without Copilot, agents, AI, or snippets during timed practice.
- [ ] **S04** Practice verbalizing requirements, shapes, assumptions and edge cases before implementation.
- [ ] **S05** Practice first delivering a correct reference implementation, then optimizing if needed.
- [ ] **S06** Use asserts or a small test harness for normal, empty, boundary and adversarial cases.
- [ ] **S07** Track each session's date, elapsed time, test pass rate, hints, and mistakes.
- [ ] **S08** Reattempt failed questions from a blank editor after 48–72 hours.

## 1. Python fundamentals and general DSA — P0

### Python fluency
- [ ] **P01** Use lists, tuples, sets, dicts; know average/worst-case operations and mutation semantics.
- [ ] **P02** Use `collections.deque`, `defaultdict`, `Counter`, `OrderedDict` when justified.
- [ ] **P03** Use `heapq`, `bisect`, `sorted(key=...)`, `enumerate`, `zip`, generators.
- [ ] **P04** Understand shallow vs deep copies, aliasing, default mutable arguments and closure traps.
- [ ] **P05** Write readable functions/classes with type hints, clear names and invariants.
- [ ] **P06** Explain algorithmic time/space complexity and justify data-structure selection.
- [ ] **P07** Write basic unit tests and isolate a bug from a failing minimal example.

### Independent coding exercises
- [ ] **P08** Hash map / frequency counting problem; include duplicate and empty-input tests.
- [ ] **P09** Sliding window or two-pointer problem; justify O(n) or O(n log n) behavior.
- [ ] **P10** Intervals (merge or conflict detection); prove ordering and overlap cases.
- [ ] **P11** Binary search / lower bound with off-by-one edge cases.
- [ ] **P12** Heap-based top-k or task prioritizer; explain tie-break behavior.
- [ ] **P13** BFS/DFS graph traversal; handle disconnected graphs and cycles.
- [ ] **P14** Implement an LRU cache with O(1) expected get/put (or explain Python-specific OrderedDict alternative).
- [ ] **P15** Bounded queue / producer-consumer data structure with clear API and edge cases.
- [ ] **P16** Implement a lightweight trie / prefix index and search/insert/delete or safe refcounts.
- [ ] **P17** Write one debugging/refactoring exercise on intentionally flawed code.

## 2. PyTorch and tensor programming — P0

### Tensor fundamentals
- [ ] **T01** Predict output shapes of indexing, slicing, broadcasting and batch matmul before running code.
- [ ] **T02** Use `reshape`, `view`, `permute`, `transpose`, `contiguous`, `flatten` correctly; explain views vs copies.
- [ ] **T03** Explain `.stride()`, `.storage_offset()`, dtype, device and contiguous vs noncontiguous storage.
- [ ] **T04** Use `einsum`, `matmul`, `bmm`, `gather`, `scatter`, `index_select`, masking, reductions.
- [ ] **T05** Handle device/dtype mismatches, inplace aliasing, unintended broadcasting and dynamic shapes.
- [ ] **T06** Explain reduction precision (FP16/BF16 vs FP32 accumulation), stability and test tolerances.
- [ ] **T07** Know inference execution modes (`no_grad`, `inference_mode`) and basics of autograd, even when implementing forward only.

### Core implementations — type every one from blank editor
- [ ] **T08** Stable softmax (subtract max); verify against `torch.softmax` on small, large and extreme logits.
- [ ] **T09** RMSNorm and LayerNorm in PyTorch; understand epsilon placement and reduction dimensions.
- [ ] **T10** Scaled dot-product attention with correct scale, shapes and masks.
- [ ] **T11** Multi-head causal attention on `[B,S,H]` or `[B,H,S,D]`; verify with reference.
- [ ] **T12** Grouped-query attention with Hq divisible by Hkv; verify head-to-group mapping.
- [ ] **T13** Rotary positional embeddings with nonzero start position; verify shape and pairing convention.
- [ ] **T14** KV-cache incremental decode with preallocated cache; validate outputs against full recomputation.
- [ ] **T15** Correct causal attention when query length is smaller than KV length (position-offset aware masking).
- [ ] **T16** Variable-length batched attention using padding or explicit sequence-length mask; prevent cross-request attention.
- [ ] **T17** Greedy sampling, temperature sampling, top-k and top-p; handle disabled/edge values.
- [ ] **T18** Symmetric per-tensor and per-group INT8 quantization/dequantization, scales, zero groups and clipping.
- [ ] **T19** Minimal transformer block forward: norm → QKV → attention → residual → MLP → residual.
- [ ] **T20** Build a slow correct autoregressive generation loop, then extend to KV caching.
- [ ] **T21** Implement top-k MoE expert dispatch and combine using PyTorch operations (optional if short on time).
- [ ] **T22** Debug an incorrect attention implementation (wrong transpose, mask or head mapping).

## 3. Inference-runtime coding — P0

- [ ] **I01** Write request state and an iteration-based continuous-batching scheduler from scratch.
- [ ] **I02** Enforce `max_num_batched_tokens` with chunked prefill plus decode tokens.
- [ ] **I03** Implement admission under a limited number of running requests and finite KV capacity.
- [ ] **I04** Implement fixed-size physical KV-block allocate/free plus per-request logical-to-physical mapping.
- [ ] **I05** Compute additional blocks needed at token boundaries, including zero tokens and partially filled last block.
- [ ] **I06** Write prefix-block hashing with chain dependence and full-block-only materialization.
- [ ] **I07** Implement refcounts and shared-block protection; test copy-on-write or private-tail behavior.
- [ ] **I08** Implement a simple LRU-based evictable prefix cache with protected/in-use entries.
- [ ] **I09** Implement one preemption/recompute policy under KV pressure; test state transitions.
- [ ] **I10** Implement a queue fairness policy; demonstrate starvation scenario and mitigation.
- [ ] **I11** Write a throughput/latency metric aggregator from request events (queue delay, TTFT, TPOT/ITL, p95).
- [ ] **I12** Test request cancellation, duplicate IDs, cache capacity exhaustion and near-simultaneous arrivals.
- [ ] **I13** Implement a simple quantized host-KV record layout with payload+scale+alignment accounting.
- [ ] **I14** Trace end-to-end correctness of an incremental decoder under dynamic admission / multiple requests (stretch).

## 4. Triton GPU kernels — P1, promote to P0 if kernel-track confirmed

### Fundamentals
- [ ] **K01** Explain Triton execution: program grid, `tl.program_id`, `tl.arange`, `BLOCK_SIZE`, masks, pointer arithmetic.
- [ ] **K02** Understand a GPU's threads/warps/SMs, memory hierarchy and why coalesced loads matter.
- [ ] **K03** Use `tl.load`/`tl.store` safely for arbitrary input sizes, including non-power-of-two tails.
- [ ] **K04** Explain `tl.constexpr`, `num_warps`, grid configuration, register pressure and occupancy at a basic level.
- [ ] **K05** Recognize memory-bound vs compute-bound operations using approximate bytes and FLOPs.

### Kernel implementations
- [ ] **K06** Triton vector addition, with tests on irregular lengths.
- [ ] **K07** Triton fused elementwise operation (bias + activation or residual + scale).
- [ ] **K08** Triton row reduction (sum/max) with stable indexing.
- [ ] **K09** Triton numerically stable row-wise softmax; compare against PyTorch.
- [ ] **K10** Triton RMSNorm or LayerNorm forward; test irregular widths and dtype differences.
- [ ] **K11** Understand and modify a tiled GEMM tutorial; reason about tile shapes and memory reuse.
- [ ] **K12** Simple Triton INT8 quantize/dequantize or packing/unpacking kernel (valuable for HiQCache).

### Testing and optimization
- [ ] **K13** Write correctness test sweep across dtype, size, edge cases, CPU/PyTorch reference and tolerance.
- [ ] **K14** Benchmark correctly with GPU synchronization/events; distinguish kernel time and end-to-end Python call time.
- [ ] **K15** Explain two optimization levers and one correctness/performance tradeoff for each built kernel.
- [ ] **K16** Read a simple Triton kernel and spot wrong masks, shape mismatch, incorrect strides or out-of-bounds access.
- [ ] **K17** Stretch: understand online softmax/FlashAttention tiling; do not sacrifice K06–K16 to memorize a full FA kernel.

**Environment:** Run kernels on supported NVIDIA/AMD GPU hardware. A Mac-only local environment is sufficient for Python/PyTorch practice, not a substitute for running CUDA Triton examples. Confirm CoderPad GPU environment before assuming kernels can execute there.

## 5. Distributed and systems programming — P1

- [ ] **D01** Implement thread-safe or async bounded work queue in your chosen language; define cancellation/shutdown semantics.
- [ ] **D02** Implement a request scheduler based on priorities/weights with fairness bounds.
- [ ] **D03** Implement consistent hashing or simple sharding and quantify key redistribution.
- [ ] **D04** Implement a rate limiter (token bucket) and reason about concurrent accesses.
- [ ] **D05** Implement timeout/retry with idempotency and bounded exponential backoff.
- [ ] **D06** Implement simple aggregation over worker results and handle duplicates/missing results.
- [ ] **D07** Understand race conditions, locks, deadlocks and Python GIL limitations.
- [ ] **D08** Explain processes vs threads vs asyncio for compute and I/O workloads.
- [ ] **D09** Compute and explain AllReduce/AllGather/ReduceScatter/All-to-All tensor partitions; code a toy reference if asked.
- [ ] **D10** Implement partitioning/reassembly of an array across N logical workers, including uneven sizes.
- [ ] **D11** Test transient errors, worker failure, late completion, and partial-result recovery.

## 6. Interview follow-up questions — practice with each implementation

- [ ] **F01** State time and space complexity, including allocated temporary tensors.
- [ ] **F02** State correctness invariants and prove them on at least one edge case.
- [ ] **F03** Identify the hottest operation and reason about memory traffic/compute cost.
- [ ] **F04** Handle zero-sized inputs, single element, duplicate inputs and invalid shapes.
- [ ] **F05** Handle noncontiguous tensors and incorrectly assumed strides.
- [ ] **F06** Discuss FP16/BF16 numerics, overflow, accumulation and tolerance.
- [ ] **F07** Support streaming/chunked input rather than full offline input.
- [ ] **F08** Change a batch=1 solution into a batched implementation with uneven lengths.
- [ ] **F09** Explain why a vectorized PyTorch implementation may outperform Python loops.
- [ ] **F10** Defend why an optimization helps or does not help at small batch / small tensor size.
- [ ] **F11** Name meaningful instrumentation and benchmark measurements.
- [ ] **F12** Explain one alternative design and why you didn't choose it.

## 7. Mock-interview gates — P0

- [ ] **M01** Baseline Python/general problem, 40 min, unaided; score and log mistakes.
- [ ] **M02** Baseline PyTorch/attention problem, 45–60 min, unaided; score and log mistakes.
- [ ] **M03** Python timed mock #1 with one surprise modification.
- [ ] **M04** PyTorch timed mock #1 with tensor shape and numerical tests.
- [ ] **M05** Triton kernel coding mock (if accessible GPU); otherwise write, review and walk through indexing and edge cases.
- [ ] **M06** Inference-runtime coding mock (KV blocks, scheduler, or cache) with failing tests to debug.
- [ ] **M07** Full 45–60 min blind mock with live communication and follow-ups.
- [ ] **M08** Second blind mock on the weakest remaining domain.
- [ ] **M09** Re-solve every critical failed problem from a blank editor at least once.
- [ ] **M10** Run final mixed mock at least two days before coding round and prioritize sleep/rest afterward.

---

## Self-scoring rubric (preparation rubric, not Inferact's)

Score each category 0–4:

| Dimension | 0 | 2 | 4 |
|---|---|---|---|
| Requirements | Did not identify inputs/constraints | Some clarifications | Explicit assumptions, shapes and cases |
| Correctness | Nonworking | Main case works, edge cases fail | Main and edge tests pass |
| Code quality | Hard to read | Readable but fragile | Clear, modular, consistent |
| Performance | No analysis | Rough complexity | Bottlenecks and tradeoffs accurately explained |
| Testing/debugging | No validation | Only examples | Focused edge/adversarial tests and debugging |
| Communication | Silent/confused | Sporadic explanation | Clear and collaborative reasoning |

**Pass target:** score >= 3/4 in every dimension on two consecutive unseen mocks, with no major correctness failures. If that does not happen, repeat the relevant track before moving on. No mock can guarantee hiring results.