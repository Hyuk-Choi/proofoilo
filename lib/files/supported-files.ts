export const SUPPORTED_FILE_EXTENSIONS = [
  "ppt",
  "pptx",
  "pdf",
  "docx",
  "txt",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "csv",
  "xls",
  "xlsx",
] as const;

export const ACCEPTED_FILE_TYPES = SUPPORTED_FILE_EXTENSIONS.map(
  (extension) => `.${extension}`,
).join(",");

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
export const MAX_FILES_PER_UPLOAD = 20;

export const SUPPORTED_FILE_GROUPS = [
  {
    label: "PPT",
    extensions: "PPT · PPTX",
    description: "기획 흐름, 슬라이드 구조, 핵심 메시지를 포트폴리오 스토리로 전환",
  },
  {
    label: "PDF",
    extensions: "PDF",
    description: "보고서 맥락, 문제 정의, 전략 제안과 근거를 분석",
  },
  {
    label: "문서",
    extensions: "DOCX · TXT",
    description: "자기소개서 초안, 활동 기록, 프로젝트 설명을 채용 문장으로 재구성",
  },
  {
    label: "이미지",
    extensions: "JPG · PNG · WEBP · GIF",
    description: "카드뉴스, 광고 소재, 캠페인 이미지의 목적과 메시지 방향을 검토",
  },
  {
    label: "데이터",
    extensions: "CSV · XLS · XLSX",
    description: "성과표, 광고 지표, 운영 기록에서 수치 근거와 개선 포인트를 추출",
  },
] as const;

export function getFileExtension(fileName: string) {
  return fileName.split(".").at(-1)?.toLocaleLowerCase("en-US") ?? "";
}

export function getDisplayFileType(fileName: string, mimeType = "") {
  const extension = getFileExtension(fileName);
  if (extension) return extension.toUpperCase();
  if (mimeType.startsWith("image/")) return "IMAGE";
  return "FILE";
}

export function getFileCategory(fileName: string) {
  const extension = getFileExtension(fileName);

  if (extension === "pdf") return "pdf";
  if (extension === "ppt" || extension === "pptx") return "presentation";
  if (extension === "docx" || extension === "txt") return "document";
  if (["jpg", "jpeg", "png", "webp", "gif"].includes(extension)) {
    return "image";
  }
  if (extension === "csv" || extension === "xls" || extension === "xlsx") {
    return "spreadsheet";
  }
  return "unknown";
}
