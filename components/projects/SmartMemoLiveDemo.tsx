"use client";

import type { ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Database,
  ExternalLink,
  FileJson,
  Info,
  Loader2,
  Maximize2,
  Minimize2,
  Play,
  RotateCcw,
  Search,
  ShieldCheck,
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

type Scenario = "debug_logging" | "web_scaling" | "trial_extension";
type QueryVariant = "paraphrase" | "opposite_action";
type StageStatus = "pending" | "running" | "done" | "skipped" | "failed";

interface DemoConfig {
  scenario: Scenario;
  scenario_label: string;
  domain: string;
  query_variant: QueryVariant;
  cosine_threshold: number;
  classifier_threshold: number;
  include_feedback: boolean;
  expected_equivalent: boolean;
  package: string;
  embedding_model: string;
  classifier: string;
  command: string;
}

interface Decision {
  query_id: string;
  cache_entry_id: string | null;
  was_cache_hit: boolean;
  response: string;
  similarity_score: number | null;
  classifier_score: number | null;
  latency_ms: number;
  cost_saved_usd: number;
  branch: "cosine_only" | "classifier_gated";
  threshold: number;
  query_llm_called: boolean;
  expected_equivalent: boolean;
  safe_reuse: boolean;
  unsafe_reuse: boolean;
  decision_label: string;
  stats?: DemoStats;
}

interface DemoStats {
  total_entries: number;
  total_lookups: number;
  cache_hits: number;
  cache_misses: number;
  hit_rate: number;
  llm_calls: number;
  total_cost_saved_usd: number;
}

interface FeedbackPayload {
  recorded: boolean;
  label: number;
  reason: string;
  exported_pairs: number;
  jsonl: string[];
}

interface DemoResult {
  config: DemoConfig;
  seed: {
    prompt: string;
    response: string;
  };
  query: {
    prompt: string;
    fresh_response: string;
    expected_equivalent: boolean;
  };
  baseline: Decision;
  smartmemo: Decision;
  comparison: {
    cosine_only_would_reuse: boolean;
    smartmemo_reused: boolean;
    blocked_unsafe_reuse: boolean;
    preserved_safe_reuse: boolean;
    cosine_false_positive: boolean;
  };
  feedback: FeedbackPayload | null;
  duration_seconds: number;
}

interface DemoEvent {
  type:
    | "demo_started"
    | "runtime_loading"
    | "runtime_ready"
    | "cache_seed_started"
    | "cache_seeded"
    | "lookup_started"
    | "cosine_decision"
    | "feedback_exported"
    | "classifier_decision"
    | "demo_completed"
    | "demo_failed";
  run_id: string;
  timestamp: number;
  config?: DemoConfig;
  decision?: Decision;
  feedback?: FeedbackPayload;
  final_result?: DemoResult;
  error?: string;
}

interface Stage {
  key: string;
  title: string;
  detail: string;
  status: StageStatus;
  icon: ReactNode;
}

const PACKAGE_REPO_URL = "https://github.com/awesome-pro/smartmemo";
const DEMO_REPO_URL = "https://github.com/awesome-pro/portfolio-service";
const PYPI_URL = "https://pypi.org/project/smartmemo/";
const API_BASE_URL =
  process.env.NEXT_PUBLIC_DEMOS_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  (process.env.NODE_ENV === "development" ? "http://localhost:8000" : "");

const PRESETS: Record<
  Scenario,
  {
    label: string;
    domain: string;
    seedPrompt: string;
    variants: Record<
      QueryVariant,
      {
        label: string;
        prompt: string;
        expectedEquivalent: boolean;
      }
    >;
  }
> = {
  debug_logging: {
    label: "Debug config",
    domain: "software-engineering",
    seedPrompt: "Change the config to enable debug logging.",
    variants: {
      opposite_action: {
        label: "Opposite",
        prompt: "Revise the configuration so that debug logging is turned off.",
        expectedEquivalent: false,
      },
      paraphrase: {
        label: "Paraphrase",
        prompt: "Update the configuration to allow debug logging to be enabled.",
        expectedEquivalent: true,
      },
    },
  },
  web_scaling: {
    label: "Web scale",
    domain: "devops",
    seedPrompt: "Increase the scale of the web service.",
    variants: {
      opposite_action: {
        label: "Opposite",
        prompt: "Decrease the size of the web service.",
        expectedEquivalent: false,
      },
      paraphrase: {
        label: "Paraphrase",
        prompt: "Boost the web service to a larger scale.",
        expectedEquivalent: true,
      },
    },
  },
  trial_extension: {
    label: "Trial reply",
    domain: "customer-support",
    seedPrompt: "Reply to the customer agreeing to extend the trial period.",
    variants: {
      opposite_action: {
        label: "Opposite",
        prompt: "Inform the customer that the trial period cannot be extended.",
        expectedEquivalent: false,
      },
      paraphrase: {
        label: "Paraphrase",
        prompt: "Respond to the customer by agreeing to extend their trial period.",
        expectedEquivalent: true,
      },
    },
  },
};

const SCENARIO_OPTIONS = Object.entries(PRESETS).map(([value, preset]) => ({
  value: value as Scenario,
  label: preset.label,
}));

const VARIANT_OPTIONS: { value: QueryVariant; label: string }[] = [
  { value: "opposite_action", label: "Opposite" },
  { value: "paraphrase", label: "Paraphrase" },
];

export default function SmartMemoLiveDemo() {
  const [scenario, setScenario] = useState<Scenario>("debug_logging");
  const [queryVariant, setQueryVariant] =
    useState<QueryVariant>("opposite_action");
  const [cosineThreshold, setCosineThreshold] = useState(0.9);
  const [classifierThreshold, setClassifierThreshold] = useState(0.95);
  const [includeFeedback, setIncludeFeedback] = useState(true);
  const [events, setEvents] = useState<DemoEvent[]>([]);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const selectedPreset = PRESETS[scenario];
  const selectedQuery = selectedPreset.variants[queryVariant];
  const config =
    result?.config ?? events.find((event) => event.config)?.config ?? null;
  const baselineDecision =
    result?.baseline ??
    latestDecision(events, "cosine_decision", "cosine_only");
  const smartmemoDecision =
    result?.smartmemo ??
    latestDecision(events, "classifier_decision", "classifier_gated");
  const stages = useMemo(
    () =>
      buildStages({
        events,
        result,
        isRunning,
        includeFeedback,
      }),
    [events, includeFeedback, isRunning, result],
  );

  const seedPrompt = result?.seed.prompt ?? selectedPreset.seedPrompt;
  const queryPrompt = result?.query.prompt ?? selectedQuery.prompt;
  const expectedEquivalent =
    result?.query.expected_equivalent ?? selectedQuery.expectedEquivalent;
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
        `${API_BASE_URL.replace(/\/$/, "")}/demos/smartmemo/run`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            scenario,
            query_variant: queryVariant,
            cosine_threshold: cosineThreshold,
            classifier_threshold: classifierThreshold,
            include_feedback: includeFeedback,
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
        if (event.type === "demo_failed") {
          setError(event.error ?? "SmartMemo demo failed");
        }
        if (event.final_result) {
          setResult(event.final_result);
        }
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
            <div className="max-w-3xl">
              <div className="flex items-center gap-2">
                <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
                  SmartMemo live demo
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
                      The backend runs the real smartmemo[ml] package. It stores
                      one prompt, searches a near match, then compares a
                      cosine-only cache against SmartMemo&apos;s classifier gate.
                    </p>
                  </HoverCardContent>
                </HoverCard>
              </div>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink">
                Can this cached answer be reused safely?
              </h2>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-ink-muted">
                One cached answer, one near-match request, two decisions:
                threshold-only reuse versus SmartMemo&apos;s classifier gate.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <IconButton
                label={isFocusMode ? "Exit focus mode" : "Open focus mode"}
                disabled={false}
                onClick={() => setIsFocusMode((current) => !current)}
              >
                {isFocusMode ? (
                  <Minimize2 aria-hidden />
                ) : (
                  <Maximize2 aria-hidden />
                )}
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
            <div className="grid gap-3 md:grid-cols-2">
              <ControlGroup
                label="Scenario"
                tip="Safe preset prompt pairs. No arbitrary prompt is sent to the backend."
              >
                <SegmentedControl
                  value={scenario}
                  options={SCENARIO_OPTIONS}
                  onChange={setScenario}
                />
              </ControlGroup>
              <ControlGroup
                label="New request"
                tip="Opposite should be blocked. Paraphrase should remain a cache hit."
              >
                <SegmentedControl
                  value={queryVariant}
                  options={VARIANT_OPTIONS}
                  onChange={setQueryVariant}
                />
              </ControlGroup>
            </div>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                className="min-w-36 flex-1 xl:flex-none"
                onClick={runDemo}
                disabled={isRunning}
                title="Run SmartMemo demo"
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

          <details className="mt-3 rounded-lg border border-border bg-background p-2.5">
            <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-wider text-ink-faint">
              Advanced thresholds
            </summary>
            <div className="mt-2 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
              <RangeControl
                label="Cosine threshold"
                value={cosineThreshold}
                min={0.7}
                max={0.98}
                step={0.01}
                help="The baseline cache reuses when similarity clears this value."
                onChange={setCosineThreshold}
              />
              <RangeControl
                label="Classifier threshold"
                value={classifierThreshold}
                min={0.7}
                max={0.99}
                step={0.01}
                help="SmartMemo reuses only when the learned equivalence score clears this value."
                onChange={setClassifierThreshold}
              />
              <label className="flex h-9 items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 text-sm text-ink">
                <span className="inline-flex items-center gap-2">
                  <FileJson className="size-4 text-ink-faint" aria-hidden />
                  Feedback
                </span>
                <input
                  type="checkbox"
                  checked={includeFeedback}
                  onChange={(event) => setIncludeFeedback(event.target.checked)}
                  className="size-4 accent-ink"
                />
              </label>
            </div>
          </details>
        </div>

        <div className="grid gap-3 border-b border-border p-3 sm:p-4 lg:grid-cols-2">
          <PromptCard
            eyebrow="1. Cached first"
            title="Stored response"
            body={seedPrompt}
            icon={<Database className="size-4" aria-hidden />}
          />
          <PromptCard
            eyebrow="2. New request"
            title={
              expectedEquivalent
                ? "Equivalent paraphrase"
                : "Near match, opposite action"
            }
            body={queryPrompt}
            icon={<Search className="size-4" aria-hidden />}
          />
        </div>

        <div className="p-3 sm:p-4">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
                3. Compare decisions
              </p>
              <h3 className="text-base font-semibold tracking-tight text-ink">
                Same candidate, different safety decision
              </h3>
            </div>
            <span className="font-mono text-[11px] text-ink-faint">
              {config?.domain ?? selectedPreset.domain}
            </span>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            <DecisionCard
              kind="baseline"
              title="Cosine-only cache"
              decision={baselineDecision}
              threshold={cosineThreshold}
            />
            <DecisionCard
              kind="smartmemo"
              title="SmartMemo"
              decision={smartmemoDecision}
              threshold={classifierThreshold}
            />
          </div>

          <ProofLine result={result} isRunning={isRunning} />
        </div>

        <details className="border-t border-border p-3 sm:p-4">
          <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-wider text-ink-faint">
            Evidence: steps, feedback, JSON
          </summary>
          <Tabs defaultValue="steps">
            <TabsList className="mt-3 w-full max-w-xl">
              <TabsTrigger className="flex-1" value="steps">
                Steps
              </TabsTrigger>
              <TabsTrigger className="flex-1" value="feedback">
                Feedback
              </TabsTrigger>
              <TabsTrigger className="flex-1" value="json">
                JSON
              </TabsTrigger>
            </TabsList>

            <TabsContent value="steps">
              <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-5">
                {stages.map((stage) => (
                  <StageTile key={stage.key} stage={stage} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="feedback">
              <pre className="mt-3 max-h-56 overflow-auto rounded-lg border border-border bg-background p-3 text-xs leading-relaxed text-ink-muted">
                {result?.feedback?.jsonl.length
                  ? result.feedback.jsonl.join("\n")
                  : "No feedback pair exported yet."}
              </pre>
            </TabsContent>

            <TabsContent value="json">
              <pre className="mt-3 max-h-64 overflow-auto rounded-lg border border-border bg-background p-3 text-xs leading-relaxed text-ink-muted">
                {JSON.stringify(result ?? events.slice(-8), null, 2)}
              </pre>
            </TabsContent>
          </Tabs>
        </details>
        </div>
      </div>
    </TooltipProvider>
  );
}

async function readErrorDetail(response: Response) {
  try {
    const payload = (await response.json()) as {
      detail?: unknown;
      error?: unknown;
    };
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

function latestDecision(
  events: DemoEvent[],
  type: DemoEvent["type"],
  branch: Decision["branch"],
) {
  const event = [...events]
    .reverse()
    .find((candidate) => candidate.type === type && candidate.decision);
  if (!event?.decision) return null;
  return event.decision.branch === branch ? event.decision : null;
}

function buildStages({
  events,
  result,
  isRunning,
  includeFeedback,
}: {
  events: DemoEvent[];
  result: DemoResult | null;
  isRunning: boolean;
  includeFeedback: boolean;
}): Stage[] {
  const has = (type: DemoEvent["type"]) =>
    events.some((event) => event.type === type);
  const failed = has("demo_failed");
  const runtimeReady = has("runtime_ready") || Boolean(result);
  const seedDone = has("cache_seeded") || Boolean(result);
  const cosineDone = has("cosine_decision") || Boolean(result);
  const smartmemoDone = has("classifier_decision") || Boolean(result);
  const feedbackDone = has("feedback_exported") || Boolean(result?.feedback);
  const feedbackSkipped = !includeFeedback || (Boolean(result) && !result?.feedback);

  return [
    {
      key: "runtime",
      title: "Runtime",
      detail: runtimeReady ? "smartmemo[ml] ready" : "load embeddings",
      status: stageStatus({
        done: runtimeReady,
        running: has("runtime_loading") && !runtimeReady && isRunning,
        failed,
      }),
      icon: <Database className="size-4" aria-hidden />,
    },
    {
      key: "seed",
      title: "Seed",
      detail: seedDone ? "cached first prompt" : "store response",
      status: stageStatus({
        done: seedDone,
        running: has("cache_seed_started") && !seedDone && isRunning,
        failed,
      }),
      icon: <Database className="size-4" aria-hidden />,
    },
    {
      key: "cosine",
      title: "Cosine",
      detail: cosineDone ? "baseline decided" : "nearest match",
      status: stageStatus({
        done: cosineDone,
        running:
          has("lookup_started") && !cosineDone && seedDone && isRunning,
        failed,
      }),
      icon: <Search className="size-4" aria-hidden />,
    },
    {
      key: "smartmemo",
      title: "Classifier",
      detail: smartmemoDone ? "gate decided" : "check equivalence",
      status: stageStatus({
        done: smartmemoDone,
        running: cosineDone && !smartmemoDone && isRunning,
        failed,
      }),
      icon: <ShieldCheck className="size-4" aria-hidden />,
    },
    {
      key: "feedback",
      title: "Feedback",
      detail: includeFeedback
        ? feedbackDone
          ? "JSONL exported"
          : feedbackSkipped
            ? "nothing to label"
            : "label baseline hit"
        : "skipped",
      status: feedbackSkipped
        ? "skipped"
        : includeFeedback
          ? stageStatus({
              done: feedbackDone,
              running: cosineDone && !feedbackDone && isRunning,
              failed,
            })
          : "skipped",
      icon: <FileJson className="size-4" aria-hidden />,
    },
  ];
}

function stageStatus({
  done,
  running,
  failed,
}: {
  done: boolean;
  running: boolean;
  failed: boolean;
}): StageStatus {
  if (failed) return "failed";
  if (done) return "done";
  if (running) return "running";
  return "pending";
}

function PromptCard({
  eyebrow,
  title,
  body,
  icon,
}: {
  eyebrow: string;
  title: string;
  body: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-border text-ink-faint">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
            {eyebrow}
          </p>
          <p className="truncate text-sm font-semibold text-ink">{title}</p>
        </div>
      </div>
      <p className="line-clamp-2 text-sm leading-relaxed text-ink-muted">
        {body}
      </p>
    </div>
  );
}

function DecisionCard({
  kind,
  title,
  decision,
  threshold,
}: {
  kind: "baseline" | "smartmemo";
  title: string;
  decision: Decision | null;
  threshold: number;
}) {
  const tone = decision
    ? decision.unsafe_reuse
      ? "danger"
      : decision.safe_reuse || decision.decision_label === "blocked unsafe reuse"
        ? "success"
        : "neutral"
    : "neutral";
  const score =
    kind === "baseline"
      ? decision?.similarity_score
      : decision?.classifier_score;
  const mainLabel = decision ? decisionTitle(decision, kind) : "Waiting";

  return (
    <div
      className={cn(
        "rounded-lg border bg-background p-3",
        tone === "danger" && "border-destructive/40 bg-destructive/5",
        tone === "success" && "border-emerald-500/40 bg-emerald-500/5",
        tone === "neutral" && "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
            {kind === "baseline" ? "common baseline" : "smartmemo path"}
          </p>
          <h4 className="mt-1 text-base font-semibold text-ink">{title}</h4>
        </div>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
            tone === "danger" && "border-destructive/30 text-destructive",
            tone === "success" && "border-emerald-500/30 text-emerald-600",
            tone === "neutral" && "border-border text-ink-muted",
          )}
        >
          {tone === "danger" ? (
            <XCircle className="size-3.5" aria-hidden />
          ) : tone === "success" ? (
            <CheckCircle2 className="size-3.5" aria-hidden />
          ) : null}
          {mainLabel}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <MiniStat
          label={kind === "baseline" ? "cosine" : "classifier"}
          value={formatScore(score)}
        />
        <MiniStat label="threshold" value={formatScore(threshold)} />
        <MiniStat
          label="llm"
          value={
            decision
              ? decision.query_llm_called
                ? "called"
                : "skipped"
              : "-"
          }
        />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ink-muted">
        {decision ? decisionExplanation(decision, kind) : waitingExplanation(kind)}
      </p>

      {decision ? (
        <div className="mt-3 rounded-md border border-border/70 bg-surface px-3 py-2">
          <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
            returned
          </p>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-muted">
            {decision.response}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function ProofLine({
  result,
  isRunning,
}: {
  result: DemoResult | null;
  isRunning: boolean;
}) {
  if (!result) {
    return (
      <div className="mt-3 rounded-lg border border-border bg-background px-3 py-2 text-sm text-ink-muted">
        {isRunning
          ? "Running SmartMemo with real embeddings, FAISS, SQLite, and the bundled classifier..."
          : "Run it to see whether SmartMemo reuses the cached answer or blocks it."}
      </div>
    );
  }

  if (result.comparison.blocked_unsafe_reuse) {
    return (
      <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm leading-relaxed text-emerald-700">
        SmartMemo blocked the exact failure mode: cosine similarity found a
        near match, but the classifier rejected reuse and returned the correct
        fresh response.
      </div>
    );
  }

  if (result.comparison.preserved_safe_reuse) {
    return (
      <div className="mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm leading-relaxed text-emerald-700">
        SmartMemo kept the useful cache hit: the new request was equivalent, so
        it reused the cached response and skipped another LLM call.
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed text-ink-muted">
      This preset did not produce a blocked false positive with the current
      thresholds. Lower the cosine threshold or choose Opposite to stress the
      safety gate.
    </div>
  );
}

function StageTile({ stage }: { stage: Stage }) {
  return (
    <div className="rounded-lg border border-border bg-background p-2.5">
      <div className="flex items-center justify-between gap-3">
        <span className={stageIconClass(stage.status)}>{stage.icon}</span>
        <span className={stageTextClass(stage.status)}>{stage.status}</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-ink">{stage.title}</p>
      <p className="mt-1 text-xs leading-relaxed text-ink-muted">{stage.detail}</p>
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

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  help,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  help: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
            {label}
          </span>
          <HelpTip label={label}>{help}</HelpTip>
        </div>
        <span className="font-mono text-xs text-ink">{formatPercent(value)}</span>
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
        {label}
      </p>
      <p className="mt-1 truncate font-mono text-sm text-ink">{value}</p>
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

function decisionTitle(decision: Decision, kind: "baseline" | "smartmemo") {
  if (decision.unsafe_reuse) return "Wrong reuse";
  if (decision.safe_reuse) return "Safe reuse";
  if (kind === "smartmemo" && decision.decision_label === "blocked unsafe reuse") {
    return "Blocked";
  }
  return decision.was_cache_hit ? "Cache hit" : "Cache miss";
}

function decisionExplanation(decision: Decision, kind: "baseline" | "smartmemo") {
  if (kind === "baseline") {
    if (decision.unsafe_reuse) {
      return "Cosine similarity says the prompts are close, so a threshold-only cache returns the old response even though the new request means the opposite.";
    }
    if (decision.safe_reuse) {
      return "Cosine similarity finds a close equivalent prompt and reuses the cached response.";
    }
    return "Cosine similarity did not clear the threshold, so the baseline misses.";
  }

  if (decision.decision_label === "blocked unsafe reuse") {
    return "SmartMemo still uses cosine to find the candidate, then the classifier rejects semantic reuse and calls the fresh function.";
  }
  if (decision.safe_reuse) {
    return "SmartMemo confirms the pair is equivalent and safely reuses the cached response.";
  }
  return "SmartMemo rejects reuse, so the cache miss path produces a fresh response.";
}

function waitingExplanation(kind: "baseline" | "smartmemo") {
  return kind === "baseline"
    ? "This branch shows what a normal cosine-threshold semantic cache would do."
    : "This branch shows SmartMemo's classifier-gated decision on the same candidate.";
}

function stageIconClass(status: StageStatus) {
  return cn(
    "inline-flex size-8 items-center justify-center rounded-md border",
    status === "done" && "border-emerald-500/30 text-emerald-600",
    status === "running" && "border-primary/30 text-primary",
    status === "failed" && "border-destructive/30 text-destructive",
    status === "pending" && "border-border text-ink-faint",
    status === "skipped" && "border-border text-ink-muted",
  );
}

function stageTextClass(status: StageStatus) {
  return cn(
    "font-mono text-[10px] uppercase tracking-wider",
    status === "done" && "text-emerald-600",
    status === "running" && "text-primary",
    status === "failed" && "text-destructive",
    status === "pending" && "text-ink-faint",
    status === "skipped" && "text-ink-muted",
  );
}

function formatScore(value: number | null | undefined) {
  if (typeof value !== "number") return "-";
  return value.toFixed(3);
}

function formatPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}
