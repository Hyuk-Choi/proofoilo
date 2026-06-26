/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

const rootDir = path.resolve(__dirname, "..");
const originalResolveFilename = Module._resolveFilename;

function resolveCandidate(basePath) {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    path.join(basePath, "index.ts"),
    path.join(basePath, "index.tsx"),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate));
}

Module._resolveFilename = function resolveProofolioModule(
  request,
  parent,
  isMain,
  options,
) {
  if (typeof request === "string" && request.startsWith("@/")) {
    const candidate = resolveCandidate(path.join(rootDir, request.slice(2)));
    if (candidate) return candidate;
  }

  try {
    return originalResolveFilename.call(this, request, parent, isMain, options);
  } catch (error) {
    if (
      typeof request === "string" &&
      parent?.filename &&
      (request.startsWith(".") || request.startsWith("/")) &&
      !path.extname(request)
    ) {
      const basePath = request.startsWith(".")
        ? path.resolve(path.dirname(parent.filename), request)
        : request;
      const candidate = resolveCandidate(basePath);
      if (candidate) return candidate;
    }

    throw error;
  }
};

require.extensions[".ts"] = function compileTypeScript(module, filename) {
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: filename,
  });

  module._compile(output.outputText, filename);
};

const { createMockAnalysis } = require(path.join(
  rootDir,
  "lib/ai/analyze-file.ts",
));
const { buildPortfolioOutput } = require(path.join(
  rootDir,
  "lib/ai/generate-portfolio.ts",
));
const { getProjectPortfolioAudit } = require(path.join(
  rootDir,
  "lib/analysis/portfolio-output-audit.ts",
));
const { createEmptyProofolioWorkspace } = require(path.join(
  rootDir,
  "lib/storage/index.ts",
));

const scenarios = [
  {
    name: "66North 글로벌 브랜드 런칭",
    fileName: "66°North_한국_시장_진입_전략.pdf",
    targetRole: "글로벌 브랜드 마케터",
    contentPreview:
      "문제: 국내 프리미엄 아웃도어 시장에서 66°North의 인지도는 낮지만 기능성 의류 관심층은 증가했다. 타깃: 25-39세 도시형 아웃도어 소비자. 인사이트: 원산지 헤리티지는 일상 사용 장면과 연결될 때 구매 근거가 된다. 전략: 고관여 고객과 얼리어답터를 우선 공략하고 제품군, 채널, 메시지를 단계화했다. 역할: 경쟁 브랜드 8개를 비교하고 포지셔닝 맵, 타깃 페르소나, 런칭 메시지 초안을 작성했다. 결과: 교수 피드백 4.6/5점, 핵심 제품군 3종과 우선 채널 2개를 제안했다.",
  },
  {
    name: "오딧세이 광고 소재 분석",
    fileName: "오딧세이_블랙_스페셜_세트_광고_성과표.csv",
    targetRole: "퍼포먼스 마케터",
    contentPreview:
      "문제: 광고 클릭 메시지와 랜딩페이지 설득 정보가 분리되어 전환 흐름이 약했다. 타깃: 30-40대 남성 직장인과 선물 구매자. 성과: 소재 A CTR 1.8%, CPC 520원, 소재 B CTR 0.9%, CPC 840원. 인사이트: 사용 단계와 피부 고민이 첫 화면에 명확할 때 클릭 효율이 높았다. 실행: 썸네일, 헤드라인, CTA 12개 조합을 비교하고 랜딩 상단에 2단계 사용법과 후기 근거를 배치하는 개선안을 작성했다. 역할: 소재 분류, CTR/CPC 분석, 랜딩페이지 와이어프레임 개선안을 담당했다.",
  },
  {
    name: "Biscuit 카드뉴스 운영",
    fileName: "Biscuit.zip.mag_카드뉴스_콘텐츠_운영.docx",
    targetRole: "콘텐츠 마케터",
    contentPreview:
      "문제: 복잡한 마케팅 이슈를 요약만 하면 차별성이 약했고 설명을 늘리면 이탈률이 높았다. 타깃: 마케팅 취업 준비생과 주니어 실무자. 실행: 기사와 리포트 평균 6개 출처를 교차 검증하고 문제 제기-배경-데이터-사례-시사점 구조로 카드뉴스를 설계했다. 결과: 대표 콘텐츠 조회 12,400회, 저장 680회, 공유 142회. 역할: 주제 선정, 원고 구조화, 발행 캘린더 운영과 성과 리뷰를 담당했다.",
  },
  {
    name: "자기소개서 첨삭 프로젝트",
    fileName: "브랜드마케터_자기소개서_첨삭_전후.txt",
    targetRole: "브랜드 마케터",
    contentPreview:
      "문제: 자기소개서 초안은 경험 설명이 길고 지원 직무와 연결되는 행동 근거가 약했다. 실행: 상황-문제-행동-결과-직무 연결 구조로 6개 문항을 재배치했다. 결과: 문항별 핵심 메시지를 1개로 제한하고 중복 표현 18개를 제거했다. 피드백: 멘토 검토에서 직무 연결성 4.5/5점으로 평가받았다. 역할: 경험 소재 선별, 문항별 메시지 정의, 수정 전후 문장 비교표 작성을 담당했다.",
  },
  {
    name: "신규 서비스 마케팅 기획",
    fileName: "신규_서비스_마케팅_기획_제안서.pptx",
    targetRole: "마케팅 기획자",
    contentPreview:
      "문제: 신규 서비스의 핵심 가치가 기능 설명 중심으로 전달되어 초기 고객의 사용 이유가 약했다. 타깃: 업무 생산성을 높이고 싶은 대학생과 주니어 직장인. 인사이트: 고객은 기능 수보다 첫 사용에서 해결되는 문제를 먼저 이해할 때 가입 의향이 높아졌다. 전략: 문제 상황별 메시지 3개와 온보딩 캠페인 2단계를 설계했다. 실행: 경쟁 서비스 5개 비교표, 고객 여정, 메시지 테스트 설문을 구성했다. 결과: 설문 42명 중 31명이 문제 중심 메시지를 더 명확하다고 응답했다. 역할: 리서치 설계, 메시지 가설, 실행안 문서화를 담당했다.",
  },
];

function createUploadedFile(scenario, index) {
  return {
    id: `quality-sample-${index}`,
    name: scenario.fileName,
    type: scenario.fileName.split(".").pop()?.toUpperCase() ?? "TXT",
    size: scenario.contentPreview.length * 2,
    uploadedAt: new Date("2026-06-26T09:00:00+09:00").toISOString(),
    status: "분석 완료",
    contentPreview: scenario.contentPreview,
    contentSummary: scenario.contentPreview.slice(0, 220),
  };
}

function buildWorkspace(scenario, file) {
  const workspace = createEmptyProofolioWorkspace();

  return {
    ...workspace,
    userProfile: {
      ...workspace.userProfile,
      name: "포트폴리오 검증 샘플",
      targetRole: scenario.targetRole,
      introduction:
        "문제 정의, 근거 분석, 실행안 설계와 결과 검증을 포트폴리오로 설명하는 지원자입니다.",
      coreStrengths: ["문제 정의", "근거 분석", "실행안 설계"],
      updatedAt: new Date().toISOString(),
    },
    uploadedFiles: [file],
  };
}

const results = scenarios.map((scenario, index) => {
  const file = createUploadedFile(scenario, index);
  const analysis = createMockAnalysis(file, {
    contentPreview: file.contentPreview,
    contentSummary: file.contentSummary,
  });
  const answers = Object.fromEntries(
    analysis.missingQuestions.map((question) => [
      question,
      `${scenario.name}에서 확인한 근거: ${scenario.contentPreview}`,
    ]),
  );
  const portfolio = buildPortfolioOutput(analysis, {
    targetRole: scenario.targetRole,
    userAnswers: answers,
  });
  const workspace = {
    ...buildWorkspace(scenario, file),
    analyses: [analysis],
    questionAnswers: {
      [analysis.id]: answers,
    },
    portfolioOutputs: {
      [analysis.id]: portfolio,
    },
  };
  const audit = getProjectPortfolioAudit({
    analysis,
    output: portfolio,
    workspace,
  });

  return {
    scenario: scenario.name,
    targetRole: scenario.targetRole,
    score: audit.score,
    level: audit.level,
    ready: audit.readyForPortfolio,
    criteria: audit.criteria.map((item) => ({
      label: item.label,
      score: item.score,
      status: item.status,
    })),
    blockers: audit.blockers,
    improvements: audit.improvements,
  };
});

const minimumScore = Math.min(...results.map((result) => result.score));
const failing = results.filter((result) => result.score < 84);

console.table(
  results.map((result) => ({
    scenario: result.scenario,
    targetRole: result.targetRole,
    score: result.score,
    level: result.level,
    ready: result.ready,
    blockers: result.blockers.length,
    improvements: result.improvements.length,
  })),
);

for (const result of results) {
  console.log(`\n[${result.scenario}] ${result.score}/100 · ${result.level}`);
  for (const criterion of result.criteria) {
    console.log(
      `- ${criterion.status} · ${criterion.label}: ${criterion.score}/100`,
    );
  }
  if (result.blockers.length) {
    console.log("차단:", result.blockers.join(" | "));
  }
  if (result.improvements.length) {
    console.log("보완:", result.improvements.join(" | "));
  }
}

console.log(`\nMinimum portfolio quality score: ${minimumScore}/100`);

if (failing.length) {
  console.error(
    `Portfolio quality check failed: ${failing
      .map((result) => `${result.scenario} ${result.score}/100`)
      .join(", ")}`,
  );
  process.exit(1);
}
