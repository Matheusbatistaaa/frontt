export const toISODate = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const addDays = (d: Date, n: number): Date => {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + n);
  return copy;
};

export const addMonths = (d: Date, n: number): Date => {
  const copy = new Date(d);
  copy.setMonth(copy.getMonth() + n);
  return copy;
};

export const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const WEEKDAY_NAMES = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export const getWeekDays = (reference: Date): Date[] => {
  const dow = reference.getDay(); 
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  const monday = addDays(reference, diffToMonday);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
};

export const getMonthGridDays = (reference: Date): Date[] => {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const firstDay = new Date(year, month, 1);
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const startDate = addDays(firstDay, -startWeekday);
  const lastDay = new Date(year, month + 1, 0);
  const endWeekday = (lastDay.getDay() + 6) % 7;
  const paddingEnd = 6 - endWeekday;
  const totalDays = startWeekday + lastDay.getDate() + paddingEnd;
  const rowCount = Math.max(35, Math.ceil(totalDays / 7) * 7);
  return Array.from({ length: rowCount }, (_, i) => addDays(startDate, i));
};

export const getMonthDays = (reference: Date): Date[] => {
  return getMonthGridDays(reference);
};

const WEEKDAY_SHORT = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
const MONTH_SHORT = new Intl.DateTimeFormat("pt-BR", { month: "short" });
const MONTH_LONG = new Intl.DateTimeFormat("pt-BR", { month: "long" });

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export const formatDayLabel = (d: Date): string => {
  const weekday = capitalize(WEEKDAY_SHORT.format(d).replace(".", ""));
  return `${weekday} ${d.getDate()}`;
};

export const formatWeekRangeLabel = (days: Date[]): string => {
  const first = days[0]!;
  const last = days[days.length - 1]!;
  const firstMonth = capitalize(MONTH_SHORT.format(first).replace(".", ""));
  const lastMonth = capitalize(MONTH_SHORT.format(last).replace(".", ""));
  return `${first.getDate()} ${firstMonth} — ${last.getDate()} ${lastMonth} ${last.getFullYear()}`;
};

export const formatMonthLabel = (reference: Date): string =>
  capitalize(`${MONTH_LONG.format(reference)} ${reference.getFullYear()}`);
