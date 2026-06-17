export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;

  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const precision = value >= 10 ? 1 : 2;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

export function formatUploadDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "날짜 정보 없음";

  const koreaTime = new Date(parsed.getTime() + 9 * 60 * 60 * 1000);
  const year = koreaTime.getUTCFullYear();
  const month = String(koreaTime.getUTCMonth() + 1).padStart(2, "0");
  const day = String(koreaTime.getUTCDate()).padStart(2, "0");
  const hour = String(koreaTime.getUTCHours()).padStart(2, "0");
  const minute = String(koreaTime.getUTCMinutes()).padStart(2, "0");

  return `${year}.${month}.${day} ${hour}:${minute}`;
}
