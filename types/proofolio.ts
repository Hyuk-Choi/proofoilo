import type { LucideIcon } from "lucide-react";

export type UploadedFileStatus =
  | "대기 중"
  | "분석 중"
  | "분석 완료"
  | "보완 필요";

export type UploadedFile = {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  status: UploadedFileStatus;
  contentPreview?: string;
  contentSummary?: string;
};

export type SourceReviewReport = {
  reviewScope: string;
  detectedSignals: string[];
  evidenceQuality: string;
  consultantNotes: string[];
  recommendedPortfolioUse: string;
};

export type ExpertEvidenceReview = {
  label: string;
  finding: string;
  recommendation: string;
};

export type ExpertAnalysisReview = {
  executiveDiagnosis: string;
  hiringRelevance: string;
  evidenceReviews: ExpertEvidenceReview[];
  strengths: string[];
  risks: string[];
  validationChecklist: string[];
  portfolioAngles: string[];
};

export type ProjectAnalysis = {
  id: string;
  sourceFileName: string;
  projectTitle: string;
  projectType: string;
  oneLineSummary: string;
  background: string;
  problemDefinition: string;
  targetAudience: string;
  keyInsight: string;
  strategy: string;
  execution: string;
  result: string;
  userRole: string;
  competencyTags: string[];
  portfolioRecommendation: string;
  improvementPoints: string[];
  expertComment: string;
  missingQuestions: string[];
  sourceReview?: SourceReviewReport;
  expertReview?: ExpertAnalysisReview;
};

export type PortfolioOutput = {
  id: string;
  projectTitle: string;
  portfolioTitle: string;
  summary: string;
  problem: string;
  insight: string;
  strategy: string;
  execution: string;
  result: string;
  role: string;
  skills: string[];
  pptCopy: string;
  notionCopy: string;
  onePageSummary: string;
  caseStudy?: string;
  keyMessage?: string;
};

export type CoverLetterOutput = {
  motivation: string;
  competency: string;
  achievement: string;
  collaboration: string;
  growth: string;
  futurePlan: string;
};

export type ResumeBullet = {
  title: string;
  bullets: string[];
  keywords: string[];
};

export type FeedbackScore = {
  jobFit: number;
  problemClarity: number;
  roleClarity: number;
  evidenceStrength: number;
  differentiation: number;
  writingPersuasiveness: number;
  portfolioFlow: number;
  totalScore: number;
  comments: string[];
  revisionSuggestions: string[];
};

export type InterviewQuestion = {
  question: string;
  followUpQuestions: string[];
  answerGuide: string;
  weaknessDefense: string;
};

export type BrandStrength = {
  title: string;
  description: string;
  evidenceProjects: string[];
};

export type PersonalBrandProfile = {
  name: string;
  targetRole: string;
  headline: string;
  positioning: string;
  professionalSummary: string;
  valueProposition: string;
  strengths: BrandStrength[];
  keywords: string[];
  targetRoles: string[];
  interviewIntroduction: string;
  generatedAt: string;
  sourceAnalysisIds: string[];
};

export type SkillLevel = "기초" | "활용" | "강점" | "핵심 경쟁력";

export type SkillInsight = {
  name: string;
  score: number;
  level: SkillLevel;
  projectCount: number;
  evidence: string[];
  improvement: string;
};

export type SkillCategoryScore = {
  name: string;
  score: number;
  description: string;
};

export type SkillAnalysisReport = {
  overallScore: number;
  summary: string;
  skills: SkillInsight[];
  categories: SkillCategoryScore[];
  topStrengths: string[];
  developmentPriorities: string[];
  generatedAt: string;
  sourceAnalysisIds: string[];
};

export type CareerStage =
  | "대학생"
  | "취업 준비생"
  | "신입"
  | "주니어"
  | "경력";

export type EmploymentType =
  | "정규직"
  | "인턴"
  | "계약직"
  | "프리랜서"
  | "협의 가능";

export type UserProfile = {
  name: string;
  englishName: string;
  email: string;
  phone: string;
  location: string;
  careerStage: CareerStage;
  targetRole: string;
  targetCompany: string;
  targetIndustries: string[];
  employmentType: EmploymentType;
  coreStrengths: string[];
  workValues: string[];
  introduction: string;
  portfolioUrl: string;
  linkedinUrl: string;
  updatedAt: string;
};

export type ProofolioWorkspace = {
  schemaVersion: number;
  userProfile: UserProfile;
  uploadedFiles: UploadedFile[];
  analyses: ProjectAnalysis[];
  portfolioOutputs: Record<string, PortfolioOutput>;
  coverLetterOutputs: Record<string, CoverLetterOutput>;
  resumeBullets: Record<string, ResumeBullet[]>;
  feedbackScores: Record<string, FeedbackScore>;
  interviewQuestions: Record<string, InterviewQuestion[]>;
  questionAnswers: Record<string, Record<string, string>>;
  personalBrand?: PersonalBrandProfile;
  skillAnalysis?: SkillAnalysisReport;
  updatedAt: string;
};

export type ProofolioNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type DashboardMetric = {
  label: string;
  value: string;
  detail: string;
  trend: string;
  tone: "blue" | "green" | "violet" | "amber";
};

export type ProjectStatus = "분석 완료" | "검토 필요" | "포트폴리오 생성";

export type RecentProject = {
  id: string;
  title: string;
  fileName: string;
  fileType: "PDF" | "PPTX" | "DOCX";
  analyzedAt: string;
  status: ProjectStatus;
  competency: string;
  progress: number;
};

export type WorkflowSummary = {
  label: string;
  value: number;
  total: number;
};
