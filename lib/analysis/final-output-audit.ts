import type { ProofolioWorkspace } from "@/types/proofolio";
import { getAccuracyReportForAnalysis } from "./accuracy-review";
import {
  getProjectEvidenceAudit,
  getWorkspaceFinalReadiness,
} from "./evidence-audit";
import { getWorkspacePortfolioAudit } from "./portfolio-output-audit";

export type FinalAuditStatus = "통과" | "보완 필요" | "차단";

export type FinalAuditCriterion = {
  label: string;
  score: number;
  status: FinalAuditStatus;
  description: string;
  evidence: string;
  recommendation: string;
};

export type FinalPortfolioAudit = {
  score: number;
  level: "최종 제출 가능" | "제출 전 보완" | "초안";
  readyForSubmission: boolean;
  executiveSummary: string;
  criteria: FinalAuditCriterion[];
  blockers: string[];
  improvements: string[];
  strengths: string[];
  reviewerNotes: string[];
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

function statusFromScore(score: number): FinalAuditStatus {
  if (score >= 82) return "통과";
  if (score >= 62) return "보완 필요";
  return "차단";
}

function criterion({
  label,
  score,
  description,
  evidence,
  recommendation,
}: Omit<FinalAuditCriterion, "score" | "status"> & {
  score: number;
}): FinalAuditCriterion {
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

function estimateDeckSlideCount(workspace: ProofolioWorkspace) {
  const baseSlides = 8;
  const perProjectSlides = workspace.analyses.reduce((total, analysis) => {
    const itemCount = analysis.detailedReview?.itemReviews.length ?? 8;
    const accuracyClaimCount = analysis.accuracyReport?.claimChecks.length ?? 8;
    const portfolio = workspace.portfolioOutputs[analysis.id];
    const coverLetter = workspace.coverLetterOutputs[analysis.id];
    const resume = workspace.resumeBullets[analysis.id];
    const feedback = workspace.feedbackScores[analysis.id];
    const interview = workspace.interviewQuestions[analysis.id];

    return (
      total +
      9 +
      Math.ceil(itemCount / 4) +
      Math.ceil(accuracyClaimCount / 4) +
      (portfolio ? 2 : 1) +
      (coverLetter ? 2 : 1) +
      (resume?.length ? 2 : 1) +
      (feedback ? 2 : 1) +
      (interview?.length ? 2 : 1)
    );
  }, 0);

  return baseSlides + perProjectSlides;
}

export function getFinalPortfolioAudit(
  workspace: ProofolioWorkspace,
): FinalPortfolioAudit {
  const readiness = getWorkspaceFinalReadiness(workspace);
  const portfolioAudit = getWorkspacePortfolioAudit(workspace);
  const analyses = workspace.analyses;
  const projectCount = analyses.length;
  const projectAudits = analyses.map((analysis) =>
    getProjectEvidenceAudit(analysis, workspace),
  );
  const accuracyReports = analyses.map(getAccuracyReportForAnalysis);
  const portfolioCount = Object.keys(workspace.portfolioOutputs).length;
  const feedbackCount = analyses.filter(
    (analysis) => workspace.feedbackScores[analysis.id],
  ).length;
  const coverLetterCount = Object.keys(workspace.coverLetterOutputs).length;
  const resumeCount = Object.keys(workspace.resumeBullets).length;
  const interviewCount = Object.keys(workspace.interviewQuestions).length;
  const missingQuestions = analyses.reduce(
    (total, analysis) => total + analysis.missingQuestions.length,
    0,
  );
  const answeredQuestions = analyses.reduce((total, analysis) => {
    const answers = workspace.questionAnswers[analysis.id] ?? {};

    return (
      total +
      analysis.missingQuestions.filter((question) => answers[question]?.trim())
        .length
    );
  }, 0);
  const averageEvidenceScore = average(
    projectAudits.map((audit) => audit.score),
  );
  const averageAccuracyScore = average(
    accuracyReports.map((report) => report.overallScore),
  );
  const verifiedClaims = accuracyReports.reduce(
    (total, report) => total + report.sourceCoverage.verifiedClaims,
    0,
  );
  const totalClaims = accuracyReports.reduce(
    (total, report) => total + report.sourceCoverage.totalClaims,
    0,
  );
  const directEvidenceItems = accuracyReports.reduce(
    (total, report) => total + report.sourceCoverage.directEvidenceItems,
    0,
  );
  const feedbackAverage = average(
    analyses
      .map((analysis) => workspace.feedbackScores[analysis.id]?.totalScore)
      .filter((score): score is number => typeof score === "number"),
  );
  const slideEstimate = estimateDeckSlideCount(workspace);
  const allSkills = [...new Set(analyses.flatMap((analysis) => analysis.competencyTags))];
  const targetRole = workspace.userProfile.targetRole.trim();
  const questionCompletionScore = missingQuestions
    ? ratioScore(answeredQuestions, missingQuestions)
    : projectCount
      ? 100
      : 0;

  const criteria = [
    criterion({
      label: "지원 직무 맞춤도",
      score:
        (targetRole ? 34 : 0) +
        (workspace.userProfile.introduction.trim() ? 12 : 0) +
        (workspace.personalBrand ? 24 : 0) +
        (workspace.skillAnalysis ? 20 : 0) +
        Math.min(10, allSkills.length * 2),
      description:
        "최종본이 특정 지원 직무의 평가 기준에 맞춰 설계되어 있는지 확인합니다.",
      evidence: `목표 직무: ${targetRole || "미설정"} · 핵심 역량 ${allSkills.length}개 · 브랜딩 ${workspace.personalBrand ? "있음" : "없음"} · 스킬 분석 ${workspace.skillAnalysis ? "있음" : "없음"}`,
      recommendation:
        "Profile에서 목표 직무를 명확히 설정하고 Personal Brand, Skill Analysis를 생성해 첫 장의 포지셔닝을 강화하세요.",
    }),
    criterion({
      label: "근거 신뢰도와 정확도",
      score:
        averageEvidenceScore * 0.42 +
        averageAccuracyScore * 0.42 +
        ratioScore(verifiedClaims, totalClaims) * 0.12 +
        Math.min(4, directEvidenceItems),
      description:
        "분석 결과가 원문, 정량 지표, 보완 답변과 얼마나 연결되어 있는지 확인합니다.",
      evidence: `근거 평균 ${Math.round(averageEvidenceScore)}/100 · 정확도 평균 ${Math.round(averageAccuracyScore)}/100 · 검증 주장 ${verifiedClaims}/${totalClaims} · 직접 근거 ${directEvidenceItems}개`,
      recommendation:
        "원문 텍스트, 표/이미지 설명, 성과 수치, 출처와 비교 기준을 추가해 추론 비중을 낮추세요.",
    }),
    criterion({
      label: "산출물 완결성",
      score:
        portfolioAudit.score * 0.32 +
        ratioScore(feedbackCount, projectCount) * 0.22 +
        ratioScore(resumeCount, projectCount) * 0.16 +
        ratioScore(coverLetterCount, projectCount) * 0.14 +
        ratioScore(interviewCount, projectCount) * 0.1 +
        (workspace.careerInputs.length ? 6 : 0),
      description:
        "분석이 최종 포트폴리오, 자기소개서, 이력서, 피드백, 면접 자료까지 이어졌는지 확인합니다.",
      evidence: `포트폴리오 품질 ${portfolioAudit.score}/100 · 포트폴리오 ${portfolioCount}/${projectCount} · 피드백 ${feedbackCount}/${projectCount} · 이력서 ${resumeCount}/${projectCount} · 자소서 ${coverLetterCount}/${projectCount} · 면접 ${interviewCount}/${projectCount} · 직접 입력 ${workspace.careerInputs.length}개`,
      recommendation:
        "각 프로젝트마다 Portfolio, Feedback, Resume, Interview를 생성하고 포트폴리오 구조 감사에서 보완 필요 항목을 먼저 해결하세요.",
    }),
    criterion({
      label: "포트폴리오 구조 품질",
      score: portfolioAudit.score,
      description:
        "프로젝트별 포트폴리오가 채용용 케이스 스터디 구조로 완성됐는지 확인합니다.",
      evidence: `포트폴리오 전용 감사 ${portfolioAudit.score}/100 · ${portfolioAudit.level}`,
      recommendation:
        "문제-인사이트-전략-실행-역할-결과-근거 상태가 한 흐름으로 읽히도록 Portfolio 결과물을 보완하세요.",
    }),
    criterion({
      label: "컨설턴트식 논리 구조",
      score:
        questionCompletionScore * 0.28 +
        (projectCount ? 20 : 0) +
        Math.min(18, allSkills.length * 3) +
        (feedbackAverage ? Math.min(22, feedbackAverage * 0.22) : 0) +
        (workspace.careerInputs.length ? 12 : 0),
      description:
        "문제 정의, 인사이트, 전략, 실행, 결과, 본인 역할이 끊기지 않고 이어지는지 확인합니다.",
      evidence: `보완 질문 답변 ${answeredQuestions}/${missingQuestions} · 피드백 평균 ${feedbackAverage ? Math.round(feedbackAverage) : 0}/100 · 직접 입력 ${workspace.careerInputs.length}개`,
      recommendation:
        "Analysis 보완 질문에 답하고 My Inputs에 경험 기록과 자기소개서 초안을 추가해 논리의 빈칸을 채우세요.",
    }),
    criterion({
      label: "면접 방어력",
      score:
        ratioScore(interviewCount, projectCount) * 0.24 +
        ratioScore(feedbackCount, projectCount) * 0.24 +
        ratioScore(verifiedClaims, totalClaims) * 0.24 +
        averageAccuracyScore * 0.18 +
        questionCompletionScore * 0.1,
      description:
        "최종본의 주장을 면접에서 질문받았을 때 근거와 한계까지 설명할 수 있는지 확인합니다.",
      evidence: `면접 자료 ${interviewCount}/${projectCount} · 피드백 ${feedbackCount}/${projectCount} · 검증 주장 ${verifiedClaims}/${totalClaims}`,
      recommendation:
        "Interview를 생성하고, 정확도 낮은 주장은 한계 인정 문장과 후속 검증 계획으로 방어하세요.",
    }),
    criterion({
      label: "PPT 가독성과 제출 형태",
      score:
        (slideEstimate >= 10 ? 20 : 0) +
        (slideEstimate <= 72 ? 28 : slideEstimate <= 96 ? 16 : 8) +
        ratioScore(portfolioCount, projectCount) * 0.24 +
        (readiness.blockers.length ? 0 : 18) +
        (workspace.userProfile.name.trim() ? 10 : 4),
      description:
        "최종 PPTX가 너무 빈약하거나 과도하게 길지 않고, 채용 담당자가 읽을 수 있는 구조인지 확인합니다.",
      evidence: `예상 슬라이드 ${slideEstimate}장 · 포트폴리오 결과물 ${portfolioCount}/${projectCount} · 차단 항목 ${readiness.blockers.length}개`,
      recommendation:
        "대표 프로젝트를 먼저 배치하고, 세부 근거는 부록으로 보내세요. 슬라이드가 90장을 넘으면 핵심 제출본과 전체 부록본을 분리하는 것이 좋습니다.",
    }),
  ];
  const score = clampScore(average(criteria.map((item) => item.score)));
  const blockers = compactList([
    ...readiness.blockers,
    ...portfolioAudit.blockers,
    ...criteria
      .filter((item) => item.status === "차단")
      .map((item) => `${item.label}: ${item.recommendation}`),
    projectCount ? "" : "분석된 프로젝트가 없어 최종 포트폴리오를 만들 수 없습니다.",
    targetRole ? "" : "목표 직무가 없어 직무 맞춤 포트폴리오 방향을 확정할 수 없습니다.",
  ]);
  const improvements = compactList([
    ...readiness.warnings,
    ...portfolioAudit.improvements,
    ...criteria
      .filter((item) => item.status === "보완 필요")
      .map((item) => `${item.label}: ${item.recommendation}`),
  ]);
  const strengths = criteria
    .filter((item) => item.status === "통과")
    .map((item) => `${item.label}: ${item.evidence}`);
  const readyForSubmission =
    score >= 86 &&
    blockers.length === 0 &&
    readiness.readyForFinal &&
    portfolioAudit.readyForPortfolioDeck;
  const level = readyForSubmission
    ? "최종 제출 가능"
    : score >= 70
      ? "제출 전 보완"
      : "초안";

  return {
    score,
    level,
    readyForSubmission,
    executiveSummary: readyForSubmission
    ? "최종 포트폴리오가 지원 직무, 근거, 산출물, 면접 방어력 기준을 대부분 충족합니다. 제출 전에는 수치 출처와 개인 기여 표현만 마지막으로 확인하세요."
      : score >= 70
        ? "최종본 구조는 형성되어 있지만 일부 근거, 산출물, 직무 맞춤 항목이 부족합니다. 보완 후 제출하면 설득력이 크게 올라갑니다."
        : "현재 상태는 최종 제출본보다 초안에 가깝습니다. 목표 직무, 원문 근거, 포트폴리오 생성, 피드백, 보완 질문 답변을 먼저 채워야 합니다.",
    criteria,
    blockers,
    improvements,
    strengths,
    reviewerNotes: [
      "좋은 포트폴리오는 많은 내용을 담는 것보다, 채용 담당자가 검증 가능한 역량을 빠르게 찾을 수 있어야 합니다.",
      "성과 수치가 부족한 프로젝트는 확정 성과가 아니라 기대효과와 검증 계획으로 표기하는 편이 더 신뢰도 높습니다.",
      "모든 프로젝트를 같은 비중으로 보여주기보다 목표 직무와 가장 가까운 2~3개 프로젝트를 앞에 배치하세요.",
    ],
  };
}
