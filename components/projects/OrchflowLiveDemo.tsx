"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertCircle,
  Braces,
  CheckCircle2,
  Clock3,
  Cpu,
  DatabaseZap,
  ExternalLink,
  GitBranch,
  HelpCircle,
  Loader2,
  Play,
  RotateCcw,
  ShieldCheck,
  Square,
  Workflow,
  XCircle,
} from "lucide-react";

import ReplayTerminal, {
  type TraceStep as ReplayTraceStep,
} from "@/components/projects/ReplayTerminal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type DemoMode = "success" | "failure_resume";
type ModelPreset = "balanced" | "haiku_only" | "o4_mini_only";

interface CheckpointMeta {
  action?: "saved" | "loaded";
  status?: string | null;
  next_step_index?: number | null;
}

interface StepTrace {
  step_name: string;
  output: unknown;
  error: string | null;
  attempt: number;
  parallel_group_id: string | null;
  duration_seconds: number;
  success: boolean;
}

interface FlowResult {
  output: unknown;
  traces: StepTrace[];
  duration_seconds: number;
  success: boolean;
  failed_step: string | null;
  state: Record<string, unknown>;
  error: string | null;
}

interface DemoEvent {
  phase: "run" | "initial" | "resume";
  type: string;
  run_id: string;
  timestamp: string;
  step_name: string | null;
  attempt: number | null;
  parallel_group_id: string | null;
  output: unknown;
  error: string | null;
  trace: StepTrace | null;
  checkpoint: CheckpointMeta | null;
  final_result: FlowResult | null;
}

type StepLifecycleStatus = "running" | "retrying" | "completed" | "failed";

type TimelineItem =
  | {
      kind: "event";
      id: string;
      event: DemoEvent;
      eventIndex: number;
    }
  | {
      kind: "step";
      id: string;
      event: DemoEvent;
      eventIndex: number;
      phase: DemoEvent["phase"];
      stepName: string;
      status: StepLifecycleStatus;
      attempt: number | null;
      retryCount: number;
      parallelGroupId: string | null;
      error: string | null;
    };

interface DemoOutput {
  title?: string;
  status?: string;
  audience?: string;
  summary?: string;
  why_orchflow?: string[];
  models?: {
    preset?: string;
    fast_parallel_steps?: string;
    reasoning_steps?: string;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const DEMO_REPO_URL = "https://github.com/awesome-pro/portfolio-service";
const DEFAULT_TOPIC = "AI code review assistant";
const DEFAULT_AUDIENCE = "engineering managers";
const DEFAULT_CONSTRAINTS =
  "Show why traces, parallel branches, and checkpoint resume matter.";

const MODEL_PRESETS: Array<{
  id: ModelPreset;
  title: string;
  body: string;
  fast: string;
  reasoning: string;
}> = [
  {
    id: "balanced",
    title: "Balanced",
    body: "Haiku handles branch work; o4-mini handles synthesis and final copy.",
    fast: "Haiku",
    reasoning: "o4-mini",
  },
  {
    id: "haiku_only",
    title: "Haiku",
    body: "Keeps every agent on the low-latency Anthropic path.",
    fast: "Haiku",
    reasoning: "Haiku",
  },
  {
    id: "o4_mini_only",
    title: "o4-mini",
    body: "Runs every agent through the OpenAI reasoning preset.",
    fast: "o4-mini",
    reasoning: "o4-mini",
  },
];

const PIPELINE_STAGES = [
  {
    id: "plan",
    label: "Plan",
    detail: "Creates the launch brief outline from the small visitor inputs.",
    steps: ["plan"],
  },
  {
    id: "parallel",
    label: "Research",
    detail: "Market, technical, and risk agents run as one parallel Orchflow group.",
    steps: ["market_research", "technical_research", "risk_review"],
  },
  {
    id: "synthesize",
    label: "Synthesize",
    detail: "Merges branch outputs into a structured draft.",
    steps: ["synthesize"],
  },
  {
    id: "route",
    label: "Route",
    detail: "A condition chooses publish-ready output or a revision branch.",
    steps: ["publish_ready", "revise"],
  },
  {
    id: "finalize",
    label: "Finalize",
    detail: "Returns the final object plus flat traces for the UI.",
    steps: ["finalize"],
  },
];

export default function OrchflowLiveDemo({
  fallbackTrace,
}: {
  fallbackTrace: ReplayTraceStep[];
}) {
  const [topic, setTopic] = useState(DEFAULT_TOPIC);
  const [audience, setAudience] = useState(DEFAULT_AUDIENCE);
  const [constraints, setConstraints] = useState(DEFAULT_CONSTRAINTS);
  const [mode, setMode] = useState<DemoMode>("success");
  const [modelPreset, setModelPreset] = useState<ModelPreset>("balanced");
  const [events, setEvents] = useState<DemoEvent[]>([]);
  const [result, setResult] = useState<FlowResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedEventIndex, setSelectedEventIndex] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const apiReady = Boolean(API_BASE_URL);
  const traces = useMemo(() => result?.traces ?? [], [result]);
  const parsedOutput = useMemo(() => parseDemoOutput(result?.output), [result]);
  const selectedPreset = MODEL_PRESETS.find((preset) => preset.id === modelPreset)!;
  const selectedEvent =
    selectedEventIndex === null
      ? events.at(-1) ?? null
      : events[selectedEventIndex] ?? events.at(-1) ?? null;
  const stats = useMemo(() => eventStats(events, traces, result), [events, traces, result]);

  async function runDemo() {
    if (!API_BASE_URL) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setEvents([]);
    setResult(null);
    setError(null);
    setSelectedEventIndex(null);
    setIsRunning(true);

    try {
      const response = await fetch(
        `${API_BASE_URL.replace(/\/$/, "")}/demos/orchflow/run`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            topic,
            audience,
            constraints,
            mode,
            model_preset: modelPreset,
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
        if (event.type === "flow_completed" && event.final_result) {
          setResult(event.final_result);
        }
        if (event.type === "flow_failed" && event.phase !== "initial") {
          setError(event.error ?? event.final_result?.error ?? "Flow failed");
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
    setSelectedEventIndex(null);
  }

  if (!apiReady) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-lg border border-border bg-surface p-4 text-sm text-ink-muted">
          Set{" "}
          <span className="font-mono text-xs text-ink">
            NEXT_PUBLIC_DEMOS_API_URL
          </span>{" "}
          to enable the live run.
        </div>
        <ReplayTerminal steps={fallbackTrace} title="orchflow · content-pipeline" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-lg border border-border bg-background">
              <Workflow className="size-4 text-ink" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-base font-semibold tracking-tight text-ink">
                  Orchflow live demo
                </h2>
                <HelpTip label="How this demo works">
                  The UI streams real Orchflow lifecycle events from the backend:
                  sequential steps, a parallel research group, retry/resume, and
                  the final FlowResult.
                </HelpTip>
              </div>
              <p className="font-mono text-[11px] text-ink-faint">
                live Flow.events() stream
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <InfoPill icon={<Cpu />} label="Live LLMs">
              Calls are made on the backend with server-side API keys.
            </InfoPill>
            <InfoPill icon={<ShieldCheck />} label="Safe presets">
              Visitors can only choose allowlisted model presets and bounded
              inputs.
            </InfoPill>
            <InfoPill icon={<Clock3 />} label="Rate limited">
              The API limits repeated runs per client.
            </InfoPill>
            <Button variant="outline" size="sm" asChild>
              <a href={DEMO_REPO_URL} target="_blank" rel="noopener noreferrer">
                Repo
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-[18.5rem_1fr]">
          <aside className="border-b border-border p-4 lg:border-b-0 lg:border-r">
            <RunConfig
              audience={audience}
              constraints={constraints}
              isRunning={isRunning}
              mode={mode}
              modelPreset={modelPreset}
              selectedPreset={selectedPreset}
              topic={topic}
              onAudienceChange={setAudience}
              onConstraintsChange={setConstraints}
              onModeChange={setMode}
              onModelPresetChange={setModelPreset}
              onReset={resetDemo}
              onRun={runDemo}
              onStop={stopDemo}
              onTopicChange={setTopic}
            />
          </aside>

          <div className="min-w-0">
            {error && (
              <div className="border-b border-border bg-destructive/5 px-4 py-2 text-sm text-destructive">
                <span className="inline-flex items-center gap-2">
                  <AlertCircle className="size-4" aria-hidden="true" />
                  {error}
                </span>
              </div>
            )}

            <div className="border-b border-border p-4">
              <PipelineProgress events={events} result={result} />
            </div>

            <div className="grid xl:grid-cols-[minmax(0,1fr)_20rem]">
              <div className="min-w-0 border-b border-border p-4 xl:border-b-0 xl:border-r">
                <Tabs defaultValue="timeline" className="gap-3">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <StatsBar stats={stats} />
                    <TabsList>
                      <TabsTrigger value="timeline">Timeline</TabsTrigger>
                      <TabsTrigger value="traces">Traces</TabsTrigger>
                      <TabsTrigger value="json">JSON</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="timeline">
                    <TimelinePanel
                      events={events}
                      isRunning={isRunning}
                      selectedEventIndex={selectedEventIndex}
                      onSelectEvent={setSelectedEventIndex}
                    />
                  </TabsContent>
                  <TabsContent value="traces">
                    <TraceTable traces={traces} />
                  </TabsContent>
                  <TabsContent value="json">
                    <JsonPanel event={selectedEvent} />
                  </TabsContent>
                </Tabs>
              </div>

              <div className="space-y-4 p-4">
                <FinalOutputPanel output={parsedOutput} result={result} />
                <SelectedEventCard event={selectedEvent} />
              </div>
            </div>
          </div>
        </div>
      </section>
    </TooltipProvider>
  );
}

function RunConfig({
  audience,
  constraints,
  isRunning,
  mode,
  modelPreset,
  selectedPreset,
  topic,
  onAudienceChange,
  onConstraintsChange,
  onModeChange,
  onModelPresetChange,
  onReset,
  onRun,
  onStop,
  onTopicChange,
}: {
  audience: string;
  constraints: string;
  isRunning: boolean;
  mode: DemoMode;
  modelPreset: ModelPreset;
  selectedPreset: (typeof MODEL_PRESETS)[number];
  topic: string;
  onAudienceChange: (value: string) => void;
  onConstraintsChange: (value: string) => void;
  onModeChange: (value: DemoMode) => void;
  onModelPresetChange: (value: ModelPreset) => void;
  onReset: () => void;
  onRun: () => void;
  onStop: () => void;
  onTopicChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-3">
        <SectionLabel label="Inputs">
          These are intentionally small edits. The backend validates length and
          does not expose arbitrary prompts or models.
        </SectionLabel>
        <LabeledInput
          label="Topic"
          maxLength={160}
          value={topic}
          onChange={onTopicChange}
        />
        <LabeledInput
          label="Audience"
          maxLength={120}
          value={audience}
          onChange={onAudienceChange}
        />
        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
            Constraints
          </span>
          <textarea
            value={constraints}
            onChange={(event) => onConstraintsChange(event.target.value)}
            maxLength={240}
            rows={3}
            className="resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed text-ink outline-none transition-colors focus:border-ink/40"
          />
          <span className="text-right font-mono text-[10px] text-ink-faint">
            {constraints.length}/240
          </span>
        </label>
      </div>

      <div className="space-y-3">
        <SectionLabel label="Model">
          Presets are mapped server-side to Haiku and o4-mini. The visitor never
          sends raw model names to the provider.
        </SectionLabel>
        <div className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-background p-1">
          {MODEL_PRESETS.map((preset) => (
            <ModelPresetButton
              key={preset.id}
              preset={preset}
              selected={modelPreset === preset.id}
              onSelect={() => onModelPresetChange(preset.id)}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <SectionLabel label="Mode">
          Resume proof intentionally fails synthesis on the first run, loads a
          JSON checkpoint, and resumes with appended traces.
        </SectionLabel>
        <div className="grid grid-cols-2 rounded-lg border border-border bg-background p-1">
          <button
            type="button"
            onClick={() => onModeChange("success")}
            className={modeButtonClass(mode === "success")}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => onModeChange("failure_resume")}
            className={modeButtonClass(mode === "failure_resume")}
          >
            Resume
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
        <span className="flex min-w-0 items-center gap-2 text-sm text-ink">
          <Cpu className="size-4 text-ink-muted" aria-hidden="true" />
          <span className="truncate">
            {selectedPreset.fast} to {selectedPreset.reasoning}
          </span>
        </span>
        <HelpTip label="Preset routing">
          {selectedPreset.body}
        </HelpTip>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={onRun}
          disabled={isRunning || topic.trim().length < 3}
          className="flex-1"
          title="Run the Orchflow demo"
        >
          {isRunning ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <Play aria-hidden="true" />
          )}
          Run
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onStop}
          disabled={!isRunning}
          title="Stop the current run"
        >
          <Square aria-hidden="true" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onReset}
          disabled={isRunning}
          title="Reset output"
        >
          <RotateCcw aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

function SectionLabel({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
        {label}
      </p>
      <HelpTip label={`${label} help`}>{children}</HelpTip>
    </div>
  );
}

function LabeledInput({
  label,
  maxLength,
  value,
  onChange,
}: {
  label: string;
  maxLength: number;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
        {label}
      </span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        maxLength={maxLength}
        className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-ink outline-none transition-colors focus:border-ink/40"
      />
    </label>
  );
}

function ModelPresetButton({
  onSelect,
  preset,
  selected,
}: {
  onSelect: () => void;
  preset: (typeof MODEL_PRESETS)[number];
  selected: boolean;
}) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button
          type="button"
          onClick={onSelect}
          className={[
            "flex h-8 items-center justify-center rounded-md px-2 text-xs font-medium transition-colors",
            selected ? "bg-ink text-background" : "text-ink-muted hover:text-ink",
          ].join(" ")}
        >
          {preset.title}
        </button>
      </HoverCardTrigger>
      <HoverCardContent>
        <p className="text-sm font-semibold text-ink">{preset.title}</p>
        <p className="mt-1 text-xs leading-relaxed text-ink-muted">
          {preset.body}
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md border border-border bg-background p-2">
            <p className="font-mono text-[10px] uppercase text-ink-faint">
              Branches
            </p>
            <p className="mt-1 font-medium text-ink">{preset.fast}</p>
          </div>
          <div className="rounded-md border border-border bg-background p-2">
            <p className="font-mono text-[10px] uppercase text-ink-faint">
              Synthesis
            </p>
            <p className="mt-1 font-medium text-ink">{preset.reasoning}</p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

function PipelineProgress({
  events,
  result,
}: {
  events: DemoEvent[];
  result: FlowResult | null;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <p className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
            Runtime graph
          </p>
          <HelpTip label="Runtime graph help">
            Each tile is a top-level Orchflow item. The research tile represents
            a parallel group that shares one parallel_group_id in the traces.
            A recovered retry stays green because the latest attempt succeeded.
          </HelpTip>
        </div>
        {result?.success && (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="size-3" aria-hidden="true" />
            Done
          </Badge>
        )}
      </div>
      <div className="grid gap-2 sm:grid-cols-5">
        {PIPELINE_STAGES.map((stage, index) => {
          const status = stageStatus(stage.steps, events, result);
          return (
            <HoverCard key={stage.id}>
              <HoverCardTrigger asChild>
                <button
                  type="button"
                  className={[
                    "min-h-16 rounded-lg border p-3 text-left transition-colors",
                    status === "complete" && "border-emerald-200 bg-emerald-50/60",
                    status === "recovered" && "border-emerald-200 bg-emerald-50/60",
                    status === "active" && "border-blue-200 bg-blue-50/70",
                    status === "failed" && "border-destructive/30 bg-destructive/5",
                    status === "idle" && "border-border bg-background hover:border-ink/30",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <StageIcon status={status} />
                    <span className="font-mono text-[10px] text-ink-faint">
                      {index + 1}
                    </span>
                  </div>
                  <p className="truncate text-sm font-semibold text-ink">
                    {stage.label}
                  </p>
                </button>
              </HoverCardTrigger>
              <HoverCardContent>
                <p className="text-sm font-semibold text-ink">{stage.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                  {stage.detail}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {stage.steps.map((step) => (
                    <Badge key={step} variant="outline" className="font-mono">
                      {step}
                    </Badge>
                  ))}
                  {status === "recovered" && (
                    <Badge variant="secondary" className="gap-1">
                      <RotateCcw className="size-3" aria-hidden="true" />
                      retry recovered
                    </Badge>
                  )}
                </div>
              </HoverCardContent>
            </HoverCard>
          );
        })}
      </div>
    </div>
  );
}

function StageIcon({ status }: { status: StageStatus }) {
  if (status === "complete") {
    return <CheckCircle2 className="size-4 text-emerald-600" aria-hidden="true" />;
  }
  if (status === "recovered") {
    return <RotateCcw className="size-4 text-amber-600" aria-hidden="true" />;
  }
  if (status === "failed") {
    return <XCircle className="size-4 text-destructive" aria-hidden="true" />;
  }
  if (status === "active") {
    return <Loader2 className="size-4 animate-spin text-blue-600" aria-hidden="true" />;
  }
  return <Workflow className="size-4 text-ink-faint" aria-hidden="true" />;
}

type StageStatus = "idle" | "active" | "complete" | "recovered" | "failed";

function stageStatus(
  steps: string[],
  events: DemoEvent[],
  result: FlowResult | null,
): StageStatus {
  if (result?.success && steps.some((step) => traceHasStep(result.traces, step))) {
    return stageHasRecoveredAttempt(steps, events, result.traces)
      ? "recovered"
      : "complete";
  }
  const relevant = events.filter((event) => event.step_name && steps.includes(event.step_name));
  const latestByStep = latestStepEvents(relevant);
  if ([...latestByStep.values()].some((event) => event.type === "step_failed")) {
    return "failed";
  }

  const startedSteps = new Set(
    relevant
      .filter((event) => event.type === "step_started")
      .map((event) => event.step_name),
  );
  const completedSteps = new Set(
    relevant
      .filter((event) => event.type === "step_completed")
      .map((event) => event.step_name),
  );
  const expectedSteps = steps.filter(
    (step) => startedSteps.has(step) || completedSteps.has(step),
  );
  if (expectedSteps.length > 0 && expectedSteps.every((step) => completedSteps.has(step))) {
    return relevant.some((event) => event.type === "step_failed")
      ? "recovered"
      : "complete";
  }
  if (relevant.some((event) => event.type === "step_started" || event.type === "retry_scheduled")) {
    return "active";
  }
  return "idle";
}

function traceHasStep(traces: StepTrace[], stepName: string) {
  return traces.some((trace) => trace.step_name === stepName && trace.success);
}

function latestStepEvents(events: DemoEvent[]) {
  const latestByStep = new Map<string, DemoEvent>();
  for (const event of events) {
    if (event.step_name) latestByStep.set(event.step_name, event);
  }
  return latestByStep;
}

function stageHasRecoveredAttempt(
  steps: string[],
  events: DemoEvent[],
  traces: StepTrace[],
) {
  return (
    traces.some(
      (trace) =>
        steps.includes(trace.step_name) && !trace.success && isTraceRecovered(trace, traces),
    ) ||
    events.some(
      (event, index) =>
        event.type === "step_failed" &&
        event.step_name !== null &&
        steps.includes(event.step_name) &&
        hasLaterCompletion(events, event, index),
    )
  );
}

function StatsBar({ stats }: { stats: ReturnType<typeof eventStats> }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Metric icon={<Clock3 className="size-3.5" />} label="events" value={stats.events} />
      <Metric icon={<GitBranch className="size-3.5" />} label="parallel" value={stats.parallelGroups} />
      <Metric icon={<ShieldCheck className="size-3.5" />} label="ok" value={stats.successfulTraces} />
      {stats.retryAttempts > 0 && (
        <Metric icon={<RotateCcw className="size-3.5" />} label="retries" value={stats.retryAttempts} />
      )}
      {stats.failedTraces > 0 && (
        <Metric icon={<XCircle className="size-3.5" />} label="failed" value={stats.failedTraces} />
      )}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-ink-muted">
          {icon}
          <span className="font-mono text-ink">{value}</span>
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent>{metricHelp(label)}</TooltipContent>
    </Tooltip>
  );
}

function TimelinePanel({
  events,
  isRunning,
  selectedEventIndex,
  onSelectEvent,
}: {
  events: DemoEvent[];
  isRunning: boolean;
  selectedEventIndex: number | null;
  onSelectEvent: (index: number) => void;
}) {
  if (events.length === 0) {
    return <EmptyState isRunning={isRunning} />;
  }

  const items = buildTimelineItems(events);

  return (
    <div className="grid max-h-[30rem] gap-2 overflow-y-auto pr-1">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelectEvent(item.eventIndex)}
          className={[
            "rounded-lg border px-3 py-2 text-left transition-colors",
            selectedEventIndex === item.eventIndex
              ? "border-ink bg-background"
              : "border-border bg-surface hover:border-ink/30",
          ].join(" ")}
        >
          {item.kind === "step" ? (
            <StepLifecycleRow item={item} />
          ) : (
            <EventRow event={item.event} />
          )}
        </button>
      ))}
    </div>
  );
}

function StepLifecycleRow({ item }: { item: Extract<TimelineItem, { kind: "step" }> }) {
  const showError = item.status === "failed" || item.status === "retrying";

  return (
    <div className="min-w-0">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
          {item.phase}
        </span>
        <span
          className={`inline-flex items-center gap-1 text-xs font-semibold ${stepLifecycleTone(
            item,
          )}`}
        >
          {stepLifecycleIcon(item.status)}
          {stepLifecycleLabel(item)}
        </span>
        <span className="font-mono text-[11px] text-ink-muted">
          {item.stepName}
        </span>
        {item.attempt && (
          <span className="font-mono text-[10px] text-ink-faint">
            a{item.attempt}
          </span>
        )}
      </div>

      {(item.parallelGroupId || item.retryCount > 0 || (showError && item.error)) && (
        <div className="mt-1 flex min-w-0 flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-ink-faint">
          {item.parallelGroupId && (
            <span>parallel {shortId(item.parallelGroupId)}</span>
          )}
          {item.retryCount > 0 && (
            <span>
              {item.status === "completed" ? "recovered" : "retry"} x{item.retryCount}
            </span>
          )}
          {showError && item.error && (
            <span
              className={[
                "max-w-full truncate",
                item.status === "retrying" ? "text-amber-700" : "text-destructive",
              ].join(" ")}
            >
              {item.error}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function EventRow({ event }: { event: DemoEvent }) {
  const tone = eventTone(event.type);
  const checkpoint = event.checkpoint;

  return (
    <div className="min-w-0">
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">
          {event.phase}
        </span>
        <span className={`inline-flex items-center gap-1 text-xs font-semibold ${tone}`}>
          {eventIcon(event.type)}
          {eventLabel(event.type)}
        </span>
        {event.step_name && (
          <span className="font-mono text-[11px] text-ink-muted">
            {event.step_name}
          </span>
        )}
        {event.attempt && (
          <span className="font-mono text-[10px] text-ink-faint">
            a{event.attempt}
          </span>
        )}
      </div>

      {(event.parallel_group_id || checkpoint?.status || event.error) && (
        <div className="mt-1 flex min-w-0 flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-ink-faint">
          {event.parallel_group_id && (
            <span>parallel {shortId(event.parallel_group_id)}</span>
          )}
          {checkpoint?.status && (
            <span>
              checkpoint {checkpoint.action}: {checkpoint.status}
            </span>
          )}
          {event.error && (
            <span
              className={[
                "max-w-full truncate",
                event.type === "step_failed" ? "text-amber-700" : "text-destructive",
              ].join(" ")}
            >
              {event.error}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function buildTimelineItems(events: DemoEvent[]) {
  const items: TimelineItem[] = [];
  const stepItemIndexes = new Map<string, number>();

  events.forEach((event, eventIndex) => {
    if (!isStepLifecycleEvent(event)) {
      items.push({
        kind: "event",
        id: `${event.timestamp}-${eventIndex}`,
        event,
        eventIndex,
      });
      return;
    }

    const key = stepTimelineKey(event);
    const existingIndex = stepItemIndexes.get(key);
    const previous =
      existingIndex !== undefined && items[existingIndex]?.kind === "step"
        ? items[existingIndex]
        : null;
    const item: Extract<TimelineItem, { kind: "step" }> = {
      kind: "step",
      id: key,
      event,
      eventIndex,
      phase: event.phase,
      stepName: event.step_name,
      status: stepLifecycleStatus(event.type),
      attempt: event.attempt ?? previous?.attempt ?? null,
      retryCount:
        (previous?.retryCount ?? 0) + (event.type === "retry_scheduled" ? 1 : 0),
      parallelGroupId: event.parallel_group_id ?? previous?.parallelGroupId ?? null,
      error:
        event.type === "step_completed"
          ? null
          : event.error ?? previous?.error ?? null,
    };

    if (existingIndex === undefined) {
      stepItemIndexes.set(key, items.length);
      items.push(item);
    } else {
      items[existingIndex] = item;
    }
  });

  return items;
}

function isStepLifecycleEvent(
  event: DemoEvent,
): event is DemoEvent & { step_name: string } {
  return (
    event.step_name !== null &&
    [
      "step_started",
      "step_completed",
      "step_failed",
      "retry_scheduled",
    ].includes(event.type)
  );
}

function stepTimelineKey(event: DemoEvent & { step_name: string }) {
  return `${event.phase}:${event.step_name}`;
}

function stepLifecycleStatus(type: string): StepLifecycleStatus {
  if (type === "step_completed") return "completed";
  if (type === "step_failed") return "failed";
  if (type === "retry_scheduled") return "retrying";
  return "running";
}

function stepLifecycleIcon(status: StepLifecycleStatus) {
  if (status === "completed") {
    return <CheckCircle2 className="size-3.5" aria-hidden="true" />;
  }
  if (status === "failed") {
    return <XCircle className="size-3.5" aria-hidden="true" />;
  }
  if (status === "retrying") {
    return <RotateCcw className="size-3.5" aria-hidden="true" />;
  }
  return <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />;
}

function stepLifecycleLabel(item: Extract<TimelineItem, { kind: "step" }>) {
  if (item.status === "completed" && item.retryCount > 0) return "recovered";
  if (item.status === "completed") return "step_completed";
  if (item.status === "failed") return "attempt_failed";
  if (item.status === "retrying") return "retry_scheduled";
  return "step_started";
}

function stepLifecycleTone(item: Extract<TimelineItem, { kind: "step" }>) {
  if (item.status === "completed") return "text-emerald-600";
  if (item.status === "failed") return "text-destructive";
  if (item.status === "retrying") return "text-amber-600";
  return "text-blue-600";
}

function eventIcon(type: string) {
  if (type === "flow_completed" || type === "step_completed") {
    return <CheckCircle2 className="size-3.5" aria-hidden="true" />;
  }
  if (type === "checkpoint_saved" || type === "checkpoint_loaded") {
    return <DatabaseZap className="size-3.5" aria-hidden="true" />;
  }
  if (type === "step_failed") {
    return <AlertCircle className="size-3.5" aria-hidden="true" />;
  }
  if (type === "flow_failed") {
    return <XCircle className="size-3.5" aria-hidden="true" />;
  }
  if (type === "retry_scheduled") {
    return <RotateCcw className="size-3.5" aria-hidden="true" />;
  }
  return null;
}

function eventLabel(type: string) {
  if (type === "step_failed") return "attempt_failed";
  return type;
}

function EmptyState({ isRunning }: { isRunning: boolean }) {
  return (
    <div className="grid min-h-[20rem] place-items-center rounded-lg border border-dashed border-border bg-background text-center">
      <div className="max-w-xs px-4">
        {isRunning ? (
          <Loader2
            className="mx-auto mb-3 size-5 animate-spin text-ink-muted"
            aria-hidden="true"
          />
        ) : (
          <Workflow className="mx-auto mb-3 size-5 text-ink-muted" />
        )}
        <p className="text-sm text-ink-muted">
          {isRunning ? "Waiting for the first event." : "Ready to run."}
        </p>
      </div>
    </div>
  );
}

function FinalOutputPanel({
  output,
  result,
}: {
  output: DemoOutput | null;
  result: FlowResult | null;
}) {
  return (
    <section className="rounded-lg border border-border bg-background p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Braces className="size-4 text-ink-muted" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-ink">Final</h3>
        </div>
        <HelpTip label="Final output help">
          This object is returned by the last Orchflow step, not handcrafted in
          the UI.
        </HelpTip>
      </div>

      {output ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={result?.success ? "secondary" : "destructive"}>
              {output.status ?? "complete"}
            </Badge>
            {output.models?.preset && (
              <Badge variant="outline">{output.models.preset}</Badge>
            )}
            {output.why_orchflow?.length ? (
              <WhyOutputHover items={output.why_orchflow} />
            ) : null}
          </div>
          <h4 className="text-lg font-semibold leading-snug text-ink">
            {output.title ?? "Launch brief"}
          </h4>
          {output.summary && (
            <p className="text-sm leading-relaxed text-ink-muted">
              {output.summary}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-ink-muted">No output yet.</p>
      )}
    </section>
  );
}

function WhyOutputHover({ items }: { items: string[] }) {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="inline-flex h-5 items-center rounded-4xl border border-border px-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          Why Orchflow
        </button>
      </HoverCardTrigger>
      <HoverCardContent align="end">
        <p className="text-sm font-semibold text-ink">Why this run used Orchflow</p>
        <ul className="mt-2 grid gap-1.5">
          {items.map((item) => (
            <li
              key={item}
              className="relative pl-4 text-xs leading-relaxed text-ink-muted before:absolute before:left-0 before:text-ink-faint before:content-['+']"
            >
              {item}
            </li>
          ))}
        </ul>
      </HoverCardContent>
    </HoverCard>
  );
}

function SelectedEventCard({ event }: { event: DemoEvent | null }) {
  return (
    <section className="rounded-lg border border-border bg-background p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink">Inspector</h3>
        <HelpTip label="Inspector help">
          Click a timeline row to inspect its lifecycle metadata.
        </HelpTip>
      </div>
      {event ? (
        <dl className="grid gap-2 text-sm">
          <Fact label="Type" value={event.type} />
          <Fact label="Step" value={event.step_name ?? "-"} />
          <Fact label="Attempt" value={event.attempt ?? "-"} />
          <Fact
            label="Parallel"
            value={event.parallel_group_id ? shortId(event.parallel_group_id) : "-"}
          />
        </dl>
      ) : (
        <p className="text-sm text-ink-muted">No event selected.</p>
      )}
    </section>
  );
}

function Fact({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="max-w-40 truncate font-mono text-ink">{value}</dd>
    </div>
  );
}

function TraceTable({ traces }: { traces: StepTrace[] }) {
  if (traces.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-background p-4 text-sm text-ink-muted">
        No traces yet.
      </div>
    );
  }

  return (
    <div className="max-h-[30rem] overflow-auto rounded-lg border border-border bg-background">
      <table className="w-full min-w-[38rem] text-left text-xs">
        <thead className="sticky top-0 bg-surface text-ink-faint">
          <tr className="border-b border-border">
            <th className="px-3 py-2 font-mono font-medium">step</th>
            <th className="px-3 py-2 font-mono font-medium">attempt</th>
            <th className="px-3 py-2 font-mono font-medium">status</th>
            <th className="px-3 py-2 font-mono font-medium">parallel</th>
            <th className="px-3 py-2 font-mono font-medium">ms</th>
          </tr>
        </thead>
        <tbody>
          {traces.map((trace, index) => (
            <tr
              key={`${trace.step_name}-${index}`}
              className="border-b border-border/70"
            >
              <td className="px-3 py-2 font-mono text-ink">{trace.step_name}</td>
              <td className="px-3 py-2 text-ink-muted">{trace.attempt}</td>
              <td className="px-3 py-2">
                <span className={traceStatusClass(trace, traces)}>
                  {traceStatusLabel(trace, traces)}
                </span>
              </td>
              <td className="px-3 py-2 font-mono text-ink-faint">
                {trace.parallel_group_id ? shortId(trace.parallel_group_id) : "-"}
              </td>
              <td className="px-3 py-2 text-ink-muted">
                {Math.max(1, Math.round(trace.duration_seconds * 1000))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JsonPanel({ event }: { event: DemoEvent | null }) {
  return (
    <pre className="max-h-[30rem] overflow-auto rounded-lg border border-border bg-[#0d0d0c] p-4 font-mono text-xs leading-relaxed text-white/80">
      {event ? JSON.stringify(event, null, 2) : "Run the demo to inspect events."}
    </pre>
  );
}

function InfoPill({
  children,
  icon,
  label,
}: {
  children: ReactNode;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs text-ink-muted">
          <span className="[&_svg]:size-3.5">{icon}</span>
          {label}
        </span>
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
  );
}

function HelpTip({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className="inline-flex size-6 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-muted hover:text-ink"
        >
          <HelpCircle className="size-3.5" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{children}</TooltipContent>
    </Tooltip>
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

function parseDemoOutput(output: unknown): DemoOutput | null {
  if (!output || typeof output !== "object") return null;
  const value = output as Record<string, unknown>;
  return {
    title: typeof value.title === "string" ? value.title : undefined,
    status: typeof value.status === "string" ? value.status : undefined,
    audience: typeof value.audience === "string" ? value.audience : undefined,
    summary: typeof value.summary === "string" ? value.summary : undefined,
    why_orchflow: Array.isArray(value.why_orchflow)
      ? value.why_orchflow.filter((item): item is string => typeof item === "string")
      : undefined,
    models:
      value.models && typeof value.models === "object"
        ? (value.models as DemoOutput["models"])
        : undefined,
  };
}

function eventStats(
  events: DemoEvent[],
  traces: StepTrace[],
  result: FlowResult | null,
) {
  const completedStepEvents = events.filter(
    (event) => event.type === "step_completed",
  ).length;
  const terminalFailedStepEvents = events.filter(
    (event, index) =>
      event.type === "step_failed" && !hasLaterCompletion(events, event, index),
  );

  return {
    events: events.length,
    parallelGroups: new Set(
      events.map((event) => event.parallel_group_id).filter(Boolean),
    ).size,
    successfulTraces: traces.length
      ? traces.filter((trace) => trace.success).length
      : completedStepEvents,
    retryAttempts: events.filter((event) => event.type === "retry_scheduled").length,
    failedTraces: traces.length
      ? traces.filter((trace) => !trace.success && !isTraceRecovered(trace, traces)).length
      : terminalFailedStepEvents.length,
    durationMs: result ? Math.round(result.duration_seconds * 1000) : 0,
  };
}

function metricHelp(label: string) {
  if (label === "events") return "Number of streamed FlowEvent objects received.";
  if (label === "parallel") return "Distinct parallel_group_id values seen in the run.";
  if (label === "ok") return "Successful StepTrace records.";
  if (label === "retries") return "Retry attempts scheduled after a failed attempt.";
  return "Steps whose latest attempt is still failed.";
}

function eventTone(type: string) {
  if (type === "step_failed" || type.includes("retry")) return "text-amber-600";
  if (type === "flow_failed") return "text-destructive";
  if (type.includes("checkpoint")) return "text-blue-600";
  if (type.includes("completed")) return "text-emerald-600";
  return "text-ink";
}

function shortId(id: string) {
  return id.slice(0, 8);
}

function hasLaterCompletion(
  events: DemoEvent[],
  failedEvent: DemoEvent,
  failedIndex: number,
) {
  if (!failedEvent.step_name) return false;
  return events
    .slice(failedIndex + 1)
    .some(
      (event) =>
        event.step_name === failedEvent.step_name && event.type === "step_completed",
    );
}

function isTraceRecovered(trace: StepTrace, traces: StepTrace[]) {
  if (trace.success) return false;
  return traces.some(
    (candidate) =>
      candidate.step_name === trace.step_name &&
      candidate.success &&
      candidate.attempt > trace.attempt,
  );
}

function traceStatusLabel(trace: StepTrace, traces: StepTrace[]) {
  if (trace.success) return "ok";
  return isTraceRecovered(trace, traces) ? "retried" : "failed";
}

function traceStatusClass(trace: StepTrace, traces: StepTrace[]) {
  if (trace.success) return "text-emerald-600";
  return isTraceRecovered(trace, traces) ? "text-amber-600" : "text-destructive";
}
