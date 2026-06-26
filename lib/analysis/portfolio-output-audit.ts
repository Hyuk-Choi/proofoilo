import type {
  PortfolioOutput,
  ProjectAnalysis,
  ProofolioWorkspace,
} from "@/types/proofolio";
import {
  hasQuantitativeEvidence,
  joinKoreanList,
} from "@/lib/ai/shared";
import { getAccuracyReportForAnalysis } from "./accuracy-review";
import { getProjectEvidenceAudit } from "./evidence-audit";

export type PortfolioAuditStatus = "통과" | "보완 필요" | "차단";

export type PortfolioAuditCriterion = {
  label: string;
  score: number;
  status: PortfolioAuditStatus;
  description: string;
  evidence: string;
  recommendation: string;
};

export type ProjectPortfolioAudit = {
  analysisId: string;
  projectTitle: string;
  score: number;
  level: "포트폴리오 제출 가능" | "보완 후 사용" | "초안";
  readyForPortfolio: boolean;
  summary: string;
  criteria: PortfolioAuditCriterion[];
  blockers: string[];
  improvements: string[];
  strengths: string[];
};

export type WorkspacePortfolioAudit = {
  score: number;
  level: "포트폴리오 제출 가능" | "보완 후 사용" | "초안";
  readyForPortfolioDeck: boolean;
  projectAudits: ProjectPortfolioAudit[];
  blockers: string[];
  improvements: string[];
  strengths: string[];
  executiveSummary: string;
};

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function average(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function ratioScore(value: number, total: number) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, (value / total) * 100));
}

function compactList(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

function statusFromScore(score: number): PortfolioAuditStatus {
  if (score >= 84) return "통과";
  if (score >= 64) return "보완 필요";
  return "차단";
}

function criterion({
  label,
  score,
  description,
  evidence,
  recommendation,
}: Omit<PortfolioAuditCriterion, "score" | "status"> & {
  score: number;
}): PortfolioAuditCriterion {
  const normalizedScore = clampScore(score);

  return {
    label,
    score: normalizedScore,
    status: statusFromScore(normalizedScore),
    description,
    evidence,
    recommendation,
  };
}

function textOf(output?: PortfolioOutput) {
  if (!output) return "";

  return [
    output.portfolioTitle,
    output.summary,
    output.problem,
    output.insight,
    output.strategy,
    output.execution,
    output.result,
    output.role,
    output.keyMessage,
    output.onePageSummary,
    output.pptCopy,
    output.notionCopy,
    output.caseStudy,
    ...output.skills,
  ]
    .filter(Boolean)
    .join("\n");
}

function hasAny(value: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(value));
}

function getRoleFitScore({
  outputText,
  targetRole,
  skills,
}: {
  outputText: string;
  targetRole: string;
  skills: string[];
}) {
  const normalized = outputText.toLocaleLowerCase("ko-KR");
  const roleTokens = targetRole
    .toLocaleLowerCase("ko-KR")
    .split(/[\s,/·|]+/)
    .filter((token) => token.length >= 2);
  const matchedRoleTokens = roleTokens.filter((token) =>
    normalized.includes(token),
  ).length;
  const matchedSkills = skills.filter((skill) =>
    normalized.includes(skill.toLocaleLowerCase("ko-KR")),
  ).length;

  return clampScore(
    (targetRole ? 28 : 0) +
      ratioScore(matchedRoleTokens, Math.max(1, roleTokens.length)) * 0.28 +
      ratioScore(matchedSkills, Math.max(1, skills.length)) * 0.34 +
      (hasAny(normalized, [/직무/, /채용/, /지원/, /역량/, /recruiter/])
        ? 10
        : 0),
  );
}

function getStructureScore(output?: PortfolioOutput) {
  if (!output) return 0;

  const requiredFields = [
    output.summary,
    output.problem,
    output.insight,
    output.strategy,
    output.execution,
    output.result,
    output.role,
    output.keyMessage,
  ];
  const requiredScore = ratioScore(
    requiredFields.filter((value) => (value?.trim().length ?? 0) >= 24).length,
    requiredFields.length,
  );
  const formatScore =
    [output.onePageSummary, output.pptCopy, output.notionCopy, output.caseStudy]
      .filter((value) => (value?.trim().length ?? 0) >= 240).length * 12;

  return clampScore(requiredScore * 0.52 + formatScore);
}

function getStoryScore(outputText: string) {
  const storySignals = [
    /문제|core issue|problem/i,
    /인사이트|insight/i,
    /전략|recommendation|strategy/i,
    /실행|execution/i,
    /결과|성과|impact|outcome/i,
    /역할|contribution|my contribution/i,
  ];

  return clampScore(
    ratioScore(
      storySignals.filter((pattern) => pattern.test(outputText)).length,
      storySignals.length,
    ) * 0.76 +
      (hasAny(outputText, [/before/i, /after/i, /decision/i, /검증|evidence/i])
        ? 24
        : 0),
  );
}

function getRoleClarityScore(role: string, outputText: string) {
  const roleSignals = [
    /주도|담당|작성|분석|도출|설계|조율|제안|개선|정의/,
    /산출물|장표|카피|리서치|표|메시지|전략안/,
    /팀|협업|공동|의사결정|검토/,
  ];

  return clampScore(
    Math.min(46, role.trim().length * 0.55) +
      ratioScore(
        roleSignals.filter((pattern) => pattern.test(`${role} ${outputText}`))
          .length,
        roleSignals.length,
      ) *
        0.54,
  );
}

function getEvidencePresentationScore({
  outputText,
  evidenceScore,
  accuracyScore,
  verifiedClaims,
  totalClaims,
}: {
  outputText: string;
  evidenceScore: number;
  accuracyScore: number;
  verifiedClaims: number;
  totalClaims: number;
}) {
  const evidenceLabels = hasAny(outputText, [
    /근거|출처|검증|evidence|source|accuracy/i,
    /기대효과|후속|보완|한계/,
  ]);

  return clampScore(
    evidenceScore * 0.26 +
      accuracyScore * 0.26 +
      ratioScore(verifiedClaims, totalClaims) * 0.28 +
      (evidenceLabels ? 20 : 0),
  );
}

function getResultScore(result: string, outputText: string) {
  const hasMetrics = hasQuantitativeEvidence(`${result} ${outputText}`);
  const hasBoundary = hasAny(outputText, [
    /기대효과|검증 계획|후속|성과로 단정|확정 성과|expected impact/i,
  ]);

  return clampScore(
    (hasMetrics ? 62 : 32) +
      (hasBoundary ? 26 : 0) +
      (hasAny(outputText, [/기준|비교|기간|모수|출처/]) ? 12 : 0),
  );
}

function getPptReadinessScore(output?: PortfolioOutput) {
  if (!output) return 0;

  const slideLines = output.pptCopy
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const hasSlideNumbers = slideLines.filter((line) =>
    /^\d{1,2}\./.test(line),
  ).length;
  const caseStudyLength = output.caseStudy?.length ?? 0;

  return clampScore(
    ratioScore(hasSlideNumbers, 10) * 0.42 +
      Math.min(28, slideLines.length * 2.5) +
      (caseStudyLength >= 1200 ? 20 : caseStudyLength >= 700 ? 12 : 0) +
      (output.keyMessage ? 10 : 0),
  );
}

export function getProjectPortfolioAudit({
  analysis,
  output,
  workspace,
}: {
  analysis: ProjectAnalysis;
  output?: PortfolioOutput;
  workspace: ProofolioWorkspace;
}): ProjectPortfolioAudit {
  const targetRole = workspace.userProfile.targetRole || "목표 직무 미설정";
  const outputText = textOf(output);
  const evidenceAudit = getProjectEvidenceAudit(analysis, workspace);
  const accuracyReport = getAccuracyReportForAnalysis(analysis);
  const structureScore = getStructureScore(output);
  const roleFitScore = getRoleFitScore({
    outputText,
    targetRole,
    skills: analysis.competencyTags,
  });
  const storyScore = getStoryScore(outputText);
  const roleScore = getRoleClarityScore(analysis.userRole, outputText);
  const evidenceScore = getEvidencePresentationScore({
    outputText,
    evidenceScore: evidenceAudit.score,
    accuracyScore: accuracyReport.overallScore,
    verifiedClaims: accuracyReport.sourceCoverage.verifiedClaims,
    totalClaims: accuracyReport.sourceCoverage.totalClaims,
  });
  const resultScore = getResultScore(analysis.result, outputText);
  const pptScore = getPptReadinessScore(output);
  const criteria = [
    criterion({
      label: "포트폴리오 구조 완성도",
      score: structureScore,
      description:
        "프로젝트 요약, 문제, 인사이트, 전략, 실행, 결과, 역할, 핵심 문장이 모두 산출물에 반영됐는지 확인합니다.",
      evidence: output
        ? `필수 필드 반영 · 1페이지/PPT/Notion/Case Study 생성 상태 확인`
        : "포트폴리오 결과물이 아직 생성되지 않았습니다.",
      recommendation:
        "Portfolio 페이지에서 결과물을 생성한 뒤 1페이지, PPT, Notion, 상세 케이스 스터디를 모두 확인하세요.",
    }),
    criterion({
      label: "지원 직무 적합성",
      score: roleFitScore,
      description:
        "산출물이 목표 직무와 역량 키워드를 명확히 보여주는지 확인합니다.",
      evidence: `목표 직무: ${targetRole} · 역량: ${joinKoreanList(
        analysis.competencyTags.slice(0, 4),
      )}`,
      recommendation:
        "핵심 문장과 첫 페이지에 목표 직무명, 대표 역량, 프로젝트가 그 직무에 유효한 이유를 명시하세요.",
    }),
    criterion({
      label: "문제-인사이트-전략 흐름",
      score: storyScore,
      description:
        "채용 담당자가 프로젝트의 사고 과정을 따라갈 수 있는 스토리라인인지 확인합니다.",
      evidence:
        "문제, 인사이트, 전략, 실행, 결과, 역할 키워드의 연결성을 검사했습니다.",
      recommendation:
        "Before/After 또는 Decision Logic 섹션을 추가해 왜 그 전략을 선택했는지 보여주세요.",
    }),
    criterion({
      label: "본인 역할 증명",
      score: roleScore,
      description:
        "팀 결과와 개인 기여가 분리되어 본인의 실무 역량으로 읽히는지 확인합니다.",
      evidence: `역할 문장 길이 ${analysis.userRole.length}자 · 역할 신호 검사`,
      recommendation:
        "본인이 직접 작성한 장표, 분석표, 카피, 의사결정 기준과 조율 범위를 별도 bullet로 분리하세요.",
    }),
    criterion({
      label: "근거와 정확도 표시",
      score: evidenceScore,
      description:
        "포트폴리오 안에서 사실, 해석, 기대효과, 검증 필요 항목이 구분되는지 확인합니다.",
      evidence: `근거 ${evidenceAudit.score}/100 · 정확도 ${accuracyReport.overallScore}/100 · 검증 주장 ${accuracyReport.sourceCoverage.verifiedClaims}/${accuracyReport.sourceCoverage.totalClaims}`,
      recommendation:
        "Source/Evidence Status 섹션을 유지하고, 수치의 기간·모수·출처를 함께 적으세요.",
    }),
    criterion({
      label: "결과 표현의 안전성",
      score: resultScore,
      description:
        "성과 수치가 없을 때 확정 성과처럼 보이지 않도록 기대효과와 검증 계획을 분리했는지 확인합니다.",
      evidence: hasQuantitativeEvidence(`${analysis.result} ${outputText}`)
        ? "정량 신호가 일부 확인됩니다."
        : "정량 성과 신호가 부족합니다.",
      recommendation:
        "수치가 없으면 결과를 기대효과, 검증 계획, 다음 실험 지표로 나눠 면접 리스크를 낮추세요.",
    }),
    criterion({
      label: "PPT 전환 가능성",
      score: pptScore,
      description:
        "최종 PPTX로 옮겼을 때 슬라이드 순서와 핵심 메시지가 바로 읽히는지 확인합니다.",
      evidence: output
        ? `PPT 줄 수 ${output.pptCopy.split(/\n+/).filter(Boolean).length}개 · Case Study ${output.caseStudy?.length ?? 0}자`
        : "PPT 문구가 아직 없습니다.",
      recommendation:
        "PPT 문구는 10장 내외의 순서로 정리하고, 상세 근거는 부록으로 분리하세요.",
    }),
  ];
  const score = clampScore(average(criteria.map((item) => item.score)));
  const blockers = compactList([
    output ? "" : "포트폴리오 결과물이 생성되지 않았습니다.",
    ...criteria
      .filter((item) => item.status === "차단")
      .map((item) => `${item.label}: ${item.recommendation}`),
  ]);
  const improvements = compactList(
    criteria
      .filter((item) => item.status === "보완 필요")
      .map((item) => `${item.label}: ${item.recommendation}`),
  );
  const strengths = criteria
    .filter((item) => item.status === "통과")
    .map((item) => `${item.label}: ${item.evidence}`);
  const readyForPortfolio = score >= 86 && blockers.length === 0;
  const level = readyForPortfolio
    ? "포트폴리오 제출 가능"
    : score >= 68
      ? "보완 후 사용"
      : "초안";

  return {
    analysisId: analysis.id,
    projectTitle: analysis.projectTitle,
    score,
    level,
    readyForPortfolio,
    summary: readyForPortfolio
      ? "포트폴리오 구조, 직무 적합성, 역할 증명과 근거 표시가 제출 가능한 수준입니다."
      : score >= 68
        ? "포트폴리오의 기본 구조는 갖췄지만 직무 맞춤, 근거 표시 또는 결과 표현을 보완하면 더 강해집니다."
        : "현재 산출물은 포트폴리오 초안입니다. 먼저 결과물을 생성하고 핵심 구조와 근거를 채워야 합니다.",
    criteria,
    blockers,
    improvements,
    strengths,
  };
}

export function getWorkspacePortfolioAudit(
  workspace: ProofolioWorkspace,
): WorkspacePortfolioAudit {
  const projectAudits = workspace.analyses.map((analysis) =>
    getProjectPortfolioAudit({
      analysis,
      output: workspace.portfolioOutputs[analysis.id],
      workspace,
    }),
  );
  const score = clampScore(average(projectAudits.map((audit) => audit.score)));
  const blockers = compactList(
    projectAudits.flatMap((audit) =>
      audit.blockers.map((blocker) => `${audit.projectTitle}: ${blocker}`),
    ),
  );
  const improvements = compactList(
    projectAudits.flatMap((audit) =>
      audit.improvements.map(
        (improvement) => `${audit.projectTitle}: ${improvement}`,
      ),
    ),
  );
  const strengths = compactList(
    projectAudits.flatMap((audit) =>
      audit.strengths.map((strength) => `${audit.projectTitle}: ${strength}`),
    ),
  );
  const readyForPortfolioDeck =
    projectAudits.length > 0 &&
    projectAudits.every((audit) => audit.readyForPortfolio);
  const level = readyForPortfolioDeck
    ? "포트폴리오 제출 가능"
    : score >= 68
      ? "보완 후 사용"
      : "초안";

  return {
    score,
    level,
    readyForPortfolioDeck,
    projectAudits,
    blockers,
    improvements,
    strengths,
    executiveSummary: readyForPortfolioDeck
      ? "모든 프로젝트가 채용 포트폴리오 구조와 근거 표시 기준을 충족합니다."
      : score >= 68
        ? "포트폴리오 흐름은 형성되어 있지만 일부 프로젝트의 직무 맞춤, 역할 증명, 근거 표시를 보완해야 합니다."
        : "현재 포트폴리오 덱은 초안 수준입니다. 프로젝트별 포트폴리오 결과물을 먼저 생성하고 구조를 보완하세요.",
  };
}
