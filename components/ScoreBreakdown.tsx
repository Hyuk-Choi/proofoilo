import type { AnalysisScores } from "@/types/analysis";

const scoreLabels: Array<{
  key: keyof AnalysisScores;
  label: string;
  description: string;
}> = [
  {
    key: "marketFit",
    label: "시장 적합성",
    description: "업종 맥락과 프로젝트 방향이 자연스럽게 연결되는지 봅니다.",
  },
  {
    key: "targetFit",
    label: "타깃 정합성",
    description: "누구의 어떤 문제를 다루는지 충분히 좁혀졌는지 평가합니다.",
  },
  {
    key: "messageClarity",
    label: "메시지 명확성",
    description: "핵심 혜택, 차별점, 행동 유도가 한 번에 읽히는지 봅니다.",
  },
  {
    key: "conversionPotential",
    label: "전환 가능성",
    description: "관심 이후 신청, 구매, 지원서 설득으로 이어질 여지를 봅니다.",
  },
  {
    key: "budgetEfficiency",
    label: "예산 효율성",
    description: "작은 테스트로 학습할 수 있는 구조인지 판단합니다.",
  },
  {
    key: "executionDifficulty",
    label: "실행 용이성",
    description: "현재 정보와 자원으로 빠르게 실행 가능한지 봅니다.",
  },
];

function getScoreTone(score: number) {
  if (score >= 80) return "bg-[#168765]";
  if (score >= 62) return "bg-[#2563eb]";
  return "bg-[#d58a18]";
}

export function ScoreBreakdown({ scores }: { scores: AnalysisScores }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {scoreLabels.map((item) => {
        const score = Math.round(scores[item.key]);

        return (
          <article
            key={item.key}
            className="rounded-2xl border border-[#e2e9f2] bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h5 className="text-[12px] font-black text-[#31435d]">
                  {item.label}
                </h5>
                <p className="mt-1 text-[11px] font-semibold leading-5 text-[#7d8da2]">
                  {item.description}
                </p>
              </div>
              <strong className="shrink-0 text-[20px] font-black tracking-[-0.04em] text-[#10213d]">
                {score}
              </strong>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#eef3f8]">
              <div
                className={`h-full rounded-full ${getScoreTone(score)}`}
                style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
