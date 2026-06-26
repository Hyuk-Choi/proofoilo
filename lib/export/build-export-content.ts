import type {
  CoverLetterOutput,
  FeedbackScore,
  InterviewQuestion,
  PortfolioOutput,
  ProjectAnalysis,
  ProofolioWorkspace,
  ResumeBullet,
} from "@/types/proofolio";
import { getAccuracyReportForAnalysis } from "@/lib/analysis/accuracy-review";
import { getDetailedReviewForAnalysis } from "@/lib/analysis/detailed-review";
import {
  getProjectEvidenceAudit,
  getWorkspaceFinalReadiness,
} from "@/lib/analysis/evidence-audit";
import { getFinalPortfolioAudit } from "@/lib/analysis/final-output-audit";
import {
  getProjectPortfolioAudit,
  getWorkspacePortfolioAudit,
} from "@/lib/analysis/portfolio-output-audit";

export type ExportFormat =
  | "notion"
  | "pdf"
  | "ppt"
  | "portfolioDeck"
  | "coverLetter"
  | "resume"
  | "interview";

function truncate(value: string, maximum: number) {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maximum
    ? `${normalized.slice(0, maximum - 3)}...`
    : normalized;
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function getRoleDirection(targetRole: string, skills: string[]) {
  const normalizedRole = targetRole.toLocaleLowerCase("ko-KR");
  const topSkills = skills.slice(0, 5).join(", ") || "문제 정의, 근거 분석, 실행안 도출";

  if (/퍼포먼스|그로스|performance|growth/.test(normalizedRole)) {
    return `${targetRole} 지원 기준에 맞춰 타깃 정의, 성과 지표 해석, 광고·랜딩 개선, 실험 설계 역량이 먼저 보이도록 구성합니다. 핵심 근거는 ${topSkills}입니다.`;
  }
  if (/브랜드|brand|글로벌|global/.test(normalizedRole)) {
    return `${targetRole} 지원 기준에 맞춰 시장 이해, 브랜드 포지셔닝, 고객 인사이트, 커뮤니케이션 전략 역량이 먼저 보이도록 구성합니다. 핵심 근거는 ${topSkills}입니다.`;
  }
  if (/콘텐츠|content|sns|커뮤니케이션/.test(normalizedRole)) {
    return `${targetRole} 지원 기준에 맞춰 이슈 리서치, 메시지 구조화, 콘텐츠 기획, 독자 반응 검증 역량이 먼저 보이도록 구성합니다. 핵심 근거는 ${topSkills}입니다.`;
  }
  if (/pm|서비스|기획|product/.test(normalizedRole)) {
    return `${targetRole} 지원 기준에 맞춰 문제 정의, 사용자·시장 근거, 우선순위 설정, 실행 검증 역량이 먼저 보이도록 구성합니다. 핵심 근거는 ${topSkills}입니다.`;
  }

  return `${targetRole} 지원 기준에 맞춰 문제 정의, 근거 기반 판단, 실행안 구조화, 본인 기여도와 검증 가능성이 먼저 보이도록 구성합니다. 핵심 근거는 ${topSkills}입니다.`;
}

function buildCoverLetterText(
  analysis: ProjectAnalysis,
  output: CoverLetterOutput,
) {
  const sections: Array<[string, string]> = [
    ["지원동기", output.motivation],
    ["직무역량", output.competency],
    ["성과경험", output.achievement],
    ["협업경험", output.collaboration],
    ["성장과정", output.growth],
    ["입사 후 포부", output.futurePlan],
  ];

  return [
    `${analysis.projectTitle} | 자기소개서`,
    "",
    ...sections.flatMap(([label, content]) => [
      `[${label}]`,
      content,
      "",
    ]),
  ].join("\n");
}

function buildResumeText(
  analysis: ProjectAnalysis,
  output: ResumeBullet[],
) {
  const keywords = Array.from(
    new Set(output.flatMap((group) => group.keywords)),
  );

  return [
    `${analysis.projectTitle} | 이력서 프로젝트 경험`,
    "",
    ...output.flatMap((group) => [
      group.title,
      ...group.bullets.map((bullet) => `- ${bullet}`),
      "",
    ]),
    `핵심 키워드: ${keywords.join(", ")}`,
  ].join("\n");
}

function buildInterviewText(
  analysis: ProjectAnalysis,
  output: InterviewQuestion[],
) {
  return [
    `${analysis.projectTitle} | 면접 준비 자료`,
    "",
    ...output.flatMap((question, index) => [
      `Q${index + 1}. ${question.question}`,
      ...question.followUpQuestions.map(
        (followUp, followUpIndex) =>
          `  꼬리질문 ${followUpIndex + 1}. ${followUp}`,
      ),
      "",
      `답변 가이드: ${question.answerGuide}`,
      "",
      `약점 방어 답변: ${question.weaknessDefense}`,
      "",
    ]),
  ].join("\n");
}

function buildFeedbackText(feedback: FeedbackScore) {
  return [
    `총점: ${feedback.totalScore}/100`,
    "",
    "[항목별 코멘트]",
    ...feedback.comments.map((comment, index) => `${index + 1}. ${comment}`),
    "",
    "[수정 제안]",
    ...feedback.revisionSuggestions.map(
      (suggestion, index) => `${index + 1}. ${suggestion}`,
    ),
  ].join("\n");
}

function buildPdfText(
  analysis: ProjectAnalysis,
  output: PortfolioOutput,
) {
  return [
    "PROOFOLIO PROJECT SUMMARY",
    "",
    output.onePageSummary,
    "",
    "보완 질문",
    ...analysis.missingQuestions.map(
      (question, index) => `${index + 1}. ${question}`,
    ),
  ].join("\n");
}

export function buildFinalPortfolioText(workspace: ProofolioWorkspace) {
  const analyses = workspace.analyses;
  const profile = workspace.userProfile;
  const allKeywords = unique(
    analyses.flatMap((analysis) => analysis.competencyTags),
  );
  const targetRole = profile.targetRole || "목표 직무 미설정";
  const roleDirection = getRoleDirection(targetRole, allKeywords);
  const readiness = getWorkspaceFinalReadiness(workspace);
  const finalAudit = getFinalPortfolioAudit(workspace);
  const portfolioAudit = getWorkspacePortfolioAudit(workspace);

  if (!analyses.length) return "";

  return [
    "PROOFOLIO FINAL PORTFOLIO PPT",
    "",
    `[지원자] ${profile.name || "이름 미설정"}`,
    `[목표 직무] ${targetRole}`,
    `[통합 핵심 역량] ${allKeywords.slice(0, 8).join(", ")}`,
    `[직무 맞춤 포트폴리오 방향] ${roleDirection}`,
    `[최종본 준비도] ${readiness.score}/100 · ${readiness.level}`,
    `[최종 QA] ${finalAudit.score}/100 · ${finalAudit.level}`,
    `[포트폴리오 구조 감사] ${portfolioAudit.score}/100 · ${portfolioAudit.level}`,
    `[제출 가능 여부] ${readiness.readyForFinal ? "제출 가능" : "보완 후 제출 권장"}`,
    `[QA 제출 판단] ${finalAudit.readyForSubmission ? "최종 제출 가능" : "보완 후 제출 권장"}`,
    `[QA 요약] ${finalAudit.executiveSummary}`,
    "",
    "작성 기준",
    "- 업로드 파일별 분석 리포트를 먼저 검토하고 프로젝트별 문제, 인사이트, 전략, 역할을 분리했습니다.",
    "- 성과 수치가 확인되지 않은 항목은 기대효과 또는 검증 과제로 구분했습니다.",
    "- 최종본은 지원 직무의 평가 기준에 맞춰 채용 담당자가 직무 역량을 빠르게 이해할 수 있는 PPT 포트폴리오 흐름으로 구성합니다.",
    "- 모든 프로젝트는 포트폴리오 케이스 스터디, 전체 분석 요약, 원문/첨부 검토, 항목별 근거 감사, 전문가 진단, 최종 포트폴리오 문장으로 반영합니다.",
    "- 생성된 자기소개서, 이력서 bullet, 전문가 피드백, 면접 질문은 프로젝트별 부록으로 함께 포함합니다.",
    "",
    "최종본 체크리스트",
    ...readiness.checklist.map(
      (item) =>
        `- ${item.done ? "완료" : "보완 필요"} · ${item.label}: ${item.description}`,
    ),
    readiness.blockers.length ? "" : "보완 차단 항목 없음",
    ...readiness.blockers.map((blocker) => `- 차단 항목: ${blocker}`),
    ...readiness.warnings.map((warning) => `- 권장 보완: ${warning}`),
    "",
    "최종 QA 세부 평가",
    ...finalAudit.criteria.map(
      (item) =>
        `- ${item.status} · ${item.label}: ${item.score}/100\n  근거: ${item.evidence}\n  권고: ${item.recommendation}`,
    ),
    finalAudit.blockers.length ? "" : "최종 QA 차단 항목 없음",
    ...finalAudit.blockers.map((blocker) => `- QA 차단: ${blocker}`),
    ...finalAudit.improvements.map((improvement) => `- QA 보완: ${improvement}`),
    ...finalAudit.reviewerNotes.map((note) => `- 리뷰어 노트: ${note}`),
    "",
    "포트폴리오 구조 감사",
    portfolioAudit.executiveSummary,
    ...portfolioAudit.projectAudits.map(
      (audit) =>
        `- ${audit.level} · ${audit.projectTitle}: ${audit.score}/100`,
    ),
    ...portfolioAudit.blockers.map((blocker) => `- 포트폴리오 차단: ${blocker}`),
    ...portfolioAudit.improvements.map(
      (improvement) => `- 포트폴리오 보완: ${improvement}`,
    ),
    "",
    ...analyses.flatMap((analysis, index) => {
      const portfolio = workspace.portfolioOutputs[analysis.id];
      const projectPortfolioAudit = getProjectPortfolioAudit({
        analysis,
        output: portfolio,
        workspace,
      });
      const sourceReview = analysis.sourceReview;
      const expertReview = analysis.expertReview;
      const detailedReview = getDetailedReviewForAnalysis(analysis);
      const accuracyReport = getAccuracyReportForAnalysis(analysis);
      const evidenceAudit = getProjectEvidenceAudit(analysis, workspace);
      const coverLetter = workspace.coverLetterOutputs[analysis.id];
      const resume = workspace.resumeBullets[analysis.id];
      const feedback = workspace.feedbackScores[analysis.id];
      const interview = workspace.interviewQuestions[analysis.id];

      return [
        `SLIDE ${String(index + 1).padStart(2, "0")} · ${analysis.projectTitle}`,
        `유형: ${analysis.projectType}`,
        `지원 직무 연결: ${targetRole} 관점에서 ${analysis.competencyTags
          .slice(0, 3)
          .join(", ")} 역량을 보여주는 케이스로 배치`,
        `한 줄 요약: ${portfolio?.keyMessage ?? analysis.oneLineSummary}`,
        `프로젝트 배경: ${truncate(analysis.background, 220)}`,
        `문제 정의: ${truncate(analysis.problemDefinition, 220)}`,
        `타깃: ${truncate(analysis.targetAudience, 180)}`,
        `핵심 인사이트: ${truncate(analysis.keyInsight, 220)}`,
        `전략/실행: ${truncate(`${analysis.strategy} ${analysis.execution}`, 260)}`,
        `본인 역할: ${truncate(analysis.userRole, 180)}`,
        `결과/검증 상태: ${truncate(analysis.result, 180)}`,
        `포트폴리오 추천: ${truncate(analysis.portfolioRecommendation, 180)}`,
        `보완 필요점: ${analysis.improvementPoints.slice(0, 3).join(" / ")}`,
        `근거 신뢰도: ${evidenceAudit.score}/100 · ${evidenceAudit.level}`,
        `분석 정확도: ${accuracyReport.overallScore}/100 · ${accuracyReport.level}`,
        `신뢰도 구성: 높음 ${evidenceAudit.confidenceCounts["높음"]}개 / 중간 ${evidenceAudit.confidenceCounts["중간"]}개 / 낮음 ${evidenceAudit.confidenceCounts["낮음"]}개`,
        `주장 검증: ${accuracyReport.sourceCoverage.verifiedClaims}/${accuracyReport.sourceCoverage.totalClaims}개 검증 · 직접 근거 ${accuracyReport.sourceCoverage.directEvidenceItems}개 · 추론 항목 ${accuracyReport.sourceCoverage.inferredItems}개`,
        `보완 질문 답변: ${evidenceAudit.answeredQuestions}/${evidenceAudit.totalQuestions}`,
        `첨부 파일 검토: ${sourceReview?.evidenceQuality ?? "파일명과 분석 리포트를 기준으로 검토했습니다."}`,
        `항목별 상세 분석: ${truncate(detailedReview.coverageSummary, 260)}`,
        "",
        "[분석 정확도 검토]",
        accuracyReport.summary,
        ...accuracyReport.claimChecks.map(
          (check) =>
            `- ${check.label} · ${check.evidenceLevel} · 정확도 ${check.confidence}\n  주장: ${check.claim}\n  연결 근거: ${check.evidenceSource}\n  리스크: ${check.accuracyRisk}\n  검증 액션: ${check.verificationAction}`,
        ),
        "",
        "[정확도 한계와 검증 액션]",
        ...accuracyReport.limitations.map((limitation) => `- 한계: ${limitation}`),
        ...accuracyReport.verificationActions.map((action) => `- 액션: ${action}`),
        "",
        "[항목별 전체 근거 감사]",
        ...detailedReview.itemReviews.map(
          (item) =>
            `- ${item.order}. ${item.sourceLabel} · ${item.analysisFocus} · 신뢰도 ${item.confidence}\n  원문/근거: ${item.sourceExcerpt}\n  진단: ${item.consultantDiagnosis}\n  활용: ${item.portfolioImplication}\n  추가 확인: ${item.requiredFollowUp}`,
        ),
        "",
        "[부족한 근거]",
        ...detailedReview.missingEvidence.map(
          (gap) =>
            `- ${gap.area}: ${gap.issue} / 필요 근거: ${gap.requiredEvidence}`,
        ),
        "",
        "[근거 감사 결과]",
        ...evidenceAudit.strengths.map((strength) => `- 강점: ${strength}`),
        ...evidenceAudit.risks.map((risk) => `- 리스크: ${risk}`),
        ...evidenceAudit.requiredActions.map((action) => `- 보완 액션: ${action}`),
        `전문가 진단: ${expertReview?.executiveDiagnosis ? truncate(expertReview.executiveDiagnosis, 260) : "재분석 시 전문가 심층 진단이 추가됩니다."}`,
        `채용 관점 적합도: ${expertReview?.hiringRelevance ? truncate(expertReview.hiringRelevance, 220) : "직무 역량과 프로젝트 근거의 연결성을 추가 검토해야 합니다."}`,
        `보완 질문: ${analysis.missingQuestions.slice(0, 3).join(" / ")}`,
        "",
        "[최종 포트폴리오 산출물]",
        `포트폴리오 품질: ${projectPortfolioAudit.score}/100 · ${projectPortfolioAudit.level}`,
        ...projectPortfolioAudit.criteria.map(
          (item) =>
            `- ${item.status} · ${item.label}: ${item.score}/100 / ${item.evidence} / 권고: ${item.recommendation}`,
        ),
        portfolio
          ? portfolio.caseStudy ?? portfolio.onePageSummary
          : "Portfolio 페이지에서 결과물을 생성하면 이 섹션에 최종 케이스 스터디가 포함됩니다.",
        "",
        "[자기소개서 산출물]",
        coverLetter
          ? buildCoverLetterText(analysis, coverLetter)
          : "Cover Letter 페이지에서 생성하면 지원서 문항별 텍스트가 포함됩니다.",
        "",
        "[이력서 문장]",
        resume
          ? buildResumeText(analysis, resume)
          : "Resume 페이지에서 생성하면 이력서 bullet point가 포함됩니다.",
        "",
        "[전문가 피드백]",
        feedback
          ? buildFeedbackText(feedback)
          : "Feedback 페이지에서 생성하면 점수, 코멘트, 수정 제안이 포함됩니다.",
        "",
        "[면접 준비 자료]",
        interview
          ? buildInterviewText(analysis, interview)
          : "Interview 페이지에서 생성하면 대표 질문, 꼬리질문, 답변 가이드가 포함됩니다.",
        "",
      ];
    }),
    "최종 보완 우선순위",
    "- 성과 문장에 기준 시점, 비교 대상, 수치와 출처를 추가",
    "- 팀 활동과 본인의 직접 기여 범위를 분리",
    "- 대표 프로젝트는 문제-인사이트-전략-실행-결과가 한 장에서 연결되도록 시각화",
  ].join("\n");
}

export function buildExportContent(
  workspace: ProofolioWorkspace,
  analysis: ProjectAnalysis,
  format: ExportFormat,
) {
  const portfolio = workspace.portfolioOutputs[analysis.id];
  const coverLetter = workspace.coverLetterOutputs[analysis.id];
  const resume = workspace.resumeBullets[analysis.id];
  const interview = workspace.interviewQuestions[analysis.id];

  if (format === "notion") return portfolio?.notionCopy ?? "";
  if (format === "pdf") {
    return portfolio ? buildPdfText(analysis, portfolio) : "";
  }
  if (format === "ppt") return portfolio?.pptCopy ?? "";
  if (format === "portfolioDeck") return buildFinalPortfolioText(workspace);
  if (format === "coverLetter") {
    return coverLetter
      ? buildCoverLetterText(analysis, coverLetter)
      : "";
  }
  if (format === "resume") {
    return resume ? buildResumeText(analysis, resume) : "";
  }
  return interview ? buildInterviewText(analysis, interview) : "";
}

export function getGeneratedExportCount(
  workspace: ProofolioWorkspace,
  analysisId: string,
) {
  const hasPortfolio = Boolean(workspace.portfolioOutputs[analysisId]);
  const hasFinalDeck = workspace.analyses.length > 0;
  const portfolioTextFormats = hasPortfolio ? 3 : 0;
  const generatedArtifacts = [
    workspace.coverLetterOutputs[analysisId],
    workspace.resumeBullets[analysisId]?.length,
    workspace.interviewQuestions[analysisId]?.length,
  ].filter(Boolean).length;

  return portfolioTextFormats + (hasFinalDeck ? 1 : 0) + generatedArtifacts;
}
