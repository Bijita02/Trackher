export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function stripTime(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function getSortedAnchors(cycle) {
  const raw = cycle.periodStarts && cycle.periodStarts.length > 0
    ? cycle.periodStarts
    : [cycle.lastPeriodStart];
  return [...new Set(raw.map(stripTime))].sort((a, b) => a - b);
}

export function dayInCycle(date, cycle) {
  const anchors = getSortedAnchors(cycle);
  const targetTime = stripTime(date);

  let anchor = null;
  for (let i = anchors.length - 1; i >= 0; i--) {
    if (anchors[i] <= targetTime) {
      anchor = anchors[i];
      break;
    }
  }

  if (anchor === null) {
    anchor = anchors[0];
  }

  const diff = Math.floor((targetTime - anchor) / MS_PER_DAY);
  const mod = ((diff % cycle.cycleLength) + cycle.cycleLength) % cycle.cycleLength;
  return mod + 1;
}

export function ovulationDayFor(cycle) {
  return cycle.cycleLength - 14;
}

export function phaseForDay(day, cycle) {
  const ovulationDay = ovulationDayFor(cycle);
  if (day <= cycle.periodLength) return "menstrual";
  if (day === ovulationDay) return "ovulation";
  if (day >= ovulationDay - 4 && day < ovulationDay) return "fertile";
  if (day < ovulationDay - 4) return "follicular";
  return "luteal";
}

export function groupPhase(phase) {
  return phase === "fertile" || phase === "ovulation" ? "ovulatory" : phase;
}

export function daysUntilNextPeriod(today, cycle) {
  const day = dayInCycle(today, cycle);
  return cycle.cycleLength - day + 1;
}

export function buildPhaseTimeline(cycle, mapPhase = (p) => p) {
  const total = cycle.cycleLength;
  const segments = [];
  let currentKey = null;
  let currentStart = 1;

  for (let day = 1; day <= total; day++) {
    const key = mapPhase(phaseForDay(day, cycle));
    if (key !== currentKey) {
      if (currentKey !== null) {
        segments.push({ key: currentKey, startDay: currentStart, endDay: day - 1 });
      }
      currentKey = key;
      currentStart = day;
    }
  }
  if (currentKey !== null) {
    segments.push({ key: currentKey, startDay: currentStart, endDay: total });
  }

  return segments.map((seg) => ({
    key: seg.key,
    start: ((seg.startDay - 1) / total) * 100,
    width: ((seg.endDay - seg.startDay + 1) / total) * 100,
  }));
}

export function toInputDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromInputDate(value) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d);
}