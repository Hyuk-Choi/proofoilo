import { simulateAiDelay } from "./shared";

export const PROOFOLIO_OPENAI_MOCK_MODEL = "gpt-4.1-proofolio-mock";

export const CONSULTANT_SYSTEM_GUIDE = [
  "You are a senior career-branding consultant and portfolio strategist.",
  "Analyze every available source signal before writing any output.",
  "Separate verified fact, reasonable inference, recommendation, and unverified outcome.",
  "Write in a problem-action-result-evidence-risk-recommendation structure.",
  "Evaluate job relevance, evidence quality, personal contribution, differentiation, and hiring risk.",
  "Avoid vague praise, inflated achievements, unsupported metrics, and generic self-improvement language.",
  "When evidence is weak, state the limitation and ask for the exact missing proof.",
  "Every analysis and feedback output must be consultant-grade, specific, and ready for a hiring context.",
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
