export type ViewId =
  | "project"
  | "targets"
  | "competitors"
  | "dashboard"
  | "positioning"
  | "report";

export type Project = {
  brandName: string;
  productName: string;
  category: string;
  priceRange: string;
  productFeatures: string;
  currentTarget: string;
  marketingGoal: string;
};

export type TargetScore = {
  painIntensity: number;
  purchasingPower: number;
  productNeed: number;
  adReachability: number;
  repeatPotential: number;
};

export type TargetSegment = {
  id: string;
  segmentName: string;
  ageRange: string;
  gender: string;
  occupation: string;
  lifestyle: string;
  painPoints: string;
  purchaseMotivation: string;
  purchaseBarriers: string;
  mediaChannels: string;
  score: TargetScore;
};

export type CompetitorScore = {
  brandAwareness: number;
  productSimilarity: number;
  priceCompetitiveness: number;
  channelPower: number;
  messageClarity: number;
};

export type Competitor = {
  id: string;
  competitorName: string;
  productName: string;
  priceRange: string;
  usp: string;
  target: string;
  strengths: string;
  weaknesses: string;
  channels: string;
  messageTone: string;
  positionX: number;
  positionY: number;
  score: CompetitorScore;
};

export type PositioningAxisId =
  | "massPremium"
  | "lowHighPrice"
  | "simpleExpert"
  | "fashionFunction"
  | "massScarcity";

export type BrandPositioning = {
  x: number;
  y: number;
  usp: string;
  strengths: string;
  weaknesses: string;
};

export type PositioningSettings = {
  xAxisId: PositioningAxisId;
  yAxisId: PositioningAxisId;
  brand: BrandPositioning;
};

export type WorkspaceState = {
  project: Project;
  targets: TargetSegment[];
  competitors: Competitor[];
  positioning: PositioningSettings;
};
