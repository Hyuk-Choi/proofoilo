import type {
  CoverLetterOutput,
  ProjectAnalysis,
} from "../../types/proofolio";
import type { GenerationOptions } from "./contracts";
import { runOpenAiMock } from "./openai-mock-provider";
import {
  compactSentence,
  firstSentence,
  joinKoreanList,
} from "./shared";

function buildWithinLimit(sentences: string[], characterLimit: number) {
  const normalizedSentences = sentences
    .map((sentence) => compactSentence(sentence))
    .filter(Boolean);
  let result = "";

  for (const sentence of normalizedSentences) {
    const next = result ? `${result} ${sentence}` : sentence;
    if (next.length > characterLimit) break;
    result = next;
  }

  return result || normalizedSentences[0]?.slice(0, characterLimit) || "";
}

export function buildCoverLetterOutput(
  analysis: ProjectAnalysis,
  options: GenerationOptions = {},
): CoverLetterOutput {
  const targetRole = options.targetRole?.trim() || "마케팅 직무";
  const companyName = options.companyName?.trim() || "지원 기업";
  const characterLimit = Math.max(300, options.characterLimit ?? 700);
  const coreSkills = joinKoreanList(analysis.competencyTags.slice(0, 3));
  const problemStatement = firstSentence(analysis.problemDefinition);
  const insightStatement = firstSentence(analysis.keyInsight);
  const strategyStatement = firstSentence(analysis.strategy);
  const executionStatement = firstSentence(analysis.execution);
  const resultStatement = firstSentence(analysis.result);
  const roleStatement = firstSentence(analysis.userRole);
  const improvementStatement = firstSentence(
    analysis.improvementPoints[0] ??
      "핵심 지표와 실행 조건을 구체화해야 합니다.",
  );
  const evidence = Object.values(options.userAnswers ?? {})
    .map((answer) => compactSentence(answer))
    .filter(Boolean);
  const evidenceSentence = evidence.length
    ? `검증 근거로 다음 내용을 확인했습니다. ${evidence
        .slice(0, 2)
        .join(" ")}`
    : "현재 결과는 분석 자료를 기반으로 한 제안 또는 기대효과이며, 실행 후 성과로 표현하기 전 기준 시점·비교 대상·수치를 추가해야 합니다.";

  return {
    motivation: buildWithinLimit(
      [
        `${companyName}에서 고객 과제를 근거 기반의 가설과 실행 우선순위로 전환하는 ${targetRole}로 기여하고자 지원했습니다.`,
        `${analysis.projectTitle} 프로젝트에서 해결해야 할 핵심 과제는 다음과 같았습니다. ${problemStatement}`,
        `저는 이를 아이디어 부족이 아니라 고객 맥락과 경쟁 대안을 평가할 의사결정 기준이 불명확한 문제로 재정의했습니다.`,
        `자료를 동일한 기준으로 비교해 다음 인사이트를 도출했습니다. ${insightStatement}`,
        `이 판단을 바탕으로 다음 전략과 실행안을 설계했습니다. ${strategyStatement} ${executionStatement}`,
        `확인된 결과 또는 기대효과는 다음과 같습니다. ${resultStatement}`,
        evidenceSentence,
        `${coreSkills} 역량을 바탕으로 입사 후에도 사실과 가설, 제안과 성과를 구분하고 고객 반응을 측정 가능한 과제로 구조화하겠습니다.`,
        `${companyName}의 브랜드 방향과 사업 목표를 연결해 팀이 검토하고 실행할 수 있는 선택지를 제시하는 ${targetRole}가 되겠습니다.`,
      ],
      characterLimit,
    ),
    competency: buildWithinLimit(
      [
        `저의 핵심 직무 역량은 ${coreSkills}이며, 강점은 분석 결과를 의사결정 기준과 실행 과제로 연결하는 데 있습니다.`,
        `${analysis.projectTitle}에서 다음 과제를 해결해야 했습니다. ${problemStatement}`,
        `먼저 자료를 시장, 고객, 경쟁, 실행 조건으로 구분해 정보의 우선순위를 정했습니다.`,
        `그 결과 다음 인사이트를 핵심 판단으로 도출했습니다. ${insightStatement}`,
        `이 판단이 보고서에 머물지 않도록 대안과 우선순위를 포함한 전략으로 구체화했습니다. ${strategyStatement}`,
        `실행 단계에서는 담당 과제와 검증 지표가 드러나도록 구체화했습니다. ${executionStatement}`,
        evidenceSentence,
        `확인된 결과 또는 기대효과는 다음과 같습니다. ${resultStatement}`,
        `이 과정에서 정보의 양보다 근거의 관련성과 신뢰도를 우선하고, 문제 정의와 실행안을 하나의 논리로 연결했습니다.`,
        `${targetRole} 업무에서도 고객 행동과 성과 지표를 함께 읽고 우선순위가 명확한 실행안을 제시하겠습니다.`,
      ],
      characterLimit,
    ),
    achievement: buildWithinLimit(
      [
        `${analysis.projectTitle}에서 만든 핵심 성과는 불명확한 과제를 검토 가능한 의사결정 구조로 전환한 것입니다.`,
        `초기 과제는 다음과 같았습니다. ${problemStatement}`,
        `저는 먼저 목표와 판단 기준을 정리한 뒤 관련 자료를 동일한 기준으로 비교했습니다.`,
        `비교 결과 다음 인사이트를 핵심 기회로 정의했습니다. ${insightStatement}`,
        `이 판단을 전략에 반영했습니다. ${strategyStatement}`,
        `실행 과정은 다음과 같습니다. ${executionStatement}`,
        evidenceSentence,
        `확인된 결과 또는 기대효과는 다음과 같습니다. ${resultStatement}`,
        `저의 직접적인 기여는 다음과 같습니다. ${roleStatement}`,
        `특히 문제 정의, 근거 선별, 대안 비교와 실행 우선순위가 하나의 흐름으로 이어지도록 만든 점이 저의 직접 기여입니다.`,
        `이 경험을 바탕으로 ${targetRole} 업무에서도 제한된 정보 안에서 핵심 변수를 찾고 측정 가능한 실행 방향을 제시하겠습니다.`,
      ],
      characterLimit,
    ),
    collaboration: buildWithinLimit(
      [
        `${analysis.projectTitle} 프로젝트에서 저의 역할은 다음과 같았습니다. ${roleStatement}`,
        `협업에서는 개인의 선호보다 고객 문제, 기대 효과, 실행 가능성을 공통 판단 기준으로 삼았습니다.`,
        `서로 다른 의견은 해당 기준에 따라 비교하고, 남은 쟁점은 추가 확인이 필요한 가설로 분리했습니다.`,
        `프로젝트의 핵심 판단은 다음과 같습니다. ${insightStatement}`,
        `합의한 가설을 전략으로 구체화했습니다. ${strategyStatement}`,
        `실행 단계에서는 역할과 산출물을 명확히 했습니다. ${executionStatement}`,
        `의견이 충돌할 때는 선호가 아니라 자료와 목표를 기준으로 선택 이유를 설명했습니다.`,
        evidenceSentence,
        `확인된 결과 또는 기대효과는 다음과 같습니다. ${resultStatement}`,
        `이 방식으로 역할이 다른 구성원도 동일한 목표, 선택 근거와 우선순위를 기준으로 논의할 수 있도록 했습니다.`,
        `${targetRole}로서도 유관 부서의 관점을 빠르게 이해하고, 고객과 성과라는 공통 언어로 협업을 정리하겠습니다.`,
      ],
      characterLimit,
    ),
    growth: buildWithinLimit(
      [
        `${analysis.projectTitle}를 통해 분석의 완성도는 정보량이 아니라 의사결정 가능성으로 판단해야 한다는 기준을 세웠습니다.`,
        `프로젝트의 핵심 과제는 다음과 같았습니다. ${problemStatement}`,
        `자료를 시장, 고객, 경쟁, 실행 조건으로 분류하고 의사결정에 직접 영향을 주는 근거부터 검토했습니다.`,
        `그 결과 다음 결론을 도출했습니다. ${insightStatement}`,
        `결론을 전략과 실행으로 연결했습니다. ${strategyStatement} ${executionStatement}`,
        evidenceSentence,
        `현재는 결과물을 검토할 때 다음 보완 기준을 적용하고 있습니다. ${improvementStatement}`,
        `이후에는 모든 결과물에서 사실과 해석, 제안과 검증 결과를 구분하고 다음 행동을 선택할 수 있는지를 최종 검토 기준으로 적용하고 있습니다.`,
        `앞으로도 가설과 근거를 분리해 점검하며 판단의 정확도와 실행 가능성을 높이는 ${targetRole}가 되겠습니다.`,
      ],
      characterLimit,
    ),
    futurePlan: buildWithinLimit(
      [
        `입사 후에는 ${analysis.competencyTags[0]}과 ${analysis.competencyTags[1] ?? "실행력"} 역량을 활용해 고객 반응과 시장 변화를 검증 가능한 과제로 구조화하겠습니다.`,
        `첫 30일에는 ${companyName}의 핵심 고객, 경쟁 환경, 기존 캠페인 데이터와 팀의 성과 기준을 파악하겠습니다.`,
        `90일 안에는 고객 행동과 메시지 반응을 연결한 우선 가설을 제안하고, 기준선과 검증 지표가 포함된 실행안을 만들겠습니다.`,
        `${analysis.projectTitle}에서 다음 인사이트를 도출한 경험을 실무에 적용하겠습니다. ${insightStatement}`,
        `당시 수립한 전략은 다음과 같습니다. ${strategyStatement}`,
        `실행 단계에서는 분석 자료를 구체적인 메시지와 채널 운영안으로 전환하겠습니다. 프로젝트에서의 실행 방식은 다음과 같습니다. ${executionStatement}`,
        `또한 결과를 단발성 성과로 판단하지 않고 가설, 실행, 검증 결과를 기록해 다음 의사결정에 재사용할 수 있도록 만들겠습니다.`,
        evidenceSentence,
        `중기적으로는 브랜드 방향과 성과 데이터를 함께 해석해 유관 부서가 신뢰할 수 있는 선택지를 제시하는 ${targetRole}가 되겠습니다.`,
        `장기적으로는 ${companyName}의 고객 경험과 사업 성과를 연결하는 의사결정 체계를 설계하겠습니다.`,
      ],
      characterLimit,
    ),
  };
}

export async function generateCoverLetter(
  analysis: ProjectAnalysis,
  options: GenerationOptions = {},
): Promise<CoverLetterOutput> {
  return runOpenAiMock({
    task: "cover-letter-generation",
    inputSummary: `${analysis.projectTitle} ${options.targetRole ?? ""}`,
    resolver: () => buildCoverLetterOutput(analysis, options),
  });
}
