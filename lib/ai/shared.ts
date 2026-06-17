export function createStableId(prefix: string, value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return `${prefix}-${hash.toString(36)}`;
}

export function cleanProjectTitle(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function compactSentence(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function firstSentence(value: string) {
  const normalized = compactSentence(value);
  const match = normalized.match(/^.*?[.!?](?=\s|$)/);

  return match?.[0] ?? normalized;
}

export function sentenceFragment(value: string) {
  return firstSentence(value).replace(/[.!?]+$/, "");
}

export function hasQuantitativeEvidence(value: string) {
  return /(?:\d[\d,.]*\s*(?:%|개|건|명|회|종|원|일|주|개월|배|점)|(?:CTR|CPC|CVR|ROAS)[^\d]{0,12}\d[\d,.]*\s*%?)/i.test(
    value,
  );
}

export function clampScore(value: number, minimum = 0, maximum = 100) {
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}

export function buildConsultingComment(
  diagnosis: string,
  implication: string,
  recommendation: string,
) {
  return `진단: ${diagnosis} 영향: ${implication} 권고: ${recommendation}`;
}

export function joinKoreanList(items: string[]) {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} 및 ${items.at(-1)}`;
}

export async function simulateAiDelay(milliseconds = 80) {
  await new Promise((resolve) => setTimeout(resolve, milliseconds));
}
