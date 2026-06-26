import type { ProjectAnalysis } from "../../types/proofolio";
import {
  firstSentence,
  hasQuantitativeEvidence,
  joinKoreanList,
} from "./shared";

export const EXPERT_CONSULTANT_STANDARDS = [
  "업로드 자료와 분석 리포트의 근거를 먼저 확인한 뒤 작성합니다.",
  "확인된 사실, 합리적 해석, 제안, 미검증 성과를 분리합니다.",
  "문제 정의, 본인 행동, 결과 또는 검증 계획이 한 흐름으로 이어지게 작성합니다.",
  "채용 담당자가 평가할 수 있는 직무 역량, 판단 기준, 책임 범위를 명확히 표시합니다.",
  "수치가 없는 성과는 기대효과 또는 후속 검증 과제로 표기합니다.",
  "추상적 칭찬보다 강점, 리스크, 우선 보완안을 구체적으로 제시합니다.",
] as const;

export function buildExpertStandardNote() {
  return `전문가 검토 기준: ${EXPERT_CONSULTANT_STANDARDS.join(" ")}`;
}

export function buildEvidenceBoundaryNote(value: string) {
  return hasQuantitativeEvidence(value)
    ? "정량 근거가 일부 확인되므로 성과 문장으로 활용할 수 있습니다. 단, 기간, 모수, 비교 기준과 출처를 함께 표기해야 합니다."
    : "정량 근거가 아직 부족하므로 결과를 확정 성과로 단정하지 말고 기대효과, 제안 결과 또는 후속 검증 과제로 구분해야 합니다.";
}

export function buildConsultantLens(
  analysis: ProjectAnalysis,
  extraEvidence = "",
) {
  const skills = joinKoreanList(analysis.competencyTags.slice(0, 3));

  return [
    `핵심 평가 렌즈: ${skills || "직무 역량"}이 실제 업무에서 재현 가능한 판단 방식으로 드러나는지 확인합니다.`,
    `문제 기준: ${firstSentence(analysis.problemDefinition)}`,
    `역할 기준: ${firstSentence(analysis.userRole)}`,
    `근거 기준: ${buildEvidenceBoundaryNote(`${analysis.result} ${analysis.userRole} ${extraEvidence}`)}`,
  ].join(" ");
}

export function buildConsultantRevisionPrinciple(analysis: ProjectAnalysis) {
  return `수정 원칙: ${analysis.projectTitle}의 경험은 활동 나열이 아니라 문제 정의, 대안 비교, 본인 판단, 실행 결과, 남은 검증 과제의 순서로 재구성해야 합니다.`;
}
