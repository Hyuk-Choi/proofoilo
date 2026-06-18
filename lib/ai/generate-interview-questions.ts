import type {
  InterviewQuestion,
  ProjectAnalysis,
} from "../../types/proofolio";
import { runOpenAiMock } from "./openai-mock-provider";
import { firstSentence } from "./shared";

export function buildInterviewQuestions(
  analysis: ProjectAnalysis,
): InterviewQuestion[] {
  const primarySkill = analysis.competencyTags[0] ?? "문제 해결";
  const secondarySkill = analysis.competencyTags[1] ?? "기획력";
  const problemSummary = firstSentence(analysis.problemDefinition);
  const strategySummary = firstSentence(analysis.strategy);
  const improvementSummary = firstSentence(
    analysis.improvementPoints[0] ?? "근거가 부족했던 지점",
  );

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
  ];
}

export async function generateInterviewQuestions(
  analysis: ProjectAnalysis,
): Promise<InterviewQuestion[]> {
  return runOpenAiMock({
    task: "interview-question-generation",
    inputSummary: `${analysis.projectTitle} ${analysis.projectType}`,
    resolver: () => buildInterviewQuestions(analysis),
  });
}
