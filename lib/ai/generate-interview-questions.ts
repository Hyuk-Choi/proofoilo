import type {
  InterviewQuestion,
  ProjectAnalysis,
  ProofolioWorkspace,
} from "../../types/proofolio";
import { getDetailedReviewForAnalysis } from "../analysis/detailed-review";
import { getProjectResearchDepthAudit } from "../analysis/research-depth-audit";
import {
  buildConsultantLens,
  buildEvidenceBoundaryNote,
} from "./consultant-standards";
import { runOpenAiMock } from "./openai-mock-provider";
import { firstSentence } from "./shared";

export function buildInterviewQuestions(
  analysis: ProjectAnalysis,
  workspace?: ProofolioWorkspace,
): InterviewQuestion[] {
  const primarySkill = analysis.competencyTags[0] ?? "문제 해결";
  const secondarySkill = analysis.competencyTags[1] ?? "기획력";
  const problemSummary = firstSentence(analysis.problemDefinition);
  const strategySummary = firstSentence(analysis.strategy);
  const improvementSummary = firstSentence(
    analysis.improvementPoints[0] ?? "근거가 부족했던 지점",
  );
  const detailedReview = getDetailedReviewForAnalysis(analysis);
  const researchAudit = getProjectResearchDepthAudit(analysis, workspace);
  const strongestEvidence =
    detailedReview.itemReviews.find((item) => item.confidence === "높음") ??
    detailedReview.itemReviews[0];
  const weakestEvidence =
    [...detailedReview.itemReviews]
      .reverse()
      .find((item) => item.confidence === "낮음") ??
    detailedReview.itemReviews.at(-1);
  const evidenceBoundary = buildEvidenceBoundaryNote(analysis.result);
  const researchDefense = researchAudit.readyForOutput
    ? `리서치 충분도 ${researchAudit.score}/100(${researchAudit.level})로 산출물 반영이 가능하지만, 출처·기간·비교 기준은 마지막에 확인하세요.`
    : `리서치 충분도 ${researchAudit.score}/100(${researchAudit.level})로 일부 주장은 초안입니다. 보완 액션은 ${researchAudit.minimumActions.slice(0, 3).join(" / ") || "원문, 수치, 출처 추가"}입니다.`;

  return [
    {
      question: `${analysis.projectTitle}에서 가장 먼저 해결해야 한다고 판단한 문제와 그 근거는 무엇이었나요?`,
      followUpQuestions: [
        "다른 문제 후보보다 해당 과제를 우선한 사업적 기준은 무엇인가요?",
        "초기 가설을 수정하게 만든 반대 근거나 예외 사례가 있었나요?",
        "핵심 문제를 잘못 정의했을 가능성을 어떤 데이터로 검증하겠나요?",
      ],
      answerGuide:
        `결론, 판단 근거, 검토한 대안, 본인의 행동, 결과 또는 검증 계획 순서로 답하세요. 분석 리포트의 핵심 문제는 다음과 같습니다: ${problemSummary} 사용한 자료와 비교 기준을 함께 설명해야 ${primarySkill} 역량이 주장보다 근거로 전달됩니다.`,
      weaknessDefense:
        "정량 데이터가 제한적이었다면 확정적 결론처럼 표현하지 마세요. 확인된 사실, 해석한 가설, 추가 검증이 필요한 항목을 구분하고 복수 출처의 교차 검토나 인터뷰 계획을 제시하세요.",
    },
    {
      question: `프로젝트에서 본인이 제안하거나 내린 가장 중요한 전략적 선택은 무엇이었나요?`,
      followUpQuestions: [
        "선택하지 않은 대안과 각 대안의 트레이드오프는 무엇이었나요?",
        "이해관계자의 반대 의견을 어떤 기준과 근거로 조율했나요?",
        "해당 선택이 유효하지 않다고 판단할 중단 기준은 무엇이었나요?",
      ],
      answerGuide:
        `전략 한 가지를 선택해 목표, 대안, 판단 기준, 예상 효과, 검증 지표 순서로 설명하세요. 분석 리포트의 전략 방향은 다음과 같습니다: ${strategySummary} 선택 자체보다 왜 그 선택이 당시 조건에서 합리적이었는지를 보여줘야 ${secondarySkill} 역량이 드러납니다.`,
      weaknessDefense:
        "팀 프로젝트였다면 전체 전략을 본인 단독 성과로 표현하지 말고, 본인이 조사하고 제안하고 합의를 이끈 범위를 구체적으로 한정하세요.",
    },
    {
      question: "실행 또는 제안 과정에서 가장 큰 불확실성과 대응 방법을 설명해 주세요.",
      followUpQuestions: [
        "부족했던 정보가 의사결정에 어떤 리스크를 만들었나요?",
        "예산과 시간이 절반이라면 어떤 가설부터 검증하겠나요?",
        "다시 진행한다면 기준선과 성과 지표를 어떻게 설계하겠나요?",
      ],
      answerGuide:
        `제약 조건, 발생 가능한 영향, 당시 대응, 남은 리스크, 후속 검증 순서로 설명하세요. 현재 확인된 보완점은 다음과 같습니다: ${improvementSummary} 개선안을 나열하기보다 우선순위와 성공 기준까지 제시하세요.`,
      weaknessDefense:
        "프로젝트가 제안 단계에서 끝났다면 실행 성과를 과장하지 말고, 검증하지 못한 항목과 후속 테스트 설계를 분리해 답하세요.",
    },
    {
      question: `이 프로젝트에서 형성한 문제 해결 방식이 지원 직무에서 어떻게 재현될 수 있나요?`,
      followUpQuestions: [
        "입사 후 첫 90일 안에 적용할 수 있는 구체적인 업무 장면은 무엇인가요?",
        "프로젝트 환경과 실제 조직의 데이터·예산·권한 조건은 어떻게 다를까요?",
        "이 역량이 일회성이 아니라는 점을 보여줄 추가 근거는 무엇인가요?",
      ],
      answerGuide:
        `${analysis.competencyTags.slice(0, 3).join(", ")} 중 근거가 가장 강한 두 역량을 지원 기업의 실제 과제와 연결하세요. 경험 자체의 유사성보다 문제 정의, 기준 수립, 실행안 설계, 검증 방식의 재현 가능성을 설명하는 것이 중요합니다.`,
      weaknessDefense:
        "산업 경험이 직접 일치하지 않는 경우 카테고리 지식보다 문제 정의, 데이터 해석, 이해관계자 커뮤니케이션처럼 이전 가능한 역량을 중심으로 답하세요.",
    },
    {
      question: "첨부 자료와 분석 리포트에서 가장 강한 근거와 가장 약한 근거는 무엇이라고 판단하나요?",
      followUpQuestions: [
        "가장 강한 근거가 지원 직무 역량을 어떻게 입증하나요?",
        "약한 근거를 면접에서 질문받으면 어떤 한계와 후속 검증 계획을 말하겠나요?",
        "확인된 사실과 본인의 해석을 어떻게 구분해 설명하겠나요?",
      ],
      answerGuide:
        `${buildConsultantLens(analysis)} 강한 근거는 ${strongestEvidence?.sourceLabel ?? "핵심 분석 항목"}의 ${strongestEvidence?.analysisFocus ?? "근거 항목"}로 설명하고, 약한 근거는 ${weakestEvidence?.sourceLabel ?? "보완 필요 항목"}의 한계를 인정한 뒤 보완 자료와 검증 계획을 제시하세요. ${evidenceBoundary} ${researchDefense}`,
      weaknessDefense:
        `모든 근거를 완벽하다고 말하면 오히려 신뢰도가 낮아집니다. 확인한 범위, 해석한 부분, 아직 검증하지 못한 부분을 분리하고 추가로 확보할 데이터나 피드백을 제시하세요. ${researchDefense}`,
    },
  ];
}

export async function generateInterviewQuestions(
  analysis: ProjectAnalysis,
  workspace?: ProofolioWorkspace,
): Promise<InterviewQuestion[]> {
  return runOpenAiMock({
    task: "interview-question-generation",
    inputSummary: `${analysis.projectTitle} ${analysis.projectType}`,
    resolver: () => buildInterviewQuestions(analysis, workspace),
  });
}
