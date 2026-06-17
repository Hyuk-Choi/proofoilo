import type {
  Competitor,
  CompetitorScore,
  Project,
  TargetScore,
  TargetSegment,
} from "@/types/market";

export const targetWeights: Record<keyof TargetScore, number> = {
  painIntensity: 25,
  purchasingPower: 20,
  productNeed: 25,
  adReachability: 15,
  repeatPotential: 15,
};

export const competitorWeights: Record<keyof CompetitorScore, number> = {
  brandAwareness: 25,
  productSimilarity: 25,
  priceCompetitiveness: 15,
  channelPower: 20,
  messageClarity: 15,
};

export function calculateWeightedScore<T extends Record<string, number>>(
  values: T,
  weights: Record<keyof T, number>,
) {
  return Math.round(
    (Object.keys(weights) as Array<keyof T>).reduce(
      (total, key) => total + (values[key] / 5) * weights[key],
      0,
    ),
  );
}

export function getTargetFitScore(target: TargetSegment) {
  return calculateWeightedScore(target.score, targetWeights);
}

export function getCompetitorThreatScore(competitor: Competitor) {
  return calculateWeightedScore(competitor.score, competitorWeights);
}

export function getScoreLabel(score: number) {
  if (score >= 85) return "매우 높음";
  if (score >= 70) return "높음";
  if (score >= 55) return "보통";
  return "낮음";
}

export function getTopTarget(targets: TargetSegment[]) {
  return [...targets].sort(
    (a, b) => getTargetFitScore(b) - getTargetFitScore(a),
  )[0];
}

export function getTopCompetitor(competitors: Competitor[]) {
  return [...competitors].sort(
    (a, b) => getCompetitorThreatScore(b) - getCompetitorThreatScore(a),
  )[0];
}

function withParticle(word: string, consonant: string, vowel: string) {
  const trimmed = word.trim();
  const lastCharacter = trimmed.at(-1);
  if (!lastCharacter) return trimmed;

  const code = lastCharacter.charCodeAt(0);
  const hasBatchim =
    code >= 0xac00 && code <= 0xd7a3 ? (code - 0xac00) % 28 !== 0 : false;

  return `${trimmed}${hasBatchim ? consonant : vowel}`;
}

export function createUsp(
  project: Project,
  targets: TargetSegment[],
  competitors: Competitor[],
) {
  const target = getTopTarget(targets);
  const rival = getTopCompetitor(competitors);
  const targetName = target?.segmentName || project.currentTarget;
  const pain = target?.painPoints.split(/[,\n]/)[0]?.trim();
  const weakness = rival?.weaknesses.split(/[,\n]/)[0]?.trim();

  const product = withParticle(project.productName, "은", "는");
  const targetWithParticle = withParticle(targetName, "을", "를");
  const painWithParticle = withParticle(
    pain || "핵심 피부 고민",
    "을",
    "를",
  );
  const featureWithParticle = withParticle(
    project.productFeatures.split(/[,\n]/)[0]?.trim() || "차별화된 솔루션",
    "을",
    "를",
  );
  const weaknessWithParticle = withParticle(
    weakness || "복잡한 사용 경험",
    "을",
    "를",
  );

  return `${project.brandName} ${product} ${targetWithParticle} 위해 ${painWithParticle} 해결하는 ${featureWithParticle} 제공하며, ${rival?.competitorName || "기존 경쟁 제품"}의 ${weaknessWithParticle} 넘어선 간결하고 감각적인 선택입니다.`;
}

export function createInsights(
  project: Project,
  targets: TargetSegment[],
  competitors: Competitor[],
) {
  const target = getTopTarget(targets);
  const rival = getTopCompetitor(competitors);
  const targetScore = target ? getTargetFitScore(target) : 0;
  const rivalScore = rival ? getCompetitorThreatScore(rival) : 0;
  const targetName = target?.segmentName || project.currentTarget;
  const feature =
    project.productFeatures.split(/[,\n]/)[0]?.trim() || "제품 핵심 기능";
  const rivalStrength =
    rival?.strengths.split(/[,\n]/)[0]?.trim() || "브랜드 인지도";
  const rivalWeakness =
    rival?.weaknesses.split(/[,\n]/)[0]?.trim() || "경험 차별화";

  return [
    `${withParticle(targetName, "은", "는")} 적합도 ${targetScore}점으로, ${project.productName}의 1차 공략 타겟으로 가장 높은 전환 가능성을 보입니다.`,
    `${rival?.competitorName || "주요 경쟁사"}의 위협도는 ${rivalScore}점이며, ${withParticle(rivalStrength, "에", "에")} 정면 대응하기보다 ${withParticle(rivalWeakness, "을", "를")} 공략해야 합니다.`,
    `${withParticle(feature, "을", "를")} 기능 설명에 머물지 않고, 타겟의 일상 루틴을 바꾸는 효익으로 번역한 메시지가 필요합니다.`,
  ];
}

export function createMarkdownReport(
  project: Project,
  targets: TargetSegment[],
  competitors: Competitor[],
) {
  const sortedTargets = [...targets].sort(
    (a, b) => getTargetFitScore(b) - getTargetFitScore(a),
  );
  const sortedCompetitors = [...competitors].sort(
    (a, b) => getCompetitorThreatScore(b) - getCompetitorThreatScore(a),
  );
  const insights = createInsights(project, targets, competitors);

  return `# ${project.brandName} ${project.productName} 시장 적합 전략 리포트

## 1. 프로젝트 개요
- **카테고리:** ${project.category}
- **가격대:** ${project.priceRange}
- **현재 타겟:** ${project.currentTarget}
- **마케팅 목표:** ${project.marketingGoal}
- **제품 특징:** ${project.productFeatures}

## 2. 핵심 타겟 우선순위
${sortedTargets
  .map(
    (target, index) =>
      `${index + 1}. **${target.segmentName}** — 적합도 ${getTargetFitScore(target)}점\n   - 페인포인트: ${target.painPoints}\n   - 구매동기: ${target.purchaseMotivation}\n   - 핵심 채널: ${target.mediaChannels}`,
  )
  .join("\n")}

## 3. 경쟁 위협도
${sortedCompetitors
  .map(
    (competitor, index) =>
      `${index + 1}. **${competitor.competitorName} / ${competitor.productName}** — 위협도 ${getCompetitorThreatScore(competitor)}점\n   - USP: ${competitor.usp}\n   - 강점: ${competitor.strengths}\n   - 약점: ${competitor.weaknesses}`,
  )
  .join("\n")}

## 4. 권장 USP
> ${createUsp(project, targets, competitors)}

## 5. PPT 핵심 인사이트
${insights.map((insight) => `- ${insight}`).join("\n")}

## 6. 실행 전략
1. **타겟 집중:** 적합도가 가장 높은 세그먼트를 캠페인 1차 오디언스로 설정합니다.
2. **메시지 차별화:** 경쟁사의 강점과 같은 언어를 반복하기보다 타겟의 구체적 사용 장면을 제시합니다.
3. **채널 검증:** 핵심 미디어 채널에서 후킹 메시지 3종을 테스트하고 전환 데이터를 축적합니다.
4. **리텐션 설계:** 반복 구매 시점에 맞춘 리마인드와 세트 구성을 운영합니다.

---
Generated by Market Fit Lab`;
}
