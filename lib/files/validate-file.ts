import type { UploadedFile } from "../../types/proofolio";
import {
  getFileExtension,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_UPLOAD,
  SUPPORTED_FILE_EXTENSIONS,
} from "./supported-files";

export type FileValidationResult = {
  validFiles: File[];
  errors: string[];
};

function isSupportedFile(file: File) {
  const extension = getFileExtension(file.name);
  return SUPPORTED_FILE_EXTENSIONS.some((item) => item === extension);
}

export function validateFiles(
  files: File[],
  existingFiles: UploadedFile[],
): FileValidationResult {
  const validFiles: File[] = [];
  const errors: string[] = [];
  const incomingFiles = files.slice(0, MAX_FILES_PER_UPLOAD);
  const existingKeys = new Set(
    existingFiles.map((file) => `${file.name.toLocaleLowerCase()}-${file.size}`),
  );

  if (files.length > MAX_FILES_PER_UPLOAD) {
    errors.push(
      `한 번에 최대 ${MAX_FILES_PER_UPLOAD}개 파일까지 추가할 수 있습니다.`,
    );
  }

  for (const file of incomingFiles) {
    const key = `${file.name.toLocaleLowerCase()}-${file.size}`;

    if (!isSupportedFile(file)) {
      errors.push(`${file.name}: 지원하지 않는 파일 형식입니다.`);
      continue;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      errors.push(`${file.name}: 파일당 최대 용량은 25MB입니다.`);
      continue;
    }

    if (existingKeys.has(key)) {
      errors.push(`${file.name}: 동일한 파일이 이미 업로드되어 있습니다.`);
      continue;
    }

    existingKeys.add(key);
    validFiles.push(file);
  }

  return { validFiles, errors };
}
