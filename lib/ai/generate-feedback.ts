import type {
  CoverLetterOutput,
  FeedbackScore,
  PortfolioOutput,
  ProjectAnalysis,
} from "../../types/proofolio";
import {
  buildConsultingComment,
  clampScore,
  hasQuantitativeEvidence,
  sentenceFragment,
  simulateAiDelay,
} from "./shared";

export function buildFeedbackScore(
  analysis: ProjectAnalysis,
  portfolio?: PortfolioOutput,
  coverLetter?: CoverLetterOutput,
  userAnswers: Record<string, string> = {},
): FeedbackScore {
  const problemSummary = sentenceFragment(analysis.problemDefinition);
  const roleSummary = sentenceFragment(analysis.userRole);
  const insightSummary = sentenceFragment(analysis.keyInsight);
  const strategySummary = sentenceFragment(analysis.strategy);
  const resultSummary = sentenceFragment(analysis.result);
  const answeredEvidence = Object.values(userAnswers).filter(
    (answer) => answer.trim().length > 0,
  );
  const evidenceText = [
    analysis.result,
    analysis.userRole,
    ...answeredEvidence,
  ].join(" ");
  const metricEvidence = hasQuantitativeEvidence(evidenceText);
  const outcomeEvidence =
    /(?:(?:CTR|CPC|CVR|ROAS|전환율|매출|도달|조회|저장|공유|완독률)[^\d]{0,12}\d[\d,.]*\s*%?|(?:증가|감소|개선|절감|단축)[^\d]{0,8}\d[\d,.]*\s*(?:%|배|원|일|주|개월))/i.test(
      evidenceText,
    );
  const roleSpecificity = /담당|정의|설계|도출|비교|작성|운영|수립/.test(
    analysis.userRole,
  );
  const scores = {
    jobFit: clampScore(76 + Math.min(10, analysis.competencyTags.length * 2)),
    problemClarity: clampScore(
      75 + (analysis.problemDefinition.length >= 70 ? 7 : 3),
    ),
    roleClarity: clampScore(70 + (roleSpecificity ? 10 : 3)),
    evidenceStrength: clampScore(
      54 +
        answeredEvidence.length * 4 +
        (metricEvidence ? 7 : 0) +
        (outcomeEvidence ? 10 : 0),
      55,
      90,
    ),
    differentiation: clampScore(
      72 + (analysis.keyInsight.length >= 70 ? 8 : 4),
    ),
    writingPersuasiveness: clampScore(
      75 + (coverLetter || portfolio ? 7 : 3),
    ),
    portfolioFlow: clampScore(73 + (portfolio ? 9 : coverLetter ? 6 : 3)),
  };
  const values = Object.values(scores);
  const totalScore = Math.round(
    values.reduce((total, score) => total + score, 0) / values.length,
  );

  return {
    ...scores,
    totalScore,
    comments: [
      buildConsultingComment(
        `${analysis.competencyTags.slice(0, 2).join(", ")} 역량은 확인되지만 지원 직무의 핵심 KPI와 직접 연결된 문장이 부족합니다.`,
        "경험의 관련성은 보이지만 입사 후 어떤 업무 성과로 전환될지 채용 담당자가 추가로 해석해야 합니다.",
        `지원 직무의 대표 과업 하나를 지정하고, "${analysis.competencyTags[0]}" 역량이 해당 과업의 품질·속도·성과를 어떻게 개선하는지 한 문장으로 연결하세요.`,
      ),
      buildConsultingComment(
        `문제 정의에 고객 현상과 사업 과제가 함께 포함되어 핵심 쟁점이 분산됩니다. 현재 핵심 문장은 "${problemSummary}"입니다.`,
        "첫 화면에서 의사결정 대상이 즉시 드러나지 않아 이후 전략의 타당성을 판단하는 속도가 느려집니다.",
        "고객이 겪는 문제, 사업에 미치는 영향, 이번 프로젝트에서 결정해야 할 항목을 각각 한 문장으로 분리하세요.",
      ),
      buildConsultingComment(
        roleSpecificity
          ? `본인의 수행 범위는 확인되지만 의사결정 권한과 최종 산출물의 경계가 충분히 구분되지 않았습니다.`
          : "팀 활동과 본인의 직접 기여를 구분할 수 있는 행동 동사가 부족합니다.",
        "역할이 불명확하면 좋은 전략도 팀 전체 성과로 인식되어 개인 역량의 증거력이 낮아집니다.",
        `"${roleSummary}" 뒤에 본인이 직접 결정한 기준, 단독 작성한 산출물, 합의를 이끈 범위를 각각 명시하세요.`,
      ),
      answeredEvidence.length
        ? buildConsultingComment(
            `보완 답변 ${answeredEvidence.length}개를 검토했습니다. ${
              outcomeEvidence
                ? "일부 성과 수치의 비교 기준과 출처가 분리되어 있습니다."
                : metricEvidence
                  ? "조사 범위 수치는 확인되지만 실행 결과를 입증할 성과 지표가 없습니다."
                : "정량 지표가 없어 근거의 강도를 객관적으로 판단하기 어렵습니다."
            }`,
            "주장과 증거가 떨어져 있으면 실제 성과보다 서술의 완성도로 평가될 위험이 있습니다.",
            "각 결과 문장 바로 뒤에 기준 시점, 비교 대상, 수치, 출처를 붙이고 제안 단계의 기대효과와 실행 후 확인된 성과를 구분하세요.",
          )
        : buildConsultingComment(
            "현재 결과가 정성적 기대효과 중심이며 조사 범위와 성과 기준이 확인되지 않습니다.",
            "검증되지 않은 결과를 성과로 표현하면 문서 전체의 신뢰도가 낮아집니다.",
            `"${analysis.missingQuestions[0] ?? "분석 범위와 성과 지표는 무엇인가요?"}"에 답한 뒤 수치, 비교 기준, 출처를 결과 섹션에 반영하세요.`,
          ),
      buildConsultingComment(
        `"${insightSummary}"는 전략 방향과 연결되지만 기존 접근과의 차이가 명시되지 않았습니다.`,
        "대안 비교가 없으면 인사이트가 일반적인 마케팅 원칙으로 읽힐 수 있습니다.",
        "기존 접근 또는 경쟁 대안 한 가지를 제시하고, 왜 해당 대안을 제외했는지 판단 기준과 예상 효과를 함께 설명하세요.",
      ),
      coverLetter
        ? buildConsultingComment(
            "문제-행동-결과 구조는 유지되지만 문항별 도입부와 결론의 기능이 유사합니다.",
            "여러 문항을 연속해서 읽을 때 동일 경험을 반복 설명한다는 인상을 줄 수 있습니다.",
            "지원동기는 기업 과제, 직무역량은 판단 기준, 성과경험은 결과, 협업경험은 조율 메커니즘을 첫 문장에 배치해 문항별 역할을 분리하세요.",
          )
        : buildConsultingComment(
            "핵심 행동보다 배경과 설명이 먼저 배치된 문장이 있어 기여도를 찾는 데 시간이 걸립니다.",
            "검토 시간이 짧은 채용 환경에서는 주요 행동과 결과가 뒤에 있을수록 평가에서 누락될 가능성이 높습니다.",
            "각 문단을 행동-근거-효과 순서로 재배치하고 한 문장에는 하나의 판단만 남기세요.",
          ),
      portfolio
        ? buildConsultingComment(
            "문제-인사이트-전략-실행 순서는 갖췄지만 섹션 사이의 의사결정 연결문이 부족합니다.",
            "독자는 무엇을 조사했는지는 이해해도 왜 해당 전략을 선택했는지 추론해야 합니다.",
            "각 섹션 끝에 '이 근거로 무엇을 선택했고 무엇을 제외했는가'를 한 줄로 추가하고, 첫 화면에는 역할·핵심 결정·검증 상태를 요약하세요.",
          )
        : buildConsultingComment(
            "분석 자료와 본인의 직접 기여, 제안 결과와 실행 성과가 같은 위계로 제시되어 있습니다.",
            "근거의 성격이 섞이면 프로젝트의 실제 완성도와 본인의 책임 범위를 과대 해석할 수 있습니다.",
            "최종 포트폴리오에서 사실, 해석, 제안, 검증 결과를 시각적으로 구분하고 첫 화면에 핵심 결정과 역할을 배치하세요.",
          ),
    ],
    revisionSuggestions: [
      `기존: 시장과 고객을 분석해 전략을 제안했습니다.\n컨설턴트 수정안: ${roleSummary}. 이 과정에서 적용한 비교 기준과 최종 의사결정 항목을 함께 명시하세요.`,
      `기존: 프로젝트를 통해 의미 있는 결과를 만들었습니다.\n컨설턴트 수정안: ${resultSummary}. 단, 실행 전 제안 결과인지 실행 후 확인된 성과인지 구분하고 기준 시점·비교 대상·수치를 추가하세요.`,
      `논리 연결 수정안: "${insightSummary}"를 근거로 "${strategySummary}"를 선택했습니다. 대안 대비 우위와 검증할 KPI를 이어서 제시하세요.`,
    ],
  };
}

export async function generateFeedback(
  analysis: ProjectAnalysis,
  portfolio?: PortfolioOutput,
  coverLetter?: CoverLetterOutput,
  userAnswers: Record<string, string> = {},
): Promise<FeedbackScore> {
  await simulateAiDelay();
  return buildFeedbackScore(
    analysis,
    portfolio,
    coverLetter,
    userAnswers,
  );
}
