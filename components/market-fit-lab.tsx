"use client";

import {
  AreaChart,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  Clipboard,
  Copy,
  Crosshair,
  FileText,
  Gauge,
  LayoutDashboard,
  Lightbulb,
  Megaphone,
  Menu,
  MoreHorizontal,
  Plus,
  RefreshCcw,
  Search,
  Settings2,
  ShieldAlert,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  Users,
  X,
  Zap,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import type { ScatterPointItem } from "recharts";
import { useEffect, useMemo, useState } from "react";

import {
  createPositioningInterpretation,
  getPositioningAxis,
  positioningAxes,
} from "@/lib/positioning";
import {
  createStrategyReport,
  reportToneOptions,
  type ReportSectionId,
  type ReportTone,
} from "@/lib/report";
import { normalizeWorkspace, sampleWorkspace } from "@/lib/sample-data";
import {
  competitorWeights,
  getCompetitorThreatScore,
  getScoreLabel,
  getTargetFitScore,
  getTopCompetitor,
  getTopTarget,
  targetWeights,
} from "@/lib/scoring";
import type {
  Competitor,
  CompetitorScore,
  PositioningAxisId,
  PositioningSettings,
  Project,
  TargetScore,
  TargetSegment,
  ViewId,
  WorkspaceState,
} from "@/types/market";

const STORAGE_KEY = "market-fit-lab-workspace-v1";

const navItems = [
  { id: "project" as const, label: "프로젝트", icon: BriefcaseBusiness },
  { id: "targets" as const, label: "타겟 분석", icon: Users, step: 1 },
  {
    id: "competitors" as const,
    label: "경쟁사 분석",
    icon: ShieldAlert,
    step: 2,
  },
  {
    id: "positioning" as const,
    label: "포지셔닝 분석",
    icon: Crosshair,
    step: 3,
  },
  {
    id: "report" as const,
    label: "마케팅 실행 전략",
    icon: FileText,
    step: 4,
  },
  { id: "dashboard" as const, label: "종합 대시보드", icon: LayoutDashboard },
];

const analysisFlow = [
  {
    view: "targets" as const,
    step: 1,
    label: "타겟 분석",
    description: "누구를 공략할 것인가",
    icon: Users,
  },
  {
    view: "competitors" as const,
    step: 2,
    label: "경쟁사 분석",
    description: "무엇과 경쟁할 것인가",
    icon: ShieldAlert,
  },
  {
    view: "positioning" as const,
    step: 3,
    label: "포지셔닝 분석",
    description: "어떤 자리를 차지할 것인가",
    icon: Crosshair,
  },
  {
    view: "report" as const,
    step: 4,
    label: "마케팅 실행 전략",
    description: "어떻게 시장에서 실행할 것인가",
    icon: Megaphone,
  },
];

const strategyWorkflow = [
  {
    view: "project" as const,
    step: 1,
    label: "브랜드 정보 입력",
    description: "브랜드와 제품의 기본 조건 정의",
    icon: BriefcaseBusiness,
  },
  {
    view: "targets" as const,
    step: 2,
    label: "타겟 세그먼트 입력",
    description: "고객의 니즈와 구매 조건 구체화",
    icon: Users,
  },
  {
    view: "competitors" as const,
    step: 3,
    label: "경쟁사 입력",
    description: "제품, 가격, 메시지 비교 정보 등록",
    icon: ShieldAlert,
  },
  {
    view: "dashboard" as const,
    step: 4,
    label: "점수화",
    description: "타겟 적합도와 경쟁 위협도 계산",
    icon: Gauge,
  },
  {
    view: "positioning" as const,
    step: 5,
    label: "포지셔닝맵",
    description: "시장 내 자사와 경쟁사 좌표 확인",
    icon: Crosshair,
  },
  {
    view: "report" as const,
    step: 6,
    label: "USP 도출",
    description: "타겟 문제와 제품 강점 연결",
    icon: Zap,
  },
  {
    view: "report" as const,
    step: 7,
    label: "PPT용 인사이트 생성",
    description: "기획서에 바로 쓰는 핵심 문장 완성",
    icon: FileText,
  },
];

const viewMeta: Record<ViewId, { eyebrow: string; title: string; copy: string }> = {
  project: {
    eyebrow: "PROJECT SETUP",
    title: "프로젝트 기본 정보를 정리하세요",
    copy: "브랜드와 제품의 현재 조건을 입력하면 분석 전체에 자동 반영됩니다.",
  },
  targets: {
    eyebrow: "TARGET ANALYSIS",
    title: "가장 가능성 높은 고객을 찾으세요",
    copy: "세그먼트별 니즈와 구매 조건을 비교해 우선순위를 결정합니다.",
  },
  competitors: {
    eyebrow: "COMPETITOR ANALYSIS",
    title: "시장 위협과 빈틈을 구조화하세요",
    copy: "경쟁사의 제품, 채널, 메시지를 같은 기준으로 비교합니다.",
  },
  dashboard: {
    eyebrow: "MARKET OVERVIEW",
    title: "핵심 비교 지표를 한눈에 보세요",
    copy: "타겟 적합도와 경쟁 위협도를 종합해 실행 우선순위를 제안합니다.",
  },
  positioning: {
    eyebrow: "POSITIONING ANALYSIS",
    title: "브랜드가 차지할 좌표를 설계하세요",
    copy: "기능성과 감성, 대중성과 프리미엄 축에서 시장의 빈 공간을 확인합니다.",
  },
  report: {
    eyebrow: "MARKETING ACTION STRATEGY",
    title: "분석을 마케팅 실행 전략으로 전환하세요",
    copy: "타겟, 경쟁사, 포지셔닝 결과를 메시지와 실행 계획으로 연결합니다.",
  },
};

const targetScoreLabels: Record<keyof TargetScore, string> = {
  painIntensity: "문제 강도",
  purchasingPower: "구매력",
  productNeed: "제품 필요성",
  adReachability: "광고 도달 가능성",
  repeatPotential: "반복 구매 가능성",
};

const competitorScoreLabels: Record<keyof CompetitorScore, string> = {
  brandAwareness: "브랜드 인지도",
  productSimilarity: "제품 유사도",
  priceCompetitiveness: "가격 경쟁력",
  channelPower: "채널 장악력",
  messageClarity: "메시지 명확성",
};

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function scoreColor(score: number) {
  if (score >= 85) return "#5b45e0";
  if (score >= 70) return "#168b6a";
  if (score >= 55) return "#e29b29";
  return "#e05a67";
}

function AppLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-[13px] bg-[#6551e8] shadow-[0_8px_20px_rgba(101,81,232,0.3)]">
        <span className="absolute left-[9px] top-[9px] size-[8px] rounded-full bg-white" />
        <span className="absolute bottom-[9px] right-[9px] size-[8px] rounded-full border-2 border-white" />
        <span className="h-[2px] w-5 rotate-[-45deg] rounded-full bg-white" />
      </div>
      {!compact && (
        <div>
          <strong className="block text-[17px] font-extrabold tracking-[-0.04em] text-[#1b1d2a]">
            Market Fit Lab
          </strong>
          <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a0a3af]">
            Strategy workspace
          </span>
        </div>
      )}
    </div>
  );
}

function PageHeader({
  view,
  onReset,
}: {
  view: ViewId;
  onReset: () => void;
}) {
  const meta = viewMeta[view];

  return (
    <div className="mb-8 flex items-end justify-between gap-6">
      <div>
        <p className="mb-2 text-[11px] font-extrabold tracking-[0.16em] text-[#6551e8]">
          {meta.eyebrow}
        </p>
        <h1 className="text-[30px] font-extrabold tracking-[-0.045em] text-[#171923]">
          {meta.title}
        </h1>
        <p className="mt-2 text-[14px] leading-6 text-[#777b88]">{meta.copy}</p>
      </div>
      <button
        onClick={onReset}
        className="hidden items-center gap-2 rounded-xl border border-[#e6e7ec] bg-white px-4 py-2.5 text-[12px] font-bold text-[#6f7380] shadow-sm transition hover:border-[#cfd0d9] hover:text-[#292c37] lg:flex"
      >
        <RefreshCcw size={14} />
        샘플 데이터 복원
      </button>
    </div>
  );
}

function AnalysisFlowNav({
  currentView,
  goTo,
}: {
  currentView: ViewId;
  goTo: (view: ViewId) => void;
}) {
  return (
    <section className="mb-7 rounded-2xl border border-[#e8e8ee] bg-white p-3 shadow-[0_8px_25px_rgba(26,28,42,0.025)]">
      <div className="grid gap-2 lg:grid-cols-4">
        {analysisFlow.map((item, index) => {
          const Icon = item.icon;
          const active = item.view === currentView;
          const currentIndex = analysisFlow.findIndex(
            (flowItem) => flowItem.view === currentView,
          );
          const completed = currentIndex > index;

          return (
            <button
              key={item.view}
              onClick={() => goTo(item.view)}
              className={`relative flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
                active
                  ? "border-[#7664ea] bg-[#f5f3ff]"
                  : completed
                    ? "border-[#dceee7] bg-[#f4fbf8]"
                    : "border-transparent hover:bg-[#f8f8fb]"
              }`}
            >
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-xl text-[11px] font-extrabold ${
                  active
                    ? "bg-[#6551e8] text-white"
                    : completed
                      ? "bg-[#dff3eb] text-[#168b6a]"
                      : "bg-[#f0f0f4] text-[#858894]"
                }`}
              >
                {completed ? <Check size={15} strokeWidth={3} /> : item.step}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={`block text-[11px] font-extrabold ${
                    active ? "text-[#5b46db]" : "text-[#41444f]"
                  }`}
                >
                  {item.label}
                </span>
                <span className="mt-1 block truncate text-[9px] font-semibold text-[#9a9da7]">
                  {item.description}
                </span>
              </span>
              <Icon
                size={15}
                className={active ? "text-[#6551e8]" : "text-[#c1c3cb]"}
              />
              {index < analysisFlow.length - 1 && (
                <span className="absolute -right-2.5 top-1/2 z-10 hidden -translate-y-1/2 text-[13px] font-bold text-[#c9cad1] lg:block">
                  →
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-[12px] font-bold text-[#555966]">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-[#e5e6eb] bg-white px-3.5 text-[13px] font-medium text-[#252733] outline-none transition placeholder:text-[#b7bac3] focus:border-[#7664ea] focus:ring-4 focus:ring-[#7664ea]/10"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-[12px] font-bold text-[#555966]">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-none rounded-xl border border-[#e5e6eb] bg-white px-3.5 py-3 text-[13px] font-medium leading-5 text-[#252733] outline-none transition placeholder:text-[#b7bac3] focus:border-[#7664ea] focus:ring-4 focus:ring-[#7664ea]/10"
      />
    </label>
  );
}

function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const color = scoreColor(score);
  return (
    <div
      className="relative grid shrink-0 place-items-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${color} ${score * 3.6}deg, #ececf2 0deg)`,
      }}
    >
      <div
        className="grid place-items-center rounded-full bg-white"
        style={{ width: size - 10, height: size - 10 }}
      >
        <strong
          className="text-[20px] font-extrabold tracking-[-0.04em]"
          style={{ color }}
        >
          {score}
        </strong>
      </div>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold"
      style={{ color: scoreColor(score), backgroundColor: `${scoreColor(score)}12` }}
    >
      <span
        className="size-1.5 rounded-full"
        style={{ backgroundColor: scoreColor(score) }}
      />
      {score}점 · {getScoreLabel(score)}
    </span>
  );
}

function TargetScoreEditor({
  value,
  onChange,
}: {
  value: TargetScore;
  onChange: (value: TargetScore) => void;
}) {
  return (
    <div className="space-y-4">
      {(Object.keys(targetWeights) as Array<keyof TargetScore>).map((key) => (
        <ScoreSlider
          key={key}
          label={targetScoreLabels[key]}
          weight={targetWeights[key]}
          value={value[key]}
          onChange={(next) => onChange({ ...value, [key]: next })}
        />
      ))}
    </div>
  );
}

function CompetitorScoreEditor({
  value,
  onChange,
}: {
  value: CompetitorScore;
  onChange: (value: CompetitorScore) => void;
}) {
  return (
    <div className="space-y-4">
      {(Object.keys(competitorWeights) as Array<keyof CompetitorScore>).map(
        (key) => (
          <ScoreSlider
            key={key}
            label={competitorScoreLabels[key]}
            weight={competitorWeights[key]}
            value={value[key]}
            onChange={(next) => onChange({ ...value, [key]: next })}
          />
        ),
      )}
    </div>
  );
}

function ScoreSlider({
  label,
  weight,
  value,
  onChange,
}: {
  label: string;
  weight: number;
  value: number;
  onChange: (value: number) => void;
}) {
  const earned = Math.round((value / 5) * weight);
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between">
        <span className="text-[12px] font-bold text-[#505460]">{label}</span>
        <span className="text-[11px] font-extrabold text-[#6551e8]">
          {earned}/{weight}점
        </span>
      </span>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min="1"
          max="5"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="score-range w-full"
        />
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-[#f0edff] text-[11px] font-extrabold text-[#6551e8]">
          {value}
        </span>
      </div>
    </label>
  );
}

function ProjectView({
  project,
  onChange,
  targets,
  competitors,
  goTo,
}: {
  project: Project;
  onChange: (project: Project) => void;
  targets: TargetSegment[];
  competitors: Competitor[];
  goTo: (view: ViewId) => void;
}) {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-[#e5e2f5] bg-[linear-gradient(135deg,#ffffff_0%,#f7f5ff_100%)] p-6 shadow-[0_10px_35px_rgba(26,28,42,0.04)]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#eeeaff] px-3 py-1.5 text-[10px] font-extrabold tracking-[0.12em] text-[#6551e8]">
            <Sparkles size={12} />
            7-STEP STRATEGY WORKFLOW
          </span>
          <h2 className="mt-4 max-w-3xl text-[22px] font-extrabold leading-[1.35] tracking-[-0.04em] text-[#252733] [word-break:keep-all]">
            브랜드 정보 입력부터 PPT용 인사이트 생성까지 하나의 흐름으로
            완성하세요
          </h2>
          <p className="mt-3 max-w-3xl text-[13px] font-medium leading-6 text-[#777b88] [word-break:keep-all]">
            입력한 데이터를 자동 점수화하고 포지셔닝과 USP로 연결해, 마케팅
            기획서에 바로 활용할 수 있는 핵심 문장을 생성합니다.
          </p>

          <div className="mt-6 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {strategyWorkflow.map((item, index) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.step}
                  onClick={() => goTo(item.view)}
                  className="group relative min-h-[126px] rounded-xl border border-white bg-white/80 p-3.5 text-left shadow-[0_6px_20px_rgba(58,50,104,0.06)] transition hover:-translate-y-0.5 hover:border-[#d8d1ff] hover:bg-white"
                >
                  <div className="flex items-center justify-between">
                    <span className="grid size-7 place-items-center rounded-lg bg-[#f0edff] text-[10px] font-extrabold text-[#6551e8]">
                      0{item.step}
                    </span>
                    <Icon
                      size={15}
                      className="text-[#aaa1e7] transition group-hover:text-[#6551e8]"
                    />
                  </div>
                  <strong className="mt-3 block text-[11px] font-extrabold leading-4 text-[#343642] [word-break:keep-all]">
                    {item.label}
                  </strong>
                  <span className="mt-1.5 block text-[9px] font-medium leading-4 text-[#8c8f99] [word-break:keep-all]">
                    {item.description}
                  </span>
                  {index < strategyWorkflow.length - 1 && (
                    <span className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 text-[12px] font-bold text-[#c9cad2] xl:block">
                      →
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
        <section className="rounded-2xl border border-[#e8e8ee] bg-white p-6 shadow-[0_10px_35px_rgba(26,28,42,0.04)]">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-[17px] font-extrabold tracking-[-0.03em]">
                프로젝트 정보
              </h2>
              <p className="mt-1 text-[12px] text-[#90939d]">
                모든 변경 사항은 브라우저에 자동 저장됩니다.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf8f2] px-3 py-1.5 text-[11px] font-bold text-[#178366]">
              <Check size={12} strokeWidth={3} />
              자동 저장됨
            </span>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="브랜드명"
              value={project.brandName}
              onChange={(brandName) => onChange({ ...project, brandName })}
            />
            <Field
              label="제품명"
              value={project.productName}
              onChange={(productName) => onChange({ ...project, productName })}
            />
            <Field
              label="카테고리"
              value={project.category}
              onChange={(category) => onChange({ ...project, category })}
            />
            <Field
              label="가격대"
              value={project.priceRange}
              onChange={(priceRange) => onChange({ ...project, priceRange })}
            />
            <TextArea
              label="제품 특징"
              value={project.productFeatures}
              onChange={(productFeatures) =>
                onChange({ ...project, productFeatures })
              }
              rows={4}
              className="md:col-span-2"
            />
            <TextArea
              label="현재 타겟"
              value={project.currentTarget}
              onChange={(currentTarget) =>
                onChange({ ...project, currentTarget })
              }
              rows={3}
            />
            <TextArea
              label="마케팅 목표"
              value={project.marketingGoal}
              onChange={(marketingGoal) =>
                onChange({ ...project, marketingGoal })
              }
              rows={3}
            />
          </div>
        </section>

        <div className="space-y-6">
          <section className="overflow-hidden rounded-2xl bg-[#1f2230] p-6 text-white shadow-[0_18px_45px_rgba(24,26,40,0.14)]">
            <div className="mb-10 flex items-center justify-between">
              <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-extrabold tracking-[0.14em] text-white/70">
                LIVE PROJECT BRIEF
              </span>
              <Sparkles size={18} className="text-[#a99cff]" />
            </div>
            <p className="text-[12px] font-bold text-[#a9adbb]">
              {project.category}
            </p>
            <h2 className="mt-2 text-[25px] font-extrabold leading-tight tracking-[-0.04em]">
              {project.brandName}
              <br />
              <span className="text-[#b6aaff]">{project.productName}</span>
            </h2>
            <div className="mt-7 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3.5">
                <span className="text-[10px] font-bold text-white/45">
                  타겟 세그먼트
                </span>
                <strong className="mt-1 block text-[20px] font-extrabold">
                  {targets.length}
                </strong>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.06] p-3.5">
                <span className="text-[10px] font-bold text-white/45">
                  비교 경쟁사
                </span>
                <strong className="mt-1 block text-[20px] font-extrabold">
                  {competitors.length}
                </strong>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#e8e8ee] bg-white p-5">
            <p className="text-[11px] font-extrabold tracking-[0.12em] text-[#979aa5]">
              7-STEP STRATEGY WORKFLOW
            </p>
            <div className="relative mt-4 space-y-2">
              {strategyWorkflow.map((item, index) => (
                <button
                  key={item.step}
                  onClick={() => goTo(item.view)}
                  className="group relative flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-[#f8f7fc]"
                >
                  <span className="grid size-8 place-items-center rounded-lg bg-[#f0edff] text-[11px] font-extrabold text-[#6551e8]">
                    0{item.step}
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-[12px] font-extrabold text-[#454852]">
                      {item.label}
                    </strong>
                    <span className="mt-0.5 block truncate text-[9px] font-semibold text-[#9b9ea8]">
                      {item.description}
                    </span>
                  </span>
                  <span className="text-[11px] font-bold text-[#aaaeba]">
                    {item.step === 1
                      ? "7개 필드"
                      : item.step === 2
                        ? `${targets.length}개`
                        : item.step === 3
                          ? `${competitors.length}개`
                          : item.step === 4
                            ? "자동 계산"
                            : item.step === 5
                              ? "X · Y"
                              : item.step === 6
                                ? "핵심 USP"
                                : "PPT 문장"}
                  </span>
                  <ArrowUpRight
                    size={14}
                    className="text-[#c2c4cc] transition group-hover:text-[#6551e8]"
                  />
                  {index < strategyWorkflow.length - 1 && (
                    <span className="absolute -bottom-2 left-[23px] text-[11px] text-[#c9cad2]">
                      ↓
                    </span>
                  )}
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function TargetView({
  targets,
  onChange,
}: {
  targets: TargetSegment[];
  onChange: (targets: TargetSegment[]) => void;
}) {
  const [selectedId, setSelectedId] = useState(targets[0]?.id ?? "");
  const selected = targets.find((target) => target.id === selectedId) ?? targets[0];

  const updateSelected = (next: TargetSegment) => {
    onChange(targets.map((target) => (target.id === next.id ? next : target)));
  };

  const addTarget = () => {
    const target: TargetSegment = {
      id: makeId("target"),
      segmentName: "새 타겟 세그먼트",
      ageRange: "",
      gender: "",
      occupation: "",
      lifestyle: "",
      painPoints: "",
      purchaseMotivation: "",
      purchaseBarriers: "",
      mediaChannels: "",
      score: {
        painIntensity: 3,
        purchasingPower: 3,
        productNeed: 3,
        adReachability: 3,
        repeatPotential: 3,
      },
    };
    onChange([...targets, target]);
    setSelectedId(target.id);
  };

  const deleteTarget = () => {
    if (!selected) return;
    const nextTargets = targets.filter((target) => target.id !== selected.id);
    setSelectedId(nextTargets[0]?.id ?? "");
    onChange(nextTargets);
  };

  if (!selected) {
    return (
      <EmptyState
        icon={Users}
        title="타겟 세그먼트가 없습니다"
        copy="첫 번째 타겟을 추가해 시장 적합도 분석을 시작하세요."
        action="타겟 추가"
        onAction={addTarget}
      />
    );
  }

  const score = getTargetFitScore(selected);

  return (
    <div className="grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-[#e8e8ee] bg-white p-4 shadow-[0_10px_35px_rgba(26,28,42,0.035)]">
        <div className="mb-4 flex items-center justify-between px-1">
          <div>
            <h2 className="text-[14px] font-extrabold">타겟 세그먼트</h2>
            <p className="mt-1 text-[11px] text-[#999ca7]">{targets.length}개 등록</p>
          </div>
          <button
            onClick={addTarget}
            className="grid size-9 place-items-center rounded-xl bg-[#6551e8] text-white shadow-[0_7px_18px_rgba(101,81,232,0.25)] transition hover:bg-[#5743d4]"
            aria-label="타겟 추가"
          >
            <Plus size={17} />
          </button>
        </div>
        <div className="space-y-2">
          {[...targets]
            .sort((a, b) => getTargetFitScore(b) - getTargetFitScore(a))
            .map((target, index) => {
              const itemScore = getTargetFitScore(target);
              const active = target.id === selected.id;
              return (
                <button
                  key={target.id}
                  onClick={() => setSelectedId(target.id)}
                  className={`w-full rounded-xl border p-3.5 text-left transition ${
                    active
                      ? "border-[#7664ea] bg-[#f6f4ff] shadow-[0_6px_18px_rgba(101,81,232,0.08)]"
                      : "border-transparent bg-[#fafafd] hover:border-[#e3e1ef]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[10px] font-extrabold text-[#a4a7b0]">
                      PRIORITY {index + 1}
                    </span>
                    <strong
                      className="text-[13px] font-extrabold"
                      style={{ color: scoreColor(itemScore) }}
                    >
                      {itemScore}
                    </strong>
                  </div>
                  <strong className="mt-1.5 block text-[13px] font-extrabold leading-5 text-[#30323c]">
                    {target.segmentName}
                  </strong>
                  <span className="mt-2 block truncate text-[11px] text-[#8b8e99]">
                    {target.ageRange} · {target.occupation || "직업 미입력"}
                  </span>
                </button>
              );
            })}
        </div>
      </aside>

      <section className="rounded-2xl border border-[#e8e8ee] bg-white shadow-[0_10px_35px_rgba(26,28,42,0.035)]">
        <div className="flex items-center justify-between border-b border-[#ececf1] px-6 py-5">
          <div className="flex items-center gap-4">
            <ScoreRing score={score} size={66} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-extrabold tracking-[-0.03em]">
                  {selected.segmentName}
                </h2>
                <ScoreBadge score={score} />
              </div>
              <p className="mt-1 text-[11px] text-[#92959f]">
                5개 기준의 가중 합산으로 적합도를 자동 계산합니다.
              </p>
            </div>
          </div>
          <button
            onClick={deleteTarget}
            className="inline-flex items-center gap-2 rounded-xl border border-[#f0dfe2] px-3 py-2 text-[11px] font-bold text-[#cf5966] transition hover:bg-[#fff6f7]"
          >
            <Trash2 size={14} />
            삭제
          </button>
        </div>

        <div className="grid gap-8 p-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(270px,0.65fr)]">
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="세그먼트명"
              value={selected.segmentName}
              onChange={(segmentName) => updateSelected({ ...selected, segmentName })}
            />
            <Field
              label="연령대"
              value={selected.ageRange}
              onChange={(ageRange) => updateSelected({ ...selected, ageRange })}
            />
            <Field
              label="성별"
              value={selected.gender}
              onChange={(gender) => updateSelected({ ...selected, gender })}
            />
            <Field
              label="직업"
              value={selected.occupation}
              onChange={(occupation) => updateSelected({ ...selected, occupation })}
            />
            <TextArea
              label="라이프스타일"
              value={selected.lifestyle}
              onChange={(lifestyle) => updateSelected({ ...selected, lifestyle })}
              className="md:col-span-2"
            />
            <TextArea
              label="페인포인트"
              value={selected.painPoints}
              onChange={(painPoints) => updateSelected({ ...selected, painPoints })}
            />
            <TextArea
              label="구매 동기"
              value={selected.purchaseMotivation}
              onChange={(purchaseMotivation) =>
                updateSelected({ ...selected, purchaseMotivation })
              }
            />
            <TextArea
              label="구매 장벽"
              value={selected.purchaseBarriers}
              onChange={(purchaseBarriers) =>
                updateSelected({ ...selected, purchaseBarriers })
              }
            />
            <TextArea
              label="미디어 채널"
              value={selected.mediaChannels}
              onChange={(mediaChannels) =>
                updateSelected({ ...selected, mediaChannels })
              }
            />
          </div>

          <div className="rounded-2xl bg-[#f8f7fc] p-5">
            <div className="mb-5 flex items-center gap-2">
              <Gauge size={16} className="text-[#6551e8]" />
              <h3 className="text-[13px] font-extrabold">적합도 평가 기준</h3>
            </div>
            <TargetScoreEditor
              value={selected.score}
              onChange={(nextScore) =>
                updateSelected({ ...selected, score: nextScore })
              }
            />
            <div className="mt-6 rounded-xl border border-[#e2def8] bg-white p-4">
              <span className="text-[10px] font-extrabold text-[#9086d0]">
                AUTO INSIGHT
              </span>
              <p className="mt-2 text-[12px] font-semibold leading-5 text-[#555866]">
                {score >= 80
                  ? "핵심 타겟으로 즉시 검증할 가치가 높습니다. 구매 장벽을 낮추는 메시지 테스트를 우선하세요."
                  : "잠재력은 있지만 구매 동기 또는 제품 필요성을 더 구체적으로 검증해야 합니다."}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function CompetitorView({
  competitors,
  onChange,
}: {
  competitors: Competitor[];
  onChange: (competitors: Competitor[]) => void;
}) {
  const [selectedId, setSelectedId] = useState(competitors[0]?.id ?? "");
  const selected =
    competitors.find((competitor) => competitor.id === selectedId) ?? competitors[0];

  const updateSelected = (next: Competitor) => {
    onChange(
      competitors.map((competitor) =>
        competitor.id === next.id ? next : competitor,
      ),
    );
  };

  const addCompetitor = () => {
    const competitor: Competitor = {
      id: makeId("competitor"),
      competitorName: "새 경쟁사",
      productName: "",
      priceRange: "",
      usp: "",
      target: "",
      strengths: "",
      weaknesses: "",
      channels: "",
      messageTone: "",
      positionX: 50,
      positionY: 50,
      score: {
        brandAwareness: 3,
        productSimilarity: 3,
        priceCompetitiveness: 3,
        channelPower: 3,
        messageClarity: 3,
      },
    };
    onChange([...competitors, competitor]);
    setSelectedId(competitor.id);
  };

  const deleteCompetitor = () => {
    if (!selected) return;
    const nextCompetitors = competitors.filter(
      (competitor) => competitor.id !== selected.id,
    );
    setSelectedId(nextCompetitors[0]?.id ?? "");
    onChange(nextCompetitors);
  };

  if (!selected) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="비교할 경쟁사가 없습니다"
        copy="경쟁사를 추가하고 위협도와 포지셔닝을 분석하세요."
        action="경쟁사 추가"
        onAction={addCompetitor}
      />
    );
  }

  const score = getCompetitorThreatScore(selected);

  return (
    <div className="grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-[#e8e8ee] bg-white p-4 shadow-[0_10px_35px_rgba(26,28,42,0.035)]">
        <div className="mb-4 flex items-center justify-between px-1">
          <div>
            <h2 className="text-[14px] font-extrabold">경쟁사 목록</h2>
            <p className="mt-1 text-[11px] text-[#999ca7]">
              {competitors.length}개 등록
            </p>
          </div>
          <button
            onClick={addCompetitor}
            className="grid size-9 place-items-center rounded-xl bg-[#6551e8] text-white shadow-[0_7px_18px_rgba(101,81,232,0.25)] transition hover:bg-[#5743d4]"
            aria-label="경쟁사 추가"
          >
            <Plus size={17} />
          </button>
        </div>
        <div className="space-y-2">
          {[...competitors]
            .sort(
              (a, b) =>
                getCompetitorThreatScore(b) - getCompetitorThreatScore(a),
            )
            .map((competitor, index) => {
              const itemScore = getCompetitorThreatScore(competitor);
              const active = competitor.id === selected.id;
              return (
                <button
                  key={competitor.id}
                  onClick={() => setSelectedId(competitor.id)}
                  className={`w-full rounded-xl border p-3.5 text-left transition ${
                    active
                      ? "border-[#7664ea] bg-[#f6f4ff] shadow-[0_6px_18px_rgba(101,81,232,0.08)]"
                      : "border-transparent bg-[#fafafd] hover:border-[#e3e1ef]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[10px] font-extrabold text-[#a4a7b0]">
                      THREAT {index + 1}
                    </span>
                    <strong
                      className="text-[13px] font-extrabold"
                      style={{ color: scoreColor(itemScore) }}
                    >
                      {itemScore}
                    </strong>
                  </div>
                  <strong className="mt-1.5 block text-[13px] font-extrabold leading-5 text-[#30323c]">
                    {competitor.competitorName}
                  </strong>
                  <span className="mt-2 block truncate text-[11px] text-[#8b8e99]">
                    {competitor.productName || "제품명 미입력"}
                  </span>
                </button>
              );
            })}
        </div>
      </aside>

      <section className="rounded-2xl border border-[#e8e8ee] bg-white shadow-[0_10px_35px_rgba(26,28,42,0.035)]">
        <div className="flex items-center justify-between border-b border-[#ececf1] px-6 py-5">
          <div className="flex items-center gap-4">
            <ScoreRing score={score} size={66} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[17px] font-extrabold tracking-[-0.03em]">
                  {selected.competitorName}
                </h2>
                <ScoreBadge score={score} />
              </div>
              <p className="mt-1 text-[11px] text-[#92959f]">
                시장 영향력을 5개 기준으로 가중 평가합니다.
              </p>
            </div>
          </div>
          <button
            onClick={deleteCompetitor}
            className="inline-flex items-center gap-2 rounded-xl border border-[#f0dfe2] px-3 py-2 text-[11px] font-bold text-[#cf5966] transition hover:bg-[#fff6f7]"
          >
            <Trash2 size={14} />
            삭제
          </button>
        </div>

        <div className="grid gap-8 p-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(270px,0.65fr)]">
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              label="경쟁사명"
              value={selected.competitorName}
              onChange={(competitorName) =>
                updateSelected({ ...selected, competitorName })
              }
            />
            <Field
              label="제품명"
              value={selected.productName}
              onChange={(productName) =>
                updateSelected({ ...selected, productName })
              }
            />
            <Field
              label="가격대"
              value={selected.priceRange}
              onChange={(priceRange) =>
                updateSelected({ ...selected, priceRange })
              }
            />
            <Field
              label="메시지 톤"
              value={selected.messageTone}
              onChange={(messageTone) =>
                updateSelected({ ...selected, messageTone })
              }
            />
            <TextArea
              label="USP"
              value={selected.usp}
              onChange={(usp) => updateSelected({ ...selected, usp })}
              className="md:col-span-2"
            />
            <TextArea
              label="핵심 타겟"
              value={selected.target}
              onChange={(target) => updateSelected({ ...selected, target })}
            />
            <TextArea
              label="주요 채널"
              value={selected.channels}
              onChange={(channels) => updateSelected({ ...selected, channels })}
            />
            <TextArea
              label="강점"
              value={selected.strengths}
              onChange={(strengths) =>
                updateSelected({ ...selected, strengths })
              }
            />
            <TextArea
              label="약점"
              value={selected.weaknesses}
              onChange={(weaknesses) =>
                updateSelected({ ...selected, weaknesses })
              }
            />
          </div>

          <div className="space-y-5">
            <div className="rounded-2xl bg-[#f8f7fc] p-5">
              <div className="mb-5 flex items-center gap-2">
                <Gauge size={16} className="text-[#6551e8]" />
                <h3 className="text-[13px] font-extrabold">위협도 평가 기준</h3>
              </div>
              <CompetitorScoreEditor
                value={selected.score}
                onChange={(nextScore) =>
                  updateSelected({ ...selected, score: nextScore })
                }
              />
            </div>
            <div className="rounded-2xl border border-[#e8e8ee] p-5">
              <div className="mb-4 flex items-center gap-2">
                <Crosshair size={16} className="text-[#6551e8]" />
                <h3 className="text-[13px] font-extrabold">포지셔닝 좌표</h3>
              </div>
              <PositionSlider
                label="X축 0"
                opposite="X축 100"
                value={selected.positionX}
                onChange={(positionX) =>
                  updateSelected({ ...selected, positionX })
                }
              />
              <div className="mt-4">
                <PositionSlider
                  label="Y축 0"
                  opposite="Y축 100"
                  value={selected.positionY}
                  onChange={(positionY) =>
                    updateSelected({ ...selected, positionY })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function PositionSlider({
  label,
  opposite,
  value,
  onChange,
  inverse = false,
}: {
  label: string;
  opposite: string;
  value: number;
  onChange: (value: number) => void;
  inverse?: boolean;
}) {
  return (
    <label className="block">
      <span
        className={`mb-2 flex justify-between text-[10px] font-bold ${
          inverse ? "text-white/55" : "text-[#8d909b]"
        }`}
      >
        <span>{label}</span>
        <span className="flex items-center gap-2">
          <strong className={inverse ? "text-white" : "text-[#6551e8]"}>
            {value}점
          </strong>
          {opposite}
        </span>
      </span>
      <input
        className="score-range w-full"
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}

function DashboardView({
  project,
  targets,
  competitors,
}: WorkspaceState) {
  const topTarget = getTopTarget(targets);
  const topCompetitor = getTopCompetitor(competitors);
  const targetScore = topTarget ? getTargetFitScore(topTarget) : 0;
  const competitorScore = topCompetitor
    ? getCompetitorThreatScore(topCompetitor)
    : 0;
  const avgThreat = competitors.length
    ? Math.round(
        competitors.reduce(
          (sum, competitor) => sum + getCompetitorThreatScore(competitor),
          0,
        ) / competitors.length,
      )
    : 0;
  const opportunity = Math.max(0, Math.round(targetScore - avgThreat / 2 + 35));

  const radarData = topTarget
    ? (Object.keys(targetWeights) as Array<keyof TargetScore>).map((key) => ({
        metric: targetScoreLabels[key],
        value: topTarget.score[key] * 20,
        fullMark: 100,
      }))
    : [];

  const threatData = [...competitors]
    .sort(
      (a, b) => getCompetitorThreatScore(b) - getCompetitorThreatScore(a),
    )
    .map((competitor) => ({
      name: competitor.competitorName,
      score: getCompetitorThreatScore(competitor),
    }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="최우선 타겟"
          value={topTarget?.segmentName || "-"}
          sub={`${targetScore}점 · ${getScoreLabel(targetScore)}`}
          icon={Target}
          accent="#6551e8"
        />
        <MetricCard
          label="최대 위협 경쟁사"
          value={topCompetitor?.competitorName || "-"}
          sub={`${competitorScore}점 · ${getScoreLabel(competitorScore)}`}
          icon={ShieldAlert}
          accent="#df6570"
        />
        <MetricCard
          label="시장 기회 지수"
          value={`${opportunity}`}
          sub="타겟 적합도 대비 경쟁 강도"
          icon={TrendingUp}
          accent="#168b6a"
        />
        <MetricCard
          label="분석 완성도"
          value={`${Math.min(100, targets.length * 12 + competitors.length * 10 + 24)}%`}
          sub={`${targets.length}개 타겟 · ${competitors.length}개 경쟁사`}
          icon={Clipboard}
          accent="#e2992c"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard
          eyebrow="TARGET FIT"
          title="최우선 타겟 적합도"
          copy={topTarget?.segmentName || "타겟 데이터 없음"}
        >
          <div className="h-[315px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              initialDimension={{ width: 600, height: 315 }}
            >
              <RadarChart data={radarData} outerRadius="72%">
                <PolarGrid stroke="#e7e6ef" />
                <PolarAngleAxis
                  dataKey="metric"
                  tick={{ fill: "#737783", fontSize: 11, fontWeight: 700 }}
                />
                <Radar
                  dataKey="value"
                  stroke="#6551e8"
                  fill="#6551e8"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e5e4eb",
                    fontSize: 12,
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard
          eyebrow="THREAT LEVEL"
          title="경쟁사 위협도 순위"
          copy="100점 만점 가중 평가"
        >
          <div className="h-[315px]">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              initialDimension={{ width: 600, height: 315 }}
            >
              <BarChart
                data={threatData}
                layout="vertical"
                margin={{ left: 8, right: 28, top: 12, bottom: 8 }}
              >
                <CartesianGrid horizontal={false} stroke="#eeedf2" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fill: "#9a9da7", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={76}
                  tick={{ fill: "#555865", fontSize: 11, fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#f8f7fc" }}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e5e4eb",
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="score" radius={[0, 8, 8, 0]} barSize={22}>
                  {threatData.map((item, index) => (
                    <Cell
                      key={item.name}
                      fill={index === 0 ? "#6551e8" : "#c9c3ef"}
                    />
                  ))}
                  <LabelList
                    dataKey="score"
                    position="right"
                    fill="#565966"
                    fontSize={11}
                    fontWeight={800}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#e8e8ee] bg-white shadow-[0_10px_35px_rgba(26,28,42,0.035)]">
        <div className="flex items-end justify-between border-b border-[#ececf1] px-6 py-5">
          <div>
            <p className="text-[10px] font-extrabold tracking-[0.15em] text-[#8e82de]">
              COMPETITIVE MATRIX
            </p>
            <h2 className="mt-1 text-[16px] font-extrabold tracking-[-0.03em]">
              경쟁사 비교표
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-[#999ca6]">
            {project.category} 시장
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead>
              <tr className="bg-[#fafafd] text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#979aa5]">
                <th className="px-6 py-4">브랜드 / 제품</th>
                <th className="px-4 py-4">가격대</th>
                <th className="px-4 py-4">핵심 USP</th>
                <th className="px-4 py-4">강점</th>
                <th className="px-4 py-4">약점</th>
                <th className="px-6 py-4 text-center">위협도</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map((competitor) => {
                const score = getCompetitorThreatScore(competitor);
                return (
                  <tr
                    key={competitor.id}
                    className="border-t border-[#efeff3] text-[12px] text-[#626570]"
                  >
                    <td className="px-6 py-4">
                      <strong className="block text-[13px] text-[#292b35]">
                        {competitor.competitorName}
                      </strong>
                      <span className="mt-1 block text-[11px] text-[#999ca6]">
                        {competitor.productName}
                      </span>
                    </td>
                    <td className="max-w-[130px] px-4 py-4 font-semibold">
                      {competitor.priceRange}
                    </td>
                    <td className="max-w-[220px] px-4 py-4 leading-5">
                      {competitor.usp}
                    </td>
                    <td className="max-w-[190px] px-4 py-4 leading-5">
                      {competitor.strengths}
                    </td>
                    <td className="max-w-[190px] px-4 py-4 leading-5">
                      {competitor.weaknesses}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <ScoreBadge score={score} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  icon: typeof Target;
  accent: string;
}) {
  return (
    <section className="rounded-2xl border border-[#e8e8ee] bg-white p-5 shadow-[0_10px_30px_rgba(26,28,42,0.03)]">
      <div className="flex items-start justify-between">
        <div
          className="grid size-10 place-items-center rounded-xl"
          style={{ color: accent, backgroundColor: `${accent}12` }}
        >
          <Icon size={18} />
        </div>
        <MoreHorizontal size={17} className="text-[#c3c5cd]" />
      </div>
      <p className="mt-5 text-[11px] font-bold text-[#92959f]">{label}</p>
      <strong className="mt-1 block truncate text-[19px] font-extrabold tracking-[-0.04em] text-[#252732]">
        {value}
      </strong>
      <p className="mt-1 truncate text-[11px] font-semibold text-[#a1a4ae]">{sub}</p>
    </section>
  );
}

function ChartCard({
  eyebrow,
  title,
  copy,
  children,
}: {
  eyebrow: string;
  title: string;
  copy: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#e8e8ee] bg-white p-6 shadow-[0_10px_35px_rgba(26,28,42,0.035)]">
      <p className="text-[10px] font-extrabold tracking-[0.15em] text-[#8e82de]">
        {eyebrow}
      </p>
      <div className="mt-1 flex items-center justify-between">
        <h2 className="text-[16px] font-extrabold tracking-[-0.03em]">{title}</h2>
        <span className="text-[11px] font-semibold text-[#999ca6]">{copy}</span>
      </div>
      {children}
    </section>
  );
}

type PositioningPoint = {
  id: string;
  type: "brand" | "competitor";
  name: string;
  productName: string;
  x: number;
  y: number;
  z: number;
  usp: string;
  strengths: string;
  weaknesses: string;
};

function clampPosition(value: number) {
  return Math.min(100, Math.max(0, Number.isFinite(value) ? value : 0));
}

function PositioningView({
  project,
  competitors,
  positioning,
  onCompetitorsChange,
  onPositioningChange,
}: {
  project: Project;
  competitors: Competitor[];
  positioning: PositioningSettings;
  onCompetitorsChange: (competitors: Competitor[]) => void;
  onPositioningChange: (positioning: PositioningSettings) => void;
}) {
  const [selectedPointId, setSelectedPointId] = useState("brand");
  const xAxis = getPositioningAxis(positioning.xAxisId);
  const yAxis = getPositioningAxis(positioning.yAxisId);
  const interpretation = createPositioningInterpretation(
    project,
    positioning,
    competitors,
  );

  const brandPoint: PositioningPoint = {
    id: "brand",
    type: "brand",
    name: project.brandName,
    productName: project.productName,
    x: positioning.brand.x,
    y: positioning.brand.y,
    z: 100,
    usp: positioning.brand.usp,
    strengths: positioning.brand.strengths,
    weaknesses: positioning.brand.weaknesses,
  };
  const competitorPoints: PositioningPoint[] = competitors.map((competitor) => ({
    id: competitor.id,
    type: "competitor",
    name: competitor.competitorName,
    productName: competitor.productName,
    x: competitor.positionX,
    y: competitor.positionY,
    z: getCompetitorThreatScore(competitor),
    usp: competitor.usp,
    strengths: competitor.strengths,
    weaknesses: competitor.weaknesses,
  }));
  const allPoints = [brandPoint, ...competitorPoints];
  const selectedPoint =
    allPoints.find((point) => point.id === selectedPointId) ?? brandPoint;

  const updateAxis = (
    axis: "x" | "y",
    nextAxisId: PositioningAxisId,
  ) => {
    if (axis === "x") {
      onPositioningChange({
        ...positioning,
        xAxisId: nextAxisId,
        yAxisId:
          nextAxisId === positioning.yAxisId
            ? positioning.xAxisId
            : positioning.yAxisId,
      });
      return;
    }

    onPositioningChange({
      ...positioning,
      xAxisId:
        nextAxisId === positioning.xAxisId
          ? positioning.yAxisId
          : positioning.xAxisId,
      yAxisId: nextAxisId,
    });
  };

  const updatePointPosition = (
    pointId: string,
    axis: "x" | "y",
    value: number,
  ) => {
    const nextValue = clampPosition(value);
    if (pointId === "brand") {
      onPositioningChange({
        ...positioning,
        brand: {
          ...positioning.brand,
          [axis]: nextValue,
        },
      });
      return;
    }

    onCompetitorsChange(
      competitors.map((competitor) =>
        competitor.id === pointId
          ? {
              ...competitor,
              [axis === "x" ? "positionX" : "positionY"]: nextValue,
            }
          : competitor,
      ),
    );
  };

  const handlePointClick = (point: ScatterPointItem) => {
    const payload = point.payload as PositioningPoint | undefined;
    if (payload) setSelectedPointId(payload.id);
  };

  const highlightedX1 = brandPoint.x >= 50 ? 50 : 0;
  const highlightedX2 = brandPoint.x >= 50 ? 100 : 50;
  const highlightedY1 = brandPoint.y >= 50 ? 50 : 0;
  const highlightedY2 = brandPoint.y >= 50 ? 100 : 50;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#e8e8ee] bg-white p-5 shadow-[0_10px_35px_rgba(26,28,42,0.035)]">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Settings2 size={16} className="text-[#6551e8]" />
              <h2 className="text-[14px] font-extrabold">포지셔닝 축 설정</h2>
            </div>
            <p className="mt-1.5 text-[11px] text-[#92959f]">
              비교 목적에 맞는 두 기준을 선택하면 차트와 해석 문장이 즉시
              갱신됩니다.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:w-[620px]">
            <label>
              <span className="mb-2 block text-[10px] font-extrabold tracking-[0.08em] text-[#8d909b]">
                X AXIS
              </span>
              <select
                aria-label="X축 기준"
                value={positioning.xAxisId}
                onChange={(event) =>
                  updateAxis("x", event.target.value as PositioningAxisId)
                }
                className="h-11 w-full rounded-xl border border-[#e3e4ea] bg-[#fafafd] px-3.5 text-[12px] font-bold text-[#3f424d] outline-none focus:border-[#7664ea] focus:ring-4 focus:ring-[#7664ea]/10"
              >
                {positioningAxes.map((axis) => (
                  <option key={axis.id} value={axis.id}>
                    {axis.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-2 block text-[10px] font-extrabold tracking-[0.08em] text-[#8d909b]">
                Y AXIS
              </span>
              <select
                aria-label="Y축 기준"
                value={positioning.yAxisId}
                onChange={(event) =>
                  updateAxis("y", event.target.value as PositioningAxisId)
                }
                className="h-11 w-full rounded-xl border border-[#e3e4ea] bg-[#fafafd] px-3.5 text-[12px] font-bold text-[#3f424d] outline-none focus:border-[#7664ea] focus:ring-4 focus:ring-[#7664ea]/10"
              >
                {positioningAxes.map((axis) => (
                  <option key={axis.id} value={axis.id}>
                    {axis.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
        <section className="rounded-2xl border border-[#e8e8ee] bg-white p-6 shadow-[0_10px_35px_rgba(26,28,42,0.035)]">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-[10px] font-extrabold tracking-[0.15em] text-[#8e82de]">
                INTERACTIVE PERCEPTUAL MAP
              </p>
              <h2 className="mt-1 text-[17px] font-extrabold tracking-[-0.03em]">
                {xAxis.label} × {yAxis.label}
              </h2>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold text-[#838690]">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#6551e8]" />
                자사
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-[#aaa3d7]" />
                경쟁사
              </span>
              <span className="text-[#b0b3bd]">점을 클릭해 상세 보기</span>
            </div>
          </div>

          <div className="relative mt-5 h-[520px] min-w-0">
            <ResponsiveContainer
              width="100%"
              height="100%"
              minWidth={0}
              initialDimension={{ width: 800, height: 520 }}
            >
              <ScatterChart margin={{ top: 34, right: 34, bottom: 28, left: 10 }}>
                <CartesianGrid stroke="#ecebf1" strokeDasharray="4 4" />
                <ReferenceArea
                  x1={highlightedX1}
                  x2={highlightedX2}
                  y1={highlightedY1}
                  y2={highlightedY2}
                  fill="#6551e8"
                  fillOpacity={0.055}
                />
                <ReferenceLine x={50} stroke="#c9c7d3" strokeWidth={1.2} />
                <ReferenceLine y={50} stroke="#c9c7d3" strokeWidth={1.2} />
                <XAxis
                  type="number"
                  dataKey="x"
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#a0a3ad", fontSize: 9, fontWeight: 700 }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                  tick={{ fill: "#a0a3ad", fontSize: 9, fontWeight: 700 }}
                />
                <ZAxis type="number" dataKey="z" range={[180, 430]} />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(value, name) => [
                    `${value}점`,
                    name === "x"
                      ? xAxis.label
                      : name === "y"
                        ? yAxis.label
                        : "상대 크기",
                  ]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e5e4eb",
                    fontSize: 11,
                  }}
                />
                <Scatter
                  name="경쟁사"
                  data={competitorPoints}
                  onClick={handlePointClick}
                  cursor="pointer"
                  isAnimationActive={false}
                >
                  {competitorPoints.map((point) => (
                    <Cell
                      key={point.id}
                      fill={
                        selectedPoint.id === point.id ? "#292c39" : "#aaa3d7"
                      }
                      stroke="#ffffff"
                      strokeWidth={selectedPoint.id === point.id ? 4 : 2}
                    />
                  ))}
                  <LabelList
                    dataKey="name"
                    position="top"
                    fill="#666975"
                    fontSize={11}
                    fontWeight={700}
                  />
                </Scatter>
                <Scatter
                  name={project.brandName}
                  data={[brandPoint]}
                  onClick={handlePointClick}
                  cursor="pointer"
                  isAnimationActive={false}
                >
                  <Cell
                    fill="#6551e8"
                    stroke="#ffffff"
                    strokeWidth={selectedPoint.id === "brand" ? 5 : 3}
                  />
                  <LabelList
                    dataKey="name"
                    position="top"
                    fill="#4f3bd4"
                    fontSize={12}
                    fontWeight={900}
                  />
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute left-12 top-4 text-[9px] font-extrabold text-[#b1b3bc]">
              {xAxis.low} · {yAxis.high}
            </div>
            <div className="pointer-events-none absolute right-5 top-4 rounded-full bg-[#6551e8]/10 px-2.5 py-1 text-[9px] font-extrabold text-[#6551e8]">
              {xAxis.high} · {yAxis.high}
            </div>
            <div className="pointer-events-none absolute bottom-8 left-12 text-[9px] font-extrabold text-[#b1b3bc]">
              {xAxis.low} · {yAxis.low}
            </div>
            <div className="pointer-events-none absolute bottom-8 right-5 text-[9px] font-extrabold text-[#b1b3bc]">
              {xAxis.high} · {yAxis.low}
            </div>
          </div>

          <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center text-[10px] font-extrabold text-[#8e919c]">
            <span>{xAxis.low}</span>
            <span className="rounded-full bg-[#f3f1fc] px-3 py-1.5 text-[#6551e8]">
              X축 · {xAxis.label}
            </span>
            <span className="text-right">{xAxis.high}</span>
          </div>

          <div className="mt-6 border-t border-[#ececf1] pt-6">
            <div className="flex items-start gap-4 rounded-2xl bg-[#f5f3ff] p-5">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#6551e8] text-white">
                <Sparkles size={17} />
              </span>
              <div>
                <p className="text-[10px] font-extrabold tracking-[0.13em] text-[#7664d7]">
                  AUTO INTERPRETATION
                </p>
                <p className="mt-2 text-[14px] font-extrabold leading-6 text-[#373348]">
                  {interpretation.summary}
                </p>
                <div className="mt-4 grid gap-2 lg:grid-cols-3">
                  {interpretation.details.map((detail, index) => (
                    <div
                      key={detail}
                      className="rounded-xl border border-[#e1dcf9] bg-white/70 p-3"
                    >
                      <span className="text-[9px] font-extrabold text-[#8e82de]">
                        INSIGHT 0{index + 1}
                      </span>
                      <p className="mt-1.5 text-[10px] font-semibold leading-4 text-[#696776]">
                        {detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-2xl bg-[#20222f] p-6 text-white shadow-[0_18px_45px_rgba(24,26,40,0.14)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[9px] font-extrabold tracking-[0.14em] text-white/45">
                  {selectedPoint.type === "brand"
                    ? "OUR BRAND"
                    : "SELECTED COMPETITOR"}
                </span>
                <h2 className="mt-2 text-[21px] font-extrabold tracking-[-0.04em]">
                  {selectedPoint.name}
                </h2>
                <p className="mt-1 text-[11px] font-semibold text-white/45">
                  {selectedPoint.productName}
                </p>
              </div>
              <span
                className={`grid size-9 place-items-center rounded-xl ${
                  selectedPoint.type === "brand"
                    ? "bg-[#6551e8]"
                    : "bg-white/10"
                }`}
              >
                {selectedPoint.type === "brand" ? (
                  <Target size={17} />
                ) : (
                  <ShieldAlert size={17} />
                )}
              </span>
            </div>

            <div className="mt-6 space-y-5">
              <PositionSlider
                label={xAxis.low}
                opposite={xAxis.high}
                value={selectedPoint.x}
                inverse
                onChange={(value) =>
                  updatePointPosition(selectedPoint.id, "x", value)
                }
              />
              <PositionSlider
                label={yAxis.low}
                opposite={yAxis.high}
                value={selectedPoint.y}
                inverse
                onChange={(value) =>
                  updatePointPosition(selectedPoint.id, "y", value)
                }
              />
            </div>
          </section>

          <section className="rounded-2xl border border-[#e8e8ee] bg-white p-5">
            <div className="flex items-center gap-2">
              <Lightbulb size={16} className="text-[#e2992c]" />
              <h3 className="text-[13px] font-extrabold">브랜드 상세 정보</h3>
            </div>
            <div className="mt-5 space-y-4">
              <PositioningDetail
                label="USP"
                value={selectedPoint.usp}
                tone="purple"
              />
              <PositioningDetail
                label="강점"
                value={selectedPoint.strengths}
                tone="green"
              />
              <PositioningDetail
                label="약점"
                value={selectedPoint.weaknesses}
                tone="red"
              />
            </div>
            {selectedPoint.type === "brand" && (
              <p className="mt-4 rounded-xl bg-[#f8f7fc] p-3 text-[10px] font-semibold leading-4 text-[#858894]">
                자사 USP·강점·약점은 아래 자사 포지셔닝 정보에서 편집할 수
                있습니다.
              </p>
            )}
          </section>
        </aside>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#e8e8ee] bg-white shadow-[0_10px_35px_rgba(26,28,42,0.035)]">
        <div className="flex flex-col justify-between gap-3 border-b border-[#ececf1] px-6 py-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-extrabold tracking-[0.15em] text-[#8e82de]">
              POSITION SCORE EDITOR
            </p>
            <h2 className="mt-1 text-[16px] font-extrabold tracking-[-0.03em]">
              브랜드별 X·Y 점수 입력
            </h2>
          </div>
          <span className="text-[11px] font-semibold text-[#999ca6]">
            0점은 왼쪽·아래, 100점은 오른쪽·위를 의미합니다.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="bg-[#fafafd] text-[10px] font-extrabold text-[#8f929d]">
                <th className="px-6 py-4">브랜드 / 제품</th>
                <th className="px-4 py-4">{xAxis.label}</th>
                <th className="px-4 py-4">{yAxis.label}</th>
                <th className="px-4 py-4">현재 영역</th>
                <th className="px-6 py-4 text-right">상세</th>
              </tr>
            </thead>
            <tbody>
              {allPoints.map((point) => (
                <tr
                  key={point.id}
                  className={`border-t border-[#efeff3] ${
                    selectedPoint.id === point.id ? "bg-[#fbfaff]" : ""
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-lg text-[10px] font-extrabold ${
                          point.type === "brand"
                            ? "bg-[#6551e8] text-white"
                            : "bg-[#efedf8] text-[#7068a5]"
                        }`}
                      >
                        {point.type === "brand" ? "자사" : "경쟁"}
                      </span>
                      <div>
                        <strong className="block text-[12px] font-extrabold text-[#33353f]">
                          {point.name}
                        </strong>
                        <span className="mt-0.5 block text-[10px] text-[#999ca6]">
                          {point.productName}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <PositionNumberInput
                      label={`${point.name} X축 점수`}
                      value={point.x}
                      onChange={(value) =>
                        updatePointPosition(point.id, "x", value)
                      }
                    />
                  </td>
                  <td className="px-4 py-4">
                    <PositionNumberInput
                      label={`${point.name} Y축 점수`}
                      value={point.y}
                      onChange={(value) =>
                        updatePointPosition(point.id, "y", value)
                      }
                    />
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex rounded-full bg-[#f3f1fc] px-2.5 py-1.5 text-[10px] font-extrabold text-[#6551e8]">
                      {point.x >= 50 ? xAxis.high : xAxis.low} ·{" "}
                      {point.y >= 50 ? yAxis.high : yAxis.low}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setSelectedPointId(point.id)}
                      className="rounded-lg border border-[#e2e2e9] px-3 py-2 text-[10px] font-extrabold text-[#696c77] transition hover:border-[#7664ea] hover:text-[#6551e8]"
                    >
                      맵에서 보기
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid gap-5 border-t border-[#ececf1] bg-[#fafafd] p-6 lg:grid-cols-3">
          <TextArea
            label="자사 USP"
            value={positioning.brand.usp}
            onChange={(usp) =>
              onPositioningChange({
                ...positioning,
                brand: { ...positioning.brand, usp },
              })
            }
          />
          <TextArea
            label="자사 강점"
            value={positioning.brand.strengths}
            onChange={(strengths) =>
              onPositioningChange({
                ...positioning,
                brand: { ...positioning.brand, strengths },
              })
            }
          />
          <TextArea
            label="자사 약점"
            value={positioning.brand.weaknesses}
            onChange={(weaknesses) =>
              onPositioningChange({
                ...positioning,
                brand: { ...positioning.brand, weaknesses },
              })
            }
          />
        </div>
      </section>
    </div>
  );
}

function PositioningDetail({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "purple" | "green" | "red";
}) {
  const toneClass = {
    purple: "bg-[#f3f1fc] text-[#6551e8]",
    green: "bg-[#edf8f3] text-[#168b6a]",
    red: "bg-[#fff1f3] text-[#cf5966]",
  }[tone];

  return (
    <div>
      <span
        className={`inline-flex rounded-lg px-2 py-1 text-[9px] font-extrabold ${toneClass}`}
      >
        {label}
      </span>
      <p className="mt-2 text-[11px] font-semibold leading-5 text-[#656873]">
        {value || "입력된 정보가 없습니다."}
      </p>
    </div>
  );
}

function PositionNumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex w-fit items-center gap-2 rounded-xl border border-[#e2e3e9] bg-white px-3">
      <input
        aria-label={label}
        type="number"
        min="0"
        max="100"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-10 w-12 bg-transparent text-center text-[12px] font-extrabold text-[#3d404a] outline-none"
      />
      <span className="text-[10px] font-bold text-[#a2a5ae]">/ 100</span>
    </div>
  );
}

const reportSectionPresentation: Record<
  ReportSectionId,
  {
    icon: typeof BriefcaseBusiness;
    color: string;
    background: string;
  }
> = {
  overview: {
    icon: BriefcaseBusiness,
    color: "#6551e8",
    background: "#f0edff",
  },
  target: { icon: Target, color: "#168b6a", background: "#edf8f3" },
  persona: { icon: Users, color: "#3d74d8", background: "#eef4ff" },
  competitors: {
    icon: ShieldAlert,
    color: "#cf5966",
    background: "#fff1f3",
  },
  positioning: {
    icon: Crosshair,
    color: "#7a5bd6",
    background: "#f3efff",
  },
  opportunity: {
    icon: TrendingUp,
    color: "#d68a20",
    background: "#fff7e9",
  },
  usp: { icon: Zap, color: "#5b46db", background: "#f0edff" },
  message: {
    icon: Megaphone,
    color: "#b45d9b",
    background: "#fff0fa",
  },
  execution: { icon: AreaChart, color: "#168b6a", background: "#edf8f3" },
};

function ReportView(workspace: WorkspaceState) {
  const { targets, competitors } = workspace;
  const [tone, setTone] = useState<ReportTone>("ppt");
  const [copied, setCopied] = useState(false);
  const [generatedLabel, setGeneratedLabel] = useState("현재 데이터 자동 반영");
  const report = useMemo(
    () => createStrategyReport(workspace, tone),
    [tone, workspace],
  );

  const copyReport = async () => {
    let copiedWithClipboardApi = false;

    if (navigator.clipboard && window.isSecureContext) {
      try {
        const permission = await navigator.permissions.query({
          name: "clipboard-write" as PermissionName,
        });
        if (permission.state !== "denied") {
          await navigator.clipboard.writeText(report.markdown);
          copiedWithClipboardApi = true;
        }
      } catch {
        copiedWithClipboardApi = false;
      }
    }

    if (!copiedWithClipboardApi) {
      const textArea = document.createElement("textarea");
      textArea.value = report.markdown;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand("copy");
      textArea.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const regenerateReport = () => {
    setGeneratedLabel(
      `${new Date().toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      })} 생성 완료`,
    );
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-[#e8e8ee] bg-white p-5 shadow-[0_10px_35px_rgba(26,28,42,0.035)]">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Settings2 size={16} className="text-[#6551e8]" />
              <h2 className="text-[14px] font-extrabold">보고서 톤 선택</h2>
            </div>
            <p className="mt-1.5 text-[11px] text-[#92959f]">
              사용 목적에 맞춰 문장 길이와 보고서 어조를 자동 조정합니다.
            </p>
          </div>
          <div className="grid gap-2 md:grid-cols-3 lg:w-[760px]">
            {reportToneOptions.map((option) => {
              const active = option.id === tone;
              return (
                <button
                  key={option.id}
                  onClick={() => setTone(option.id)}
                  className={`rounded-xl border p-3.5 text-left transition ${
                    active
                      ? "border-[#7664ea] bg-[#f5f3ff] shadow-[0_6px_18px_rgba(101,81,232,0.08)]"
                      : "border-[#e5e6eb] bg-[#fafafd] hover:border-[#d6d3e8]"
                  }`}
                >
                  <span
                    className={`block text-[11px] font-extrabold ${
                      active ? "text-[#6551e8]" : "text-[#4f525d]"
                    }`}
                  >
                    {option.label}
                  </span>
                  <span className="mt-1.5 block text-[9px] font-semibold leading-4 text-[#9a9da7]">
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-2xl bg-[#20222f] p-7 text-white shadow-[0_18px_45px_rgba(24,26,40,0.14)]">
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-[#6551e8]/35 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-end">
          <div>
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-extrabold tracking-[0.14em] text-white/65">
              EXECUTIVE SUMMARY
            </span>
            <h2 className="mt-6 text-[25px] font-extrabold tracking-[-0.045em]">
              {report.title}
            </h2>
            <p className="mt-4 max-w-[900px] text-[14px] font-semibold leading-7 text-white/75">
              {report.executiveSummary}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {[report.subtitle, `${targets.length}개 타겟`, `${competitors.length}개 경쟁사`].map(
                (tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white/65"
                  >
                    {tag}
                  </span>
                ),
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
            <div className="flex items-center justify-between text-[10px] font-bold text-white/50">
              <span>REPORT STATUS</span>
              <Check size={13} className="text-[#78d5b6]" />
            </div>
            <strong className="mt-2 block text-[13px]">{generatedLabel}</strong>
            <button
              onClick={regenerateReport}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6551e8] px-4 py-2.5 text-[11px] font-extrabold text-white transition hover:bg-[#7561ee]"
            >
              <RefreshCcw size={14} />
              리포트 다시 생성
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="grid content-start gap-5 lg:grid-cols-2">
          {report.sections.map((section, index) => {
            const presentation = reportSectionPresentation[section.id];
            const Icon = presentation.icon;
            const isWide =
              section.id === "overview" ||
              section.id === "positioning" ||
              section.id === "execution";

            return (
              <article
                key={section.id}
                className={`rounded-2xl border border-[#e8e8ee] bg-white p-5 shadow-[0_10px_30px_rgba(26,28,42,0.03)] ${
                  isWide ? "lg:col-span-2" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid size-10 shrink-0 place-items-center rounded-xl"
                      style={{
                        color: presentation.color,
                        backgroundColor: presentation.background,
                      }}
                    >
                      <Icon size={18} />
                    </span>
                    <div>
                      <p
                        className="text-[9px] font-extrabold tracking-[0.14em]"
                        style={{ color: presentation.color }}
                      >
                        {section.eyebrow}
                      </p>
                      <h2 className="mt-1 text-[15px] font-extrabold tracking-[-0.03em]">
                        {section.title}
                      </h2>
                    </div>
                  </div>
                  <span className="text-[10px] font-extrabold text-[#c0c2ca]">
                    0{index + 1}
                  </span>
                </div>

                <p
                  className={`mt-5 font-bold leading-6 text-[#40434e] ${
                    section.id === "usp" ? "text-[15px]" : "text-[12px]"
                  }`}
                >
                  {section.summary}
                </p>

                <div
                  className={`mt-4 grid gap-2 ${
                    isWide ? "md:grid-cols-2" : ""
                  }`}
                >
                  {section.bullets.map((bullet) => (
                    <div
                      key={bullet}
                      className="flex gap-2.5 rounded-xl bg-[#f8f8fb] p-3"
                    >
                      <span
                        className="mt-1.5 size-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: presentation.color }}
                      />
                      <p className="text-[10px] font-semibold leading-[1.7] text-[#71747f]">
                        {bullet}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>

        <aside>
          <section className="sticky top-24 overflow-hidden rounded-2xl border border-[#e8e8ee] bg-white shadow-[0_10px_35px_rgba(26,28,42,0.05)]">
            <div className="flex items-center justify-between border-b border-[#ececf1] px-5 py-4">
              <div>
                <h2 className="text-[14px] font-extrabold">Markdown 리포트</h2>
                <p className="mt-1 text-[10px] text-[#999ca6]">
                  Notion · 문서 · 프레젠테이션용
                </p>
              </div>
              <button
                onClick={copyReport}
                className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-extrabold text-white transition ${
                  copied ? "bg-[#168b6a]" : "bg-[#6551e8] hover:bg-[#5743d4]"
                }`}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? "복사 완료" : "Markdown 복사"}
              </button>
            </div>
            <div className="border-b border-[#ececf1] bg-[#fafafd] px-5 py-3">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-[#858893]">포함된 리포트 섹션</span>
                <strong className="text-[#6551e8]">
                  {report.sections.length}개
                </strong>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#eceaf5]">
                <span className="block h-full w-full rounded-full bg-[#6551e8]" />
              </div>
            </div>
            <pre className="report-scroll max-h-[760px] overflow-auto whitespace-pre-wrap p-5 font-mono text-[10px] leading-[1.8] text-[#5e616d]">
              {report.markdown}
            </pre>
          </section>
        </aside>
      </div>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  copy,
  action,
  onAction,
}: {
  icon: typeof Users;
  title: string;
  copy: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="grid min-h-[500px] place-items-center rounded-2xl border border-dashed border-[#d9d8e2] bg-white">
      <div className="max-w-sm text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#f1eefc] text-[#6551e8]">
          <Icon size={24} />
        </span>
        <h2 className="mt-4 text-[17px] font-extrabold">{title}</h2>
        <p className="mt-2 text-[12px] leading-5 text-[#8e919c]">{copy}</p>
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#6551e8] px-4 py-2.5 text-[12px] font-extrabold text-white"
        >
          <Plus size={15} />
          {action}
        </button>
      </div>
    </div>
  );
}

export function MarketFitLab() {
  const [view, setView] = useState<ViewId>("dashboard");
  const [workspace, setWorkspace] = useState<WorkspaceState>(sampleWorkspace);
  const [hydrated, setHydrated] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setWorkspace(
            normalizeWorkspace(JSON.parse(saved) as Partial<WorkspaceState>),
          );
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      } finally {
        setHydrated(true);
      }
    });
  }, []);

  useEffect(() => {
    if (hydrated) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    }
  }, [hydrated, workspace]);

  const projectProgress = useMemo(() => {
    const values = Object.values(workspace.project);
    return Math.round(
      (values.filter((value) => value.trim().length > 0).length / values.length) * 100,
    );
  }, [workspace.project]);

  const resetWorkspace = () => {
    setWorkspace(sampleWorkspace);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleWorkspace));
  };

  const goTo = (nextView: ViewId) => {
    setView(nextView);
    setMobileNav(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#f6f6f8] text-[#20222d]">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col border-r border-[#e5e5ea] bg-white px-4 py-5 transition-transform lg:translate-x-0 ${
          mobileNav ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-2">
          <AppLogo />
          <button
            className="grid size-8 place-items-center rounded-lg text-[#8d909b] lg:hidden"
            onClick={() => setMobileNav(false)}
            aria-label="메뉴 닫기"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-8 rounded-xl border border-[#e8e8ee] bg-[#fafafd] p-3">
          <button className="flex w-full items-center gap-3 text-left">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#1f2230] text-[11px] font-extrabold text-white">
              OB
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-[12px] font-extrabold">
                {workspace.project.brandName} {workspace.project.productName}
              </strong>
              <span className="mt-0.5 block truncate text-[10px] font-semibold text-[#989ba6]">
                {workspace.project.category}
              </span>
            </span>
            <ChevronDown size={14} className="text-[#a9acb5]" />
          </button>
        </div>

        <nav className="mt-7 space-y-1" aria-label="주요 메뉴">
          <p className="mb-2 px-3 text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#b1b3bc]">
            Workspace
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.id === view;
            return (
              <button
                key={item.id}
                onClick={() => goTo(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[12px] font-bold transition ${
                  active
                    ? "bg-[#f0edff] text-[#5b46db]"
                    : "text-[#777a85] hover:bg-[#f8f8fa] hover:text-[#30323c]"
                }`}
              >
                <Icon size={17} strokeWidth={active ? 2.4 : 2} />
                <span className="flex-1">{item.label}</span>
                {"step" in item && (
                  <span
                    className={`grid size-5 place-items-center rounded-md text-[9px] font-extrabold ${
                      active
                        ? "bg-[#6551e8] text-white"
                        : "bg-[#eeeeF3] text-[#8d909b]"
                    }`}
                  >
                    {item.step}
                  </span>
                )}
                {active && <span className="size-1.5 rounded-full bg-[#6551e8]" />}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto">
          <div className="rounded-2xl bg-[#20222f] p-4 text-white">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-white/55">프로젝트 완성도</span>
              <strong className="text-[11px]">{projectProgress}%</strong>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
              <span
                className="block h-full rounded-full bg-[#8b78ff]"
                style={{ width: `${projectProgress}%` }}
              />
            </div>
            <p className="mt-3 text-[10px] font-medium leading-4 text-white/45">
              분석 필드를 채울수록 인사이트의 구체성이 높아집니다.
            </p>
          </div>
          <button className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-[11px] font-bold text-[#858893] transition hover:bg-[#f8f8fa]">
            <Settings2 size={16} />
            워크스페이스 설정
          </button>
        </div>
      </aside>

      {mobileNav && (
        <button
          className="fixed inset-0 z-30 bg-[#171923]/35 lg:hidden"
          onClick={() => setMobileNav(false)}
          aria-label="메뉴 배경 닫기"
        />
      )}

      <div className="min-h-screen lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-[#e5e5ea] bg-white/90 px-5 backdrop-blur-xl lg:px-8">
          <div className="flex items-center gap-3">
            <button
              className="grid size-9 place-items-center rounded-xl border border-[#e5e6eb] lg:hidden"
              onClick={() => setMobileNav(true)}
              aria-label="메뉴 열기"
            >
              <Menu size={18} />
            </button>
            <div className="relative hidden md:block">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a8abb5]"
              />
              <input
                className="h-9 w-64 rounded-xl bg-[#f5f5f8] pl-9 pr-3 text-[11px] font-semibold outline-none placeholder:text-[#a8abb5] focus:ring-2 focus:ring-[#7664ea]/20"
                placeholder="프로젝트 내 검색"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full bg-[#edf8f3] px-3 py-1.5 text-[10px] font-extrabold text-[#168b6a] sm:inline-flex">
              <span className="size-1.5 rounded-full bg-[#20a47d]" />
              브라우저에 저장됨
            </span>
            <div className="h-6 w-px bg-[#e4e5ea]" />
            <button className="grid size-9 place-items-center rounded-xl bg-[#292c39] text-[11px] font-extrabold text-white">
              CH
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1500px] px-5 py-8 lg:px-8 lg:py-10">
          <PageHeader view={view} onReset={resetWorkspace} />
          {analysisFlow.some((item) => item.view === view) && (
            <AnalysisFlowNav currentView={view} goTo={goTo} />
          )}
          {view === "project" && (
            <ProjectView
              project={workspace.project}
              onChange={(project) => setWorkspace({ ...workspace, project })}
              targets={workspace.targets}
              competitors={workspace.competitors}
              goTo={goTo}
            />
          )}
          {view === "targets" && (
            <TargetView
              targets={workspace.targets}
              onChange={(targets) => setWorkspace({ ...workspace, targets })}
            />
          )}
          {view === "competitors" && (
            <CompetitorView
              competitors={workspace.competitors}
              onChange={(competitors) =>
                setWorkspace({ ...workspace, competitors })
              }
            />
          )}
          {view === "dashboard" && <DashboardView {...workspace} />}
          {view === "positioning" && (
            <PositioningView
              project={workspace.project}
              competitors={workspace.competitors}
              positioning={workspace.positioning}
              onCompetitorsChange={(competitors) =>
                setWorkspace({ ...workspace, competitors })
              }
              onPositioningChange={(positioning) =>
                setWorkspace({ ...workspace, positioning })
              }
            />
          )}
          {view === "report" && <ReportView {...workspace} />}
        </main>
      </div>
    </div>
  );
}
