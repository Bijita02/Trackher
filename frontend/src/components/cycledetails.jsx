import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Droplet, Sparkles, Leaf, Moon, Pencil, Check, X, Loader2 } from "lucide-react";
import {
  dayInCycle,
  stripTime,
  phaseForDay,
  addDays,
  daysUntilNextPeriod,
  toInputDate,
  fromInputDate,
} from "../utils/cycleMath";

const PHASE = {
  menstrual: { label: "Menstrual", color: "#E23670", soft: "#FCE1EA", icon: Droplet },
  follicular: { label: "Follicular", color: "#8C7CD6", soft: "#EAE5FA", icon: Leaf },
  fertile: { label: "Fertile window", color: "#F2A93B", soft: "#FDF0DC", icon: Sparkles },
  ovulation: { label: "Ovulation", color: "#F2A93B", soft: "#FDF0DC", icon: Sparkles },
  luteal: { label: "Luteal", color: "#B96C87", soft: "#F6E4EA", icon: Moon },
};

export default function Cycledetails({
  lastPeriodStart,
  cycleLength,
  periodLength,
  history = [],           // NEW: real logged period dates, e.g. user.cycleInfo.history
  apiBaseUrl = "/api",
  authToken,
  onCycleUpdate,
}) {
  const today = useMemo(() => new Date(), []);
  const [localLastPeriod, setLocalLastPeriod] = useState(null);
  const [localHistory, setLocalHistory] = useState(null); // NEW: mirrors saved history immediately

  const resolvedLastPeriod = localLastPeriod || lastPeriodStart || new Date(2026, 5, 28);
  const resolvedHistory = localHistory || history;

  // NEW: every known real period-start date, so past months anchor to
  // what actually happened instead of being extrapolated from the newest one
  const periodStarts = useMemo(() => {
    const dates = [resolvedLastPeriod, ...resolvedHistory.map((h) => new Date(h.date))];
    return dates.filter((d) => d instanceof Date && !isNaN(d));
  }, [resolvedLastPeriod, resolvedHistory]);

  const CYCLE = {
    lastPeriodStart: resolvedLastPeriod,
    periodStarts,
    cycleLength: cycleLength || 28,
    periodLength: periodLength || 5,
  };

  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState(() => toInputDate(today));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const todayCycleDay = dayInCycle(today, CYCLE);
  const todayPhase = phaseForDay(todayCycleDay, CYCLE);
  const untilNext = daysUntilNextPeriod(today, CYCLE);
  const nextPeriodDate = addDays(today, untilNext);
  const isOnPeriod = todayPhase === "menstrual";

  const grid = useMemo(() => buildMonthGrid(viewDate), [viewDate]);

  async function handleSavePeriod() {
    if (!editDate) {
      setSaveError("Please pick a date.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const res = await fetch(`${apiBaseUrl}/user-cycle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          lastPeriod: editDate,
          cycleLength: CYCLE.cycleLength,
          periodLength: CYCLE.periodLength,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Couldn't save your period date. Please try again.");
      }

      const savedUser = data.user || data;
      const newLastPeriod = fromInputDate(editDate);

      setLocalLastPeriod(newLastPeriod);
      // Keep local history in sync immediately too, so the calendar reflects
      // the fix instantly without waiting for a full user refetch.
      setLocalHistory(savedUser?.cycleInfo?.history || [...resolvedHistory, { date: editDate }]);
      setIsEditing(false);
      onCycleUpdate?.(savedUser);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function openEditor() {
    setEditDate(toInputDate(today));
    setSaveError(null);
    setIsEditing(true);
  }

  function cancelEditor() {
    setIsEditing(false);
    setSaveError(null);
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
        .fr-display { font-family: 'Fraunces', serif; }
      `}</style>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="fr-display text-3xl" style={{ color: "#241220" }}>Cycle calendar</h1>
            <p className="text-sm mt-1" style={{ color: "#8F8290" }}>
              Day {todayCycleDay} of {CYCLE.cycleLength} · {PHASE[todayPhase].label} phase
            </p>
          </div>
          <div
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{ background: "#FCE1EA", color: "#E23670" }}
          >
            {isOnPeriod
              ? `On day ${todayCycleDay} of your period`
              : `Next period in ${untilNext} day${untilNext === 1 ? "" : "s"} · ${nextPeriodDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #FDE3EC" }}>
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                className="p-2 rounded-full hover:bg-rose-50 transition"
                aria-label="Previous month"
              >
                <ChevronLeft size={18} color="#8F8290" />
              </button>
              <span className="fr-display text-lg" style={{ color: "#241220" }}>{monthLabel}</span>
              <button
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                className="p-2 rounded-full hover:bg-rose-50 transition"
                aria-label="Next month"
              >
                <ChevronRight size={18} color="#8F8290" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={i} className="text-center text-xs font-medium py-1" style={{ color: "#B7A8B1" }}>{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {grid.map((cell, i) => {
                if (!cell.date) return <div key={i} />;
                const phase = phaseForDay(dayInCycle(cell.date, CYCLE), CYCLE);
                const isToday = stripTime(cell.date) === stripTime(today);
                const p = PHASE[phase];
                return (
                  <div
                    key={i}
                    className="aspect-square rounded-lg flex flex-col items-center justify-center relative text-sm"
                    style={{
                      background: p.soft,
                      color: "#241220",
                      outline: isToday ? `2px solid ${p.color}` : "none",
                      outlineOffset: "-2px",
                    }}
                  >
                    <span style={{ fontWeight: isToday ? 700 : 500 }}>{cell.date.getDate()}</span>
                    {phase === "menstrual" && (
                      <span className="absolute bottom-1 w-1 h-1 rounded-full" style={{ background: p.color }} />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap gap-4 mt-5 pt-5" style={{ borderTop: "1px solid #FBE7EF" }}>
              {["menstrual", "follicular", "fertile", "luteal"].map((key) => (
                <div key={key} className="flex items-center gap-2 text-xs" style={{ color: "#8F8290" }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: PHASE[key].color }} />
                  {PHASE[key].label}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-6 flex flex-col items-center justify-center" style={{ background: "#fff", border: "1px solid #FDE3EC" }}>
            <div className="w-full flex justify-end mb-1">
              {!isEditing && (
                <button
                  onClick={openEditor}
                  className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full hover:bg-rose-50 transition"
                  style={{ color: "#B96C87" }}
                >
                  <Pencil size={12} /> Log period
                </button>
              )}
            </div>

            <PhaseRing cycle={CYCLE} today={today} phase={todayPhase} />
            <p className="fr-display text-xl mt-4" style={{ color: PHASE[todayPhase].color }}>{PHASE[todayPhase].label}</p>
            <p className="text-sm text-center mt-1" style={{ color: "#8F8290" }}>
              Cycle day {todayCycleDay} of {CYCLE.cycleLength}
            </p>

            {isEditing && (
              <div className="w-full mt-5 pt-5" style={{ borderTop: "1px solid #FBE7EF" }}>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#8F8290" }}>
                  Period started on
                </label>
                <input
                  type="date"
                  value={editDate}
                  max={toInputDate(today)}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full text-sm px-3 py-2 rounded-lg outline-none"
                  style={{ border: "1px solid #FDE3EC", color: "#241220" }}
                />

                {saveError && (
                  <p className="text-xs mt-2" style={{ color: "#E23670" }}>{saveError}</p>
                )}

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleSavePeriod}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-lg transition disabled:opacity-60"
                    style={{ background: "#E23670", color: "#fff" }}
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={cancelEditor}
                    disabled={saving}
                    className="flex items-center justify-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition disabled:opacity-60"
                    style={{ background: "#FCE1EA", color: "#8F8290" }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PhaseRing({ cycle, today, phase }) {
  const size = 160;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;

  const ovulationDay = cycle.cycleLength - 14;
  const segments = [
    { key: "menstrual", start: 0, end: cycle.periodLength },
    { key: "follicular", start: cycle.periodLength, end: ovulationDay - 4 },
    { key: "fertile", start: ovulationDay - 4, end: ovulationDay },
    { key: "luteal", start: ovulationDay, end: cycle.cycleLength },
  ];

  const todayDay = dayInCycle(today, cycle);
  const todayAngle = (todayDay / cycle.cycleLength) * 360 - 90;
  const markerX = c + r * Math.cos((todayAngle * Math.PI) / 180);
  const markerY = c + r * Math.sin((todayAngle * Math.PI) / 180);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((seg) => {
        const len = ((seg.end - seg.start) / cycle.cycleLength) * circumference;
        const gap = 3;
        const offset = (seg.start / cycle.cycleLength) * circumference;
        return (
          <circle
            key={seg.key}
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={PHASE[seg.key].color}
            strokeWidth={stroke}
            strokeDasharray={`${Math.max(len - gap, 0)} ${circumference - len + gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${c} ${c})`}
          />
        );
      })}
      <circle cx={markerX} cy={markerY} r={6} fill="#fff" stroke={PHASE[phase].color} strokeWidth={3} />
      <text x={c} y={c - 4} textAnchor="middle" fontSize="22" fontWeight="700" fill="#241220" fontFamily="'Fraunces', serif">
        {todayDay}
      </text>
      <text x={c} y={c + 14} textAnchor="middle" fontSize="10" fill="#B7A8B1">
        of {cycle.cycleLength} days
      </text>
    </svg>
  );
}

function buildMonthGrid(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push({ date: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(year, month, d) });
  return cells;
}