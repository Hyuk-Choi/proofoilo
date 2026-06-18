import type {
  CoverLetterOutput,
  FeedbackScore,
  InterviewQuestion,
  PersonalBrandProfile,
  PortfolioOutput,
  ProjectAnalysis,
  ProofolioWorkspace,
  ResumeBullet,
  SkillAnalysisReport,
  SkillCategoryScore,
  SkillInsight,
  SourceReviewReport,
  UserProfile,
  UploadedFile,
  UploadedFileStatus,
} from "../../types/proofolio";
import { PROOFOLIO_SCHEMA_VERSION } from "./keys";

const fileStatuses: UploadedFileStatus[] = [
  "대기 중",
  "분석 중",
  "분석 완료",
  "보완 필요",
];

const careerStages = [
  "대학생",
  "취업 준비생",
  "신입",
  "주니어",
  "경력",
] as const;

const employmentTypes = [
  "정규직",
  "인턴",
  "계약직",
  "프리랜서",
  "협의 가능",
] as const;

const RESET_PROJECT_DATA_SCHEMA_VERSION = 4;
const legacySampleProfile = {
  name: "김민지",
  englishName: "Minji Kim",
  email: "minji.kim@example.com",
  phone: "010-1234-5678",
  location: "서울",
  careerStage: "취업 준비생",
  targetRole: "브랜드 전략 마케터",
  targetCompany: "글로벌 소비재·라이프스타일 브랜드",
  targetIndustries: ["패션·라이프스타일", "뷰티", "콘텐츠"],
  employmentType: "정규직",
  coreStrengths: ["시장 분석", "인사이트 도출", "브랜드 포지셔닝"],
  workValues: ["근거 중심 의사결정", "고객 관점", "명확한 커뮤니케이션"],
  introduction:
    "시장과 고객 자료에서 핵심 문제를 정의하고, 분석 결과를 브랜드 메시지와 실행 우선순위로 전환하는 마케터를 지향합니다.",
  portfolioUrl: "",
  linkedinUrl: "",
  updatedAt: "2026-06-15T14:40:00+09:00",
} satisfies UserProfile;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function arraysEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function isLegacySampleProfile(profile: UserProfile) {
  return (
    profile.name === legacySampleProfile.name &&
    profile.englishName === legacySampleProfile.englishName &&
    profile.email === legacySampleProfile.email &&
    profile.phone === legacySampleProfile.phone &&
    profile.location === legacySampleProfile.location &&
    profile.careerStage === legacySampleProfile.careerStage &&
    profile.targetRole === legacySampleProfile.targetRole &&
    profile.targetCompany === legacySampleProfile.targetCompany &&
    arraysEqual(profile.targetIndustries, legacySampleProfile.targetIndustries) &&
    profile.employmentType === legacySampleProfile.employmentType &&
    arraysEqual(profile.coreStrengths, legacySampleProfile.coreStrengths) &&
    arraysEqual(profile.workValues, legacySampleProfile.workValues) &&
    profile.introduction === legacySampleProfile.introduction &&
    profile.portfolioUrl === legacySampleProfile.portfolioUrl &&
    profile.linkedinUrl === legacySampleProfile.linkedinUrl &&
    profile.updatedAt === legacySampleProfile.updatedAt
  );
}

function isUserProfile(value: unknown): value is UserProfile {
  if (!isRecord(value)) return false;

  return (
    isString(value.name) &&
    isString(value.englishName) &&
    isString(value.email) &&
    isString(value.phone) &&
    isString(value.location) &&
    careerStages.includes(
      value.careerStage as (typeof careerStages)[number],
    ) &&
    isString(value.targetRole) &&
    isString(value.targetCompany) &&
    isStringArray(value.targetIndustries) &&
    employmentTypes.includes(
      value.employmentType as (typeof employmentTypes)[number],
    ) &&
    isStringArray(value.coreStrengths) &&
    isStringArray(value.workValues) &&
    isString(value.introduction) &&
    isString(value.portfolioUrl) &&
    isString(value.linkedinUrl) &&
    isString(value.updatedAt)
  );
}

function isUploadedFile(value: unknown): value is UploadedFile {
  if (!isRecord(value)) return false;

  return (
    isString(value.id) &&
    isString(value.name) &&
    isString(value.type) &&
    typeof value.size === "number" &&
    isString(value.uploadedAt) &&
    fileStatuses.includes(value.status as UploadedFileStatus) &&
    (value.contentPreview === undefined || isString(value.contentPreview)) &&
    (value.contentSummary === undefined || isString(value.contentSummary))
  );
}

function isSourceReviewReport(value: unknown): value is SourceReviewReport {
  if (!isRecord(value)) return false;

  return (
    isString(value.reviewScope) &&
    isStringArray(value.detectedSignals) &&
    isString(value.evidenceQuality) &&
    isStringArray(value.consultantNotes) &&
    isString(value.recommendedPortfolioUse)
  );
}

function isProjectAnalysis(value: unknown): value is ProjectAnalysis {
  if (!isRecord(value)) return false;

  return (
    isString(value.id) &&
    isString(value.sourceFileName) &&
    isString(value.projectTitle) &&
    isString(value.projectType) &&
    isString(value.oneLineSummary) &&
    isString(value.background) &&
    isString(value.problemDefinition) &&
    isString(value.targetAudience) &&
    isString(value.keyInsight) &&
    isString(value.strategy) &&
    isString(value.execution) &&
    isString(value.result) &&
    isString(value.userRole) &&
    isStringArray(value.competencyTags) &&
    isString(value.portfolioRecommendation) &&
    isStringArray(value.improvementPoints) &&
    isString(value.expertComment) &&
    isStringArray(value.missingQuestions) &&
    (value.sourceReview === undefined ||
      isSourceReviewReport(value.sourceReview))
  );
}

function pickRecordValues<T>(
  value: unknown,
  predicate: (item: unknown) => item is T,
): Record<string, T> {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, T] =>
      predicate(entry[1]),
    ),
  );
}

function isPortfolioOutput(value: unknown): value is PortfolioOutput {
  if (!isRecord(value)) return false;

  return (
    isString(value.id) &&
    isString(value.projectTitle) &&
    isString(value.portfolioTitle) &&
    isString(value.summary) &&
    isString(value.problem) &&
    isString(value.insight) &&
    isString(value.strategy) &&
    isString(value.execution) &&
    isString(value.result) &&
    isString(value.role) &&
    isStringArray(value.skills) &&
    isString(value.pptCopy) &&
    isString(value.notionCopy) &&
    isString(value.onePageSummary) &&
    (value.caseStudy === undefined || isString(value.caseStudy)) &&
    (value.keyMessage === undefined || isString(value.keyMessage))
  );
}

function isCoverLetterOutput(value: unknown): value is CoverLetterOutput {
  if (!isRecord(value)) return false;

  return (
    isString(value.motivation) &&
    isString(value.competency) &&
    isString(value.achievement) &&
    isString(value.collaboration) &&
    isString(value.growth) &&
    isString(value.futurePlan)
  );
}

function isResumeBullet(value: unknown): value is ResumeBullet {
  if (!isRecord(value)) return false;

  return (
    isString(value.title) &&
    isStringArray(value.bullets) &&
    isStringArray(value.keywords)
  );
}

function isResumeBulletList(value: unknown): value is ResumeBullet[] {
  return Array.isArray(value) && value.every(isResumeBullet);
}

function isFeedbackScore(value: unknown): value is FeedbackScore {
  if (!isRecord(value)) return false;

  const scoreKeys: Array<keyof FeedbackScore> = [
    "jobFit",
    "problemClarity",
    "roleClarity",
    "evidenceStrength",
    "differentiation",
    "writingPersuasiveness",
    "portfolioFlow",
    "totalScore",
  ];

  return (
    scoreKeys.every((key) => typeof value[key] === "number") &&
    isStringArray(value.comments) &&
    isStringArray(value.revisionSuggestions)
  );
}

function isInterviewQuestion(value: unknown): value is InterviewQuestion {
  if (!isRecord(value)) return false;

  return (
    isString(value.question) &&
    isStringArray(value.followUpQuestions) &&
    isString(value.answerGuide) &&
    isString(value.weaknessDefense)
  );
}

function isInterviewQuestionList(
  value: unknown,
): value is InterviewQuestion[] {
  return Array.isArray(value) && value.every(isInterviewQuestion);
}

function isPersonalBrandProfile(
  value: unknown,
): value is PersonalBrandProfile {
  if (!isRecord(value)) return false;

  return (
    isString(value.name) &&
    isString(value.targetRole) &&
    isString(value.headline) &&
    isString(value.positioning) &&
    isString(value.professionalSummary) &&
    isString(value.valueProposition) &&
    Array.isArray(value.strengths) &&
    value.strengths.every(
      (strength) =>
        isRecord(strength) &&
        isString(strength.title) &&
        isString(strength.description) &&
        isStringArray(strength.evidenceProjects),
    ) &&
    isStringArray(value.keywords) &&
    isStringArray(value.targetRoles) &&
    isString(value.interviewIntroduction) &&
    isString(value.generatedAt) &&
    isStringArray(value.sourceAnalysisIds)
  );
}

function isSkillInsight(value: unknown): value is SkillInsight {
  if (!isRecord(value)) return false;

  return (
    isString(value.name) &&
    typeof value.score === "number" &&
    ["기초", "활용", "강점", "핵심 경쟁력"].includes(
      value.level as string,
    ) &&
    typeof value.projectCount === "number" &&
    isStringArray(value.evidence) &&
    isString(value.improvement)
  );
}

function isSkillCategoryScore(value: unknown): value is SkillCategoryScore {
  if (!isRecord(value)) return false;

  return (
    isString(value.name) &&
    typeof value.score === "number" &&
    isString(value.description)
  );
}

function isSkillAnalysisReport(
  value: unknown,
): value is SkillAnalysisReport {
  if (!isRecord(value)) return false;

  return (
    typeof value.overallScore === "number" &&
    isString(value.summary) &&
    Array.isArray(value.skills) &&
    value.skills.every(isSkillInsight) &&
    Array.isArray(value.categories) &&
    value.categories.every(isSkillCategoryScore) &&
    isStringArray(value.topStrengths) &&
    isStringArray(value.developmentPriorities) &&
    isString(value.generatedAt) &&
    isStringArray(value.sourceAnalysisIds)
  );
}

function normalizeQuestionAnswers(
  value: unknown,
): Record<string, Record<string, string>> {
  if (!isRecord(value)) return {};

  return Object.fromEntries(
    Object.entries(value).flatMap(([analysisId, answers]) => {
      if (!isRecord(answers)) return [];

      const normalizedAnswers = Object.fromEntries(
        Object.entries(answers).filter(
          (entry): entry is [string, string] => isString(entry[1]),
        ),
      );

      return [[analysisId, normalizedAnswers]];
    }),
  );
}

export function createEmptyProofolioWorkspace(): ProofolioWorkspace {
  return {
    schemaVersion: PROOFOLIO_SCHEMA_VERSION,
    userProfile: createDefaultUserProfile(),
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
    updatedAt: new Date().toISOString(),
  };
}

export function createDefaultUserProfile(): UserProfile {
  return {
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
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeProofolioWorkspace(
  value: unknown,
  fallback: ProofolioWorkspace = createEmptyProofolioWorkspace(),
): ProofolioWorkspace {
  if (!isRecord(value)) {
    return {
      ...fallback,
      userProfile: { ...fallback.userProfile },
      uploadedFiles: [...fallback.uploadedFiles],
      analyses: [...fallback.analyses],
      portfolioOutputs: { ...fallback.portfolioOutputs },
      coverLetterOutputs: { ...fallback.coverLetterOutputs },
      resumeBullets: { ...fallback.resumeBullets },
      feedbackScores: { ...fallback.feedbackScores },
      interviewQuestions: { ...fallback.interviewQuestions },
      questionAnswers: { ...fallback.questionAnswers },
      personalBrand: fallback.personalBrand,
      skillAnalysis: fallback.skillAnalysis,
    };
  }

  const incomingSchemaVersion =
    typeof value.schemaVersion === "number" ? value.schemaVersion : 0;
  const parsedUserProfile = isUserProfile(value.userProfile)
    ? value.userProfile
    : { ...fallback.userProfile };
  const userProfile = isLegacySampleProfile(parsedUserProfile)
    ? createDefaultUserProfile()
    : parsedUserProfile;

  if (incomingSchemaVersion < RESET_PROJECT_DATA_SCHEMA_VERSION) {
    return {
      ...createEmptyProofolioWorkspace(),
      userProfile: { ...userProfile },
      updatedAt: new Date().toISOString(),
    };
  }

  const uploadedFiles = Array.isArray(value.uploadedFiles)
    ? value.uploadedFiles.filter(isUploadedFile)
    : fallback.uploadedFiles;
  const analyses = Array.isArray(value.analyses)
    ? value.analyses.filter(isProjectAnalysis)
    : fallback.analyses;

  return {
    schemaVersion: PROOFOLIO_SCHEMA_VERSION,
    userProfile,
    uploadedFiles,
    analyses,
    portfolioOutputs: pickRecordValues(
      value.portfolioOutputs,
      isPortfolioOutput,
    ),
    coverLetterOutputs: pickRecordValues(
      value.coverLetterOutputs,
      isCoverLetterOutput,
    ),
    resumeBullets: pickRecordValues(value.resumeBullets, isResumeBulletList),
    feedbackScores: pickRecordValues(value.feedbackScores, isFeedbackScore),
    interviewQuestions: pickRecordValues(
      value.interviewQuestions,
      isInterviewQuestionList,
    ),
    questionAnswers: normalizeQuestionAnswers(value.questionAnswers),
    personalBrand: isPersonalBrandProfile(value.personalBrand)
      ? value.personalBrand
      : undefined,
    skillAnalysis: isSkillAnalysisReport(value.skillAnalysis)
      ? value.skillAnalysis
      : undefined,
    updatedAt: isString(value.updatedAt)
      ? value.updatedAt
      : fallback.updatedAt,
  };
}
