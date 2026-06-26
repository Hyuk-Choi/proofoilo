import type {
  ProjectAnalysis,
  ResumeBullet,
} from "../../types/proofolio";
import { buildEvidenceBoundaryNote } from "./consultant-standards";
import { runOpenAiMock } from "./openai-mock-provider";
import {
  compactSentence,
  sentenceFragment,
} from "./shared";

function createResumeBulletCopy(analysis: ProjectAnalysis) {
  const projectTitle = analysis.projectTitle;
  const problem = sentenceFragment(analysis.problemDefinition);
  const insight = sentenceFragment(analysis.keyInsight);
  const strategy = sentenceFragment(analysis.strategy);
  const execution = sentenceFragment(analysis.execution);
  const result = sentenceFragment(analysis.result);
  const role = sentenceFragment(analysis.userRole);

  if (analysis.projectType.includes("글로벌 브랜드")) {
    return [
      `${projectTitle}에서 국내 프리미엄 아웃도어 시장의 경쟁 구도와 소비자 구매 맥락을 비교해 핵심 진입 과제와 판단 기준 정의`,
      `원산지 스토리보다 국내 사용 장면과의 연결이 구매 판단을 강화한다는 인사이트를 도출해 차별화 포지셔닝 수립`,
      `브랜드 정체성을 국내 고객 언어로 번역하고 제품군·채널·커뮤니케이션 우선순위를 포함한 시장 진입 로드맵 제안`,
      `시장·경쟁 조사, 고객 세그먼트 정의와 런칭 메시지 구조화를 담당하고 제안 효과와 실행 성과를 구분한 검증 항목 명시`,
    ];
  }

  if (
    analysis.projectType.includes("퍼포먼스 마케팅") ||
    analysis.projectType.includes("광고 소재")
  ) {
    return [
      `${projectTitle}에서 타깃별 피부 고민과 구매 여정을 분석해 광고 클릭 이후 전환을 저해하는 메시지 단절 요인 정의`,
      `소재별 CTR·CPC와 메시지 반응을 동일 기준으로 비교해 고반응 요소와 저성과 원인을 구분`,
      `자기관리·간편 루틴·선물 적합성의 메시지 축을 광고 후킹 포인트와 랜딩페이지 정보 위계 개선안으로 전환`,
      `타깃 정의, 소재 분류와 메시지 가설 수립을 담당하고 전환율·랜딩 행동 지표와 테스트 조건을 후속 KPI로 제시`,
    ];
  }

  if (
    analysis.projectType.includes("콘텐츠 마케팅") ||
    analysis.projectType.includes("트렌드 리서치")
  ) {
    return [
      `${projectTitle}에서 국내외 기사와 리포트를 교차 검토해 독자가 우선 이해해야 할 핵심 쟁점과 콘텐츠 선정 기준 정의`,
      `독자 이탈 원인을 이슈의 현재 의미 부족으로 정의하고 문제 제기·근거·사례·시사점의 카드뉴스 정보 구조 설계`,
      `주제 선정, 자료 검증, 원고 구조화와 발행 일정을 반복 가능한 콘텐츠 운영 프로세스로 표준화`,
      `콘텐츠별 조회·저장·공유 지표를 주제와 연결해 편집 판단과 채널 성과를 함께 검증할 측정 기준 제안`,
    ];
  }

  if (analysis.projectType.includes("자기소개서")) {
    return [
      `지원 직무와 프로젝트 경험의 연결성을 분석해 자기소개서의 핵심 직무 역량과 주장 정의`,
      `경험을 문제, 행동, 결과 순서로 재구성해 문항별 메시지의 설득력과 구체성 강화`,
      `추상적 표현을 검토 가능한 역할과 근거 중심 문장으로 전환해 경험의 신뢰도 향상`,
      `문항 분석부터 사례 선별, 초안 작성과 퇴고 기준 수립까지 자기소개서 개선 과정 구조화`,
    ];
  }

  return [
    `${projectTitle}의 핵심 문제를 고객·사업·실행 관점으로 구조화: ${problem}`,
    `${analysis.competencyTags.slice(0, 2).join(" 및 ")} 관점의 판단 근거와 전략 방향 도출: ${insight} ${strategy}`,
    `담당자·우선순위·검증 지표가 포함된 실행 과제로 구체화: ${execution}`,
    `직접 기여 범위는 ${role}이며 결과를 ${result}로 정리하고 실제 성과와 기대효과를 구분`,
  ];
}

export function buildResumeBullets(
  analysis: ProjectAnalysis,
): ResumeBullet[] {
  const evidenceBoundary = buildEvidenceBoundaryNote(
    `${analysis.result} ${analysis.userRole}`,
  );

  return [
    {
      title: `${analysis.projectTitle} | ${analysis.projectType}`,
      bullets: [
        ...createResumeBulletCopy(analysis).map(compactSentence),
        compactSentence(
          `성과 해석 단계에서 확정 성과와 기대효과를 구분하고, ${evidenceBoundary}`,
        ),
      ],
      keywords: [
        ...analysis.competencyTags,
        "문제 정의",
        "근거 검증",
        "실행안 도출",
      ],
    },
  ];
}

export async function generateResumeBullets(
  analysis: ProjectAnalysis,
): Promise<ResumeBullet[]> {
  return runOpenAiMock({
    task: "resume-bullet-generation",
    inputSummary: `${analysis.projectTitle} ${analysis.projectType}`,
    resolver: () => buildResumeBullets(analysis),
  });
}
