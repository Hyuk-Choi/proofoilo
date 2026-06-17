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
  | "coverLetter"
  | "resume"
  | "interview";

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
    workspace.coverLetterOutputs[analysisId],
    workspace.resumeBullets[analysisId],
    workspace.interviewQuestions[analysisId],
  ].filter(Boolean).length;
}
