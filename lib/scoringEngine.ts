import type {
  AnalysisInput,
  AnalysisScores,
  BudgetLevel,
  ConfidenceLevel,
} from "@/types/analysis";
import { clampScore, hasQuantitativeEvidence } from "@/lib/ai/shared";
import { normalizeText, tokenize } from "./textVariation";

export type ScoringResult = {
  scores: AnalysisScores;
  totalScore: number;
  confidenceLevel: ConfidenceLevel;
  inputCompleteness: number;
  missingInputs: string[];
  signals: string[];
};

function hasAny(value: string, patterns: RegExp[]) {
  return patterns.some((pattern) => pattern.test(value));
}

function normalizeBudget(value?: string): BudgetLevel {
  if (!value) return "미정";
  if (/낮|소액|적|low|small|제한|없음/i.test(value)) return "낮음";
  if (/높|충분|high|large|대규모/i.test(value)) return "높음";
  if (/중|보통|medium/i.test(value)) return "중간";
  return value as BudgetLevel;
}

function completeness(input: AnalysisInput) {
  const checks = [
    ["업종", input.industry],
    ["목표", input.goal],
    ["예산", input.budget],
    ["타깃", input.target || input.targetAge],
    ["채널", input.channel || input.channels?.join(", ")],
    ["메시지", input.message],
    ["제품/프로젝트", input.product || input.projectType],
    ["근거", input.evidenceText],
  ] as const;
  const filled = checks.filter(([, value]) => normalizeText(value).length >= 3);

  return {
    score: clampScore((filled.length / checks.length) * 100),
    missing: checks
      .filter(([, value]) => normalizeText(value).length < 3)
      .map(([label]) => `${label} 정보가 부족합니다.`),
  };
}

export function scoreAnalysisInput(input: AnalysisInput): ScoringResult {
  const text = [
    input.industry,
    input.goal,
    input.budget,
    input.target,
    input.targetAge,
    input.channel,
    input.channels?.join(" "),
    input.message,
    input.product,
    input.projectType,
    input.evidenceText,
    input.role,
  ]
    .filter(Boolean)
    .join(" ");
  const normalized = normalizeText(text);
  const budget = normalizeBudget(input.budget);
  const completion = completeness(input);
  const tokens = tokenize(normalized);
  const hasTarget = normalizeText(input.target || input.targetAge).length >= 8;
  const hasMessage = normalizeText(input.message).length >= 12;
  const hasChannel = Boolean(input.channel || input.channels?.length);
  const hasEvidence = hasQuantitativeEvidence(normalized);
  const isConversionGoal = hasAny(normalized, [/전환|구매|문의|가입|설치|리드|conversion|lead/i]);
  const isAwarenessGoal = hasAny(normalized, [/인지|도달|브랜드|awareness|reach/i]);
  const isCareerGoal = hasAny(normalized, [/포트폴리오|자기소개서|이력서|면접|커리어|채용/i]);
  const isLowBudget = budget === "낮음";

  const scores: AnalysisScores = {
    marketFit: clampScore(
      46 +
        (input.industry ? 12 : 0) +
        (input.projectType ? 8 : 0) +
        (hasEvidence ? 13 : 0) +
        (isCareerGoal ? 7 : 0) +
        Math.min(14, tokens.length * 0.45),
    ),
    targetFit: clampScore(
      42 +
        (hasTarget ? 24 : 0) +
        (hasAny(normalized, [/20대|30대|40대|학생|직장인|마케터|주니어|고객|사용자/i])
          ? 14
          : 0) +
        (hasAny(normalized, [/고민|니즈|문제|구매|행동|상황/i]) ? 12 : 0),
    ),
    messageClarity: clampScore(
      38 +
        (hasMessage ? 20 : 0) +
        (hasAny(normalized, [/혜택|차별|핵심|문제|해결|결과|근거/i]) ? 20 : 0) +
        (hasAny(normalized, [/CTA|클릭|신청|다운로드|업로드|확인|생성/i]) ? 10 : 0) +
        (hasEvidence ? 8 : 0),
    ),
    conversionPotential: clampScore(
      40 +
        (isConversionGoal ? 20 : 0) +
        (hasChannel ? 10 : 0) +
        (hasAny(normalized, [/랜딩|상세|후기|가격|체험|CTA|전환/i]) ? 16 : 0) +
        (hasEvidence ? 10 : 0),
    ),
    budgetEfficiency: clampScore(
      52 +
        (isLowBudget ? 14 : 0) +
        (hasAny(normalized, [/테스트|검증|우선순위|세그먼트|저비용|효율/i]) ? 18 : 0) +
        (hasChannel ? 8 : 0) -
        (budget === "미정" ? 10 : 0),
    ),
    executionDifficulty: clampScore(
      48 +
        (hasChannel ? 8 : 0) +
        (hasMessage ? 8 : 0) +
        (isLowBudget ? 10 : 0) +
        (isAwarenessGoal ? -6 : 0) +
        (hasAny(normalized, [/전체|대규모|모든|복잡|다채널/i]) ? -12 : 0),
    ),
  };
  const totalScore = clampScore(
    scores.marketFit * 0.18 +
      scores.targetFit * 0.18 +
      scores.messageClarity * 0.18 +
      scores.conversionPotential * 0.18 +
      scores.budgetEfficiency * 0.16 +
      scores.executionDifficulty * 0.12,
  );
  const confidenceLevel: ConfidenceLevel =
    completion.score >= 80 ? "높음" : completion.score >= 50 ? "보통" : "낮음";
  const signals = [
    ...tokens,
    input.industry || "",
    input.goal || "",
    budget,
    ...(input.channels ?? []),
    isConversionGoal ? "conversion" : "",
    isAwarenessGoal ? "awareness" : "",
    isCareerGoal ? "career" : "",
    hasEvidence ? "proof" : "",
    isLowBudget ? "budget" : "",
  ].filter(Boolean);

  return {
    scores,
    totalScore,
    confidenceLevel,
    inputCompleteness: completion.score,
    missingInputs: completion.missing,
    signals,
  };
}
