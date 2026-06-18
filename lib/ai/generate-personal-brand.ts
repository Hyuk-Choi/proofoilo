import type {
  PersonalBrandProfile,
  ProjectAnalysis,
} from "../../types/proofolio";
import { runOpenAiMock } from "./openai-mock-provider";
import {
  firstSentence,
  joinKoreanList,
} from "./shared";

type PersonalBrandOptions = {
  name?: string;
  targetRole?: string;
};

const competencyPriority = [
  "시장 분석",
  "인사이트 도출",
  "브랜드 포지셔닝",
  "전략 기획",
  "타깃 분석",
  "글로벌 마케팅",
  "CTR/CPC 분석",
  "콘텐츠 구조화",
  "커뮤니케이션 전략",
  "광고 소재 기획",
] as const;

function rankCompetencies(analyses: ProjectAnalysis[]) {
  const counts = new Map<string, number>();
  const firstSeen = new Map<string, number>();
  let order = 0;

  analyses.forEach((analysis) => {
    analysis.competencyTags.forEach((tag) => {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
      if (!firstSeen.has(tag)) firstSeen.set(tag, order);
      order += 1;
    });
  });

  return [...counts.entries()]
    .sort((a, b) => {
      const countDifference = b[1] - a[1];
      if (countDifference) return countDifference;

      const aPriority = competencyPriority.indexOf(
        a[0] as (typeof competencyPriority)[number],
      );
      const bPriority = competencyPriority.indexOf(
        b[0] as (typeof competencyPriority)[number],
      );
      const normalizedAPriority = aPriority === -1 ? 999 : aPriority;
      const normalizedBPriority = bPriority === -1 ? 999 : bPriority;

      return (
        normalizedAPriority - normalizedBPriority ||
        (firstSeen.get(a[0]) ?? 999) - (firstSeen.get(b[0]) ?? 999)
      );
    })
    .map(([name]) => name);
}

function describeStrength(skill: string) {
  if (/분석|리서치|CTR|CPC/.test(skill)) {
    return "분산된 시장·고객·성과 자료를 동일한 기준으로 비교하고, 의사결정에 필요한 핵심 변수와 우선순위를 도출합니다.";
  }

  if (/브랜드|포지셔닝|글로벌/.test(skill)) {
    return "브랜드가 보유한 자산을 고객의 실제 선택 이유로 번역하고, 경쟁 대안과 구별되는 메시지와 진입 방향을 설계합니다.";
  }

  if (/콘텐츠|카드뉴스|커뮤니케이션/.test(skill)) {
    return "복잡한 정보를 독자의 이해 흐름에 맞게 재구성하고, 핵심 메시지가 행동으로 이어지도록 콘텐츠 구조를 설계합니다.";
  }

  if (/광고|랜딩|타깃/.test(skill)) {
    return "타깃의 문제와 반응 지표를 연결해 광고 메시지, 소재와 랜딩페이지의 개선 우선순위를 구체화합니다.";
  }

  return "문제를 구조화하고 실행 가능한 기준과 산출물로 전환해 팀이 다음 행동을 선택할 수 있도록 만듭니다.";
}

function inferTargetRoles(analyses: ProjectAnalysis[], targetRole: string) {
  const roles = new Set<string>([targetRole]);

  analyses.forEach((analysis) => {
    if (analysis.projectType.includes("글로벌 브랜드")) {
      roles.add("글로벌 마케터");
      roles.add("브랜드 전략 마케터");
    }
    if (analysis.projectType.includes("퍼포먼스")) {
      roles.add("퍼포먼스 마케터");
      roles.add("그로스 마케터");
    }
    if (analysis.projectType.includes("콘텐츠")) {
      roles.add("콘텐츠 마케터");
      roles.add("브랜드 콘텐츠 기획자");
    }
    if (analysis.projectType.includes("일반 마케팅")) {
      roles.add("마케팅 기획자");
    }
  });

  return [...roles].slice(0, 5);
}

export function buildPersonalBrandProfile(
  analyses: ProjectAnalysis[],
  options: PersonalBrandOptions = {},
): PersonalBrandProfile {
  const name = options.name?.trim() || "지원자";
  const targetRole = options.targetRole?.trim() || "브랜드 전략 마케터";
  const rankedSkills = rankCompetencies(analyses);
  const primarySkill = rankedSkills[0] ?? "시장 분석";
  const secondarySkill = rankedSkills[1] ?? "전략 기획";
  const projectTitles = analyses.slice(0, 3).map((analysis) => analysis.projectTitle);
  const strengths = rankedSkills.slice(0, 3).map((skill) => ({
    title: skill,
    description: `${describeStrength(skill)} ${
      analyses.filter((analysis) => analysis.competencyTags.includes(skill))
        .length >= 2
        ? "서로 다른 프로젝트에서 반복 확인되어 재현 가능성이 높은 역량입니다."
        : "현재는 단일 프로젝트 근거이므로 추가 사례나 성과 지표로 재현 가능성을 보강해야 합니다."
    }`,
    evidenceProjects: analyses
      .filter((analysis) => analysis.competencyTags.includes(skill))
      .map((analysis) => analysis.projectTitle)
      .slice(0, 3),
  }));

  return {
    name,
    targetRole,
    headline: `${primarySkill}과 ${secondarySkill}을 기반으로 시장 신호를 검증 가능한 전략 과제로 전환하는 ${targetRole}`,
    positioning:
      "고객과 시장의 핵심 문제를 정의하고, 선택 근거와 실행 우선순위를 함께 제시하는 전략형 마케터로 포지셔닝합니다. 분석 결과를 설명에 머물게 하지 않고 메시지, 채널, 콘텐츠 또는 성과 지표로 연결하는 역량을 핵심 차별점으로 설정합니다.",
    professionalSummary:
      `검토한 ${analyses.length}개 프로젝트에서 시장, 고객, 경쟁과 성과 자료를 구조화하고 문제 정의부터 전략·실행안까지 연결한 경험이 확인됩니다. ` +
      `${joinKoreanList(rankedSkills.slice(0, 4))} 역량이 주요 강점 후보이며, 반복 사례와 수치 근거가 확보된 항목부터 핵심 경쟁력으로 제시하는 것이 적절합니다.`,
    valueProposition:
      "불명확한 과제를 고객과 사업 관점의 의사결정 문제로 재정의하고, 근거의 강도와 한계를 구분해 팀이 검토·실행·측정할 수 있는 전략으로 전환합니다.",
    strengths,
    keywords: [...new Set([...rankedSkills, "문제 정의", "근거 중심 기획"])]
      .slice(0, 10),
    targetRoles: inferTargetRoles(analyses, targetRole),
    interviewIntroduction:
      `안녕하세요. 저는 ${primarySkill}과 ${secondarySkill}을 기반으로 고객의 선택 이유를 구조화하는 ${targetRole} ${name}입니다. ` +
      `${projectTitles.length ? `${joinKoreanList(projectTitles)} 프로젝트를 수행하며 ` : ""}` +
      "시장과 고객 자료에서 핵심 과제를 정의하고, 대안을 비교해 포지셔닝·메시지·실행 우선순위로 연결해 왔습니다. " +
      `대표적으로 ${firstSentence(analyses[0]?.userRole ?? "문제 정의부터 실행안 구조화까지 담당했습니다.")} ` +
      "입사 후에도 가설과 사실, 제안과 성과를 구분하는 분석 방식으로 의사결정의 정확도와 실행 속도를 높이겠습니다.",
    generatedAt: new Date().toISOString(),
    sourceAnalysisIds: analyses.map((analysis) => analysis.id),
  };
}

export async function generatePersonalBrand(
  analyses: ProjectAnalysis[],
  options: PersonalBrandOptions = {},
): Promise<PersonalBrandProfile> {
  return runOpenAiMock({
    task: "personal-brand-generation",
    inputSummary: `${analyses.length} analyses ${options.targetRole ?? ""}`,
    resolver: () => buildPersonalBrandProfile(analyses, options),
  });
}
