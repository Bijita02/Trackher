import React, { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Sprout, Sun, Heart, Pencil, Check, X, Loader2 } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, ReferenceDot,
} from "recharts";
import {
  stripTime,
  addDays,
  toInputDate,
  fromInputDate,
  TOTAL_PREGNANCY_DAYS,
  dayInPregnancy,
  weekForDay,
  trimesterForWeek,
  daysUntilDue,
  upcomingMilestones,
} from "../utils/pregnancyMath";

const TRIMESTER = {
  first: { label: "First trimester", color: "#8C7CD6", soft: "#EAE5FA", icon: Sprout },
  second: { label: "Second trimester", color: "#F2A93B", soft: "#FDF0DC", icon: Sun },
  third: { label: "Third trimester", color: "#E23670", soft: "#FCE1EA", icon: Heart },
};

export default function PregnancyDetails({
  dueDate,
  apiBaseUrl = "/api",
  authToken,
  onPregnancyUpdate,
  showStats = true,
}) {
  const today = useMemo(() => new Date(), []);
  const [localDueDate, setLocalDueDate] = useState(null);

  const resolvedDueDate = localDueDate || dueDate;
  const pregnancy = { dueDate: resolvedDueDate };

  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState(() => toInputDate(resolvedDueDate));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [dayModalDate, setDayModalDate] = useState(null);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState(null);

  const rawTodayDay = dayInPregnancy(today, pregnancy);
  const todayDay = Math.min(TOTAL_PREGNANCY_DAYS, Math.max(1, rawTodayDay));
  const todayWeek = weekForDay(todayDay);
  const todayTrimester = trimesterForWeek(todayWeek);
  const daysUntil = daysUntilDue(today, pregnancy);

  const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const grid = useMemo(() => buildMonthGrid(viewDate), [viewDate]);

  const progressData = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => {
      const week = i + 1;
      return { label: `Wk ${week}`, week, pct: Math.round((week / 40) * 100) };
    });
  }, []);

  const milestoneData = useMemo(() => upcomingMilestones(todayDay), [todayDay]);

  async function persistDueDate(dateStr) {
    const res = await fetch(`${apiBaseUrl}/pregnancy-info`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ dueDate: dateStr }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data?.error || "Couldn't save your due date. Please try again.");
    }

    const savedUser = data.user || data;
    setLocalDueDate(fromInputDate(dateStr));
    onPregnancyUpdate?.(savedUser);

    return savedUser;
  }

  async function handleSaveDueDate() {
    if (!editDate) {
      setSaveError("Please pick a date.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await persistDueDate(editDate);
      setIsEditing(false);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function openEditor() {
    setEditDate(toInputDate(resolvedDueDate));
    setSaveError(null);
    setIsEditing(true);
  }

  function cancelEditor() {
    setIsEditing(false);
    setSaveError(null);
  }

  async function handleSetDueDateFromModal() {
    if (!dayModalDate) return;
    setModalSaving(true);
    setModalError(null);
    try {
      await persistDueDate(toInputDate(dayModalDate));
      setDayModalDate(null);
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalSaving(false);
    }
  }

  function handleDayClick(date) {
    setModalError(null);
    setDayModalDate(date);
  }

  function closeDayModal() {
    setDayModalDate(null);
    setModalError(null);
  }

  const calendarCard = (
    <div
      className={showStats ? "lg:col-span-2 rounded-2xl p-6" : "rounded-2xl p-6"}
      style={{ background: "#fff", border: "1px solid #FDE3EC" }}
    >
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
          const day = dayInPregnancy(cell.date, pregnancy);
          const inRange = day >= 1 && day <= TOTAL_PREGNANCY_DAYS;
          const trimester = inRange ? trimesterForWeek(weekForDay(day)) : null;
          const isToday = stripTime(cell.date) === stripTime(today);
          const isDueDate = stripTime(cell.date) === stripTime(resolvedDueDate);

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleDayClick(cell.date)}
              className="aspect-square rounded-lg flex flex-col items-center justify-center relative text-sm transition-transform"
              style={{
                background: inRange ? TRIMESTER[trimester].soft : "#F7F5F4",
                color: "#241220",
                outline: isToday ? `2px solid ${inRange ? TRIMESTER[trimester].color : "#8F8290"}` : "none",
                outlineOffset: "-2px",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              <span style={{ fontWeight: isToday ? 700 : 500 }}>{cell.date.getDate()}</span>
              {isDueDate && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full" style={{ background: "#E23670" }} />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 mt-5 pt-5" style={{ borderTop: "1px solid #FBE7EF" }}>
        {Object.entries(TRIMESTER).map(([key, t]) => (
          <div key={key} className="flex items-center gap-2 text-xs" style={{ color: "#8F8290" }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: t.color }} />
            {t.label}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
        .fr-display { font-family: 'Fraunces', serif; }
      `}</style>

      <div className="mt-8">
        {showStats && (
          <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
            <div>
              <h1 className="fr-display text-3xl" style={{ color: "#241220" }}>Pregnancy overview</h1>
              <p className="text-sm mt-1" style={{ color: "#8F8290" }}>
                Week {todayWeek} · {TRIMESTER[todayTrimester].label}
              </p>
            </div>
            <div
              className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{ background: TRIMESTER[todayTrimester].soft, color: TRIMESTER[todayTrimester].color }}
            >
              Due in {daysUntil} day{daysUntil === 1 ? "" : "s"} · {resolvedDueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </div>
          </div>
        )}

        {showStats ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {calendarCard}
<div
  className="rounded-2xl p-6 flex flex-col items-center"
  style={{ background: "#fff", border: "1px solid #FDE3EC" }}
>
  <div className="w-full flex justify-end mb-1">
    {!isEditing && (
      <button
        onClick={openEditor}
        className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full hover:bg-rose-50 transition"
        style={{ color: "#B96C87" }}
      >
        <Pencil size={12} /> Edit due date
      </button>
    )}
  </div>

  <TrimesterRing todayDay={todayDay} trimester={todayTrimester} />

  <h2 className="fr-display text-3xl mt-4 mb-1 text-center" style={{ color: "#241220" }}>
    Week {todayWeek} of your pregnancy
  </h2>
  <p className="text-sm" style={{ color: "#8F8290" }}>
    {TRIMESTER[todayTrimester].label}
  </p>
  <p
    className="text-xs mt-3 inline-block px-4 py-1.5 rounded-full"
    style={{ background: TRIMESTER[todayTrimester].soft, color: TRIMESTER[todayTrimester].color }}
  >
    Due in {daysUntil} day{daysUntil === 1 ? "" : "s"} ·{" "}
    {resolvedDueDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
  </p>

  {isEditing && (
    <div className="w-full mt-5 pt-5" style={{ borderTop: "1px solid #FBE7EF" }}>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "#8F8290" }}>
        Due date
      </label>
      <input
        type="date"
        value={editDate}
        onChange={(e) => setEditDate(e.target.value)}
        className="w-full text-sm px-3 py-2 rounded-lg outline-none"
        style={{ border: "1px solid #FDE3EC", color: "#241220" }}
      />

      {saveError && (
        <p className="text-xs mt-2" style={{ color: "#E23670" }}>{saveError}</p>
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={handleSaveDueDate}
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
        ) : (
          calendarCard
        )}

        {showStats && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #FDE3EC" }}>
              <h3 className="fr-display text-lg mb-1" style={{ color: "#241220" }}>Pregnancy progress</h3>
              <p className="text-xs mb-4" style={{ color: "#8F8290" }}>Weeks 1–40</p>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={progressData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="pregFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#E23670" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#E23670" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#FBE7EF" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#B7A8B1" }} axisLine={false} tickLine={false} interval={4} />
                  <YAxis tick={{ fontSize: 12, fill: "#B7A8B1" }} axisLine={false} tickLine={false} domain={[0, 100]} unit="%" />
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #FDE3EC", fontSize: 13 }} />
                  <Area type="monotone" dataKey="pct" stroke="#E23670" strokeWidth={2.5} fill="url(#pregFill)" />
                  <ReferenceDot x={`Wk ${todayWeek}`} y={Math.round((todayWeek / 40) * 100)} r={5} fill="#E23670" stroke="#fff" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #FDE3EC" }}>
              <h3 className="fr-display text-lg mb-1" style={{ color: "#241220" }}>Days until</h3>
              <p className="text-xs mb-4" style={{ color: "#8F8290" }}>Upcoming milestones</p>
              {milestoneData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={milestoneData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#FBE7EF" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 12, fill: "#B7A8B1" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12, fill: "#241220" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #FDE3EC", fontSize: 13 }} />
                    <Bar dataKey="days" radius={[0, 6, 6, 0]}>
                      {milestoneData.map((_, i) => (
                        <Cell key={i} fill={["#E23670", "#EB5490", "#F281AB"][i % 3]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-sm" style={{ color: "#8F8290" }}>
                  You've reached every milestone 🎉
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {dayModalDate && (
        <DayPopup
          date={dayModalDate}
          pregnancy={pregnancy}
          saving={modalSaving}
          error={modalError}
          onClose={closeDayModal}
          onSetDueDate={handleSetDueDateFromModal}
        />
      )}
    </div>
  );
}

function DayPopup({ date, pregnancy, saving, error, onClose, onSetDueDate }) {
  const day = dayInPregnancy(date, pregnancy);
  const inRange = day >= 1 && day <= TOTAL_PREGNANCY_DAYS;
  const week = inRange ? weekForDay(day) : null;
  const trimester = inRange ? trimesterForWeek(week) : null;
  const t = trimester ? TRIMESTER[trimester] : null;

  const dateLabel = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(36, 18, 32, 0.35)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{ background: "#fff", fontFamily: "'Inter', sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="fr-display text-xl" style={{ color: "#241220" }}>{dateLabel}</p>
            {inRange ? (
              <p className="text-xs mt-1" style={{ color: "#8F8290" }}>
                Would be week {week} · {t.label}
              </p>
            ) : (
              <p className="text-xs mt-1" style={{ color: "#8F8290" }}>
                Outside the 40-week window
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-rose-50 transition" aria-label="Close">
            <X size={16} color="#8F8290" />
          </button>
        </div>

        <div
          className="rounded-xl p-4 mb-4 flex items-center gap-3"
          style={{ background: t ? t.soft : "#F7F5F4" }}
        >
          <Heart size={18} color={t ? t.color : "#8F8290"} />
          <p className="text-sm" style={{ color: "#241220" }}>
            Set your due date to this day
          </p>
        </div>

        {error && <p className="text-xs mb-3" style={{ color: "#E23670" }}>{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={onSetDueDate}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-60"
            style={{ background: "#E23670", color: "#fff" }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {saving ? "Saving…" : "Set as due date"}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            className="flex items-center justify-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-lg transition disabled:opacity-60"
            style={{ background: "#FCE1EA", color: "#8F8290" }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function TrimesterRing({ todayDay, trimester }) {
  const size = 160;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;

  const segments = [
    { key: "first", start: 0, end: 91 },
    { key: "second", start: 91, end: 189 },
    { key: "third", start: 189, end: 280 },
  ];

  const todayAngle = (todayDay / TOTAL_PREGNANCY_DAYS) * 360 - 90;
  const markerX = c + r * Math.cos((todayAngle * Math.PI) / 180);
  const markerY = c + r * Math.sin((todayAngle * Math.PI) / 180);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((seg) => {
        const len = ((seg.end - seg.start) / TOTAL_PREGNANCY_DAYS) * circumference;
        const gap = 3;
        const offset = (seg.start / TOTAL_PREGNANCY_DAYS) * circumference;
        return (
          <circle
            key={seg.key}
            cx={c}
            cy={c}
            r={r}
            fill="none"
            stroke={TRIMESTER[seg.key].color}
            strokeWidth={stroke}
            strokeDasharray={`${Math.max(len - gap, 0)} ${circumference - len + gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${c} ${c})`}
          />
        );
      })}
      <circle cx={markerX} cy={markerY} r={6} fill="#fff" stroke={TRIMESTER[trimester].color} strokeWidth={3} />
      <text x={c} y={c - 4} textAnchor="middle" fontSize="22" fontWeight="700" fill="#241220" fontFamily="'Fraunces', serif">
        {Math.min(40, Math.ceil(todayDay / 7))}
      </text>
      <text x={c} y={c + 14} textAnchor="middle" fontSize="10" fill="#B7A8B1">
        of 40 weeks
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