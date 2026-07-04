import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Droplet, Sparkles, Leaf, Moon } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";

// ---------- Fallback mock data (used only if no real data is passed in) ----------
const CYCLE_HISTORY = [
  { label: "Feb", length: 29 },
  { label: "Mar", length: 27 },
  { label: "Apr", length: 28 },
  { label: "May", length: 30 },
  { label: "Jun", length: 26 },
  { label: "Jul", length: 28 },
];

const SYMPTOM_FREQUENCY = [
  { name: "Fatigue", count: 15 },
  { name: "Cramps", count: 12 },
  { name: "Mood swings", count: 10 },
  { name: "Headache", count: 8 },
  { name: "Bloating", count: 7 },
];
// ------------------------------------------------------------

const PHASE = {
  menstrual: { label: "Menstrual", color: "#E23670", soft: "#FCE1EA", icon: Droplet },
  follicular: { label: "Follicular", color: "#8C7CD6", soft: "#EAE5FA", icon: Leaf },
  fertile: { label: "Fertile window", color: "#F2A93B", soft: "#FDF0DC", icon: Sparkles },
  ovulation: { label: "Ovulation", color: "#F2A93B", soft: "#FDF0DC", icon: Sparkles },
  luteal: { label: "Luteal", color: "#B96C87", soft: "#F6E4EA", icon: Moon },
};

function dayInCycle(date, cycle) {
  const msPerDay = 86400000;
  const diff = Math.floor((stripTime(date) - stripTime(cycle.lastPeriodStart)) / msPerDay);
  const mod = ((diff % cycle.cycleLength) + cycle.cycleLength) % cycle.cycleLength;
  return mod + 1; // 1-indexed day within the cycle
}

function stripTime(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function phaseForDay(day, cycle) {
  const ovulationDay = cycle.cycleLength - 14; // 14-day luteal phase is the stable part of the cycle
  if (day <= cycle.periodLength) return "menstrual";
  if (day === ovulationDay) return "ovulation";
  if (day >= ovulationDay - 4 && day < ovulationDay) return "fertile";
  if (day < ovulationDay - 4) return "follicular";
  return "luteal";
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function daysUntilNextPeriod(today, cycle) {
  const day = dayInCycle(today, cycle);
  const remaining = cycle.cycleLength - day + 1;
  return remaining === cycle.cycleLength ? 0 : remaining;
}

export default function Cycledetails({ lastPeriodStart, cycleLength, periodLength }) {
  // Real data from Dashboard.jsx is used when provided; otherwise falls back to mock data
  const CYCLE = {
    lastPeriodStart: lastPeriodStart || new Date(2026, 5, 28),
    cycleLength: cycleLength || 28,
    periodLength: periodLength || 5,
  };

  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const todayPhase = phaseForDay(dayInCycle(today, CYCLE), CYCLE);
  const todayCycleDay = dayInCycle(today, CYCLE);
  const untilNext = daysUntilNextPeriod(today, CYCLE);
  const nextPeriodDate = addDays(today, untilNext);

  const grid = useMemo(() => buildMonthGrid(viewDate), [viewDate]);

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
        .fr-display { font-family: 'Fraunces', serif; }
      `}</style>

      <div className="mt-8">
        {/* Header */}
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
            Next period in {untilNext} day{untilNext === 1 ? "" : "s"} · {nextPeriodDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
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

            {/* Legend */}
            <div className="flex flex-wrap gap-4 mt-5 pt-5" style={{ borderTop: "1px solid #FBE7EF" }}>
              {["menstrual", "follicular", "fertile", "luteal"].map((key) => (
                <div key={key} className="flex items-center gap-2 text-xs" style={{ color: "#8F8290" }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: PHASE[key].color }} />
                  {PHASE[key].label}
                </div>
              ))}
            </div>
          </div>

          {/* Phase ring */}
          <div className="rounded-2xl p-6 flex flex-col items-center justify-center" style={{ background: "#fff", border: "1px solid #FDE3EC" }}>
            <PhaseRing cycle={CYCLE} today={today} phase={todayPhase} />
            <p className="fr-display text-xl mt-4" style={{ color: PHASE[todayPhase].color }}>{PHASE[todayPhase].label}</p>
            <p className="text-sm text-center mt-1" style={{ color: "#8F8290" }}>
              Cycle day {todayCycleDay} of {CYCLE.cycleLength}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #FDE3EC" }}>
            <h3 className="fr-display text-lg mb-1" style={{ color: "#241220" }}>Cycle length trend</h3>
            <p className="text-xs mb-4" style={{ color: "#8F8290" }}>Last 6 cycles</p>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={CYCLE_HISTORY} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cycleFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E23670" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#E23670" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#FBE7EF" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#B7A8B1" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#B7A8B1" }} axisLine={false} tickLine={false} domain={[24, 32]} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #FDE3EC", fontSize: 13 }} />
                <Area type="monotone" dataKey="length" stroke="#E23670" strokeWidth={2.5} fill="url(#cycleFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #FDE3EC" }}>
            <h3 className="fr-display text-lg mb-1" style={{ color: "#241220" }}>Most logged symptoms</h3>
            <p className="text-xs mb-4" style={{ color: "#8F8290" }}>Past 6 cycles</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={SYMPTOM_FREQUENCY} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FBE7EF" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: "#B7A8B1" }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12, fill: "#241220" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #FDE3EC", fontSize: 13 }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {SYMPTOM_FREQUENCY.map((_, i) => (
                    <Cell key={i} fill={["#E23670", "#EB5490", "#F281AB", "#F7A7C6", "#FBCADD"][i % 5]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
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