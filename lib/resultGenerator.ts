import { benchmarkData } from "@/data/benchmarkData";
import { copyTemplates } from "@/data/copyTemplates";
import type {
  AnalysisInput,
  AnalysisResult,
  BenchmarkRange,
  PriorityAction,
} from "@/types/analysis";
import type {
  ProjectAnalysis,
  ProofolioWorkspace,
} from "@/types/proofolio";
import { buildRecommendationBundle } from "./recommendationEngine";
import { scoreAnalysisInput } from "./scoringEngine";
import {
  normalizeText,
  pickVariant,
  replaceTemplate,
  stableHash,
} from "./textVariation";

function inferIndustryKey(value: string) {
  const normalized = value.toLocaleLowerCase("ko-KR");

  if (/뷰티|화장|스킨|beauty/.test(normalized)) return "beauty";
  if (/아웃도어|66|outdoor|north/.test(normalized)) return "outdoor";
  if (/커리어|자기소개서|이력서|포트폴리오|채용/.test(normalized)) return "career";
  if (/콘텐츠|카드뉴스|sns|media|biscuit/.test(normalized)) return "content";
  if (/교육|강의|학습/.test(normalized)) return "education";
  if (/saas|서비스|프로덕트|앱/.test(normalized)) return "saas";
  if (/패션|의류/.test(normalized)) return "fashion";
  if (/이커머스|커머스|쇼핑|구매/.test(normalized)) return "ecommerce";
  if (/금융|보험|투자/.test(normalized)) return "finance";
  if (/헬스|의료|건강/.test(normalized)) return "healthcare";
  if (/여행|관광/.test(normalized)) return "travel";
  if (/구독|멤버십/.test(normalized)) return "subscription";
  if (/b2b|기업|리드/.test(normalized)) return "b2b";
  if (/이벤트|행사/.test(normalized)) return "event";

  return "general";
}

function getBenchmark(input: AnalysisInput): BenchmarkRange {
  const key = inferIndustryKey(
    [
      input.industry,
      input.projectType,
      input.product,
      input.evidenceText,
    ]
      .filter(Boolean)
      .join(" "),
  );

  return benchmarkData[key] ?? benchmarkData.general;
}

function scoreComment(score: number, high: string, mid: string, low: string) {
  if (score >= 80) return high;
  if (score >= 58) return mid;
  return low;
}

function buildPriorityActions(
  result: ReturnType<typeof scoreAnalysisInput>,
  bundle: ReturnType<typeof buildRecommendationBundle>,
): PriorityAction[] {
  const scoreEntries = [
    {
      key: "messageClarity",
      score: result.scores.messageClarity,
      action: "핵심 혜택과 CTA를 첫 화면 기준으로 다시 정리",
      reason: "메시지가 선명해야 클릭 이후 행동까지 이어질 가능성이 높아집니다.",
    },
    {
      key: "targetFit",
      score: result.scores.targetFit,
      action: "타깃을 문제 강도와 구매 장벽 기준으로 세분화",
      reason: "넓은 타깃보다 반응 가능성이 높은 세그먼트부터 검증하는 편이 효율적입니다.",
    },
    {
      key: "conversionPotential",
      score: result.scores.conversionPotential,
      action: "랜딩 정보 위계와 근거 박스 추가",
      reason: "관심을 전환으로 바꾸려면 약속한 혜택이 바로 확인되어야 합니다.",
    },
    {
      key: "budgetEfficiency",
      score: result.scores.budgetEfficiency,
      action: "채널을 줄이고 메시지 가설 2~3개를 작게 테스트",
      reason: "예산 효율은 넓은 집행보다 학습 단가를 낮추는 방식으로 올라갑니다.",
    },
  ];

  return scoreEntries
    .sort((a, b) => a.score - b.score)
    .slice(0, 4)
    .map((entry, index) => ({
      priority: index === 0 ? "높음" : index === 1 ? "중간" : "낮음",
      action: entry.action,
      reason: `${entry.reason} 참고 전략: ${bundle.strategies[index] ?? bundle.recommendations[index]}`,
    }));
}

function getScoreEntries(scores: ReturnType<typeof scoreAnalysisInput>["scores"]) {
  return [
    { label: "시장 적합성", score: scores.marketFit },
    { label: "타깃 정합성", score: scores.targetFit },
    { label: "메시지 명확성", score: scores.messageClarity },
    { label: "전환 가능성", score: scores.conversionPotential },
    { label: "예산 효율성", score: scores.budgetEfficiency },
    { label: "실행 용이성", score: scores.executionDifficulty },
  ];
}

export function generateAnalysisResult(input: AnalysisInput): AnalysisResult {
  const baseSeed = `${input.seed ?? ""}:${JSON.stringify({
    ...input,
    variant: undefined,
  })}`;
  const variationSeed = `${baseSeed}:${input.variant ?? 0}`;
  const scoring = scoreAnalysisInput(input);
  const bundle = buildRecommendationBundle({
    input,
    scores: scoring.scores,
    signals: scoring.signals,
    seed: baseSeed,
  });
  const benchmarkRange = getBenchmark(input);
  const target = normalizeText(input.target || input.targetAge) || "핵심 타깃";
  const industry = benchmarkRange.label;
  const goal = normalizeText(input.goal) || "성과 개선";
  const problem = bundle.problems[0] ?? "핵심 혜택과 근거가 충분히 연결되지 않은 점";
  const benefit = scoreComment(
    scoring.scores.messageClarity,
    "선택 이유가 비교적 빠르게 전달되는 구조",
    "핵심 혜택은 보이지만 더 직접적인 표현이 필요한 구조",
    "사용자가 왜 선택해야 하는지 즉시 이해하기 어려운 구조",
  );
  const action = scoring.scores.conversionPotential >= 70 ? "다음 행동" : "작은 테스트";
  const solution = bundle.recommendations[0] ?? "메시지와 근거를 다시 연결하는 방식";
  const scoreEntries = getScoreEntries(scoring.scores);
  const strongestScore = scoreEntries.reduce((best, entry) =>
    entry.score > best.score ? entry : best,
  );
  const weakestScore = scoreEntries.reduce((weakest, entry) =>
    entry.score < weakest.score ? entry : weakest,
  );
  const priorityActions = buildPriorityActions(scoring, bundle);
  const headlineDiagnosis = `${target} 기준으로 ${strongestScore.label}은 강점이지만 ${weakestScore.label}이 병목입니다. 지금은 '${priorityActions[0]?.action ?? "핵심 메시지 검증"}'을 먼저 실행해야 합니다.`;
  const summary = `입력값 기반 분석 결과입니다. ${goal} 목표를 ${industry} 참고 벤치마크와 전략 패턴에 맞춰 보면, ${problem}을 줄이고 검증 가능한 작은 액션으로 전환하는 것이 핵심입니다.`;
  const generatedCopy = copyTemplates.copy.slice(0, 5).map((template, index) =>
    replaceTemplate(pickVariant(copyTemplates.copy, variationSeed, `copy-${index}`), {
      target,
      industry,
      goal,
      problem,
      benefit,
      action,
      solution,
      result: "검증 가능한 결과",
    }),
  );
  const nextTestIdeas = [
    `${target} 대상 메시지를 문제 강조형과 혜택 강조형으로 나눠 7일간 비교`,
    `CTA를 '자세히 보기'와 '결과물 확인하기'로 나눠 클릭 후 행동 차이 측정`,
    `참고 벤치마크 CTR ${benchmarkRange.ctr} 범위를 기준으로 첫 소재 반응 확인`,
  ];

  return {
    headlineDiagnosis,
    summary,
    totalScore: scoring.totalScore,
    confidenceLevel: scoring.confidenceLevel,
    scores: scoring.scores,
    keyInsights: [
      ...bundle.insights,
      scoreComment(
        scoring.scores.messageClarity,
        "현재 메시지는 사용자가 혜택을 비교적 빠르게 이해할 수 있는 구조입니다.",
        "핵심 혜택은 보이지만 CTA와 차별점이 더 명확해질 필요가 있습니다.",
        "현재 메시지는 사용자가 왜 선택해야 하는지 즉시 이해하기 어려운 구조입니다.",
      ),
    ].slice(0, 3),
    problems: bundle.problems.slice(0, 3),
    recommendations: bundle.recommendations.slice(0, 5),
    priorityActions,
    generatedCopy,
    nextTestIdeas,
    caution: pickVariant(copyTemplates.caution, variationSeed, "caution"),
    reasoningSummary:
      "입력된 목표, 예산, 타깃, 채널, 프로젝트 근거를 내부 mock 지식 베이스와 참고 벤치마크에 매칭한 뒤 항목별 점수를 계산해 결과를 생성했습니다.",
    inputCompleteness: scoring.inputCompleteness,
    missingInputs: scoring.missingInputs,
    benchmarkRange,
    strategyTable: bundle.strategies.slice(0, 3).map((strategy, index) => ({
      area: ["메시지", "타깃", "전환"][index] ?? "전략",
      recommendation: strategy,
      expectedEffect: [
        "사용자가 첫 화면에서 선택 이유를 더 빠르게 이해합니다.",
        "예산 대비 반응 가능성이 높은 세그먼트부터 학습할 수 있습니다.",
        "클릭 이후 행동으로 이어질 가능성을 높입니다.",
      ][index] ?? "실행 우선순위가 선명해집니다.",
    })),
  };
}

export function createAnalysisInputFromProject(
  analysis: ProjectAnalysis,
  workspace?: ProofolioWorkspace,
  variant = 0,
): AnalysisInput {
  const sourceFile = workspace?.uploadedFiles.find(
    (file) => file.name === analysis.sourceFileName,
  );
  const answers = workspace?.questionAnswers[analysis.id] ?? {};
  const profile = workspace?.userProfile;
  const evidenceText = [
    sourceFile?.contentPreview,
    sourceFile?.contentSummary,
    ...Object.values(answers),
    analysis.background,
    analysis.problemDefinition,
    analysis.targetAudience,
    analysis.keyInsight,
    analysis.strategy,
    analysis.execution,
    analysis.result,
    analysis.userRole,
  ]
    .filter(Boolean)
    .join(" ");
  const seedBase = stableHash(`${analysis.id}:${analysis.projectTitle}`);

  return {
    industry: inferIndustryKey(`${analysis.projectType} ${analysis.projectTitle}`),
    goal: profile?.targetRole || analysis.portfolioRecommendation || "포트폴리오 완성",
    budget: /예산|CPC|광고|퍼포먼스/.test(evidenceText) ? "중간" : "미정",
    target: analysis.targetAudience,
    targetAge: analysis.targetAudience,
    channel: /콘텐츠|카드뉴스|SNS/.test(evidenceText)
      ? "SNS/콘텐츠"
      : /광고|CPC|CTR|랜딩/.test(evidenceText)
        ? "광고/랜딩"
        : "포트폴리오/지원서",
    channels: analysis.competencyTags,
    message: `${analysis.oneLineSummary} ${analysis.keyInsight}`,
    product: analysis.projectTitle,
    projectType: analysis.projectType,
    evidenceText,
    role: analysis.userRole,
    seed: `${analysis.id}-${seedBase}`,
    variant,
  };
}
