import { createPositioningInterpretation, getPositioningAxis } from "@/lib/positioning";
import {
  createUsp,
  getCompetitorThreatScore,
  getTargetFitScore,
  getTopCompetitor,
  getTopTarget,
} from "@/lib/scoring";
import type { WorkspaceState } from "@/types/market";

export type ReportTone = "ppt" | "detailed" | "client";

export type ReportSectionId =
  | "overview"
  | "target"
  | "persona"
  | "competitors"
  | "positioning"
  | "opportunity"
  | "usp"
  | "message"
  | "execution";

export type ReportSection = {
  id: ReportSectionId;
  eyebrow: string;
  title: string;
  summary: string;
  bullets: string[];
};

export type StrategyReport = {
  title: string;
  subtitle: string;
  executiveSummary: string;
  sections: ReportSection[];
  markdown: string;
};

export const reportToneOptions: Array<{
  id: ReportTone;
  label: string;
  description: string;
}> = [
  {
    id: "ppt",
    label: "간결한 PPT용",
    description: "슬라이드에 바로 사용할 수 있는 핵심 문장 중심",
  },
  {
    id: "detailed",
    label: "상세 분석용",
    description: "판단 근거와 시장 맥락을 포함한 분석 문장 중심",
  },
  {
    id: "client",
    label: "클라이언트 보고용",
    description: "제안 배경과 권고안을 정돈한 공식 보고 문체",
  },
];

const toneLabel: Record<ReportTone, string> = {
  ppt: "간결한 PPT용",
  detailed: "상세 분석용",
  client: "클라이언트 보고용",
};

function firstItem(value: string, fallback: string) {
  return value.split(/[,\n]/)[0]?.trim() || fallback;
}

function ageMidpoint(ageRange: string) {
  const ages = ageRange.match(/\d+/g)?.map(Number) ?? [];
  if (!ages.length) return "30대 후반";
  if (ages.length === 1) return `${ages[0]}세`;
  return `${Math.round((ages[0] + ages[1]) / 2)}세`;
}

function compactBullets(items: string[], tone: ReportTone) {
  return tone === "ppt" ? items.slice(0, 3) : items;
}

function adaptPositioningTone(value: string, tone: ReportTone) {
  if (tone === "client") return value;

  return value
    .replaceAll("입니다.", "임.")
    .replaceAll("있습니다.", "있음.")
    .replaceAll("해야 합니다.", "할 필요가 있음.")
    .replaceAll("중요합니다.", "중요함.");
}

function sectionToMarkdown(section: ReportSection, index: number) {
  return `## ${index + 1}. ${section.title}
${section.summary}

${section.bullets.map((bullet) => `- ${bullet}`).join("\n")}`;
}

function applyClientTone(section: ReportSection): ReportSection {
  const convert = (value: string) =>
    value
      .replaceAll("판단됨", "판단됩니다")
      .replaceAll("필요가 있음", "필요가 있습니다")
      .replaceAll("적합함", "적합합니다")
      .replaceAll("나타남", "나타납니다")
      .replaceAll("설정됨", "설정됩니다")
      .replaceAll("정리됨", "정리됩니다")
      .replaceAll("요약됨", "요약됩니다")
      .replaceAll("확인됨", "확인됩니다")
      .replaceAll("상태임", "상태입니다")
      .replaceAll("요인임", "요인입니다")
      .replaceAll("제안임", "제안입니다")
      .replaceAll("중요함", "중요합니다")
      .replaceAll("활용 가능함", "활용할 수 있습니다")
      .replaceAll("얻고자 함", "얻고자 합니다")
      .replaceAll("경향이 있음", "경향이 있습니다")
      .replaceAll("설정할 수 있음", "설정할 수 있습니다")
      .replaceAll("운영되고 있음", "운영되고 있습니다")
      .replaceAll("설정되어 있음", "설정되어 있습니다")
      .replaceAll("목표는 다음과 같음", "목표는 다음과 같습니다")
      .replaceAll("집중되어 있음", "집중되어 있습니다")
      .replaceAll("구성하는 전략이 적합합니다", "구성하는 방향이 적합합니다")
      .replaceAll("제안함", "제안합니다")
      .replaceAll("운영할 필요가 있습니다", "운영하는 것을 권고합니다");

  return {
    ...section,
    summary: convert(section.summary),
    bullets: section.bullets.map(convert),
  };
}

export function createStrategyReport(
  workspace: WorkspaceState,
  tone: ReportTone,
): StrategyReport {
  const { project, targets, competitors, positioning } = workspace;
  const sortedTargets = [...targets].sort(
    (a, b) => getTargetFitScore(b) - getTargetFitScore(a),
  );
  const sortedCompetitors = [...competitors].sort(
    (a, b) => getCompetitorThreatScore(b) - getCompetitorThreatScore(a),
  );
  const topTarget = getTopTarget(targets);
  const topCompetitor = getTopCompetitor(competitors);
  const targetScore = topTarget ? getTargetFitScore(topTarget) : 0;
  const competitorScore = topCompetitor
    ? getCompetitorThreatScore(topCompetitor)
    : 0;
  const averageThreat = competitors.length
    ? Math.round(
        competitors.reduce(
          (sum, competitor) => sum + getCompetitorThreatScore(competitor),
          0,
        ) / competitors.length,
      )
    : 0;
  const opportunityScore = Math.min(
    100,
    Math.max(0, Math.round(targetScore - averageThreat / 2 + 35)),
  );
  const positioningInterpretation = createPositioningInterpretation(
    project,
    positioning,
    competitors,
  );
  const xAxis = getPositioningAxis(positioning.xAxisId);
  const yAxis = getPositioningAxis(positioning.yAxisId);
  const usp = positioning.brand.usp || createUsp(project, targets, competitors);
  const targetName = topTarget?.segmentName || project.currentTarget;
  const targetPain = firstItem(topTarget?.painPoints || "", "핵심 고객 문제");
  const targetMotivation = firstItem(
    topTarget?.purchaseMotivation || "",
    "명확한 구매 효익",
  );
  const targetBarrier = firstItem(
    topTarget?.purchaseBarriers || "",
    "구매 확신 부족",
  );
  const targetChannel = firstItem(
    topTarget?.mediaChannels || "",
    "핵심 디지털 채널",
  );
  const productFeature = firstItem(
    project.productFeatures,
    "제품 핵심 기능",
  );
  const competitorWeakness = firstItem(
    topCompetitor?.weaknesses || "",
    "차별적 고객 경험 부족",
  );
  const overview: ReportSection = {
    id: "overview",
    eyebrow: "BRAND OVERVIEW",
    title: "브랜드/제품 개요",
    summary: `${project.brandName} 브랜드의 분석 제품은 “${project.productName}”이며, ${project.category} 시장에서 ${project.priceRange} 가격대로 운영되고 있음. 현재 마케팅 목표는 다음과 같음: “${project.marketingGoal}”.`,
    bullets: compactBullets(
      [
        `핵심 제품 자산: ${project.productFeatures}.`,
        `현재 정의된 타겟: ${project.currentTarget}. 분석 결과와의 정합성을 지속 점검할 필요가 있음.`,
        `브랜드 자산은 유지하되 제품 경험과 메시지의 현대화가 우선 과제로 판단됨.`,
        `단기 성과뿐 아니라 신규 고객 유입과 반복 구매 구조를 함께 설계할 필요가 있음.`,
      ],
      tone,
    ),
  };

  const target: ReportSection = {
    id: "target",
    eyebrow: "CORE TARGET",
    title: "핵심 타겟 요약",
    summary: `${targetName} 세그먼트는 타겟 적합도 ${targetScore}점으로 가장 높은 우선순위를 보이며, 1차 캠페인 오디언스로 설정하는 것이 적합한 것으로 판단됨.`,
    bullets: compactBullets(
      [
        `주요 문제: ${topTarget?.painPoints || targetPain}.`,
        `구매 동기: ${topTarget?.purchaseMotivation || targetMotivation}.`,
        `구매 장벽: ${topTarget?.purchaseBarriers || targetBarrier}. 메시지와 후기 자산을 통해 해소할 필요가 있음.`,
        `우선 도달 채널: ${topTarget?.mediaChannels || targetChannel}. 해당 채널 중심으로 미디어를 구성하는 전략이 적합함.`,
        ...sortedTargets.slice(1, 3).map(
          (item) =>
            `“${item.segmentName}” 세그먼트는 적합도 ${getTargetFitScore(item)}점으로 2차 확장 타겟으로 활용 가능함.`,
        ),
      ],
      tone,
    ),
  };

  const persona: ReportSection = {
    id: "persona",
    eyebrow: "PERSONA",
    title: "핵심 페르소나",
    summary: `${ageMidpoint(topTarget?.ageRange || "")} ${topTarget?.occupation || "직장인"}으로 설정할 수 있음. 라이프스타일 요약: “${topTarget?.lifestyle || "효율적인 자기관리를 중시하는 생활자"}”.`,
    bullets: compactBullets(
      [
        `상황: “${targetPain}” 문제를 체감하지만 복잡한 제품 탐색과 사용 과정에는 부담을 느낌.`,
        `욕구: “${targetMotivation}” 니즈를 통해 관리 효과와 심리적 만족을 동시에 얻고자 함.`,
        `장벽: “${targetBarrier}” 요인으로 인해 구매 직전 비교 검색과 후기 확인이 필요함.`,
        `행동: ${targetChannel}에서 제품 효능, 사용 편의성, 실제 사용자 평가를 확인하는 경향이 있음.`,
        `전환 조건: 짧은 사용 루틴, 구체적인 효능 근거, 신뢰 가능한 리뷰를 함께 제시할 필요가 있음.`,
      ],
      tone,
    ),
  };

  const competitor: ReportSection = {
    id: "competitors",
    eyebrow: "COMPETITIVE REVIEW",
    title: "경쟁사 비교 요약",
    summary: `${topCompetitor?.competitorName || "주요 경쟁사"}의 위협도는 ${competitorScore}점으로 가장 높으며, 평균 경쟁 위협도는 ${averageThreat}점으로 나타남.`,
    bullets: compactBullets(
      [
        ...sortedCompetitors.slice(0, tone === "ppt" ? 3 : 4).map(
          (item) =>
            `${item.competitorName}: 위협도 ${getCompetitorThreatScore(item)}점. 강점: “${firstItem(item.strengths, "브랜드 경쟁력")}”. 약점: “${firstItem(item.weaknesses, "차별화 여지")}”.`,
        ),
        `${topCompetitor?.competitorName || "경쟁사"}의 약점은 “${competitorWeakness}”로 확인됨. 해당 지점을 공략해 직접적인 이미지 경쟁을 우회할 필요가 있음.`,
      ],
      tone,
    ),
  };

  const positioningSection: ReportSection = {
    id: "positioning",
    eyebrow: "POSITIONING",
    title: "포지셔닝 해석",
    summary: positioningInterpretation.summary.replace(
      "확보할 수 있습니다.",
      "확보할 수 있는 것으로 판단됨.",
    ),
    bullets: compactBullets(
      [
        `${xAxis.label} 기준 ${positioning.brand.x}점, ${yAxis.label} 기준 ${positioning.brand.y}점으로 설정됨.`,
        ...positioningInterpretation.details
          .slice(1)
          .map((detail) => adaptPositioningTone(detail, tone)),
        `자사 강점: ${firstItem(positioning.brand.strengths, productFeature)}. 해당 자산을 포지셔닝 근거로 일관되게 제시할 필요가 있음.`,
      ],
      tone,
    ),
  };

  const opportunity: ReportSection = {
    id: "opportunity",
    eyebrow: "MARKET OPPORTUNITY",
    title: "시장 기회",
    summary: `시장 기회 지수는 ${opportunityScore}점으로 산출되며, 높은 타겟 적합도를 경쟁사의 미충족 영역과 연결하는 전략이 유효한 것으로 판단됨.`,
    bullets: compactBullets(
      [
        `핵심 수요: ${targetPain}. 해당 문제는 제품 필요성을 강화하는 직접적 수요로 판단됨.`,
        `경쟁 공백: ${competitorWeakness}. 해당 지점은 자사가 차별적 사용 경험과 메시지를 선점할 수 있는 기회 요인임.`,
        `제품 자산: ${productFeature}. 기능 설명이 아닌 고객의 일상 변화와 연결해 제시할 필요가 있음.`,
        `현재 포지셔닝 좌표를 기준으로 경쟁사와 유사한 표현을 반복하기보다 슬로우에이징과 간편한 루틴을 결합하는 전략이 적합함.`,
      ],
      tone,
    ),
  };

  const uspSection: ReportSection = {
    id: "usp",
    eyebrow: "USP",
    title: "핵심 USP",
    summary: `“${usp}”`,
    bullets: compactBullets(
      [
        `타겟 문제와 제품 자산을 직접 연결한 제안임: “${targetPain}” + “${productFeature}”.`,
        `${topCompetitor?.competitorName || "주요 경쟁사"} 대비 보완점은 “${competitorWeakness}”이며, 이를 해소하는 차별화가 필요함.`,
        `USP는 제품 상세, 광고, 리뷰 가이드, 오프라인 설명 문구에 동일하게 적용할 필요가 있음.`,
      ],
      tone,
    ),
  };

  const message: ReportSection = {
    id: "message",
    eyebrow: "MARKETING MESSAGE",
    title: "추천 마케팅 메시지",
    summary: `핵심 메시지는 다음과 같이 제안함: “복잡한 관리는 줄이고, 핵심 타겟을 위한 슬로우에이징 루틴은 ${productFeature}에서 시작됨”.`,
    bullets: compactBullets(
      [
        `문제 환기형: “피부가 달라진 것이 아니라, 관리 방식이 오래된 것일 수 있음.”`,
        `효익 제안형: “매일 두 단계로 채우는 탄력과 신뢰감.”`,
        `구매 전환형: “처음 시작하는 남성 안티에이징, 검증된 루틴으로 간편하게.”`,
        `메시지 전달 시 ${targetChannel}에서 효능 근거, 사용 순서, 전후 경험을 짧게 반복 노출할 필요가 있음.`,
      ],
      tone,
    ),
  };

  const execution: ReportSection = {
    id: "execution",
    eyebrow: "ACTION PLAN",
    title: "실행 전략",
    summary: `${targetName} 세그먼트를 중심으로 메시지 검증, 채널 전환, 재구매 설계를 단계적으로 운영하는 전략이 적합함.`,
    bullets: compactBullets(
      [
        `1단계 타겟 검증: ${targetChannel}에서 문제 환기형·효익형·신뢰형 소재를 비교 테스트할 필요가 있음.`,
        `2단계 전환 강화: 상세 페이지에 효능 근거, 2단계 사용법, 경쟁 대안 대비 차이를 구조화할 필요가 있음.`,
        `3단계 채널 확장: 반응이 검증된 메시지를 카카오 선물하기, 검색 광고, 리타겟팅으로 확장하는 전략이 적합함.`,
        `4단계 리텐션: 제품 소진 예상 시점에 맞춰 리마인드, 세트 혜택, 후기 요청을 자동화할 필요가 있음.`,
        `핵심 KPI는 타겟별 클릭률, 상세 페이지 전환율, 첫 구매 비용, 60~90일 재구매율로 설정하는 것이 적합함.`,
      ],
      tone,
    ),
  };

  const baseSections = [
    overview,
    target,
    persona,
    competitor,
    positioningSection,
    opportunity,
    uspSection,
    message,
    execution,
  ];
  const sections =
    tone === "client" ? baseSections.map(applyClientTone) : baseSections;

  const executiveSummary =
    tone === "ppt"
      ? `${targetName} 집중, ${productFeature} 차별화, 슬로우에이징 포지션 선점이 핵심 과제로 판단됨.`
      : tone === "client"
        ? `분석 결과, 핵심 고객은 ${targetName} 세그먼트로 판단됩니다. 제품 차별화 자산은 “${productFeature}”입니다. 경쟁 보완점은 “${competitorWeakness}”이며, 이를 해결하는 메시지와 채널 실행을 병행할 필요가 있습니다.`
        : `분석 결과, ${targetName} 세그먼트의 적합도가 가장 높음. 제품 차별화 자산은 “${productFeature}”이며, 이를 중심으로 한 포지셔닝이 유효한 것으로 판단됨. 경쟁 강도가 높은 시장이므로 기능 효익, 간편한 루틴, 브랜드 신뢰를 하나의 구매 이유로 통합할 필요가 있음.`;

  const title = `${project.brandName} ${project.productName} 전략 리포트`;
  const subtitle = `${toneLabel[tone]} · ${project.category}`;
  const markdown = `# ${title}

> ${subtitle}

## Executive Summary
${executiveSummary}

${sections.map(sectionToMarkdown).join("\n\n")}

---
Generated by Market Fit Lab`;

  return {
    title,
    subtitle,
    executiveSummary,
    sections,
    markdown,
  };
}
