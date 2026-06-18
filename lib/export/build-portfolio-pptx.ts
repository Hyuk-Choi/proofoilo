import type {
  PortfolioOutput,
  ProofolioWorkspace,
} from "@/types/proofolio";

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
  const title = textParagraph(slide.title, 2500);
  const eyebrow = slide.eyebrow
    ? shapeText(10, 640000, 280000, 5600000, 360000, textParagraph(slide.eyebrow, 1050))
    : "";
  const bodyParagraphs = [
    slide.body ? textParagraph(slide.body, 1450) : "",
    ...(slide.bullets ?? []).slice(0, 6).map((bullet) => textParagraph(`• ${bullet}`, 1380)),
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
      ${eyebrow}
      ${shapeText(2, 620000, 760000, 10900000, 760000, title)}
      ${shapeText(3, 700000, 1750000, 10800000, 3900000, bodyParagraphs)}
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
  const allSkills = unique(
    analyses.flatMap((analysis) => analysis.competencyTags),
  );
  const targetRole = profile.targetRole || "지원 직무";

  const slides: SlideBlock[] = [
    {
      eyebrow: "PROOFOLIO FINAL PORTFOLIO",
      title: `${profile.name || "지원자"} 통합 포트폴리오`,
      body: `${analyses.length}개 업로드 파일과 분석 리포트를 기반으로 ${targetRole} 관점의 문제 정의, 핵심 인사이트, 실행 전략, 본인 역할과 보완 질문을 하나의 채용 포트폴리오 덱으로 정리했습니다.`,
      bullets: [
        `목표 직무: ${targetRole}`,
        `핵심 역량: ${allSkills.slice(0, 5).join(", ") || "분석 후 자동 도출"}`,
        "작성 기준: 전문 컨설턴트 관점, 사실·추론·제안·검증 상태 분리",
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
  ];

  analyses.forEach((analysis, index) => {
    const portfolio = portfolioOutputs[analysis.id] as PortfolioOutput | undefined;
    const sourceReview = analysis.sourceReview;

    slides.push({
      eyebrow: `PROJECT ${String(index + 1).padStart(2, "0")} · EXECUTIVE SUMMARY`,
      title: analysis.projectTitle,
      body: truncate(portfolio?.keyMessage ?? analysis.oneLineSummary, 230),
      bullets: [
        `유형: ${analysis.projectType}`,
        `핵심 문제: ${truncate(analysis.problemDefinition, 150)}`,
        `핵심 인사이트: ${truncate(analysis.keyInsight, 150)}`,
        `역량 태그: ${analysis.competencyTags.slice(0, 4).join(", ")}`,
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
      eyebrow: `PROJECT ${String(index + 1).padStart(2, "0")} · SOURCE REVIEW`,
      title: "첨부 파일 검토와 보완 과제",
      bullets: [
        truncate(sourceReview?.reviewScope ?? "파일명과 분석 리포트를 기준으로 검토했습니다.", 170),
        truncate(sourceReview?.evidenceQuality ?? "성과 수치와 출처는 추가 확인이 필요합니다.", 170),
        ...analysis.missingQuestions.slice(0, 3).map((question) => `보완 질문: ${question}`),
      ],
    });
  });

  slides.push({
    eyebrow: "INTEGRATED POSITIONING",
    title: "통합 직무 역량 포지셔닝",
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
    title: "최종 보완 우선순위",
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
  <dc:creator>Proofolio OpenAI Mock Consultant</dc:creator>
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
