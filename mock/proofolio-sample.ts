import { PROOFOLIO_SCHEMA_VERSION } from "../lib/storage/keys";
import type { ProofolioWorkspace } from "../types/proofolio";

const profileUpdatedAt = "2026-06-15T14:40:00+09:00";

export const sampleProofolioWorkspace: ProofolioWorkspace = {
  schemaVersion: PROOFOLIO_SCHEMA_VERSION,
  userProfile: {
    name: "",
    englishName: "",
    email: "",
    phone: "",
    location: "",
    careerStage: "취업 준비생",
    targetRole: "",
    targetCompany: "",
    targetIndustries: [],
    employmentType: "정규직",
    coreStrengths: [],
    workValues: [],
    introduction: "",
    portfolioUrl: "",
    linkedinUrl: "",
    updatedAt: profileUpdatedAt,
  },
  uploadedFiles: [],
  analyses: [],
  portfolioOutputs: {},
  coverLetterOutputs: {},
  resumeBullets: {},
  feedbackScores: {},
  interviewQuestions: {},
  questionAnswers: {},
  personalBrand: undefined,
  skillAnalysis: undefined,
  updatedAt: profileUpdatedAt,
};
