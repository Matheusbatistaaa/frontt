import { BRAZIL_TIME_ZONE, getDateInBrazil } from "../../lib/dateTime";

const createCivilDate = (year: number, month: number, day: number): Date =>
  new Date(Date.UTC(year, month, day, 12));

export const getTodayInBrazil = (): Date => {
  const [year, month, day] = getDateInBrazil().split("-").map(Number);
  return createCivilDate(year!, month! - 1, day!);
};

export const toISODate = (d: Date): string => {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const addDays = (d: Date, n: number): Date => {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + n);
  return copy;
};

export const addMonths = (d: Date, n: number): Date => {
  const copy = new Date(d);
  copy.setUTCMonth(copy.getUTCMonth() + n);
  return copy;
};

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getUTCFullYear() === b.getUTCFullYear() &&
  a.getUTCMonth() === b.getUTCMonth() &&
  a.getUTCDate() === b.getUTCDate();

export const WEEKDAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export const getWeekDays = (reference: Date): Date[] => {
  const dow = reference.getUTCDay();
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  const monday = addDays(reference, diffToMonday);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
};

export const getMonthGridDays = (reference: Date): Date[] => {
  const year = reference.getUTCFullYear();
  const month = reference.getUTCMonth();
  const firstDay = createCivilDate(year, month, 1);
  const startWeekday = (firstDay.getUTCDay() + 6) % 7;
  const startDate = addDays(firstDay, -startWeekday);
  const lastDay = new Date(Date.UTC(year, month + 1, 0, 12));
  const endWeekday = (lastDay.getUTCDay() + 6) % 7;
  const paddingEnd = 6 - endWeekday;
  const totalDays = startWeekday + lastDay.getUTCDate() + paddingEnd;
  const rowCount = Math.max(35, Math.ceil(totalDays / 7) * 7);
  return Array.from({ length: rowCount }, (_, i) => addDays(startDate, i));
};

export const getMonthDays = (reference: Date): Date[] => {
  return getMonthGridDays(reference);
};

const WEEKDAY_SHORT = new Intl.DateTimeFormat("pt-BR", {
  weekday: "short",
  timeZone: BRAZIL_TIME_ZONE,
});
const MONTH_SHORT = new Intl.DateTimeFormat("pt-BR", {
  month: "short",
  timeZone: BRAZIL_TIME_ZONE,
});
const MONTH_LONG = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  timeZone: BRAZIL_TIME_ZONE,
});

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const formatDayLabel = (d: Date): string => {
  const weekday = capitalize(WEEKDAY_SHORT.format(d).replace(".", ""));
  return `${weekday} ${d.getUTCDate()}`;
};

export const formatWeekRangeLabel = (days: Date[]): string => {
  const first = days[0]!;
  const last = days[days.length - 1]!;
  const firstMonth = capitalize(MONTH_SHORT.format(first).replace(".", ""));
  const lastMonth = capitalize(MONTH_SHORT.format(last).replace(".", ""));
  return `${first.getUTCDate()} ${firstMonth} — ${last.getUTCDate()} ${lastMonth} ${last.getUTCFullYear()}`;
};

export const formatMonthLabel = (reference: Date): string =>
  capitalize(`${MONTH_LONG.format(reference)} ${reference.getUTCFullYear()}`);
