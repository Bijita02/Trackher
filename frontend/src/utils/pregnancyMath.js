import { MS_PER_DAY, stripTime, addDays, toInputDate, fromInputDate } from "./cycleMath";

export { MS_PER_DAY, stripTime, addDays, toInputDate, fromInputDate };

export const TOTAL_PREGNANCY_DAYS = 280; 

export function pregnancyStartFor(dueDate) {
  return addDays(dueDate, -TOTAL_PREGNANCY_DAYS);
}

export function dayInPregnancy(date, pregnancy) {
  const start = pregnancyStartFor(pregnancy.dueDate);
  return Math.floor((stripTime(date) - stripTime(start)) / MS_PER_DAY) + 1;
}

export function weekForDay(day) {
  return Math.min(40, Math.max(1, Math.ceil(day / 7)));
}

export function trimesterForWeek(week) {
  if (week <= 13) return "first";
  if (week <= 27) return "second";
  return "third";
}

export function daysUntilDue(today, pregnancy) {
  const day = dayInPregnancy(today, pregnancy);
  return Math.max(0, TOTAL_PREGNANCY_DAYS - day);
}

export const MILESTONES = [
  { label: "3rd trimester begins", day: 190 },
  { label: "Full term (week 39)", day: 267 },
  { label: "Due date", day: 280 },
];

export function upcomingMilestones(todayDay) {
  return MILESTONES
    .map((m) => ({ name: m.label, days: m.day - todayDay }))
    .filter((m) => m.days > 0)
    .sort((a, b) => a.days - b.days);
}