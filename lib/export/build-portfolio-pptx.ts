import type {
  CoverLetterOutput,
  FeedbackScore,
  InterviewQuestion,
  PortfolioOutput,
  ProofolioWorkspace,
  ResumeBullet,
} from "@/types/proofolio";
import { getAccuracyReportForAnalysis } from "@/lib/analysis/accuracy-review";
import { getDetailedReviewForAnalysis } from "@/lib/analysis/detailed-review";
import {
  getProjectEvidenceAudit,
  getWorkspaceFinalReadiness,
} from "@/lib/analysis/evidence-audit";
import { getFinalPortfolioAudit } from "@/lib/analysis/final-output-audit";
import {
  getProjectPortfolioAudit,
  getWorkspacePortfolioAudit,
} from "@/lib/analysis/portfolio-output-audit";
import {
  getProjectResearchDepthAudit,
  getWorkspaceResearchDepthAudit,
} from "@/lib/analysis/research-depth-audit";

type SlideBlock = {
  title: string;
  eyebrow?: string;
  bullets?: string[];
  body?: string;
  footer?: string;
};

const encoder = new TextEncoder();

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function cleanLine(value: string, fallback = "") {
  return value.replace(/\s+/g, " ").trim() || fallback;
}

function truncate(value: string, maximum: number) {
  const normalized = cleanLine(value);
  return normalized.length > maximum
    ? `${normalized.slice(0, maximum - 3)}...`
    : normalized;
}

function unique<T>(items: T[]) {
  return [...new Set(items)];
}

function chunkArray<T>(items: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function splitLongText(value: string, maximum = 135) {
  const normalized = cleanLine(value);
  if (!normalized) return [];

  const chunks: string[] = [];
  let remaining = normalized;

  while (remaining.length > maximum) {
    const slice = remaining.slice(0, maximum);
    const breakIndex = Math.max(slice.lastIndexOf(" "), slice.lastIndexOf(","));
    const endIndex = breakIndex > 55 ? breakIndex : maximum;

    chunks.push(remaining.slice(0, endIndex).trim());
    remaining = remaining.slice(endIndex).trim();
  }

  if (remaining) chunks.push(remaining);

  return chunks;
}

function labeledChunks(label: string, value: string, maximum = 135) {
  const chunks = splitLongText(value, maximum);

  if (!chunks.length) return [`${label}: 내용 없음`];

  return chunks.map((chunk, index) =>
    index === 0 ? `${label}: ${chunk}` : `${label} 계속: ${chunk}`,
  );
}

function getRoleDirection(
  targetRole: string,
  skills: string[],
) {
  const normalizedRole = targetRole.toLocaleLowerCase("ko-KR");
  const topSkills = skills.slice(0, 4).join(", ") || "문제 정의, 근거 분석, 실행안 도출";

  if (/퍼포먼스|그로스|performance|growth/.test(normalizedRole)) {
    return `지원 직무 방향: ${targetRole}. 따라서 최종 포트폴리오는 타깃 정의, 성과 지표 해석, 광고·랜딩 개선, 실험 설계 역량이 먼저 보이도록 구성합니다. 핵심 근거는 ${topSkills}입니다.`;
  }

  if (/브랜드|brand|글로벌|global/.test(normalizedRole)) {
    return `지원 직무 방향: ${targetRole}. 따라서 최종 포트폴리오는 시장 이해, 브랜드 포지셔닝, 고객 인사이트, 커뮤니케이션 전략 역량이 먼저 보이도록 구성합니다. 핵심 근거는 ${topSkills}입니다.`;
  }

  if (/콘텐츠|content|sns|커뮤니케이션/.test(normalizedRole)) {
    return `지원 직무 방향: ${targetRole}. 따라서 최종 포트폴리오는 이슈 리서치, 메시지 구조화, 콘텐츠 기획, 독자 반응 검증 역량이 먼저 보이도록 구성합니다. 핵심 근거는 ${topSkills}입니다.`;
  }

  if (/pm|서비스|기획|product/.test(normalizedRole)) {
    return `지원 직무 방향: ${targetRole}. 따라서 최종 포트폴리오는 문제 정의, 사용자·시장 근거, 우선순위 설정, 실행 검증 역량이 먼저 보이도록 구성합니다. 핵심 근거는 ${topSkills}입니다.`;
  }

  return `지원 직무 방향: ${targetRole}. 따라서 최종 포트폴리오는 문제 정의, 근거 기반 판단, 실행안 구조화, 본인 기여도와 검증 가능성이 먼저 보이도록 구성합니다. 핵심 근거는 ${topSkills}입니다.`;
}

function getRoleFitSummary(
  targetRole: string,
  analysisSkills: string[],
  projectType: string,
) {
  return `${targetRole} 관점에서 이 프로젝트는 ${analysisSkills
    .slice(0, 3)
    .join(", ")} 역량을 보여주는 ${projectType} 사례입니다. 최종 덱에서는 활동 자체보다 직무에서 재현 가능한 판단 기준과 본인 기여도를 중심으로 배치합니다.`;
}

function artifactStatusLabel(value: boolean) {
  return value ? "완료" : "미생성";
}

function coverLetterBullets(output?: CoverLetterOutput) {
  if (!output) return ["자기소개서 미생성: Cover Letter 페이지에서 생성하면 최종본 부록에 포함됩니다."];

  return [
    ...labeledChunks("지원동기", output.motivation),
    ...labeledChunks("직무역량", output.competency),
    ...labeledChunks("성과경험", output.achievement),
    ...labeledChunks("협업경험", output.collaboration),
    ...labeledChunks("성장과정", output.growth),
    ...labeledChunks("입사 후 포부", output.futurePlan),
  ];
}

function resumeBullets(output?: ResumeBullet[]) {
  if (!output?.length) return ["이력서 문장 미생성: Resume 페이지에서 생성하면 최종본 부록에 포함됩니다."];

  return output.flatMap((group) => [
    ...labeledChunks("이력서 그룹", group.title),
    ...group.bullets.flatMap((bullet) => labeledChunks("이력서 bullet", bullet)),
    ...labeledChunks("키워드", group.keywords.join(", ")),
  ]);
}

function feedbackBullets(output?: FeedbackScore) {
  if (!output) return ["전문가 피드백 미생성: Feedback 페이지에서 생성하면 점수와 수정 제안이 최종본에 포함됩니다."];

  return [
    `총점: ${output.totalScore}/100`,
    `직무 적합성 ${output.jobFit}/100 · 문제 정의 ${output.problemClarity}/100 · 역할 선명도 ${output.roleClarity}/100`,
    `근거 활용도 ${output.evidenceStrength}/100 · 차별화 ${output.differentiation}/100 · 문장 설득력 ${output.writingPersuasiveness}/100`,
    ...output.comments.flatMap((comment) => labeledChunks("코멘트", comment)),
    ...output.revisionSuggestions.flatMap((suggestion) =>
      labeledChunks("수정 제안", suggestion),
    ),
  ];
}

function interviewBullets(output?: InterviewQuestion[]) {
  if (!output?.length) return ["면접 질문 미생성: Interview 페이지에서 생성하면 대표 질문과 답변 가이드가 포함됩니다."];

  return output.flatMap((question, index) => [
    ...labeledChunks(`Q${index + 1}`, question.question),
    ...question.followUpQuestions.flatMap((followUp) =>
      labeledChunks("꼬리질문", followUp),
    ),
    ...labeledChunks("답변 가이드", question.answerGuide),
    ...labeledChunks("약점 방어", question.weaknessDefense),
  ]);
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function uint16(value: number) {
  return [value & 0xff, (value >>> 8) & 0xff];
}

function uint32(value: number) {
  return [
    value & 0xff,
    (value >>> 8) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 24) & 0xff,
  ];
}

function makeZip(files: Array<{ path: string; content: string }>) {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  files.forEach((file) => {
    const name = encoder.encode(file.path);
    const content = encoder.encode(file.content);
    const checksum = crc32(content);
    const localHeader = new Uint8Array([
      ...uint32(0x04034b50),
      ...uint16(20),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint32(checksum),
      ...uint32(content.length),
      ...uint32(content.length),
      ...uint16(name.length),
      ...uint16(0),
      ...name,
    ]);
    const centralHeader = new Uint8Array([
      ...uint32(0x02014b50),
      ...uint16(20),
      ...uint16(20),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint32(checksum),
      ...uint32(content.length),
      ...uint32(content.length),
      ...uint16(name.length),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint16(0),
      ...uint32(0),
      ...uint32(offset),
      ...name,
    ]);

    localParts.push(localHeader, content);
    centralParts.push(centralHeader);
    offset += localHeader.length + content.length;
  });

  const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
  const endRecord = new Uint8Array([
    ...uint32(0x06054b50),
    ...uint16(0),
    ...uint16(0),
    ...uint16(files.length),
    ...uint16(files.length),
    ...uint32(centralSize),
    ...uint32(offset),
    ...uint16(0),
  ]);
  const allParts = [...localParts, ...centralParts, endRecord];
  const blobParts = allParts.map((part) => {
    const buffer = new ArrayBuffer(part.byteLength);
    new Uint8Array(buffer).set(part);
    return buffer;
  });

  return new Blob(blobParts, {
    type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  });
}

function textParagraph(text: string, size = 1700, level = 0) {
  return `<a:p><a:pPr lvl="${level}"/><a:r><a:rPr lang="ko-KR" sz="${size}" dirty="0"/><a:t>${escapeXml(text)}</a:t></a:r></a:p>`;
}

function solidRect(
  id: number,
  x: number,
  y: number,
  cx: number,
  cy: number,
  fill: string,
) {
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="Block ${id}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="${fill}"/></a:solidFill><a:ln><a:noFill/></a:ln></p:spPr></p:sp>`;
}

function shapeText(
  id: number,
  x: number,
  y: number,
  cx: number,
  cy: number,
  paragraphs: string,
) {
  return `<p:sp><p:nvSpPr><p:cNvPr id="${id}" name="Text ${id}"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/><a:ln><a:noFill/></a:ln></p:spPr><p:txBody><a:bodyPr wrap="square"/><a:lstStyle/>${paragraphs}</p:txBody></p:sp>`;
}

function buildSlideXml(slide: SlideBlock, index: number) {
  const title = textParagraph(slide.title, 2700);
  const eyebrow = slide.eyebrow
    ? shapeText(10, 650000, 295000, 6000000, 360000, textParagraph(slide.eyebrow, 1050))
    : "";
  const bodyParagraphs = [
    slide.body ? textParagraph(slide.body, 1420) : "",
    ...(slide.bullets ?? [])
      .slice(0, 5)
      .map((bullet) => textParagraph(`• ${truncate(bullet, 160)}`, 1320)),
  ].join("");
  const footer = textParagraph(
    slide.footer ?? `Proofolio Consultant Portfolio · ${String(index).padStart(2, "0")}`,
    950,
  );

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld>
    <p:bg><p:bgPr><a:solidFill><a:srgbClr val="F8FBFF"/></a:solidFill><a:effectLst/></p:bgPr></p:bg>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
      ${solidRect(20, 0, 0, 12192000, 235000, "10213D")}
      ${solidRect(21, 570000, 1660000, 11040000, 4140000, "FFFFFF")}
      ${eyebrow}
      ${shapeText(2, 620000, 760000, 10900000, 760000, title)}
      ${shapeText(3, 760000, 1830000, 10480000, 3740000, bodyParagraphs)}
      ${shapeText(4, 700000, 6350000, 10800000, 280000, footer)}
    </p:spTree>
  </p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sld>`;
}

function buildSlides(workspace: ProofolioWorkspace): SlideBlock[] {
  const analyses = workspace.analyses;
  const profile = workspace.userProfile;
  const portfolioOutputs = workspace.portfolioOutputs;
  const readiness = getWorkspaceFinalReadiness(workspace);
  const finalAudit = getFinalPortfolioAudit(workspace);
  const portfolioAudit = getWorkspacePortfolioAudit(workspace);
  const researchAudit = getWorkspaceResearchDepthAudit(workspace);
  const allSkills = unique(
    analyses.flatMap((analysis) => analysis.competencyTags),
  );
  const targetRole = profile.targetRole || "지원 직무";
  const roleDirection = getRoleDirection(targetRole, allSkills);

  const slides: SlideBlock[] = [
    {
      eyebrow: "PROOFOLIO FINAL PORTFOLIO",
      title: `${profile.name || "지원자"} 통합 포트폴리오`,
      body: `${analyses.length}개 업로드 파일과 분석 리포트를 기반으로 ${targetRole} 관점의 문제 정의, 핵심 인사이트, 실행 전략, 본인 역할, 전문가 진단과 보완 질문을 하나의 채용 포트폴리오 덱으로 정리했습니다.`,
      bullets: [
        `목표 직무: ${targetRole}`,
        `핵심 역량: ${allSkills.slice(0, 5).join(", ") || "분석 후 자동 도출"}`,
        `최종본 준비도: ${readiness.score}/100 · ${readiness.level}`,
        `최종 QA: ${finalAudit.score}/100 · ${finalAudit.level}`,
        `포트폴리오 구조 감사: ${portfolioAudit.score}/100 · ${portfolioAudit.level}`,
        `리서치 충분도: ${researchAudit.score}/100 · ${researchAudit.level}`,
        roleDirection,
        `제출 판단: ${finalAudit.readyForSubmission ? "최종 제출 가능" : "보완 후 제출 권장"}`,
      ],
    },
    {
      eyebrow: "RESEARCH DEPTH AUDIT",
      title: "충분한 리서치와 근거 확인",
      body: researchAudit.executiveSummary,
      bullets: [
        `리서치 감사: ${researchAudit.score}/100 · ${researchAudit.level}`,
        `산출물 반영 가능 프로젝트: ${researchAudit.projectAudits.filter((audit) => audit.readyForOutput).length}/${analyses.length}`,
        ...researchAudit.projectAudits
          .slice(0, 3)
          .map(
            (audit) =>
              `${audit.level} · ${audit.projectTitle}: ${audit.score}/100`,
          ),
      ],
    },
    ...chunkArray(
      [
        ...researchAudit.blockers.map((item) => `차단: ${item}`),
        ...researchAudit.improvements.map((item) => `보완: ${item}`),
      ],
      4,
    ).map((items, index) => ({
      eyebrow: `RESEARCH DEPTH AUDIT · ACTION ${String(index + 1).padStart(2, "0")}`,
      title: "리서치 보완 우선순위",
      body:
        index === 0
          ? "아래 항목은 최종 산출물의 신뢰도와 면접 방어력에 직접 영향을 줍니다."
          : "리서치 보완 우선순위 계속",
      bullets: items,
    })),
    {
      eyebrow: "PORTFOLIO STRUCTURE AUDIT",
      title: "포트폴리오 구조 품질 진단",
      body: portfolioAudit.executiveSummary,
      bullets: [
        `포트폴리오 감사: ${portfolioAudit.score}/100 · ${portfolioAudit.level}`,
        ...portfolioAudit.projectAudits
          .slice(0, 4)
          .map(
            (audit) =>
              `${audit.level} · ${audit.projectTitle}: ${audit.score}/100`,
          ),
      ],
    },
    ...chunkArray(
      [
        ...portfolioAudit.blockers.map((item) => `차단: ${item}`),
        ...portfolioAudit.improvements.map((item) => `보완: ${item}`),
      ],
      4,
    ).map((items, index) => ({
      eyebrow: `PORTFOLIO STRUCTURE AUDIT · ACTION ${String(index + 1).padStart(2, "0")}`,
      title: "포트폴리오 구조 보완 권고",
      body:
        index === 0
          ? "아래 항목은 최종 덱이 단순 분석 보고서가 아니라 채용 포트폴리오로 읽히기 위해 필요한 보완입니다."
          : "포트폴리오 구조 보완 권고 계속",
      bullets: items,
    })),
    {
      eyebrow: "FINAL PORTFOLIO QA",
      title: "최종 제출 가능성 진단",
      body: finalAudit.executiveSummary,
      bullets: [
        `QA 점수: ${finalAudit.score}/100 · ${finalAudit.level}`,
        ...finalAudit.criteria
          .slice(0, 4)
          .map((item) => `${item.status} · ${item.label}: ${item.score}/100`),
      ],
    },
    ...chunkArray(
      [
        ...finalAudit.blockers.map((item) => `차단: ${item}`),
        ...finalAudit.improvements.map((item) => `보완: ${item}`),
      ],
      4,
    ).map((items, index) => ({
      eyebrow: `FINAL PORTFOLIO QA · ACTION ${String(index + 1).padStart(2, "0")}`,
      title: "최종 QA 차단 항목과 보완 권고",
      body:
        index === 0
          ? "아래 항목은 완성본의 신뢰도, 직무 적합도, 면접 방어력에 직접 영향을 줍니다."
          : "최종 QA 보완 권고 계속",
      bullets: items,
    })),
    ...chunkArray(finalAudit.criteria, 4).map((items, index) => ({
      eyebrow: `FINAL PORTFOLIO QA · DETAIL ${String(index + 1).padStart(2, "0")}`,
      title: "최종 QA 세부 기준",
      body:
        index === 0
          ? "각 기준은 최종 포트폴리오가 제출 가능한 완성본인지 판단하는 컨설턴트식 체크리스트입니다."
          : "최종 QA 세부 기준 계속",
      bullets: items.map(
        (item) =>
          `${item.label} ${item.score}/100 · ${item.status}: ${item.evidence} / 권고: ${item.recommendation}`,
      ),
    })),
    {
      eyebrow: "FINAL READINESS AUDIT",
      title: "최종본 완성도와 보완 차단 항목",
      body:
        "최종 PPTX는 완성본 형태로 생성되지만, 아래 체크리스트가 남아 있으면 제출 전 보완을 권장합니다. 특히 원문 근거, 성과 수치, 본인 기여도는 면접 검증 가능성이 큰 항목입니다.",
      bullets: [
        `준비도: ${readiness.score}/100 · ${readiness.level}`,
        ...readiness.checklist.map(
          (item) =>
            `${item.done ? "완료" : "보완 필요"} · ${item.label}: ${item.description}`,
        ),
      ],
    },
    ...(readiness.blockers.length || readiness.warnings.length
      ? [
          {
            eyebrow: "FINAL READINESS AUDIT",
            title: "제출 전 보완 권고",
            body:
              "아래 항목은 최종본의 신뢰도와 면접 방어력을 좌우합니다. 보완하지 않아도 다운로드는 가능하지만, 최종 제출본으로 쓰기 전 확인이 필요합니다.",
            bullets: [
              ...readiness.blockers.map((item) => `차단 항목: ${item}`),
              ...readiness.warnings.map((item) => `권장 보완: ${item}`),
            ],
          },
        ]
      : []),
    {
      eyebrow: "TARGET ROLE STRATEGY",
      title: "지원 직무 맞춤 포트폴리오 방향",
      body: roleDirection,
      bullets: [
        "각 프로젝트는 지원 직무에서 평가하는 역량과 연결되는 순서로 재배치",
        "성과 수치가 부족한 경우 확정 성과가 아니라 기대효과와 검증 과제로 구분",
        "본인 역할은 조사, 판단, 실행, 조율, 산출물 단위로 분리",
        "마지막 슬라이드에는 면접에서 보완해야 할 질문과 근거 확보 과제를 정리",
      ],
    },
    {
      eyebrow: "CONSULTANT REVIEW METHOD",
      title: "검토 방식과 작성 원칙",
      bullets: [
        "첨부 파일별 프로젝트 맥락, 파일 형식, 텍스트 미리보기와 분석 리포트를 먼저 검토",
        "문제 정의, 핵심 판단, 실행안, 결과 또는 기대효과, 본인 기여도를 분리",
        "성과 수치가 없는 항목은 확정 성과가 아니라 기대효과 또는 검증 과제로 표기",
        "최종 산출물은 채용 담당자가 빠르게 이해하는 직무 역량 중심 문장으로 재구성",
      ],
    },
    {
      eyebrow: "PORTFOLIO STRUCTURE",
      title: "최종 덱 구성",
      body:
        "이 PPT는 전체 프로젝트를 한 번에 나열하지 않고, 채용 담당자가 빠르게 판단할 수 있도록 핵심 역량과 대표 근거를 먼저 보여준 뒤 프로젝트별 케이스 스터디로 확장합니다.",
      bullets: [
        `전체 분석 프로젝트: ${analyses.length}개`,
        `반복 확인 역량: ${allSkills.slice(0, 6).join(", ") || "분석 결과 생성 필요"}`,
        `직무 맞춤 설계: ${targetRole} 평가 기준에 맞춰 문제 정의, 판단 근거, 실행 결과 순서로 구성`,
        ...analyses
          .slice(0, 3)
          .map(
            (analysis, index) =>
              `대표 케이스 ${index + 1}: ${analysis.projectTitle} · ${analysis.projectType}`,
          ),
      ],
    },
  ];

  analyses.forEach((analysis, index) => {
    const portfolio = portfolioOutputs[analysis.id] as PortfolioOutput | undefined;
    const projectPortfolioAudit = getProjectPortfolioAudit({
      analysis,
      output: portfolio,
      workspace,
    });
    const sourceReview = analysis.sourceReview;
    const expertReview = analysis.expertReview;
    const detailedReview = getDetailedReviewForAnalysis(analysis);
    const accuracyReport = getAccuracyReportForAnalysis(analysis);
    const evidenceAudit = getProjectEvidenceAudit(analysis, workspace);
    const researchDepthAudit = getProjectResearchDepthAudit(
      analysis,
      workspace,
    );
    const coverLetter = workspace.coverLetterOutputs[analysis.id];
    const resume = workspace.resumeBullets[analysis.id];
    const feedback = workspace.feedbackScores[analysis.id];
    const interview = workspace.interviewQuestions[analysis.id];
    const portfolioSummary = portfolio?.onePageSummary ?? "";
    const roleFitSummary = getRoleFitSummary(
      targetRole,
      analysis.competencyTags,
      analysis.projectType,
    );

    slides.push({
      eyebrow: `PROJECT ${String(index + 1).padStart(2, "0")} · EXECUTIVE SUMMARY`,
      title: analysis.projectTitle,
      body: truncate(portfolio?.keyMessage ?? analysis.oneLineSummary, 230),
      bullets: [
        roleFitSummary,
        `포트폴리오 품질: ${projectPortfolioAudit.score}/100 · ${projectPortfolioAudit.level}`,
        `리서치 충분도: ${researchDepthAudit.score}/100 · ${researchDepthAudit.level}`,
        `근거 신뢰도: ${evidenceAudit.score}/100 · ${evidenceAudit.level}`,
        `분석 정확도: ${accuracyReport.overallScore}/100 · ${accuracyReport.level}`,
        `유형: ${analysis.projectType}`,
        `핵심 문제: ${truncate(analysis.problemDefinition, 150)}`,
        `핵심 인사이트: ${truncate(analysis.keyInsight, 150)}`,
      ],
    });

    slides.push({
      eyebrow: `PROJECT ${String(index + 1).padStart(2, "0")} · RESEARCH DEPTH`,
      title: "리서치 충분도와 산출물 사용 판단",
      body: researchDepthAudit.summary,
      bullets: [
        `리서치 점수: ${researchDepthAudit.score}/100 · ${researchDepthAudit.level}`,
        `산출물 판단: ${researchDepthAudit.readyForOutput ? "최종 산출물 반영 가능" : "초안/가설 라벨 병기 필요"}`,
        ...researchDepthAudit.researchBrief.slice(0, 4),
      ],
    });

    chunkArray(researchDepthAudit.criteria, 4).forEach((items, chunkIndex) => {
      slides.push({
        eyebrow: `PROJECT ${String(index + 1).padStart(2, "0")} · RESEARCH CRITERIA ${String(chunkIndex + 1).padStart(2, "0")}`,
        title: "리서치 충분도 세부 기준",
        body:
          chunkIndex === 0
            ? "원문, 출처 다양성, 시장·고객 맥락, 본인 기여와 검증 근거를 항목별로 점검합니다."
            : "리서치 충분도 세부 기준 계속",
        bullets: items.map(
          (item) =>
            `${item.status} · ${item.label}: ${item.score}/100 · ${item.evidence}`,
        ),
      });
    });

    if (
      researchDepthAudit.minimumActions.length ||
      researchDepthAudit.researchGaps.length
    ) {
      slides.push({
        eyebrow: `PROJECT ${String(index + 1).padStart(2, "0")} · RESEARCH ACTIONS`,
        title: "리서치 공백과 보완 액션",
        body:
          "보완되지 않은 항목은 최종본에서 확정 성과가 아니라 기대효과, 가설 또는 검증 계획으로 표기합니다.",
        bullets: [
          ...researchDepthAudit.researchGaps
            .slice(0, 3)
            .map((item) => `공백: ${item}`),
          ...researchDepthAudit.minimumActions
            .slice(0, 4)
            .map((item) => `액션: ${item}`),
        ],
      });
    }

    slides.push({
      eyebrow: `PROJECT ${String(index + 1).padStart(2, "0")} · PORTFOLIO QUALITY`,
      title: "포트폴리오 구조 감사",
      body: projectPortfolioAudit.summary,
      bullets: [
        `품질 점수: ${projectPortfolioAudit.score}/100 · ${projectPortfolioAudit.level}`,
        ...projectPortfolioAudit.criteria
          .slice(0, 4)
          .map(
            (item) =>
              `${item.status} · ${item.label}: ${item.score}/100 · ${item.evidence}`,
          ),
      ],
    });

    chunkArray(projectPortfolioAudit.criteria, 4).forEach((items, chunkIndex) => {
      slides.push({
        eyebrow: `PROJECT ${String(index + 1).padStart(2, "0")} · PORTFOLIO QUALITY ${String(chunkIndex + 1).padStart(2, "0")}`,
        title: "포트폴리오 품질 세부 기준",
        body:
          chunkIndex === 0
            ? "포트폴리오가 채용 담당자에게 문제 해결 역량으로 읽히는지 항목별로 점검합니다."
            : "포트폴리오 품질 세부 기준 계속",
        bullets: items.map(
          (item) =>
            `${item.label} ${item.score}/100 · ${item.status}: ${item.recommendation}`,
        ),
      });
    });

    slides.push({
      eyebrow: `PROJECT ${String(index + 1).padStart(2, "0")} · EVIDENCE AUDIT`,
      title: "근거 신뢰도와 제출 준비도",
      body: `이 프로젝트의 근거 신뢰도는 ${evidenceAudit.score}/100(${evidenceAudit.level}), 분석 정확도는 ${accuracyReport.overallScore}/100(${accuracyReport.level})입니다. 높음 ${evidenceAudit.confidenceCounts["높음"]}개, 중간 ${evidenceAudit.confidenceCounts["중간"]}개, 낮음 ${evidenceAudit.confidenceCounts["낮음"]}개 항목으로 구성되어 있습니다.`,
      bullets: [
        `텍스트 미리보기: ${evidenceAudit.hasTextPreview ? "있음" : "없음"}`,
        `정량 근거: ${evidenceAudit.hasQuantitativeEvidence ? "확인" : "부족"}`,
        `보완 질문 답변: ${evidenceAudit.answeredQuestions}/${evidenceAudit.totalQuestions}`,
        `주장 검증: ${accuracyReport.sourceCoverage.verifiedClaims}/${accuracyReport.sourceCoverage.totalClaims}개 · 직접 근거 ${accuracyReport.sourceCoverage.directEvidenceItems}개 · 추론 ${accuracyReport.sourceCoverage.inferredItems}개`,
        `생성 상태: 포트폴리오 ${artifactStatusLabel(evidenceAudit.generatedArtifacts.portfolio)} · 피드백 ${artifactStatusLabel(evidenceAudit.generatedArtifacts.feedback)} · 이력서 ${artifactStatusLabel(evidenceAudit.generatedArtifacts.resume)}`,
      ],
    });

    slides.push({
      eyebrow: `PROJECT ${String(index + 1).padStart(2, "0")} · ACCURACY REVIEW`,
      title: "분석 정확도와 주장 검증",
      body: truncate(accuracyReport.summary, 260),
      bullets: [
        `검토 항목: ${accuracyReport.sourceCoverage.reviewedItems}개`,
        `직접 근거: ${accuracyReport.sourceCoverage.directEvidenceItems}개`,
        `정량 근거: ${accuracyReport.sourceCoverage.quantitativeEvidenceItems}개`,
        `검증된 주장: ${accuracyReport.sourceCoverage.verifiedClaims}/${accuracyReport.sourceCoverage.totalClaims}개`,
        `텍스트 근거량: ${accuracyReport.sourceCoverage.textPreviewCharacters}자`,
      ],
    });

    chunkArray(accuracyReport.claimChecks, 4).forEach((checks, chunkIndex) => {
      slides.push({
        eyebrow: `PROJECT ${String(index + 1).padStart(2, "0")} · ACCURACY CLAIMS ${String(chunkIndex + 1).padStart(2, "0")}`,
        title: "주장별 정확도 검토",
        body:
          chunkIndex === 0
            ? "최종본에서 확정 표현으로 쓸 수 있는 주장과 보완 후 써야 하는 주장을 구분합니다."
            : "주장별 정확도 검토 계속",
        bullets: checks.map(
          (check) =>
            `${check.label} · ${check.evidenceLevel} · 정확도 ${check.confidence}: ${check.accuracyRisk} / 검증: ${check.verificationAction}`,
        ),
      });
    });

    if (accuracyReport.limitations.length || accuracyReport.verificationActions.length) {
      slides.push({
        eyebrow: `PROJECT ${String(index + 1).padStart(2, "0")} · ACCURACY ACTIONS`,
        title: "정확도 한계와 제출 전 검증 액션",
        body:
          "아래 항목은 전문가 관점에서 최종 제출 전 반드시 확인해야 하는 정확도 리스크입니다.",
        bullets: [
          ...accuracyReport.limitations.map((limitation) => `한계: ${limitation}`),
          ...accuracyReport.verificationActions.map((action) => `액션: ${action}`),
        ],
      });
    }

    if (evidenceAudit.risks.length || evidenceAudit.requiredActions.length) {
      slides.push({
        eyebrow: `PROJECT ${String(index + 1).padStart(2, "0")} · EVIDENCE AUDIT`,
        title: "근거 리스크와 보완 액션",
        body:
          "아래 항목은 최종본에서 확정 성과처럼 쓰면 면접 검증에 취약해질 수 있습니다. 보완 전에는 기대효과, 가설, 검증 과제로 라벨링합니다.",
        bullets: [
          ...evidenceAudit.risks.map((risk) => `리스크: ${risk}`),
          ...evidenceAudit.requiredActions.map((action) => `보완: ${action}`),
        ],
      });
    }

    slides.push({
      eyebrow: `PROJECT ${String(index + 1).padStart(2, "0")} · PORTFOLIO CASE`,
      title: "포트폴리오 케이스 스터디",
      body: truncate(portfolio?.summary ?? roleFitSummary, 240),
      bullets: [
        `문제: ${truncate(portfolio?.problem ?? analysis.problemDefinition, 145)}`,
        `인사이트: ${truncate(portfolio?.insight ?? analysis.keyInsight, 145)}`,
        `전략: ${truncate(portfolio?.strategy ?? analysis.strategy, 145)}`,
        `실행: ${truncate(portfolio?.execution ?? analysis.execution, 145)}`,
        `결과: ${truncate(portfolio?.result ?? analysis.result, 145)}`,
      ],
    });

    slides.push({
      eyebrow: `PROJECT ${String(index + 1).padStart(2, "0")} · STRATEGY`,
      title: "전략, 실행, 역할",
      bullets: [
        `전략 방향: ${truncate(analysis.strategy, 170)}`,
        `실행 내용: ${truncate(analysis.execution, 170)}`,
        `본인 역할: ${truncate(analysis.userRole, 150)}`,
        `결과/기대효과: ${truncate(analysis.result, 150)}`,
      ],
    });

    slides.push({
      eyebrow: `PROJECT ${String(index + 1).padStart(2, "0")} · FULL ANALYSIS MAP`,
      title: "전체 분석 내용 요약",
      body: truncate(
        portfolioSummary ||
          `${analysis.background} ${analysis.problemDefinition} ${analysis.keyInsight} ${analysis.strategy} ${analysis.execution} ${analysis.result}`,
        260,
      ),
      bullets: [
        `배경: ${truncate(analysis.background, 135)}`,
        `타깃: ${truncate(analysis.targetAudience, 135)}`,
        `역량 태그: ${analysis.competencyTags.slice(0, 5).join(", ")}`,
        `포트폴리오 추천: ${truncate(analysis.portfolioRecommendation, 135)}`,
        `전문가 코멘트: ${truncate(analysis.expertComment, 135)}`,
      ],
    });

    slides.push({
      eyebrow: `PROJECT ${String(index + 1).padStart(2, "0")} · SOURCE REVIEW`,
      title: "첨부 파일 검토와 보완 과제",
      bullets: [
        truncate(sourceReview?.reviewScope ?? "파일명과 분석 리포트를 기준으로 검토했습니다.", 170),
        truncate(sourceReview?.evidenceQuality ?? "성과 수치와 출처는 추가 확인이 필요합니다.", 170),
        ...analysis.missingQuestions.slice(0, 3).map((question) => `보완 질문: ${question}`),
      ],
    });

    slides.push({
      eyebrow: `PROJECT ${String(index + 1).padStart(2, "0")} · ITEM-BY-ITEM REVIEW`,
      title: "항목별 정밀 분석",
      body: truncate(
        detailedReview.coverageSummary,
        240,
      ),
      bullets: detailedReview.itemReviews.slice(0, 5).map(
        (item) =>
          `${item.sourceLabel} · ${item.analysisFocus}: ${truncate(item.consultantDiagnosis, 150)}`,
      ),
    });

    chunkArray(detailedReview.itemReviews, 4).forEach((items, chunkIndex) => {
      slides.push({
        eyebrow: `PROJECT ${String(index + 1).padStart(2, "0")} · APPENDIX ${String(chunkIndex + 1).padStart(2, "0")}`,
        title: "전체 항목별 근거 감사",
        body:
          chunkIndex === 0
            ? detailedReview.coverageSummary
            : "이전 슬라이드에 이어 항목별 원문/구성요소, 진단, 활용 방식과 추가 확인 항목을 정리합니다.",
        bullets: items.map(
          (item) =>
            `${item.order}. ${item.sourceLabel} · ${item.analysisFocus} · 신뢰도 ${item.confidence}: ${item.consultantDiagnosis} / 추가 확인: ${item.requiredFollowUp}`,
        ),
      });
    });

    slides.push({
      eyebrow: `PROJECT ${String(index + 1).padStart(2, "0")} · MISSING EVIDENCE`,
      title: "부족한 근거와 추가 확보 과제",
      body:
        "최종본의 신뢰도를 높이려면 아래 근거를 보완해야 합니다. 보완되지 않은 항목은 확정 성과가 아니라 검증 과제로 표기합니다.",
      bullets: detailedReview.missingEvidence.map(
        (gap) => `${gap.area}: ${gap.issue} / 필요 근거: ${gap.requiredEvidence}`,
      ),
    });

    slides.push({
      eyebrow: `PROJECT ${String(index + 1).padStart(2, "0")} · EXPERT DEEP DIVE`,
      title: "전문가 심층 진단",
      body: truncate(
        expertReview?.executiveDiagnosis ??
          "전문가 심층 진단은 파일을 다시 분석하면 자동으로 추가됩니다.",
        260,
      ),
      bullets: [
        truncate(
          expertReview?.hiringRelevance ??
            "지원 직무와 프로젝트 근거의 연결성을 추가 검토해야 합니다.",
          180,
        ),
        ...(expertReview?.risks.slice(0, 3).map((risk) => `리스크: ${risk}`) ?? []),
        ...(expertReview?.portfolioAngles
          .slice(0, 2)
          .map((angle) => `포트폴리오 각도: ${angle}`) ?? []),
      ],
    });

    slides.push({
      eyebrow: `PROJECT ${String(index + 1).padStart(2, "0")} · FINAL PORTFOLIO COPY`,
      title: "최종 포트폴리오 문장",
      body: truncate(
        portfolio?.keyMessage ??
          `${analysis.projectTitle}에서 ${analysis.competencyTags
            .slice(0, 3)
            .join(", ")} 역량을 바탕으로 문제 정의부터 실행안까지 구조화했습니다.`,
        250,
      ),
      bullets: [
        `PPT 문구: ${truncate(portfolio?.pptCopy ?? analysis.oneLineSummary, 155)}`,
        `Notion 문구: ${truncate(portfolio?.notionCopy ?? analysis.portfolioRecommendation, 155)}`,
        `역할 문장: ${truncate(portfolio?.role ?? analysis.userRole, 155)}`,
        `스킬: ${analysis.competencyTags.slice(0, 5).join(", ")}`,
      ],
    });

    if (portfolio?.caseStudy || portfolio?.onePageSummary) {
      chunkArray(
        (portfolio.caseStudy ?? portfolio.onePageSummary)
          .split(/\n+/)
          .map((line) => line.trim())
          .filter(Boolean)
          .flatMap((line) => splitLongText(line, 135)),
        4,
      ).forEach((lines, chunkIndex) => {
        slides.push({
          eyebrow: `PROJECT ${String(index + 1).padStart(2, "0")} · FINAL CASE STUDY ${String(chunkIndex + 1).padStart(2, "0")}`,
          title: "최종 포트폴리오 케이스 스터디",
          body:
            chunkIndex === 0
              ? "Portfolio 페이지에서 생성하거나 수정한 최신 케이스 스터디를 최종본 부록으로 포함합니다."
              : "케이스 스터디 계속",
          bullets: lines,
        });
      });
    }

    chunkArray(coverLetterBullets(coverLetter), 4).forEach((items, chunkIndex) => {
      slides.push({
        eyebrow: `PROJECT ${String(index + 1).padStart(2, "0")} · COVER LETTER ${String(chunkIndex + 1).padStart(2, "0")}`,
        title: "자기소개서 산출물",
        body:
          "프로젝트 경험이 지원 직무 문항으로 어떻게 전환되는지 확인하는 부록입니다.",
        bullets: items,
      });
    });

    chunkArray(resumeBullets(resume), 4).forEach((items, chunkIndex) => {
      slides.push({
        eyebrow: `PROJECT ${String(index + 1).padStart(2, "0")} · RESUME ${String(chunkIndex + 1).padStart(2, "0")}`,
        title: "이력서 bullet point",
        body:
          "채용 담당자가 빠르게 읽을 수 있도록 문제, 행동, 결과와 역량 키워드를 압축한 문장입니다.",
        bullets: items,
      });
    });

    chunkArray(feedbackBullets(feedback), 4).forEach((items, chunkIndex) => {
      slides.push({
        eyebrow: `PROJECT ${String(index + 1).padStart(2, "0")} · FEEDBACK ${String(chunkIndex + 1).padStart(2, "0")}`,
        title: "전문가 피드백과 수정 제안",
        body:
          "최종 제출 전 직무 적합성, 근거 강도, 역할 선명도와 문장 설득력을 점검한 결과입니다.",
        bullets: items,
      });
    });

    chunkArray(interviewBullets(interview), 4).forEach((items, chunkIndex) => {
      slides.push({
        eyebrow: `PROJECT ${String(index + 1).padStart(2, "0")} · INTERVIEW ${String(chunkIndex + 1).padStart(2, "0")}`,
        title: "면접 예상 질문과 답변 가이드",
        body:
          "프로젝트 근거와 한계를 면접에서 방어할 수 있도록 대표 질문, 꼬리질문과 답변 가이드를 포함합니다.",
        bullets: items,
      });
    });
  });

  slides.push({
    eyebrow: "INTEGRATED POSITIONING",
    title: "통합 직무 역량 포지셔닝",
    body: roleDirection,
    bullets: [
      `반복 확인 역량: ${allSkills.slice(0, 7).join(", ") || "분석 결과 생성 필요"}`,
      workspace.personalBrand?.positioning ??
        "프로젝트별 문제 정의와 실행안을 하나의 커리어 메시지로 연결해야 합니다.",
      workspace.skillAnalysis?.summary ??
        "스킬 분석을 생성하면 역량별 강도와 보완 우선순위를 함께 제시할 수 있습니다.",
    ],
  });

  slides.push({
    eyebrow: "NEXT REVISION PRIORITIES",
    title: `${targetRole} 지원 전 최종 보완 우선순위`,
    bullets: [
      "각 프로젝트의 성과 문장에 기준 시점, 비교 대상, 수치와 출처를 추가",
      "팀 활동과 본인의 직접 의사결정, 작성 산출물, 조율 범위를 분리",
      "대표 프로젝트 2~3개는 문제-인사이트-전략-실행-결과가 한 화면에서 이어지도록 시각화",
      "면접에서는 검증하지 못한 항목을 인정하고 후속 테스트 계획까지 제시",
    ],
  });

  return slides;
}

function contentTypesXml(slideCount: number) {
  const slideOverrides = Array.from({ length: slideCount }, (_, index) =>
    `<Override PartName="/ppt/slides/slide${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`,
  ).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
  <Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  <Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>
  <Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>
  <Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>
  ${slideOverrides}
</Types>`;
}

function presentationXml(slideCount: number) {
  const slideIds = Array.from({ length: slideCount }, (_, index) =>
    `<p:sldId id="${256 + index}" r:id="rId${index + 2}"/>`,
  ).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>
  <p:sldIdLst>${slideIds}</p:sldIdLst>
  <p:sldSz cx="12192000" cy="6858000" type="wide"/>
  <p:notesSz cx="6858000" cy="9144000"/>
</p:presentation>`;
}

function presentationRelsXml(slideCount: number) {
  const slideRels = Array.from({ length: slideCount }, (_, index) =>
    `<Relationship Id="rId${index + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${index + 1}.xml"/>`,
  ).join("");

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>
  ${slideRels}
</Relationships>`;
}

const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

const coreXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
  <dc:title>Proofolio Final Portfolio</dc:title>
  <dc:creator>Proofolio Simulation Consultant</dc:creator>
  <cp:lastModifiedBy>Proofolio</cp:lastModifiedBy>
  <dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created>
  <dcterms:modified xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:modified>
</cp:coreProperties>`;

const appXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes">
  <Application>Proofolio</Application>
  <PresentationFormat>Widescreen</PresentationFormat>
</Properties>`;

const slideLayoutXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`;

const slideLayoutRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`;

const slideMasterXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/><p:sldLayoutIdLst><p:sldLayoutId id="1" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>`;

const slideMasterRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>`;

const themeXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Proofolio"><a:themeElements><a:clrScheme name="Proofolio"><a:dk1><a:srgbClr val="10213D"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="263853"/></a:dk2><a:lt2><a:srgbClr val="F4F7FB"/></a:lt2><a:accent1><a:srgbClr val="2563EB"/></a:accent1><a:accent2><a:srgbClr val="15966F"/></a:accent2><a:accent3><a:srgbClr val="7157D9"/></a:accent3><a:accent4><a:srgbClr val="C77B0D"/></a:accent4><a:accent5><a:srgbClr val="52657D"/></a:accent5><a:accent6><a:srgbClr val="8EB5FF"/></a:accent6><a:hlink><a:srgbClr val="2563EB"/></a:hlink><a:folHlink><a:srgbClr val="7157D9"/></a:folHlink></a:clrScheme><a:fontScheme name="Proofolio"><a:majorFont><a:latin typeface="Arial"/><a:ea typeface="Malgun Gothic"/><a:cs typeface="Arial"/></a:majorFont><a:minorFont><a:latin typeface="Arial"/><a:ea typeface="Malgun Gothic"/><a:cs typeface="Arial"/></a:minorFont></a:fontScheme><a:fmtScheme name="Proofolio"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>`;

export function buildPortfolioPptx(workspace: ProofolioWorkspace) {
  const slides = buildSlides(workspace);
  const files = [
    { path: "[Content_Types].xml", content: contentTypesXml(slides.length) },
    { path: "_rels/.rels", content: rootRelsXml },
    { path: "docProps/core.xml", content: coreXml },
    { path: "docProps/app.xml", content: appXml },
    { path: "ppt/presentation.xml", content: presentationXml(slides.length) },
    {
      path: "ppt/_rels/presentation.xml.rels",
      content: presentationRelsXml(slides.length),
    },
    { path: "ppt/slideMasters/slideMaster1.xml", content: slideMasterXml },
    {
      path: "ppt/slideMasters/_rels/slideMaster1.xml.rels",
      content: slideMasterRelsXml,
    },
    { path: "ppt/slideLayouts/slideLayout1.xml", content: slideLayoutXml },
    {
      path: "ppt/slideLayouts/_rels/slideLayout1.xml.rels",
      content: slideLayoutRelsXml,
    },
    { path: "ppt/theme/theme1.xml", content: themeXml },
    ...slides.flatMap((slide, index) => [
      {
        path: `ppt/slides/slide${index + 1}.xml`,
        content: buildSlideXml(slide, index + 1),
      },
      {
        path: `ppt/slides/_rels/slide${index + 1}.xml.rels`,
        content:
          '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>',
      },
    ]),
  ];

  return makeZip(files);
}

export function getPortfolioPptxFileName(workspace: ProofolioWorkspace) {
  const name = cleanLine(workspace.userProfile.name, "proofolio")
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "-");

  return `${name || "proofolio"}-final-portfolio.pptx`;
}
