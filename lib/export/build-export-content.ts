import type {
  CoverLetterOutput,
  InterviewQuestion,
  PortfolioOutput,
  ProjectAnalysis,
  ProofolioWorkspace,
  ResumeBullet,
} from "@/types/proofolio";

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
  const allKeywords = Array.from(
    new Set(analyses.flatMap((analysis) => analysis.competencyTags)),
  );

  if (!analyses.length) return "";

  return [
    "PROOFOLIO FINAL PORTFOLIO PPT",
    "",
    `[지원자] ${profile.name || "이름 미설정"}`,
    `[목표 직무] ${profile.targetRole || "목표 직무 미설정"}`,
    `[통합 핵심 역량] ${allKeywords.slice(0, 8).join(", ")}`,
    "",
    "작성 기준",
    "- 업로드 파일별 분석 리포트를 먼저 검토하고 프로젝트별 문제, 인사이트, 전략, 역할을 분리했습니다.",
    "- 성과 수치가 확인되지 않은 항목은 기대효과 또는 검증 과제로 구분했습니다.",
    "- 최종본은 채용 담당자가 직무 역량을 빠르게 이해할 수 있는 PPT 포트폴리오 흐름으로 구성합니다.",
    "",
    ...analyses.flatMap((analysis, index) => {
      const portfolio = workspace.portfolioOutputs[analysis.id];
      const sourceReview = analysis.sourceReview;
      const expertReview = analysis.expertReview;

      return [
        `SLIDE ${String(index + 1).padStart(2, "0")} · ${analysis.projectTitle}`,
        `유형: ${analysis.projectType}`,
        `한 줄 요약: ${portfolio?.keyMessage ?? analysis.oneLineSummary}`,
        `문제 정의: ${truncate(analysis.problemDefinition, 220)}`,
        `핵심 인사이트: ${truncate(analysis.keyInsight, 220)}`,
        `전략/실행: ${truncate(`${analysis.strategy} ${analysis.execution}`, 260)}`,
        `본인 역할: ${truncate(analysis.userRole, 180)}`,
        `결과/검증 상태: ${truncate(analysis.result, 180)}`,
        `첨부 파일 검토: ${sourceReview?.evidenceQuality ?? "파일명과 분석 리포트를 기준으로 검토했습니다."}`,
        `전문가 진단: ${expertReview?.executiveDiagnosis ? truncate(expertReview.executiveDiagnosis, 260) : "재분석 시 전문가 심층 진단이 추가됩니다."}`,
        `채용 관점 적합도: ${expertReview?.hiringRelevance ? truncate(expertReview.hiringRelevance, 220) : "직무 역량과 프로젝트 근거의 연결성을 추가 검토해야 합니다."}`,
        `보완 질문: ${analysis.missingQuestions.slice(0, 3).join(" / ")}`,
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
  return [
    workspace.portfolioOutputs[analysisId],
    workspace.portfolioOutputs[analysisId],
    workspace.portfolioOutputs[analysisId],
    workspace.analyses.length ? workspace.analyses : undefined,
    workspace.coverLetterOutputs[analysisId],
    workspace.resumeBullets[analysisId],
    workspace.interviewQuestions[analysisId],
  ].filter(Boolean).length;
}
