"use client";

import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  FileJson,
  Info,
  Loader2,
  Play,
  RotateCcw,
  Square,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type DemoMode = "healthy" | "regression";
type DemoProvider = "openai" | "anthropic";
type RunStatus = "queued" | "running" | "passed" | "failed";

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
  type:
    | "demo_started"
    | "run_passed"
    | "run_failed"
    | "gate_passed"
    | "gate_failed";
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

interface RunRow {
  index: number;
  status: RunStatus;
  trace: AgentTrace | null;
}

const DEMO_REPO_URL = "https://github.com/awesome-pro/portfolio-service";
const PACKAGE_REPO_URL = "https://github.com/awesome-pro/agenteval";
const PYPI_URL = "https://pypi.org/project/agenteval-py/";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_DEMOS_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "");

const DEFAULT_MESSAGE = "I want a refund for order A1007";

export default function AgentEvalLiveDemo() {
  const [message, setMessage] = useState(DEFAULT_MESSAGE);
  const [provider, setProvider] = useState<DemoProvider>("openai");
  const [mode, setMode] = useState<DemoMode>("healthy");
  const [nRuns, setNRuns] = useState(6);
  const [threshold, setThreshold] = useState(0.8);
  const [events, setEvents] = useState<DemoEvent[]>([]);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const started = events.some((event) => event.type === "demo_started");
  const config = result ?? events.find((event) => event.config)?.config;
  const liveTraces = useMemo(
    () =>
      events
        .map((event) => event.trace)
        .filter((trace): trace is AgentTrace => Boolean(trace)),
    [events],
  );
  const traces = result?.traces ?? liveTraces;
  const runRows = useMemo(
    () => buildRunRows(result?.n_runs ?? config?.n_runs ?? nRuns, traces, started && isRunning),
    [config?.n_runs, isRunning, nRuns, result?.n_runs, started, traces],
  );
  const selectedTrace =
    traces.find((trace) => trace.run_id === selectedRunId) ?? traces[0] ?? null;
  const assertions = result?.assertions ?? events[0]?.assertions ?? [];

  async function runDemo() {
    if (!API_BASE_URL) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setEvents([]);
    setResult(null);
    setSelectedRunId(null);
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
        if (event.trace) {
          setSelectedRunId((current) => current ?? event.trace?.run_id ?? null);
        }
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
    setSelectedRunId(null);
    setError(null);
  }

  if (!API_BASE_URL) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-start gap-3 text-sm text-ink-muted">
          <AlertCircle className="mt-0.5 size-4 text-ink-faint" aria-hidden="true" />
          <div>
            <p className="font-medium text-ink">Live demo API is not configured.</p>
            <p className="mt-1 leading-relaxed">
              Set{" "}
              <span className="font-mono text-xs text-ink">
                NEXT_PUBLIC_DEMOS_API_URL
              </span>{" "}
              to the deployed FastAPI service URL.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="w-full overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex flex-col gap-4 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
                AgentEval live demo
              </p>
              <HoverCard>
                <HoverCardTrigger asChild>
                  <button
                    type="button"
                    className="text-ink-faint transition-colors hover:text-ink"
                    aria-label="About this demo"
                  >
                    <Info className="size-4" aria-hidden="true" />
                  </button>
                </HoverCardTrigger>
                <HoverCardContent>
                  <p className="text-sm font-medium text-ink">Reliability gate</p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                    The backend runs the real `agenteval-py` package against a
                    live tool-calling refund agent, then gates the repeated traces
                    by pass rate.
                  </p>
                </HoverCardContent>
              </HoverCard>
            </div>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink">
              Refund-support eval lab
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            <ExternalLinkButton href={PACKAGE_REPO_URL} label="Package repo" />
            <ExternalLinkButton href={DEMO_REPO_URL} label="Demo API" />
            <ExternalLinkButton href={PYPI_URL} label="PyPI" />
          </div>
        </div>

        {error ? (
          <div className="border-b border-border bg-destructive/5 px-4 py-3 text-sm text-destructive">
            <span className="inline-flex items-center gap-2">
              <AlertCircle className="size-4" aria-hidden="true" />
              {error}
            </span>
          </div>
        ) : null}

        <div className="grid lg:grid-cols-[20rem_minmax(0,1fr)]">
          <aside className="border-b border-border p-4 lg:border-b-0 lg:border-r">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
                Inputs
              </p>
              <HelpTip label="Safe inputs">
                The browser can edit the customer message, run count, threshold,
                provider, and mode. Model names and API keys stay server-side.
              </HelpTip>
            </div>

            <label className="mt-4 block">
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
                Support request
              </span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={180}
                rows={4}
                className="mt-2 min-h-28 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed text-ink outline-none transition-colors focus:border-ink/40"
              />
              <span className="mt-1 block text-right font-mono text-[10px] text-ink-faint">
                {message.length}/180
              </span>
            </label>

            <ControlGroup label="Provider" tip="Selects the live adapter path used by the backend. Arbitrary model names are not accepted.">
              <SegmentedControl
                value={provider}
                options={[
                  ["openai", "OpenAI"],
                  ["anthropic", "Anthropic"],
                ]}
                onChange={setProvider}
              />
            </ControlGroup>

            <ControlGroup label="Mode" tip="Healthy should clear the contract; regression intentionally skips policy behavior so the gate fails.">
              <SegmentedControl
                value={mode}
                options={[
                  ["healthy", "Healthy"],
                  ["regression", "Regression"],
                ]}
                onChange={setMode}
              />
            </ControlGroup>

            <RangeControl
              label="Runs"
              value={nRuns}
              min={3}
              max={12}
              step={1}
              suffix=""
              help="How many times AgentEval repeats the same behavioral test."
              onChange={setNRuns}
            />
            <RangeControl
              label="Threshold"
              value={threshold}
              min={0.5}
              max={1}
              step={0.05}
              suffix="%"
              help="Minimum pass rate required for a CI-style success."
              formatValue={(value) => String(Math.round(value * 100))}
              onChange={setThreshold}
            />

            <div className="mt-5 flex items-center gap-2">
              <Button
                type="button"
                className="min-w-0 flex-1"
                onClick={runDemo}
                disabled={isRunning || message.trim().length < 8}
                title="Run the AgentEval demo"
              >
                {isRunning ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <Play aria-hidden="true" />
                )}
                Run eval
              </Button>
              <IconButton
                label="Stop current run"
                disabled={!isRunning}
                onClick={stopDemo}
              >
                <Square aria-hidden="true" />
              </IconButton>
              <IconButton
                label="Reset output"
                disabled={isRunning || (!events.length && !result && !error)}
                onClick={resetDemo}
              >
                <RotateCcw aria-hidden="true" />
              </IconButton>
            </div>
          </aside>

          <section className="min-w-0">
            <GateSummary result={result} traces={traces} nRuns={nRuns} threshold={threshold} />

            <div className="grid border-t border-border lg:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="min-w-0 border-b border-border p-4 lg:border-b-0 lg:border-r">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
                      Repeated runs
                    </p>
                    <HelpTip label="Why repeated?">
                      A single agent run can pass by luck. AgentEval scores the
                      behavior over repeated traces.
                    </HelpTip>
                  </div>
                  <span className="font-mono text-[11px] text-ink-faint">
                    {traces.length}/{result?.n_runs ?? nRuns}
                  </span>
                </div>

                <div className="flex h-[28rem] flex-col gap-2 overflow-y-auto rounded-lg border border-border bg-background p-2">
                  {runRows.map((row) => (
                    <RunTraceRow
                      key={row.index}
                      row={row}
                      active={Boolean(row.trace && row.trace.run_id === selectedTrace?.run_id)}
                      onSelect={() => {
                        if (row.trace) setSelectedRunId(row.trace.run_id);
                      }}
                    />
                  ))}
                </div>
              </div>

              <TraceInspector
                trace={selectedTrace}
                assertions={assertions}
                command={result?.command ?? config?.command ?? null}
              />
            </div>
          </section>
        </div>
      </div>
    </TooltipProvider>
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

function buildRunRows(totalRuns: number, traces: AgentTrace[], running: boolean): RunRow[] {
  const rows: RunRow[] = Array.from({ length: totalRuns }, (_, index) => {
    const trace = traces[index] ?? null;
    let status: RunStatus = "queued";
    if (trace) status = trace.passed ? "passed" : "failed";
    return { index: index + 1, status, trace };
  });

  if (running) {
    const nextQueued = rows.find((row) => row.status === "queued");
    if (nextQueued) nextQueued.status = "running";
  }

  return rows;
}

function GateSummary({
  result,
  traces,
  nRuns,
  threshold,
}: {
  result: DemoResult | null;
  traces: AgentTrace[];
  nRuns: number;
  threshold: number;
}) {
  const passCount = result?.n_passed ?? traces.filter((trace) => trace.passed).length;
  const failedCount = result?.n_failed ?? traces.filter((trace) => !trace.passed).length;
  const passRate = result?.pass_rate ?? (traces.length ? passCount / traces.length : 0);
  const metThreshold = result?.met_threshold ?? false;

  return (
    <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric
        label="Gate"
        value={result ? (metThreshold ? "pass" : "fail") : "pending"}
        tone={result ? (metThreshold ? "success" : "danger") : "neutral"}
        detail={result ? `exit ${result.exit_code}` : `${traces.length}/${nRuns} runs`}
      />
      <Metric
        label="Pass rate"
        value={formatPercent(passRate)}
        detail={`threshold ${formatPercent(result?.threshold ?? threshold)}`}
      />
      <Metric
        label="Runs"
        value={`${passCount}/${result?.n_runs ?? nRuns}`}
        detail={`${failedCount} failed`}
      />
      <Metric
        label="Avg"
        value={result ? `${result.avg_steps.toFixed(1)} steps` : "-"}
        detail={result ? `${formatMs(result.avg_duration_seconds)} avg` : "waiting"}
      />
    </div>
  );
}

function RunTraceRow({
  row,
  active,
  onSelect,
}: {
  row: RunRow;
  active: boolean;
  onSelect: () => void;
}) {
  const trace = row.trace;
  const statusLabel =
    row.status === "running"
      ? "running"
      : row.status === "queued"
        ? "queued"
        : trace?.passed
          ? "passed"
          : "failed";

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!trace}
      className={cn(
        "grid min-h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border bg-surface px-3 py-2 text-left transition-colors",
        active ? "border-ink/60 bg-background shadow-sm" : "border-border",
        trace ? "hover:border-ink/30" : "cursor-default opacity-70",
        row.status === "failed" && "border-destructive/35 bg-destructive/5",
      )}
    >
      <StatusIcon status={row.status} />

      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
            run {row.index}
          </span>
          <span className={runStatusClass(row.status)}>{statusLabel}</span>
        </div>
        <p className="mt-0.5 truncate font-mono text-[10px] text-ink-muted">
          {trace
            ? `${trace.tool_calls.length} tools · ${trace.effective_steps} steps`
            : row.status === "running"
              ? "waiting for trace"
              : "queued"}
        </p>
      </div>

      <div className="text-right">
        <span className="font-mono text-[10px] text-ink-faint">
          {trace
            ? formatMs(trace.duration_seconds)
            : row.status === "running"
              ? "live"
              : "-"}
        </span>
      </div>
    </button>
  );
}

function TraceInspector({
  trace,
  assertions,
  command,
}: {
  trace: AgentTrace | null;
  assertions: string[];
  command: string | null;
}) {
  return (
    <aside className="min-w-0 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
          Inspector
        </p>
        <HelpTip label="Trace inspector">
          Select a run to inspect the tool calls and assertion failures that
          decide the pass-rate gate.
        </HelpTip>
      </div>

      <Tabs defaultValue="trace">
        <TabsList className="w-full">
          <TabsTrigger className="flex-1" value="trace">
            Trace
          </TabsTrigger>
          <TabsTrigger className="flex-1" value="tools">
            Tools
          </TabsTrigger>
          <TabsTrigger className="flex-1" value="json">
            JSON
          </TabsTrigger>
        </TabsList>

        <TabsContent value="trace">
          <div className="mt-2 rounded-lg border border-border bg-background p-3">
            {trace ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 text-sm font-semibold",
                      trace.passed ? "text-emerald-600" : "text-destructive",
                    )}
                  >
                    {trace.passed ? (
                      <CheckCircle2 className="size-4" aria-hidden="true" />
                    ) : (
                      <XCircle className="size-4" aria-hidden="true" />
                    )}
                    {trace.passed ? "passed" : "failed"}
                  </span>
                  <span className="font-mono text-[10px] text-ink-faint">
                    {trace.run_id.slice(0, 8)}
                  </span>
                </div>
                <KeyValue label="model" value={trace.metadata.model ?? "-"} />
                <KeyValue label="provider" value={trace.metadata.provider ?? "-"} />
                <KeyValue label="duration" value={formatMs(trace.duration_seconds)} />
                <KeyValue label="llm calls" value={String(trace.metadata.llm_calls ?? "-")} />
                <OutputBlock title="Output" value={trace.output ?? "No output."} />
                {trace.assertion_errors.length ? (
                  <OutputBlock
                    title="Failures"
                    value={trace.assertion_errors.map(cleanFailureText).join("\n\n")}
                    danger
                  />
                ) : null}
              </div>
            ) : (
              <EmptyInspector />
            )}
          </div>
        </TabsContent>

        <TabsContent value="tools">
          <div className="mt-2 flex max-h-[24rem] flex-col gap-2 overflow-y-auto rounded-lg border border-border bg-background p-2">
            {trace ? (
              trace.tool_calls.length ? (
                trace.tool_calls.map((call, index) => (
                  <ToolCallRow key={`${call.name}-${index}`} call={call} index={index + 1} />
                ))
              ) : (
                <p className="p-2 text-sm text-ink-muted">No tool calls recorded.</p>
              )
            ) : (
              <EmptyInspector />
            )}
          </div>
        </TabsContent>

        <TabsContent value="json">
          <pre className="mt-2 max-h-[24rem] overflow-auto rounded-lg border border-border bg-background p-3 text-xs leading-relaxed text-ink-muted">
            {trace
              ? JSON.stringify(trace, null, 2)
              : JSON.stringify({ assertions, command }, null, 2)}
          </pre>
        </TabsContent>
      </Tabs>

      <div className="mt-3 rounded-lg border border-border bg-background p-3">
        <div className="mb-2 flex items-center gap-2">
          <FileJson className="size-4 text-ink-faint" aria-hidden="true" />
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
            Contract
          </p>
        </div>
        <div className="flex max-h-28 flex-col gap-1 overflow-y-auto">
          {assertions.length ? (
            assertions.map((assertion) => (
              <span
                key={assertion}
                className="rounded border border-border bg-surface px-2 py-1 font-mono text-[10px] text-ink-muted"
              >
                {assertion}
              </span>
            ))
          ) : (
            <span className="text-sm text-ink-muted">Run the eval to load checks.</span>
          )}
        </div>
      </div>
    </aside>
  );
}

function ToolCallRow({ call, index }: { call: ToolCall; index: number }) {
  return (
    <div className="rounded-md border border-border bg-surface p-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
          tool {index}
        </span>
        <span className="font-mono text-[10px] text-ink-faint">
          {formatMs(call.duration_seconds)}
        </span>
      </div>
      <p className="mt-1 font-mono text-xs font-semibold text-ink">{call.name}</p>
      <pre className="mt-2 max-h-24 overflow-auto rounded border border-border bg-background p-2 text-[10px] leading-relaxed text-ink-muted">
        {JSON.stringify({ arguments: call.arguments, result: call.result, error: call.error }, null, 2)}
      </pre>
    </div>
  );
}

function ControlGroup({
  label,
  tip,
  children,
}: {
  label: string;
  tip: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
          {label}
        </span>
        <HelpTip label={label}>{tip}</HelpTip>
      </div>
      {children}
    </div>
  );
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: [T, string][];
  onChange: (value: T) => void;
}) {
  return (
    <div
      className="grid rounded-lg border border-border bg-background p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map(([optionValue, label]) => (
        <button
          key={optionValue}
          type="button"
          onClick={() => onChange(optionValue)}
          className={cn(
            "h-8 rounded-md px-2 text-xs font-medium transition-colors",
            value === optionValue
              ? "bg-ink text-background"
              : "text-ink-muted hover:text-ink",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  suffix,
  help,
  formatValue = String,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  help: string;
  formatValue?: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
            {label}
          </span>
          <HelpTip label={label}>{help}</HelpTip>
        </div>
        <span className="font-mono text-xs text-ink">
          {formatValue(value)}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-ink"
      />
    </div>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          disabled={disabled}
          onClick={onClick}
          aria-label={label}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function HelpTip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className="text-ink-faint transition-colors hover:text-ink"
          aria-label={label}
        >
          <Info className="size-3.5" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  );
}

function ExternalLinkButton({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild variant="outline" size="sm">
      <a href={href} target="_blank" rel="noreferrer">
        {label}
        <ExternalLink className="size-3.5" aria-hidden="true" />
      </a>
    </Button>
  );
}

function Metric({
  label,
  value,
  detail,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "neutral" | "success" | "danger";
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 text-xl font-semibold tracking-tight",
          tone === "success" && "text-emerald-600",
          tone === "danger" && "text-destructive",
          tone === "neutral" && "text-ink",
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-ink-muted">{detail}</p>
    </div>
  );
}

function StatusIcon({ status }: { status: RunStatus }) {
  if (status === "passed") {
    return <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />;
  }
  if (status === "failed") {
    return <XCircle className="size-4 text-destructive" aria-hidden="true" />;
  }
  if (status === "running") {
    return <Loader2 className="size-4 animate-spin text-ink" aria-hidden="true" />;
  }
  return <span className="size-4 rounded-full border border-border" aria-hidden="true" />;
}

function runStatusClass(status: RunStatus) {
  return cn(
    "truncate text-sm font-semibold",
    status === "passed" && "text-emerald-600",
    status === "failed" && "text-destructive",
    status === "running" && "text-ink",
    status === "queued" && "text-ink-muted",
  );
}

function KeyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="text-ink-muted">{label}</span>
      <span className="break-all text-right font-mono text-xs text-ink">{value}</span>
    </div>
  );
}

function OutputBlock({
  title,
  value,
  danger = false,
}: {
  title: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div>
      <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-ink-faint">
        {title}
      </p>
      <p
        className={cn(
          "max-h-28 overflow-y-auto whitespace-pre-wrap rounded border border-border bg-surface p-2 text-xs leading-relaxed",
          danger ? "text-destructive" : "text-ink-muted",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function EmptyInspector() {
  return (
    <div className="grid min-h-40 place-items-center text-center">
      <p className="max-w-44 text-sm leading-relaxed text-ink-muted">
        Select a completed run to inspect its trace.
      </p>
    </div>
  );
}

function formatMs(seconds: number) {
  return `${Math.max(1, Math.round(seconds * 1000))}ms`;
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function cleanFailureText(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
}
