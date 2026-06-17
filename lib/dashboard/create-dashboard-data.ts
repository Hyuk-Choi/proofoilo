import type {
  DashboardMetric,
  ProjectStatus,
  ProofolioWorkspace,
  RecentProject,
  WorkflowSummary,
} from "../../types/proofolio";

export type ProofolioDashboardData = {
  metrics: DashboardMetric[];
  recentProjects: RecentProject[];
  workflowSummary: WorkflowSummary[];
};

function countGeneratedOutputs(workspace: ProofolioWorkspace) {
  return (
    Object.keys(workspace.portfolioOutputs).length +
    Object.keys(workspace.coverLetterOutputs).length +
    Object.keys(workspace.resumeBullets).length +
    Object.keys(workspace.feedbackScores).length +
    Object.keys(workspace.interviewQuestions).length
  );
}

function getProjectCompletion(
  workspace: ProofolioWorkspace,
  analysisId: string,
) {
  let score = 35;

  if (workspace.portfolioOutputs[analysisId]) score += 25;
  if (workspace.coverLetterOutputs[analysisId]) score += 10;
  if (workspace.resumeBullets[analysisId]) score += 10;
  if (workspace.feedbackScores[analysisId]) score += 10;
  if (workspace.interviewQuestions[analysisId]) score += 10;

  return score;
}

function getFileType(fileName: string): RecentProject["fileType"] {
  const extension = fileName.split(".").at(-1)?.toUpperCase();

  if (extension === "PPTX" || extension === "DOCX") return extension;
  return "PDF";
}

function formatAnalyzedAt(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "날짜 정보 없음";

  const koreaTime = new Date(parsed.getTime() + 9 * 60 * 60 * 1000);
  const month = koreaTime.getUTCMonth() + 1;
  const day = koreaTime.getUTCDate();
  const hour = koreaTime.getUTCHours();
  const minute = String(koreaTime.getUTCMinutes()).padStart(2, "0");
  const period = hour < 12 ? "오전" : "오후";
  const displayHour = hour % 12 || 12;

  return `${month}월 ${day}일 ${period} ${displayHour}:${minute}`;
}

function getSourceTimestamp(
  workspace: ProofolioWorkspace,
  sourceFileName: string,
) {
  const sourceFile = workspace.uploadedFiles.find(
    (file) => file.name === sourceFileName,
  );
  const timestamp = new Date(
    sourceFile?.uploadedAt ?? workspace.updatedAt,
  ).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function getProjectStatus(
  workspace: ProofolioWorkspace,
  analysisId: string,
  sourceStatus?: string,
): ProjectStatus {
  if (sourceStatus === "보완 필요") return "검토 필요";
  if (
    workspace.portfolioOutputs[analysisId] &&
    !workspace.coverLetterOutputs[analysisId]
  ) {
    return "포트폴리오 생성";
  }
  return "분석 완료";
}

export function createDashboardData(
  workspace: ProofolioWorkspace,
): ProofolioDashboardData {
  const analysisCount = workspace.analyses.length;
  const generatedOutputCount = countGeneratedOutputs(workspace);
  const completion = analysisCount
    ? Math.round(
        workspace.analyses.reduce(
          (total, analysis) =>
            total + getProjectCompletion(workspace, analysis.id),
          0,
        ) / analysisCount,
      )
    : 0;
  const feedbackValues = Object.values(workspace.feedbackScores);
  const averageFeedback = feedbackValues.length
    ? (
        feedbackValues.reduce(
          (total, feedback) => total + feedback.totalScore,
          0,
        ) /
        feedbackValues.length /
        20
      ).toFixed(1)
    : "0.0";

  const metrics: DashboardMetric[] = [
    {
      label: "전체 업로드 파일",
      value: String(workspace.uploadedFiles.length),
      detail: `${analysisCount}개 프로젝트에서 수집`,
      trend: "브라우저·계정 저장",
      tone: "blue",
    },
    {
      label: "분석 완료 프로젝트",
      value: String(analysisCount),
      detail: analysisCount
        ? "업로드 후 분석 리포트 생성"
        : "분석된 프로젝트가 없습니다",
      trend: analysisCount
        ? `${Math.round(
            (analysisCount /
              Math.max(
                1,
                new Set(workspace.analyses.map((item) => item.projectTitle))
                  .size,
              )) *
              100,
          )}% 분석률`
        : "분석 대기",
      tone: "green",
    },
    {
      label: "포트폴리오 완성도",
      value: `${completion}%`,
      detail: `핵심 결과물 ${generatedOutputCount}개 완성`,
      trend: `${Object.keys(workspace.portfolioOutputs).length}개 포트폴리오`,
      tone: "violet",
    },
    {
      label: "평균 피드백 점수",
      value: averageFeedback,
      detail: "5점 만점 기준",
      trend: `${feedbackValues.length}개 전문가 리뷰`,
      tone: "amber",
    },
  ];

  const recentProjects = [...workspace.analyses]
    .sort(
      (a, b) =>
        getSourceTimestamp(workspace, b.sourceFileName) -
        getSourceTimestamp(workspace, a.sourceFileName),
    )
    .slice(0, 5)
    .map((analysis) => {
      const sourceFile = workspace.uploadedFiles.find(
        (file) => file.name === analysis.sourceFileName,
      );

      return {
        id: analysis.id,
        title: analysis.projectTitle,
        fileName: analysis.sourceFileName,
        fileType: getFileType(analysis.sourceFileName),
        analyzedAt: formatAnalyzedAt(
          sourceFile?.uploadedAt ?? workspace.updatedAt,
        ),
        status: getProjectStatus(
          workspace,
          analysis.id,
          sourceFile?.status,
        ),
        competency: analysis.competencyTags.slice(0, 2).join(" · "),
        progress: getProjectCompletion(workspace, analysis.id),
      };
    });

  const totalQuestions = workspace.analyses.reduce(
    (total, analysis) => total + analysis.missingQuestions.length,
    0,
  );
  const answeredQuestions = Object.values(workspace.questionAnswers).reduce(
    (total, answers) =>
      total +
      Object.values(answers).filter((answer) => answer.trim().length > 0)
        .length,
    0,
  );
  const totalPossibleOutputs = analysisCount * 5;

  const workflowSummary: WorkflowSummary[] = [
    { label: "자료 분석", value: analysisCount, total: analysisCount },
    {
      label: "보완 질문",
      value: answeredQuestions,
      total: totalQuestions,
    },
    {
      label: "콘텐츠 생성",
      value: generatedOutputCount,
      total: totalPossibleOutputs,
    },
    {
      label: "최종 검토",
      value: feedbackValues.length,
      total: analysisCount,
    },
  ];

  return { metrics, recentProjects, workflowSummary };
}
