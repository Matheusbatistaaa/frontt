export const BRAZIL_TIME_ZONE = "America/Sao_Paulo";

const brazilPartsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: BRAZIL_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

const brazilTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: BRAZIL_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

const brazilDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: BRAZIL_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

type DateParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function getBrazilParts(date: Date): DateParts {
  const values = Object.fromEntries(
    brazilPartsFormatter.formatToParts(date).map((part) => [part.type, part.value])
  );

  return {
    year: Number(values["year"]),
    month: Number(values["month"]),
    day: Number(values["day"]),
    hour: Number(values["hour"]),
    minute: Number(values["minute"]),
    second: Number(values["second"]),
  };
}

function partsAsUtc(parts: DateParts): number {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
}

export function zonedDateTimeToUtc(date: string, time: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const desiredWallTime = Date.UTC(year!, month! - 1, day!, hour!, minute!, 0);

  let utcTime = desiredWallTime;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const realizedWallTime = partsAsUtc(getBrazilParts(new Date(utcTime)));
    utcTime = desiredWallTime - (realizedWallTime - utcTime);
  }

  return new Date(utcTime).toISOString();
}

export function parseTimestamp(value: string | Date): Date {
  if (value instanceof Date) return value;

  const normalized = value.trim();
  const wallTime = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}:\d{2})(?::\d{2})?$/.exec(normalized);
  if (wallTime) return new Date(zonedDateTimeToUtc(wallTime[1]!, wallTime[2]!));

  const dateOnly = /^(\d{4}-\d{2}-\d{2})$/.exec(normalized);
  if (dateOnly) return new Date(zonedDateTimeToUtc(dateOnly[1]!, "00:00"));

  return new Date(value);
}

export function formatTimeInBrazil(value?: string | Date | null): string {
  if (!value) return "---";
  const date = parseTimestamp(value);
  return Number.isNaN(date.getTime()) ? "---" : brazilTimeFormatter.format(date);
}

export function formatDateInBrazil(value?: string | Date | null): string {
  if (!value) return "—";
  const date = parseTimestamp(value);
  return Number.isNaN(date.getTime()) ? "—" : brazilDateFormatter.format(date);
}

export function getDateInBrazil(value: string | Date = new Date()): string {
  const date = parseTimestamp(value);
  const parts = getBrazilParts(date);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}
