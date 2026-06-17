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
  { label: "PPT", extensions: "PPT · PPTX" },
  { label: "PDF", extensions: "PDF" },
  { label: "문서", extensions: "DOCX · TXT" },
  { label: "이미지", extensions: "JPG · PNG · WEBP · GIF" },
  { label: "데이터", extensions: "CSV · XLS · XLSX" },
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
