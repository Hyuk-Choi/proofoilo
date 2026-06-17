import type {
  Competitor,
  PositioningAxisId,
  PositioningSettings,
  Project,
} from "@/types/market";

export type PositioningAxis = {
  id: PositioningAxisId;
  label: string;
  low: string;
  high: string;
  lowDescription: string;
  highDescription: string;
};

export const positioningAxes: PositioningAxis[] = [
  {
    id: "massPremium",
    label: "대중성 ↔ 프리미엄",
    low: "대중성",
    high: "프리미엄",
    lowDescription: "대중적",
    highDescription: "프리미엄",
  },
  {
    id: "lowHighPrice",
    label: "저가 ↔ 고가",
    low: "저가",
    high: "고가",
    lowDescription: "합리적 가격",
    highDescription: "고가격",
  },
  {
    id: "simpleExpert",
    label: "간편함 ↔ 전문성",
    low: "간편함",
    high: "전문성",
    lowDescription: "간편한",
    highDescription: "전문적",
  },
  {
    id: "fashionFunction",
    label: "패션성 ↔ 기능성",
    low: "패션성",
    high: "기능성",
    lowDescription: "패션 지향",
    highDescription: "고기능",
  },
  {
    id: "massScarcity",
    label: "대중성 ↔ 희소성",
    low: "대중성",
    high: "희소성",
    lowDescription: "대중적",
    highDescription: "희소성 높은",
  },
];

export function getPositioningAxis(id: PositioningAxisId) {
  return (
    positioningAxes.find((axis) => axis.id === id) ?? positioningAxes[0]
  );
}

function getSideDescription(axis: PositioningAxis, score: number) {
  return score >= 50 ? axis.highDescription : axis.lowDescription;
}

function withTopicParticle(word: string) {
  const trimmed = word.trim();
  const lastCharacter = trimmed.at(-1);
  if (!lastCharacter) return trimmed;

  const code = lastCharacter.charCodeAt(0);
  const hasBatchim =
    code >= 0xac00 && code <= 0xd7a3 ? (code - 0xac00) % 28 !== 0 : false;

  return `${trimmed}${hasBatchim ? "은" : "는"}`;
}

function getNearestCompetitor(
  positioning: PositioningSettings,
  competitors: Competitor[],
) {
  return [...competitors]
    .map((competitor) => ({
      competitor,
      distance: Math.hypot(
        competitor.positionX - positioning.brand.x,
        competitor.positionY - positioning.brand.y,
      ),
    }))
    .sort((a, b) => a.distance - b.distance)[0];
}

export function createPositioningInterpretation(
  project: Project,
  positioning: PositioningSettings,
  competitors: Competitor[],
) {
  const xAxis = getPositioningAxis(positioning.xAxisId);
  const yAxis = getPositioningAxis(positioning.yAxisId);
  const xDescription = getSideDescription(xAxis, positioning.brand.x);
  const yDescription = getSideDescription(yAxis, positioning.brand.y);
  const feature =
    project.productFeatures.split(/[,\n]/)[0]?.trim() || "핵심 제품 효익";
  const nearest = getNearestCompetitor(positioning, competitors);
  const quadrantCompetitors = competitors.filter(
    (competitor) =>
      (competitor.positionX >= 50) === (positioning.brand.x >= 50) &&
      (competitor.positionY >= 50) === (positioning.brand.y >= 50),
  );

  const summary = `${project.brandName} ${withTopicParticle(project.productName)} ${yDescription}과 ${xDescription} 영역에 위치하며, ${feature} 중심의 차별화 포지션을 확보할 수 있습니다.`;

  const details = [
    `${xAxis.label} 기준 ${positioning.brand.x}점, ${yAxis.label} 기준 ${positioning.brand.y}점으로 해석됩니다.`,
    nearest
      ? `가장 가까운 경쟁사는 ${nearest.competitor.competitorName}이며, 좌표 거리는 ${Math.round(nearest.distance)}점입니다. 메시지와 경험 차별화를 함께 설계해야 합니다.`
      : "등록된 경쟁사가 없어 자사 좌표를 중심으로 시장 가설을 먼저 검증해야 합니다.",
    quadrantCompetitors.length
      ? `동일 사분면에 ${quadrantCompetitors.length}개 경쟁사가 있습니다. USP를 기능 설명보다 구체적인 사용 장면과 고객 효익으로 표현하는 것이 중요합니다.`
      : "동일 사분면에 직접 경쟁사가 없어 선점 가능성이 있지만, 실제 고객 인식 조사를 통해 빈 시장인지 수요가 없는 영역인지 확인해야 합니다.",
  ];

  return { summary, details };
}
