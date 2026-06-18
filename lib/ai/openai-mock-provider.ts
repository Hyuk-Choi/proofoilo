import { simulateAiDelay } from "./shared";

export const PROOFOLIO_OPENAI_MOCK_MODEL = "gpt-4.1-proofolio-mock";

export const CONSULTANT_SYSTEM_GUIDE = [
  "You are a senior career-branding consultant.",
  "Analyze source evidence before writing.",
  "Separate fact, inference, recommendation, and unverified outcome.",
  "Write in problem-action-result structure.",
  "Avoid vague phrases and unsupported achievement claims.",
].join(" ");

type OpenAiMockRequest<T> = {
  task: string;
  inputSummary: string;
  resolver: () => T;
  latencyMs?: number;
};

export async function runOpenAiMock<T>({
  resolver,
  latencyMs,
}: OpenAiMockRequest<T>): Promise<T> {
  await simulateAiDelay(latencyMs);
  return resolver();
}
