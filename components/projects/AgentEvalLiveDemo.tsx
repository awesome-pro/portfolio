"use client";

import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Play,
  RotateCcw,
  Square,
  XCircle,
} from "lucide-react";

import ReplayTerminal, {
  type TraceStep as ReplayTraceStep,
} from "@/components/projects/ReplayTerminal";
import { Button } from "@/components/ui/button";

type DemoMode = "healthy" | "regression";
type DemoProvider = "openai" | "anthropic";

interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
  result: unknown;
  duration_seconds: number;
  error: string | null;
}

interface AgentTrace {
  run_id: string;
  input: string;
  output: string | null;
  passed: boolean;
  duration_seconds: number;
  effective_steps: number;
  error: string | null;
  assertion_errors: string[];
  metadata: {
    mode?: string;
    provider?: string;
    model?: string;
    run_index?: number;
    variant?: string;
    live_llm?: boolean;
    llm_calls?: number;
  };
  token_usage: Record<string, number> | null;
  tool_calls: ToolCall[];
}

interface DemoResult {
  message: string;
  mode: DemoMode;
  provider: DemoProvider;
  model: string;
  n_runs: number;
  threshold: number;
  command: string;
  test_name: string;
  n_passed: number;
  n_failed: number;
  pass_rate: number;
  met_threshold: boolean;
  avg_duration_seconds: number;
  avg_steps: number;
  duration_seconds: number;
  exit_code: number;
  assertions: string[];
  traces: AgentTrace[];
}

interface DemoEvent {
  type: "demo_started" | "run_passed" | "run_failed" | "gate_passed" | "gate_failed";
  run_id: string;
  timestamp: number;
  index?: number;
  config?: {
    message: string;
    mode: DemoMode;
    provider: DemoProvider;
    model: string;
    n_runs: number;
    threshold: number;
    command: string;
  };
  assertions?: string[];
  trace?: AgentTrace;
  final_result?: DemoResult;
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_DEMOS_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;

const DEFAULT_MESSAGE = "I want a refund for order A1007";

export default function AgentEvalLiveDemo({
  fallbackTrace,
}: {
  fallbackTrace: ReplayTraceStep[];
}) {
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [provider, setProvider] = useState<DemoProvider>("openai");
  const [mode, setMode] = useState<DemoMode>("healthy");
  const [nRuns, setNRuns] = useState(6);
  const [threshold, setThreshold] = useState(0.8);
  const [events, setEvents] = useState<DemoEvent[]>([]);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const apiReady = Boolean(API_BASE_URL);
  const liveTraces = useMemo(
    () => events.map((event) => event.trace).filter((trace): trace is AgentTrace => Boolean(trace)),
    [events],
  );
  const traces = result?.traces ?? liveTraces;
  const failedTraces = traces.filter((trace) => !trace.passed);

  async function runDemo() {
    if (!API_BASE_URL) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setEvents([]);
    setResult(null);
    setError(null);
    setIsRunning(true);

    try {
      const response = await fetch(
        `${API_BASE_URL.replace(/\/$/, "")}/demos/agenteval/run`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            message,
            mode,
            provider,
            n_runs: nRuns,
            threshold,
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const detail = await readErrorDetail(response);
        throw new Error(detail ?? `Demo API returned ${response.status}`);
      }
      if (!response.body) {
        throw new Error("Demo API returned an empty stream");
      }

      await readEventStream(response.body, (event) => {
        setEvents((current) => [...current, event]);
        if (event.final_result) setResult(event.final_result);
      });
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") {
        return;
      }
      setError(caught instanceof Error ? caught.message : "Demo run failed");
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setIsRunning(false);
    }
  }

  function stopDemo() {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsRunning(false);
  }

  function resetDemo() {
    stopDemo();
    setEvents([]);
    setResult(null);
    setError(null);
  }

  if (!apiReady) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-border bg-surface p-4 text-sm leading-relaxed text-ink-muted">
          Set{" "}
          <span className="font-mono text-xs text-ink">
            NEXT_PUBLIC_DEMOS_API_URL
          </span>{" "}
          to the FastAPI demo backend URL to enable live OpenAI/Anthropic
          agenteval runs.
        </div>
        <ReplayTerminal steps={fallbackTrace} title="agenteval · refund-policy gate" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_0.78fr]">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
              Support request
            </span>
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-ink outline-none transition-colors focus:border-ink/40"
              maxLength={180}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
                Runs
              </span>
              <input
                type="number"
                min={3}
                max={12}
                value={nRuns}
                onChange={(event) =>
                  setNRuns(clampNumber(event.target.value, 3, 12, 6))
                }
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-ink outline-none transition-colors focus:border-ink/40"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
                Threshold
              </span>
              <input
                type="number"
                min={0.5}
                max={1}
                step={0.05}
                value={threshold}
                onChange={(event) =>
                  setThreshold(clampNumber(event.target.value, 0.5, 1, 0.8))
                }
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-ink outline-none transition-colors focus:border-ink/40"
              />
            </label>
          </div>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-ink-muted">
          Each run calls a live provider model through a tool-calling loop, wraps
          the real tools with agenteval, and gates repeated traces by pass rate.
        </p>

        <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="inline-grid grid-cols-2 rounded-lg border border-border bg-background p-1">
              <button
                type="button"
                onClick={() => setProvider("openai")}
                className={modeButtonClass(provider === "openai")}
              >
                OpenAI
              </button>
              <button
                type="button"
                onClick={() => setProvider("anthropic")}
                className={modeButtonClass(provider === "anthropic")}
              >
                Anthropic
              </button>
            </div>
            <div className="inline-grid grid-cols-2 rounded-lg border border-border bg-background p-1">
              <button
                type="button"
                onClick={() => setMode("healthy")}
                className={modeButtonClass(mode === "healthy")}
              >
                Healthy agent
              </button>
              <button
                type="button"
                onClick={() => setMode("regression")}
                className={modeButtonClass(mode === "regression")}
              >
                Regression
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={runDemo}
              disabled={isRunning || message.trim().length < 8}
              title="Run the agenteval demo"
            >
              {isRunning ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Play aria-hidden="true" />
              )}
              Run eval
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={stopDemo}
              disabled={!isRunning}
              title="Stop the current demo run"
            >
              <Square aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={resetDemo}
              disabled={isRunning || (events.length === 0 && !result && !error)}
              title="Reset the demo output"
            >
              <RotateCcw aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      {error && (
        <div className="border-b border-border bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <span className="inline-flex items-center gap-2">
            <AlertCircle className="size-4" aria-hidden="true" />
            {error}
          </span>
        </div>
      )}

      <div className="grid gap-0 lg:grid-cols-[1.02fr_0.98fr]">
        <div className="border-b border-border p-4 lg:border-b-0 lg:border-r">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
              Repeated runs
            </p>
            <span className="font-mono text-[11px] text-ink-faint">
              {traces.length}/{result?.n_runs ?? nRuns}
            </span>
          </div>
          <div className="flex h-[27rem] flex-col gap-2 overflow-y-auto rounded-lg border border-border bg-background p-2">
            {traces.length === 0 ? (
              <EmptyState isRunning={isRunning} />
            ) : (
              traces.map((trace, index) => (
                <TraceRow key={trace.run_id} trace={trace} index={index + 1} />
              ))
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 p-4">
          <SummaryPanel result={result} failedTraces={failedTraces} />
          <AssertionPanel assertions={result?.assertions ?? events[0]?.assertions ?? []} />
        </div>
      </div>
    </div>
  );
}

async function readErrorDetail(response: Response) {
  try {
    const payload = (await response.json()) as { detail?: unknown; error?: unknown };
    if (typeof payload.detail === "string") return payload.detail;
    if (typeof payload.error === "string") return payload.error;
  } catch {}
  return null;
}

async function readEventStream(
  body: ReadableStream<Uint8Array>,
  onEvent: (event: DemoEvent) => void,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });

    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) onEvent(JSON.parse(trimmed) as DemoEvent);
    }

    if (done) break;
  }

  const tail = buffer.trim();
  if (tail) onEvent(JSON.parse(tail) as DemoEvent);
}

function modeButtonClass(active: boolean) {
  return [
    "h-8 rounded-md px-3 text-xs font-medium transition-colors",
    active ? "bg-ink text-background" : "text-ink-muted hover:text-ink",
  ].join(" ");
}

function EmptyState({ isRunning }: { isRunning: boolean }) {
  return (
    <div className="grid h-full place-items-center text-center">
      <div className="max-w-xs">
        {isRunning ? (
          <Loader2
            className="mx-auto mb-3 size-5 animate-spin text-ink-muted"
            aria-hidden="true"
          />
        ) : null}
        <p className="text-sm leading-relaxed text-ink-muted">
          {isRunning
            ? "Starting repeated agent runs."
            : "Run the eval to see pass-rate scoring and failed traces."}
        </p>
      </div>
    </div>
  );
}

function TraceRow({ trace, index }: { trace: AgentTrace; index: number }) {
  const variant = trace.metadata.variant ?? "run";
  const firstFailure = firstFailureLine(trace);

  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
          run {index}
        </span>
        <span
          className={[
            "inline-flex items-center gap-1 text-xs font-semibold",
            trace.passed ? "text-emerald-600" : "text-destructive",
          ].join(" ")}
        >
          {trace.passed ? (
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
          ) : (
            <XCircle className="size-3.5" aria-hidden="true" />
          )}
          {trace.passed ? "passed" : "failed"}
        </span>
        <span className="font-mono text-[11px] text-ink-muted">
          {formatVariant(variant)}
        </span>
      </div>

      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-ink-faint">
        <span>{trace.tool_calls.length} tool calls</span>
        {trace.metadata.llm_calls ? (
          <span>{trace.metadata.llm_calls} LLM calls</span>
        ) : null}
        {trace.token_usage?.total_tokens ? (
          <span>{trace.token_usage.total_tokens} tokens</span>
        ) : null}
        <span>{trace.effective_steps} steps</span>
        <span>{Math.max(1, Math.round(trace.duration_seconds * 1000))}ms</span>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {trace.tool_calls.map((call, callIndex) => (
          <span
            key={`${trace.run_id}-${call.name}-${callIndex}`}
            className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-ink-muted"
          >
            {call.name}
          </span>
        ))}
      </div>

      {firstFailure ? (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-destructive">
          {firstFailure}
        </p>
      ) : null}
    </div>
  );
}

function SummaryPanel({
  result,
  failedTraces,
}: {
  result: DemoResult | null;
  failedTraces: AgentTrace[];
}) {
  if (!result) {
    return (
      <div className="rounded-lg border border-border bg-background p-4">
        <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-ink-faint">
          Gate result
        </p>
        <p className="text-sm leading-relaxed text-ink-muted">
          The report will show the pass rate, threshold decision, exit code, and
          the failing traces that explain the regression.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
            Gate result
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-ink">
            {result.n_passed}/{result.n_runs}
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            {formatPercent(result.pass_rate)} pass rate · threshold{" "}
            {formatPercent(result.threshold)}
          </p>
        </div>
        <span
          className={[
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px]",
            result.met_threshold
              ? "border-emerald-500/30 text-emerald-600"
              : "border-destructive/30 text-destructive",
          ].join(" ")}
        >
          {result.met_threshold ? (
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
          ) : (
            <XCircle className="size-3.5" aria-hidden="true" />
          )}
          exit {result.exit_code}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Metric label="failed" value={String(result.n_failed)} />
        <Metric label="avg steps" value={result.avg_steps.toFixed(1)} />
        <Metric
          label="runtime"
          value={`${Math.max(1, Math.round(result.duration_seconds * 1000))}ms`}
        />
      </div>

      <div className="mt-4 rounded-md border border-border bg-surface p-3">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
          Live provider
        </p>
        <p className="break-words font-mono text-[11px] leading-relaxed text-ink-muted">
          {result.provider} · {result.model}
        </p>
      </div>

      <div className="mt-3 rounded-md border border-border bg-surface p-3">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
          CLI equivalent
        </p>
        <p className="break-words font-mono text-[11px] leading-relaxed text-ink-muted">
          {result.command}
        </p>
      </div>

      {failedTraces.length ? (
        <div className="mt-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
            First failed traces
          </p>
          <div className="flex max-h-[8.5rem] flex-col gap-2 overflow-y-auto">
            {failedTraces.slice(0, 3).map((trace) => (
              <div
                key={trace.run_id}
                className="rounded-md border border-border bg-surface px-3 py-2"
              >
                <p className="font-mono text-[11px] text-ink">
                  {formatVariant(trace.metadata.variant ?? "failed")}
                </p>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-destructive">
                  {firstFailureLine(trace) ?? trace.error ?? "failed"}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AssertionPanel({ assertions }: { assertions: string[] }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-ink-faint">
        Assertion contract
      </p>
      {assertions.length ? (
        <div className="flex max-h-[13rem] flex-col gap-1.5 overflow-y-auto">
          {assertions.map((assertion) => (
            <span
              key={assertion}
              className="rounded border border-border bg-surface px-2 py-1 font-mono text-[11px] text-ink-muted"
            >
              {assertion}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-ink-muted">
          The backend sends the exact behavioral checks used for each run.
        </p>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface p-2.5">
      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function clampNumber(value: string, min: number, max: number, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function formatVariant(value: string) {
  return value.replaceAll("_", " ");
}

function firstFailureLine(trace: AgentTrace) {
  const failure = trace.assertion_errors[0];
  if (!failure) return null;
  return failure
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("Assertion failures:"));
}
