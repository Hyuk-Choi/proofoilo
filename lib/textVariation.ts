import type { KnowledgeItem } from "@/data/mockKnowledgeBase";

export function stableHash(value: string) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash >>> 0);
}

export function normalizeText(value?: string) {
  return value?.replace(/\s+/g, " ").trim() ?? "";
}

export function tokenize(value: string) {
  return normalizeText(value)
    .toLocaleLowerCase("ko-KR")
    .split(/[\s,./·|:;()[\]{}"'!?]+/)
    .filter((token) => token.length >= 2);
}

export function createSeededIndex(seed: string, length: number, salt = "") {
  if (length <= 0) return 0;
  return stableHash(`${seed}:${salt}`) % length;
}

export function pickVariant<T>(items: readonly T[], seed: string, salt = "") {
  return items[createSeededIndex(seed, items.length, salt)];
}

export function replaceTemplate(
  template: string,
  replacements: Record<string, string>,
) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    replacements[key] || "",
  );
}

export function scoreKnowledgeItem(
  item: KnowledgeItem,
  signals: string[],
) {
  const signalSet = new Set(signals.map((signal) => signal.toLocaleLowerCase("ko-KR")));
  return item.tags.reduce(
    (score, tag) =>
      score + (signalSet.has(tag.toLocaleLowerCase("ko-KR")) ? 6 : 0),
    0,
  );
}

export function selectRelevantItems(
  items: readonly KnowledgeItem[],
  signals: string[],
  seed: string,
  count: number,
) {
  return [...items]
    .map((item, index) => ({
      item,
      rank:
        scoreKnowledgeItem(item, signals) * 1000 +
        createSeededIndex(seed, 997, `${item.id}-${index}`),
    }))
    .sort((a, b) => b.rank - a.rank)
    .slice(0, count)
    .map(({ item }) => item);
}
