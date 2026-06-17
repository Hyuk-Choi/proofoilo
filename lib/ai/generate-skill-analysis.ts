import type {
  ProjectAnalysis,
  SkillAnalysisReport,
  SkillInsight,
  SkillLevel,
} from "../../types/proofolio";
import {
  clampScore,
  firstSentence,
  hasQuantitativeEvidence,
  simulateAiDelay,
} from "./shared";

const categoryDefinitions = [
  {
    name: "시장·데이터 분석",
    pattern: /분석|리서치|CTR|CPC|인사이트/,
    description: "자료를 비교하고 핵심 변수와 판단 근거를 도출하는 능력",
  },
  {
    name: "브랜드·전략 기획",
    pattern: /브랜드|포지셔닝|전략|기획|글로벌/,
    description: "고객 문제를 차별화 방향과 실행 우선순위로 전환하는 능력",
  },
  {
    name: "콘텐츠·커뮤니케이션",
    pattern: /콘텐츠|카드뉴스|커뮤니케이션|메시지/,
    description: "복잡한 정보를 이해하기 쉬운 메시지와 구조로 전달하는 능력",
  },
  {
    name: "실행·성과 개선",
    pattern: /광고|랜딩|실행|문제 해결|타깃/,
    description: "전략을 구체적인 산출물과 개선 행동으로 연결하는 능력",
  },
] as const;

const skillPriority = [
  "시장 분석",
  "인사이트 도출",
  "브랜드 포지셔닝",
  "타깃 분석",
  "글로벌 마케팅",
  "CTR/CPC 분석",
  "콘텐츠 구조화",
  "커뮤니케이션 전략",
  "광고 소재 기획",
  "랜딩페이지 개선",
] as const;

function getSkillPriority(name: string) {
  const index = skillPriority.indexOf(
    name as (typeof skillPriority)[number],
  );
  return index === -1 ? 999 : index;
}

function getSkillLevel(score: number): SkillLevel {
  if (score >= 88) return "핵심 경쟁력";
  if (score >= 78) return "강점";
  if (score >= 68) return "활용";
  return "기초";
}

function buildSkillInsights(analyses: ProjectAnalysis[]): SkillInsight[] {
  const skills = new Map<string, ProjectAnalysis[]>();

  analyses.forEach((analysis) => {
    analysis.competencyTags.forEach((tag) => {
      skills.set(tag, [...(skills.get(tag) ?? []), analysis]);
    });
  });

  return [...skills.entries()]
    .map(([name, relatedAnalyses]) => {
      const projectTypeCount = new Set(
        relatedAnalyses.map((analysis) => analysis.projectType),
      ).size;
      const roleEvidence = relatedAnalyses.some((analysis) =>
        /담당|정의|설계|도출|비교|작성|운영|수립|제안/.test(
          analysis.userRole,
        ),
      );
      const quantitativeEvidence = relatedAnalyses.some((analysis) =>
        hasQuantitativeEvidence(
          `${analysis.result} ${analysis.userRole}`,
        ),
      );
      const score = clampScore(
        58 +
          relatedAnalyses.length * 8 +
          Math.min(6, projectTypeCount * 2) +
          (roleEvidence ? 5 : 0) +
          (quantitativeEvidence ? 7 : 0),
        55,
        93,
      );

      return {
        name,
        score,
        level: getSkillLevel(score),
        projectCount: relatedAnalyses.length,
        evidence: relatedAnalyses
          .map(
            (analysis) =>
              `${analysis.projectTitle} | 역할: ${firstSentence(analysis.userRole)} | 결과: ${firstSentence(analysis.result)}`,
          )
          .slice(0, 3),
        improvement:
          relatedAnalyses[0]?.improvementPoints[0] ??
          "성과를 판단할 수 있는 수치와 비교 기준을 추가하면 역량의 신뢰도가 높아집니다.",
      };
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.projectCount - a.projectCount ||
        getSkillPriority(a.name) - getSkillPriority(b.name),
    );
}

export function buildSkillAnalysisReport(
  analyses: ProjectAnalysis[],
): SkillAnalysisReport {
  const skills = buildSkillInsights(analyses);
  const overallScore = skills.length
    ? Math.round(
        skills.slice(0, 6).reduce((total, skill) => total + skill.score, 0) /
          Math.min(skills.length, 6),
      )
    : 0;
  const categories = categoryDefinitions.map((category) => {
    const matchedSkills = skills.filter((skill) =>
      category.pattern.test(skill.name),
    );
    const score = matchedSkills.length
      ? Math.round(
          matchedSkills.reduce((total, skill) => total + skill.score, 0) /
            matchedSkills.length,
        )
      : 55;

    return {
      name: category.name,
      score,
      description: category.description,
    };
  });
  const topStrengths = skills.slice(0, 3).map(
    (skill) =>
      `${skill.name}: ${skill.projectCount}개 프로젝트 근거를 기준으로 ${skill.level} 단계로 평가했습니다. ${
        skill.projectCount >= 2
          ? "반복 적용 사례가 확인됩니다."
          : "추가 프로젝트 또는 정량 성과가 확보되면 재현 가능성을 더 강하게 입증할 수 있습니다."
      }`,
  );
  const developmentPriorities = skills.length
    ? [...skills]
        .sort(
          (a, b) =>
            a.score - b.score ||
            getSkillPriority(a.name) - getSkillPriority(b.name),
        )
        .slice(0, 2)
        .map(
          (skill) =>
            `${skill.name}: ${skill.improvement}`,
        )
    : ["분석 리포트를 생성하면 역량별 보완 우선순위를 확인할 수 있습니다."];

  return {
    overallScore,
    summary:
      `현재 ${analyses.length}개 프로젝트에서 ${skills.length}개의 직무 역량이 확인됩니다. ` +
      `상위 역량은 ${skills
        .slice(0, 3)
        .map((skill) => skill.name)
        .join(", ")}입니다. 점수는 프로젝트 반복성, 역할의 구체성, 프로젝트 유형의 다양성, 정량 근거 여부를 반영했으며 단일 사례는 핵심 경쟁력으로 과대평가하지 않았습니다.`,
    skills,
    categories,
    topStrengths,
    developmentPriorities,
    generatedAt: new Date().toISOString(),
    sourceAnalysisIds: analyses.map((analysis) => analysis.id),
  };
}

export async function generateSkillAnalysis(
  analyses: ProjectAnalysis[],
): Promise<SkillAnalysisReport> {
  await simulateAiDelay();
  return buildSkillAnalysisReport(analyses);
}
