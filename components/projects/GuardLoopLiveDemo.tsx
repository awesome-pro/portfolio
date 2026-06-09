"use client";

import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Info,
  Loader2,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  ShieldCheck,
  Square,
  XCircle,
  Zap,
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

type Scenario = "budget" | "circuit_breaker" | "verifier";
type Policy = "guarded" | "relaxed";
type Execution = "openai" | "anthropic" | "no_key";
type StepStatus = "completed" | "failed" | "blocked" | "running";

interface TimelineStep {
  key: string;
  title: string;
  status: StepStatus;
  detail: string;
  metrics: Record<string, unknown>;
}

interface DemoEvent {
  type:
    | "demo_started"
    | "llm_call_completed"
    | "tool_call_failed"
    | "tool_call_blocked"
    | "agent_attempt_completed"
    | "verifier_checked"
    | "guardrail_tripped"
    | "demo_completed"
    | "demo_failed";
  run_id: string;
  timestamp: number;
  config?: {
    scenario: Scenario;
    policy: Policy;
    execution: Execution;
    model: string;
    command: string;
  };
  scenarios?: { value: Scenario; label: string; description: string }[];
  step?: TimelineStep;
  final_result?: DemoResult;
  error?: string;
}

interface RunResultPayload {
  output: string | null;
  success: boolean;
  cost_usd: string;
  estimated_cost_usd: string;
  tokens_used: number;
  input_tokens: number;
  output_tokens: number;
  duration_seconds: number;
  tool_calls: number;
  verification_passed: boolean | null;
  verification_attempts: number;
  verification_feedback: string[];
  trace_id: string | null;
  terminated_reason: string | null;
  error_type: string | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
}

interface SpanPayload {
  name: string;
  span_id: string;
  trace_id: string;
  parent_span_id: string | null;
  status: string;
  attributes: Record<string, unknown>;
  events: { name: string; attributes: Record<string, unknown> }[];
}

interface DemoResult {
  run_id: string;
  title: string;
  scenario: Scenario;
  policy: Policy;
  execution?: Execution;
  run_result: RunResultPayload;
  timeline: DemoEvent[];
  baseline: Record<string, unknown>;
  guardloop: Record<string, unknown>;
  circuit_breakers: Record<string, unknown>;
  spans: SpanPayload[];
  code: string;
  summary: {
    outcome: string;
    success: boolean;
    terminated_reason: string | null;
    cost_usd: string;
    tokens_used: number;
    tool_calls: number;
    verification_attempts: number;
    trace_id: string | null;
  };
  duration_seconds: number;
}

const PACKAGE_REPO_URL = "https://github.com/awesome-pro/guardloop";
const DEMO_REPO_URL = "https://github.com/awesome-pro/portfolio-service";
const PYPI_URL = "https://pypi.org/project/guardloop/";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_DEMOS_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "");

const SCENARIO_OPTIONS: { value: Scenario; label: string }[] = [
  { value: "budget", label: "Budget" },
  { value: "circuit_breaker", label: "Breaker" },
  { value: "verifier", label: "Verifier" },
];

const POLICY_OPTIONS: { value: Policy; label: string }[] = [
  { value: "guarded", label: "Guarded" },
  { value: "relaxed", label: "Relaxed" },
];

const EXECUTION_OPTIONS: { value: Execution; label: string }[] = [
  { value: "openai", label: "Live OpenAI" },
  { value: "anthropic", label: "Live Claude" },
  { value: "no_key", label: "No-key" },
];

export default function GuardLoopLiveDemo() {
  const [scenario, setScenario] = useState<Scenario>("budget");
  const [policy, setPolicy] = useState<Policy>("guarded");
  const [execution, setExecution] = useState<Execution>("openai");
  const [events, setEvents] = useState<DemoEvent[]>([]);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const timeline = useMemo(() => buildTimeline(events, result, isRunning), [
    events,
    isRunning,
    result,
  ]);
  const started = events.some((event) => event.type === "demo_started");
  const shellClass = cn(
    "scroll-mt-24 overflow-hidden rounded-xl border border-border bg-surface",
    isFocusMode &&
      "fixed inset-3 z-50 flex max-h-[calc(100vh-1.5rem)] flex-col bg-background shadow-2xl sm:inset-5 sm:max-h-[calc(100vh-2.5rem)]",
  );

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
        `${API_BASE_URL.replace(/\/$/, "")}/demos/guardloop/run`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ scenario, policy, execution }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const detail = await readErrorDetail(response);
        throw new Error(detail ?? `Demo API returned ${response.status}`);
      }
      if (!response.body) throw new Error("Demo API returned an empty stream");

      await readEventStream(response.body, (event) => {
        setEvents((current) => [...current, event]);
        if (event.type === "demo_failed") {
          setError(event.error ?? "GuardLoop demo failed");
        }
        if (event.final_result) setResult(event.final_result);
      });
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
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

  if (!API_BASE_URL) {
    return (
      <div className="rounded-xl border border-border bg-surface p-5">
        <div className="flex items-start gap-3 text-sm text-ink-muted">
          <AlertCircle className="mt-0.5 size-4 text-ink-faint" aria-hidden />
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
      {isFocusMode ? (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
          aria-hidden
        />
      ) : null}
      <div className={shellClass}>
        <div className="shrink-0 border-b border-border p-3 sm:p-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
                  GuardLoop live demo
                </p>
                <HoverCard>
                  <HoverCardTrigger asChild>
                    <button
                      type="button"
                      className="text-ink-faint transition-colors hover:text-ink"
                      aria-label="About this demo"
                    >
                      <Info className="size-4" aria-hidden />
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent>
                    <p className="text-sm font-medium text-ink">
                      What this proves
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                      Live modes use backend-owned provider keys through
                      GuardLoop&apos;s SDK wrappers. No-key mode stays available for
                      deterministic local verification.
                    </p>
                  </HoverCardContent>
                </HoverCard>
              </div>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink">
                Guardrail incident lab
              </h2>
            </div>

            <div className="flex flex-wrap gap-2">
              <IconButton
                label={isFocusMode ? "Exit focus mode" : "Open focus mode"}
                disabled={false}
                onClick={() => setIsFocusMode((current) => !current)}
              >
                {isFocusMode ? <Minimize2 aria-hidden /> : <Maximize2 aria-hidden />}
              </IconButton>
              <ExternalLinkButton href={PACKAGE_REPO_URL} label="Package repo" />
              <ExternalLinkButton href={DEMO_REPO_URL} label="Demo API" />
              <ExternalLinkButton href={PYPI_URL} label="PyPI" />
            </div>
          </div>
        </div>

        <div className={cn(isFocusMode && "min-h-0 overflow-y-auto")}>
          {error ? (
            <div className="border-b border-border bg-destructive/5 px-4 py-3 text-sm text-destructive">
              <span className="inline-flex items-center gap-2">
                <AlertCircle className="size-4" aria-hidden />
                {error}
              </span>
            </div>
          ) : null}

          <div className="border-b border-border p-3 sm:p-4">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
              <div className="grid gap-3 md:grid-cols-3">
                <ControlGroup
                  label="Scenario"
                  tip="Each scenario is a safe preset. The browser cannot submit arbitrary prompts, tools, or model names."
                >
                  <SegmentedControl
                    value={scenario}
                    options={SCENARIO_OPTIONS}
                    onChange={setScenario}
                  />
                </ControlGroup>
                <ControlGroup
                  label="Runtime"
                  tip="Live modes call real providers with backend-owned keys. No-key runs the same GuardLoop path against a deterministic local provider."
                >
                  <SegmentedControl
                    value={execution}
                    options={EXECUTION_OPTIONS}
                    onChange={setExecution}
                  />
                </ControlGroup>
                <ControlGroup
                  label="Policy"
                  tip="Guarded uses strict runtime limits. Relaxed shows the same agent under a weaker policy."
                >
                  <SegmentedControl
                    value={policy}
                    options={POLICY_OPTIONS}
                    onChange={setPolicy}
                  />
                </ControlGroup>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  className="min-w-36 flex-1 xl:flex-none"
                  onClick={runDemo}
                  disabled={isRunning}
                  title="Run GuardLoop demo"
                >
                  {isRunning ? (
                    <Loader2 className="animate-spin" aria-hidden />
                  ) : (
                    <Play aria-hidden />
                  )}
                  Run demo
                </Button>
                <IconButton
                  label="Stop current run"
                  disabled={!isRunning}
                  onClick={stopDemo}
                >
                  <Square aria-hidden />
                </IconButton>
                <IconButton
                  label="Reset output"
                  disabled={isRunning || (!events.length && !result && !error)}
                  onClick={resetDemo}
                >
                  <RotateCcw aria-hidden />
                </IconButton>
              </div>
            </div>
          </div>

          <SummaryGrid result={result} started={started} isRunning={isRunning} />

          <div className="grid gap-3 border-y border-border p-3 sm:p-4 lg:grid-cols-2">
            <OutcomeCard
              icon={<Activity className="size-4" aria-hidden />}
              title="Unprotected agent"
              data={result?.baseline}
              pending="Run a scenario to see the projected failure mode."
            />
            <OutcomeCard
              icon={<ShieldCheck className="size-4" aria-hidden />}
              title="GuardLoop runtime"
              data={result?.guardloop}
              pending="GuardLoop result will appear after the run."
              guarded
            />
          </div>

          <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <section className="min-w-0 border-b border-border p-3 sm:p-4 lg:border-b-0 lg:border-r">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
                    Runtime timeline
                  </p>
                  <HelpTip label="Runtime timeline">
                    Events are streamed from the FastAPI demo as the deterministic
                    incident runs.
                  </HelpTip>
                </div>
                <span className="font-mono text-[11px] text-ink-faint">
                  {timeline.length} events
                </span>
              </div>

              <div className="flex max-h-72 flex-col gap-2 overflow-y-auto rounded-lg border border-border bg-background p-2">
                {timeline.map((step) => (
                  <TimelineRow key={step.key} step={step} />
                ))}
              </div>
            </section>

            <Inspector result={result} events={events} />
          </div>
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

function buildTimeline(
  events: DemoEvent[],
  result: DemoResult | null,
  isRunning: boolean,
): TimelineStep[] {
  const steps = (result?.timeline ?? events)
    .map((event) => event.step)
    .filter((step): step is TimelineStep => Boolean(step));

  if (!steps.length && isRunning) {
    return [
      {
        key: "starting",
        title: "Starting runtime",
        status: "running",
        detail: "Creating GuardLoop runtime and deterministic demo inputs.",
        metrics: {},
      },
    ];
  }
  if (!steps.length) {
    return [
      {
        key: "idle",
        title: "Ready",
        status: "running",
        detail: "Choose a scenario and run the incident lab.",
        metrics: {},
      },
    ];
  }
  return steps;
}

function SummaryGrid({
  result,
  started,
  isRunning,
}: {
  result: DemoResult | null;
  started: boolean;
  isRunning: boolean;
}) {
  const runResult = result?.run_result;
  const outcome = result
    ? result.summary.outcome
    : isRunning || started
      ? "running"
      : "ready";

  return (
    <div className="grid gap-3 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-4">
      <Metric
        label="Outcome"
        value={outcomeLabel(outcome)}
        detail={runResult?.terminated_reason ?? (result ? "completed" : "waiting")}
        tone={metricTone(runResult)}
      />
      <Metric
        label="Cost / tokens"
        value={runResult ? `$${runResult.cost_usd}` : "$0"}
        detail={runResult ? `${runResult.tokens_used} tokens` : "no calls yet"}
      />
      <Metric
        label="Tool calls"
        value={String(runResult?.tool_calls ?? 0)}
        detail="charged by runtime"
      />
      <Metric
        label="Verifier"
        value={String(runResult?.verification_attempts ?? 0)}
        detail={
          runResult?.verification_passed === true
            ? "passed"
            : runResult?.verification_passed === false
              ? "failed"
              : "not active"
        }
      />
    </div>
  );
}

function OutcomeCard({
  icon,
  title,
  data,
  pending,
  guarded = false,
}: {
  icon: ReactNode;
  title: string;
  data: Record<string, unknown> | undefined;
  pending: string;
  guarded?: boolean;
}) {
  const outcome = typeof data?.outcome === "string" ? data.outcome : pending;
  const rows = data
    ? Object.entries(data).filter(([key]) => !["label", "outcome"].includes(key))
    : [];

  return (
    <div
      className={cn(
        "rounded-lg border bg-background p-3",
        guarded && data && "border-emerald-500/35 bg-emerald-500/5",
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className={cn(
            "inline-flex size-8 items-center justify-center rounded-md border",
            guarded
              ? "border-emerald-500/30 text-emerald-600"
              : "border-border text-ink-faint",
          )}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
            {guarded ? "guarded path" : "baseline"}
          </p>
          <h3 className="truncate text-base font-semibold text-ink">{title}</h3>
        </div>
      </div>
      <p className="min-h-10 text-sm leading-relaxed text-ink-muted">{outcome}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {rows.slice(0, 4).map(([key, value]) => (
          <MiniStat key={key} label={humanize(key)} value={formatValue(value)} />
        ))}
      </div>
    </div>
  );
}

function TimelineRow({ step }: { step: TimelineStep }) {
  return (
    <div
      className={cn(
        "grid min-h-14 grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-lg border bg-surface px-3 py-2",
        step.status === "blocked" && "border-amber-500/40 bg-amber-500/5",
        step.status === "failed" && "border-destructive/35 bg-destructive/5",
        step.status === "completed" && "border-border",
      )}
    >
      <StatusIcon status={step.status} />
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-sm font-semibold text-ink">{step.title}</p>
          <span className={statusTextClass(step.status)}>{step.status}</span>
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-ink-muted">
          {step.detail}
        </p>
      </div>
    </div>
  );
}

function Inspector({
  result,
  events,
}: {
  result: DemoResult | null;
  events: DemoEvent[];
}) {
  return (
    <aside className="min-w-0 p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
          Inspector
        </p>
        <HelpTip label="Inspector">
          Inspect the typed RunResult, OpenTelemetry spans, runnable API snippet,
          and framework adapter proof.
        </HelpTip>
      </div>

      <details open className="rounded-lg border border-border bg-background p-2">
        <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-wider text-ink-faint">
          Evidence
        </summary>
        <Tabs defaultValue="result">
          <TabsList className="mt-3 w-full">
            <TabsTrigger className="flex-1" value="result">
              Result
            </TabsTrigger>
            <TabsTrigger className="flex-1" value="spans">
              Spans
            </TabsTrigger>
            <TabsTrigger className="flex-1" value="code">
              Code
            </TabsTrigger>
            <TabsTrigger className="flex-1" value="adapters">
              Adapters
            </TabsTrigger>
          </TabsList>

          <TabsContent value="result">
            <pre className="mt-3 max-h-64 overflow-auto rounded border border-border bg-surface p-3 text-xs leading-relaxed text-ink-muted">
              {JSON.stringify(result?.run_result ?? events.slice(-6), null, 2)}
            </pre>
          </TabsContent>

          <TabsContent value="spans">
            <div className="mt-3 flex max-h-64 flex-col gap-2 overflow-y-auto">
              {result?.spans.length ? (
                result.spans.map((span) => <SpanRow key={span.span_id} span={span} />)
              ) : (
                <p className="rounded border border-border bg-surface p-3 text-sm text-ink-muted">
                  Run the demo to capture in-memory OpenTelemetry spans.
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="code">
            <pre className="mt-3 max-h-64 overflow-auto rounded border border-border bg-surface p-3 text-xs leading-relaxed text-ink-muted">
              {result?.code ?? "Run the demo to load the exact GuardLoop API path."}
            </pre>
          </TabsContent>

          <TabsContent value="adapters">
            <div className="mt-3 space-y-2 text-xs leading-relaxed text-ink-muted">
              <AdapterSnippet
                title="LangGraph"
                code={
                  'from guardloop.adapters.langgraph import guarded_graph\n\nagent = guarded_graph(my_compiled_graph, input_key="messages")\nresult = await runtime.run(agent, {"messages": [...]})'
                }
              />
              <AdapterSnippet
                title="OpenAI Agents SDK"
                code={
                  "from guardloop.adapters.openai_agents import guarded_runner\n\nagent = guarded_runner(my_sdk_agent)\nresult = await runtime.run(agent, user_input)"
                }
              />
            </div>
          </TabsContent>
        </Tabs>
      </details>
    </aside>
  );
}

function SpanRow({ span }: { span: SpanPayload }) {
  return (
    <div className="rounded border border-border bg-surface p-2.5">
      <div className="flex items-center justify-between gap-3">
        <p className="truncate font-mono text-xs font-semibold text-ink">
          {span.name}
        </p>
        <span className="font-mono text-[10px] text-ink-faint">{span.status}</span>
      </div>
      <p className="mt-1 truncate font-mono text-[10px] text-ink-faint">
        {span.span_id}
      </p>
    </div>
  );
}

function AdapterSnippet({ title, code }: { title: string; code: string }) {
  return (
    <div className="rounded border border-border bg-surface p-2.5">
      <p className="mb-2 text-sm font-semibold text-ink">{title}</p>
      <pre className="overflow-auto whitespace-pre-wrap font-mono text-[10px] leading-relaxed">
        {code}
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
    <div>
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
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div
      className="grid rounded-lg border border-border bg-background p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "min-h-8 rounded-md px-2 text-sm font-medium transition-colors",
            value === option.value
              ? "bg-ink text-background"
              : "text-ink-muted hover:text-ink",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
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
  tone?: "neutral" | "success" | "danger" | "warning";
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 truncate text-xl font-semibold tracking-tight",
          tone === "success" && "text-emerald-600",
          tone === "danger" && "text-destructive",
          tone === "warning" && "text-amber-600",
          tone === "neutral" && "text-ink",
        )}
      >
        {value}
      </p>
      <p className="mt-1 truncate text-xs text-ink-muted">{detail}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
        {label}
      </p>
      <p className="mt-1 truncate font-mono text-xs text-ink">{value}</p>
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
          className="size-9 shrink-0"
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
          <Info className="size-3.5" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  );
}

function ExternalLinkButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium text-ink-muted transition-colors hover:border-ink/30 hover:text-ink"
    >
      {label}
      <ExternalLink className="size-3" aria-hidden />
    </a>
  );
}

function StatusIcon({ status }: { status: StepStatus }) {
  if (status === "completed") {
    return <CheckCircle2 className="mt-0.5 size-4 text-emerald-600" aria-hidden />;
  }
  if (status === "failed") {
    return <XCircle className="mt-0.5 size-4 text-destructive" aria-hidden />;
  }
  if (status === "blocked") {
    return <Zap className="mt-0.5 size-4 text-amber-600" aria-hidden />;
  }
  return <Loader2 className="mt-0.5 size-4 animate-spin text-ink" aria-hidden />;
}

function statusTextClass(status: StepStatus) {
  return cn(
    "shrink-0 font-mono text-[10px] uppercase tracking-wider",
    status === "completed" && "text-emerald-600",
    status === "failed" && "text-destructive",
    status === "blocked" && "text-amber-600",
    status === "running" && "text-ink-muted",
  );
}

function metricTone(
  runResult: RunResultPayload | undefined,
): "neutral" | "success" | "danger" | "warning" {
  if (!runResult) return "neutral";
  if (runResult.terminated_reason) return "warning";
  if (runResult.success) return "success";
  return "danger";
}

function outcomeLabel(value: string) {
  return value.replaceAll("_", " ");
}

function humanize(value: string) {
  return value.replaceAll("_", " ");
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(", ");
  if (value && typeof value === "object") return JSON.stringify(value);
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "yes" : "no";
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "-";
  return String(value);
}
