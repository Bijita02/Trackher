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

export function getCycleNotifications(cycle, today = new Date()) {
  const notifications = [];
  if (!cycle || !cycle.lastPeriodStart || !cycle.cycleLength || !cycle.periodLength) {
    return notifications;
  }

  const anchors = getSortedAnchors(cycle);
  const lastAnchor = anchors[anchors.length - 1];
  const daysSinceAnchor = Math.floor((stripTime(today) - lastAnchor) / MS_PER_DAY);

  const day = dayInCycle(today, cycle);
  const rawPhase = phaseForDay(day, cycle);
  const groupedPhase = groupPhase(rawPhase);
  const ovulationDay = ovulationDayFor(cycle);
  const daysToOvulation = ovulationDay - day;
  const daysToNextPeriod = daysUntilNextPeriod(today, cycle);
  const fertileWindowStartDay = ovulationDay - 4;

  // --- Late period detection ---
  const isLate = daysSinceAnchor > cycle.cycleLength + 2 && daysSinceAnchor < cycle.cycleLength * 2;

  if (isLate) {
    notifications.push({
      id: "period-late",
      icon: "🌙",
      title: "Your period seems late",
      message: "Your period is a few days later than usual. Take a breath, or tap to log a test if needed.",
    });
  }

  // --- Menstrual phase: on-period status ---
  if (rawPhase === "menstrual") {
    notifications.push({
      id: "on-period",
      icon: "🩸",
      title: day === 1 ? "Period started" : "On your period",
      message:
        day === 1
          ? "Today marks day 1 of your period."
          : `You're on day ${day} of your period.`,
    });
  } else if (!isLate && daysToNextPeriod >= 1 && daysToNextPeriod <= 3) {
    notifications.push({
      id: "period-heads-up",
      icon: "📅",
      title: "Upcoming period",
      message: `Friendly reminder: your cycle is predicted to start in ${daysToNextPeriod} day${
        daysToNextPeriod === 1 ? "" : "s"
      }. Time to prep!`,
    });
  }

  // --- Fertile window / ovulation ---
  if (rawPhase === "ovulation") {
    notifications.push({
      id: "ovulation-today",
      icon: "🌸",
      title: "Ovulation day",
      message: "Today is your predicted ovulation day — peak fertility.",
    });
  } else if (rawPhase === "fertile") {
    const justStarted = day === fertileWindowStartDay;
    notifications.push({
      id: "fertile-window",
      icon: justStarted ? "✨" : "🌱",
      title: justStarted ? "Fertile window has started" : "Fertile window",
      message: justStarted
        ? "Heads up! You're entering your fertile window starting today."
        : `You're in your fertile window. Ovulation expected in ${daysToOvulation} day${
            daysToOvulation === 1 ? "" : "s"
          }.`,
    });
  }

  // --- Cycle-syncing / wellness tips per phase ---
  if (rawPhase === "follicular") {
    notifications.push({
      id: "follicular-tip",
      icon: "⚡",
      title: "Follicular phase",
      message: "Your energy might be peaking — great time for a new workout routine.",
    });
  }

  if (groupedPhase === "luteal" && daysToNextPeriod > 5) {
    notifications.push({
      id: "luteal-tip",
      icon: "🍫",
      title: "Pre-menstrual phase",
      message: "Be extra gentle with yourself, and maybe reach for some dark chocolate.",
    });
  }

  if (groupedPhase === "luteal" && daysToNextPeriod >= 2 && daysToNextPeriod <= 5) {
    notifications.push({
      id: "pms-warning",
      icon: "💢",
      title: "PMS symptoms may start soon",
      message: "Your period is approaching — watch for mood changes, bloating, or fatigue.",
    });
  }

  notifications.push({
    id: "log-symptoms-reminder",
    icon: "📝",
    title: "How are you feeling?",
    message: "Tap to log today's symptoms and flow.",
    actionLabel: "Log symptoms",
    actionPath: "/symptoms",
  });

  return notifications;
}

// --- Symptom-driven notifications ---
// These are generated from the symptoms you log most often across all your
// entries, so the bell surfaces patterns worth paying attention to instead
// of generic tips.
const SYMPTOM_TIPS = {
  Migraines: { icon: "🧊", title: "You often log Migraines", message: "Try resting in a dark, quiet room when they hit." },
  Headache: { icon: "🧊", title: "You often log Headaches", message: "Staying hydrated and resting your eyes may help." },
  Cramps: { icon: "🔥", title: "You often log Cramps", message: "A heating pad or gentle stretching tends to ease this." },
  "Abdominal cramps": { icon: "🔥", title: "You often log Cramps", message: "A heating pad or gentle stretching tends to ease this." },
  Nausea: { icon: "🍵", title: "You often log Nausea", message: "Ginger tea or small, bland snacks can help settle your stomach." },
  Anxious: { icon: "🌬️", title: "You often log feeling Anxious", message: "A few minutes of slow, deep breathing may help you reset." },
  Stress: { icon: "🌬️", title: "You often log Stress", message: "Short walks or deep breathing could help you unwind." },
  Insomnia: { icon: "🌙", title: "You often log Insomnia", message: "A screen-free wind-down routine before bed may help." },
  Fatigue: { icon: "🔋", title: "You often log Fatigue", message: "Listen to your body — extra rest may be worth prioritizing." },
  "Low energy": { icon: "🔋", title: "You often log Low energy", message: "Be gentle with yourself and prioritize rest where you can." },
  "Mood swings": { icon: "🎢", title: "You often log Mood swings", message: "It's okay to feel this way — be kind to yourself." },
  "Low mood": { icon: "💗", title: "You often log Low mood", message: "Consider reaching out to someone you trust, or take time for yourself." },
  "Heavy flow": { icon: "🩸", title: "You often log Heavy flow", message: "Make sure to stay comfortable and change protection regularly." },
  Bloating: { icon: "🎈", title: "You often log Bloating", message: "Peppermint tea or a short walk may help ease bloating." },
  Backaches: { icon: "🦴", title: "You often log Backaches", message: "Gentle stretching or a warm compress may help." },
  "Lower back pain": { icon: "🦴", title: "You often log Lower back pain", message: "Gentle stretching or a warm compress may help." },
  Diarrhea: { icon: "🧻", title: "You often log Diarrhea", message: "Stay hydrated and stick to bland, easy-to-digest foods." },
  Constipation: { icon: "💩", title: "You often log Constipation", message: "Fiber, water, and gentle movement can help." },
  Irritable: { icon: "😤", title: "You often log feeling Irritable", message: "A short break or change of scene might help you reset." },
  "Tender breasts": { icon: "🎗️", title: "You often log Tender breasts", message: "A supportive bra may help ease the discomfort." },
};

/**
 * Computes which symptom tags appear most often across all logs and
 * returns notifications for the top ones. Mirrors the "frequent tags"
 * logic already used in SymptomsPage, so the bell stays consistent with
 * what the person sees there.
 *
 * @param {Array} allLogs - full array of symptom logs from the API
 * @param {number} topN - how many top symptoms to surface (default 3)
 * @param {number} minCount - minimum times a tag must appear to qualify (default 2)
 */
export function getSymptomBasedNotifications(allLogs, topN = 3, minCount = 2) {
  const notifications = [];
  if (!Array.isArray(allLogs) || allLogs.length === 0) {
    return notifications;
  }

  const counts = new Map();
  for (const log of allLogs) {
    for (const tag of log.tags || []) {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }

  const topTags = [...counts.entries()]
    .filter(([, count]) => count >= minCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN);

  for (const [tag, count] of topTags) {
    const tip = SYMPTOM_TIPS[tag];
    if (tip) {
      notifications.push({
        id: `symptom-freq-${tag.toLowerCase().replace(/\s+/g, "-")}`,
        icon: tip.icon,
        title: tip.title,
        message: `${tip.message} (logged ${count} times)`,
      });
    } else {
      // Fallback for tags without a specific tip (e.g. custom symptoms)
      notifications.push({
        id: `symptom-freq-${tag.toLowerCase().replace(/\s+/g, "-")}`,
        icon: "📝",
        title: `You often log "${tag}"`,
        message: `This has come up ${count} times in your logs.`,
      });
    }
  }

  return notifications;
}