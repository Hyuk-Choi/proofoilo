"use client";

import {
  Clipboard,
  Download,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";

import { ActionPlan } from "@/components/ActionPlan";
import { InsightList } from "@/components/InsightList";
import { ScoreBreakdown } from "@/components/ScoreBreakdown";
import type { AnalysisResult } from "@/types/analysis";

function buildExportText(result: AnalysisResult) {
  return [
    "# Proofolio 입력값 기반 분석 결과",
    "",
    "1. 핵심 진단 한 줄",
    result.headlineDiagnosis,
    "",
    "2. 종합 점수",
    `${Math.round(result.totalScore)}/100`,
    "",
    "3. 신뢰도",
    `${result.confidenceLevel} · 입력 완성도 ${Math.round(result.inputCompleteness)}/100`,
    "",
    "4. 항목별 점수",
    `시장 적합성: ${Math.round(result.scores.marketFit)}`,
    `타깃 정합성: ${Math.round(result.scores.targetFit)}`,
    `메시지 명확성: ${Math.round(result.scores.messageClarity)}`,
    `전환 가능성: ${Math.round(result.scores.conversionPotential)}`,
    `예산 효율성: ${Math.round(result.scores.budgetEfficiency)}`,
    `실행 용이성: ${Math.round(result.scores.executionDifficulty)}`,
    "",
    "5. 주요 인사이트",
    ...result.keyInsights.map((item) => `- ${item}`),
    "",
    "6. 발견된 문제점",
    ...result.problems.map((item) => `- ${item}`),
    "",
    "7. 개선 전략",
    ...result.recommendations.map((item) => `- ${item}`),
    "",
    "8. 우선순위 액션 플랜",
    ...result.priorityActions.map(
      (item) => `- [${item.priority}] ${item.action}: ${item.reason}`,
    ),
    "",
    "9. 바로 사용할 수 있는 문장",
    ...result.generatedCopy.map((item) => `- ${item}`),
    "",
    "10. 다음 테스트 제안",
    ...result.nextTestIdeas.map((item) => `- ${item}`),
    "",
    "11. 주의사항",
    result.caution,
  ].join("\n");
}

export function AnalysisResultCard({
  result,
  onRegenerate,
}: {
  result: AnalysisResult;
  onRegenerate: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const exportText = useMemo(() => buildExportText(result), [result]);

  const copyToClipboard = async () => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(exportText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const downloadText = () => {
    const blob = new Blob([exportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "proofolio-simulation-analysis.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-[#d9e4f4] bg-white shadow-[0_20px_45px_rgba(16,33,61,0.07)]">
      <header className="border-b border-[#e2e9f2] bg-[linear-gradient(135deg,#10213d_0%,#1f4ca5_100%)] p-5 text-white sm:p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black tracking-[0.13em] text-[#bcd3ff]">
              <Sparkles size={12} />
              입력값 기반 분석 결과입니다
            </p>
            <h4 className="mt-4 text-[19px] font-black tracking-[-0.035em]">
              1. 핵심 진단 한 줄
            </h4>
            <p className="mt-2 max-w-3xl text-[13px] font-semibold leading-7 text-white/72">
              {result.headlineDiagnosis}
            </p>
            <p className="mt-3 max-w-3xl rounded-2xl bg-white/10 px-4 py-3 text-[12px] font-semibold leading-6 text-white/64 ring-1 ring-white/10">
              {result.summary}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              onClick={copyToClipboard}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white px-3.5 text-[11px] font-black text-[#10213d]"
            >
              <Clipboard size={14} />
              {copied ? "복사 완료" : "복사"}
            </button>
            <button
              type="button"
              onClick={onRegenerate}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-white/10 px-3.5 text-[11px] font-black text-white ring-1 ring-white/20"
            >
              <RefreshCcw size={14} />
              다른 버전
            </button>
            <button
              type="button"
              onClick={downloadText}
              className="col-span-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-3.5 text-[11px] font-black text-white sm:col-span-1"
            >
              <Download size={14} />
              텍스트 저장
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            ["2. 종합 점수", `${Math.round(result.totalScore)}/100`],
            ["3. 신뢰도", result.confidenceLevel],
            ["입력 완성도", `${Math.round(result.inputCompleteness)}/100`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
              <p className="text-[10px] font-black tracking-[0.12em] text-[#bcd3ff]">
                {label}
              </p>
              <strong className="mt-1 block text-[24px] font-black tracking-[-0.05em]">
                {value}
              </strong>
            </div>
          ))}
        </div>
      </header>

      <div className="space-y-6 p-5 sm:p-6">
        <section>
          <div className="mb-3 flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#2563eb]" />
            <h4 className="text-[14px] font-black text-[#263853]">
              4. 항목별 점수
            </h4>
          </div>
          <ScoreBreakdown scores={result.scores} />
        </section>

        <div className="grid gap-4 lg:grid-cols-3">
          <InsightList
            title="5. 주요 인사이트"
            description="입력값에서 전략적으로 읽을 수 있는 의미입니다."
            items={result.keyInsights}
            tone="blue"
          />
          <InsightList
            title="6. 발견된 문제점"
            description="최종 결과물의 설득력을 낮출 수 있는 부분입니다."
            items={result.problems}
            tone="amber"
          />
          <InsightList
            title="7. 개선 전략"
            description="먼저 손보면 결과물 완성도가 올라가는 항목입니다."
            items={result.recommendations}
            tone="green"
          />
        </div>

        <ActionPlan actions={result.priorityActions} />

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-2xl border border-[#dbe7f8] bg-[#f8fbff] p-5">
            <h4 className="text-[14px] font-black text-[#264d85]">
              9. 바로 사용할 수 있는 문장
            </h4>
            <p className="mt-2 text-[12px] leading-6 text-[#5f789b]">
              같은 전략 방향을 유지하되 표현을 바꿔 테스트할 수 있는 문장입니다.
            </p>
            <div className="mt-4 grid gap-2">
              {result.generatedCopy.map((copy) => (
                <p
                  key={copy}
                  className="rounded-xl bg-white px-3.5 py-3 text-[12px] font-semibold leading-6 text-[#40536d] shadow-sm"
                >
                  {copy}
                </p>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[#dbe7f8] bg-[#f8fbff] p-4">
              <h5 className="text-[12px] font-black text-[#2563eb]">
                10. 다음 테스트 제안
              </h5>
              <ul className="mt-3 space-y-2 text-[11px] font-semibold leading-5 text-[#55739b]">
                {result.nextTestIdeas.map((testIdea) => (
                  <li key={testIdea}>- {testIdea}</li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-[#e3ebf5] bg-white p-4">
              <h5 className="text-[12px] font-black text-[#31435d]">
                참고 벤치마크
              </h5>
              <p className="mt-2 text-[11px] font-semibold leading-5 text-[#7d8da2]">
                내부 기준값과 시뮬레이션 기준으로 해석해야 합니다.
              </p>
              <div className="mt-3 grid gap-2 text-[11px] font-bold text-[#52657d]">
                <span>업종: {result.benchmarkRange.label}</span>
                <span>CTR: {result.benchmarkRange.ctr}</span>
                <span>CPC: {result.benchmarkRange.cpc}</span>
                <span>CVR: {result.benchmarkRange.conversionRate}</span>
              </div>
              <p className="mt-3 rounded-xl bg-[#f8fafc] px-3 py-2 text-[11px] leading-5 text-[#68788e]">
                {result.benchmarkRange.note}
              </p>
            </div>

            <div className="rounded-2xl border border-[#f1d7dc] bg-[#fff7f8] p-4">
              <h5 className="text-[12px] font-black text-[#c24b5a]">
                11. 주의사항
              </h5>
              <p className="mt-2 text-[11px] font-semibold leading-5 text-[#8f5360]">
                {result.caution}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#e3ebf5] bg-[#fbfcfe] p-5">
          <h4 className="text-[14px] font-black text-[#263853]">
            판단 근거 요약
          </h4>
          <p className="mt-2 text-[12px] leading-6 text-[#6f7f94]">
            {result.reasoningSummary}
          </p>
          {result.missingInputs.length ? (
            <div className="mt-4 rounded-2xl border border-[#eadfc5] bg-[#fffbf2] p-4">
              <strong className="text-[12px] font-black text-[#a96a0d]">
                보강하면 좋은 입력값
              </strong>
              <ul className="mt-2 space-y-1.5 text-[11px] font-semibold leading-5 text-[#806b4e]">
                {result.missingInputs.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </div>
    </section>
  );
}
