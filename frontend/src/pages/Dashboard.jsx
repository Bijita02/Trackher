import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, ChevronLeft, ChevronRight, Droplet, Check, X, Loader2 } from "lucide-react";
import Onboardingmodal from "../components/onboardingmodal";
import ChatBot from "../components/chatbot";
import StatusPopup from "../components/statuspopup";
import {
  MS_PER_DAY,
  dayInCycle,
  phaseForDay,
  groupPhase,
  addDays,
  toInputDate,
} from "../utils/cycleMath";

const POSTPARTUM_BUFFER_DAYS = 42;

// Same brand palette as cycledetails.jsx, so the dashboard and calendar feel like one app
const BRAND = {
  ink: "#241220",
  muted: "#8F8290",
  pink: "#E23670",
  pinkSoft: "#FCE1EA",
  border: "#FDE3EC",
};

const PHASE_DISPLAY = {
  menstrual: { label: "Period", color: "#E23670" },
  follicular: { label: "Follicular", color: "#8C7CD6" },
  ovulatory: { label: "Ovulation", color: "#F2A93B" },
  luteal: { label: "Luteal", color: "#B96C87" },
};

// Ungrouped-phase colors, matching PHASE in cycledetails.jsx — needed because
// phaseForDay() can return "fertile" / "ovulation" as distinct from the grouped labels above
const RING_COLORS = {
  menstrual: "#E23670",
  follicular: "#8C7CD6",
  fertile: "#F2A93B",
  ovulation: "#F2A93B",
  luteal: "#B96C87",
};

function Dashboard() {
  const navigate = useNavigate();
  const today = useMemo(() => new Date(), []);
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVibeOpen, setIsVibeOpen] = useState(false);

  // Which week is shown in the strip: 0 = this week, -1 = last week, 1 = next week, etc.
  const [weekOffset, setWeekOffset] = useState(0);

  // Quick "Log period" action state — logDate is whichever date is being logged
  // (today, when opened from the quick-action circle; or a clicked week-strip day)
  const [showLogModal, setShowLogModal] = useState(false);
  const [logDate, setLogDate] = useState(null);
  const [logSaving, setLogSaving] = useState(false);
  const [logError, setLogError] = useState(null);

  const fetchUser = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      if (!userId || !token) {
        setLoading(false);
        navigate("/login", { replace: true });
        return;
      }

      const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        navigate("/login", { replace: true });
        return;
      }

      const data = await res.json();
      setUser(data);

      const dueDateStr = data?.pregnancyInfo?.dueDate;
      if (dueDateStr) {
        const dueDate = new Date(dueDateStr);
        const daysPastDue = (Date.now() - dueDate.getTime()) / MS_PER_DAY;
        if (daysPastDue < POSTPARTUM_BUFFER_DAYS) {
          navigate("/pregnancy-dashboard", { replace: true });
          return;
        }
      }

      if (!data.cycleInfo?.lastPeriod) {
        setShowModal(true);
      } else {
        setShowModal(false);
      }
    } catch (err) {
      console.error(err);
      setShowModal(true);
    } finally {
      if (loading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleOnboardingClose = async () => {
    setShowModal(false);
    await fetchUser();
  };

  const getFertilityLabel = (phaseKey) => {
    switch (phaseKey) {
      case "menstrual":
        return "On your period";
      case "ovulatory":
        return "High chance of getting pregnant";
      case "follicular":
        return "Low chance of getting pregnant";
      default:
        return "Low chance of getting pregnant";
    }
  };

  const handleNavigateToCycleStats = () => {
    if (!user?.cycleInfo) return;
    navigate("/cycle-stats", {
      state: {
        lastPeriodDate: user.cycleInfo.lastPeriod,
        cycleLength: Number(user.cycleInfo.cycleLength),
        periodLength: Number(user.cycleInfo.periodLength),
      },
    });
  };

  async function confirmLogPeriod() {
    if (!logDate) return;
    setLogSaving(true);
    setLogError(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/user-cycle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          lastPeriod: toInputDate(logDate),
          cycleLength: cycleLength || 28,
          periodLength: periodLength || 5,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Couldn't save your period date. Please try again.");
      }

      setShowLogModal(false);
      await fetchUser();
    } catch (err) {
      setLogError(err.message);
    } finally {
      setLogSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FDF6F3]">
        <p className="text-sm animate-pulse" style={{ color: BRAND.muted }}>Loading...</p>
      </div>
    );
  }

  const cycleLength = user?.cycleInfo ? Number(user.cycleInfo.cycleLength) : null;
  const periodLength = user?.cycleInfo ? Number(user.cycleInfo.periodLength) : null;
  const lastPeriodDate = user?.cycleInfo?.lastPeriod ? new Date(user.cycleInfo.lastPeriod) : null;

  const CYCLE = lastPeriodDate && cycleLength && periodLength
    ? { lastPeriodStart: lastPeriodDate, cycleLength, periodLength }
    : null;

  const cycleDay = CYCLE ? dayInCycle(today, CYCLE) : null;
  const rawPhase = CYCLE ? phaseForDay(cycleDay, CYCLE) : null; // ungrouped: menstrual/follicular/fertile/ovulation/luteal
  const currentPhase = CYCLE ? groupPhase(rawPhase) : null;     // grouped: menstrual/follicular/ovulatory/luteal

  // Days until ovulation (only meaningful before ovulation happens this cycle)
  const ovulationDay = CYCLE ? CYCLE.cycleLength - 14 : null;
  const daysToOvulation = ovulationDay != null && cycleDay != null ? ovulationDay - cycleDay : null;

  // Days until next period — always computed, shown as a small line regardless of phase
  const untilNextPeriod = CYCLE
    ? ((CYCLE.cycleLength - (cycleDay % CYCLE.cycleLength)) % CYCLE.cycleLength) || CYCLE.cycleLength
    : null;
  const nextPeriodDate = CYCLE ? addDays(today, untilNextPeriod) : null;

  let headline = "";
  let subtitle = "";
  if (CYCLE) {
    if (currentPhase === "menstrual") {
      headline = `Day ${cycleDay} of your period`;
      subtitle = getFertilityLabel("menstrual");
    } else if (currentPhase === "ovulatory") {
      headline = "Ovulating today";
      subtitle = getFertilityLabel("ovulatory");
    } else if (currentPhase === "follicular" && daysToOvulation > 0) {
      headline = `Ovulation in ${daysToOvulation} day${daysToOvulation === 1 ? "" : "s"}`;
      subtitle = getFertilityLabel("follicular");
    } else {
      headline = `Next period in ${untilNextPeriod} day${untilNextPeriod === 1 ? "" : "s"}`;
      subtitle = getFertilityLabel("luteal");
    }
  }

  // Week strip: centered on whichever day is the middle of the selected week
  const weekCenter = CYCLE ? addDays(today, weekOffset * 7) : null;
  const weekDays = CYCLE
    ? Array.from({ length: 7 }, (_, i) => addDays(weekCenter, i - 3))
    : [];
  const weekRangeLabel = weekDays.length
    ? `${weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    : "";

  return (
    <div className="min-h-screen bg-[#FDF6F3] relative" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
        .fr-display { font-family: 'Fraunces', serif; }
      `}</style>

      {showModal && <Onboardingmodal onClose={handleOnboardingClose} />}

      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-6 flex justify-between items-start">
          <div>
            {cycleDay && (
              <span
                className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3"
                style={{ background: BRAND.pinkSoft, color: BRAND.pink }}
              >
                Day {cycleDay} of your cycle
              </span>
            )}
            <h1 className="fr-display text-3xl leading-tight" style={{ color: BRAND.ink }}>
              Welcome Back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
            </h1>
            <p className="text-sm mt-1" style={{ color: BRAND.muted }}>Here's your cycle overview</p>
          </div>

        </div>

        {user?.cycleInfo?.lastPeriod ? (
          <>
            {/* Week strip */}
            <div className="rounded-2xl p-5 mb-6 bg-white" style={{ border: `1px solid ${BRAND.border}` }}>
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setWeekOffset((w) => w - 1)}
                  className="p-1.5 rounded-full hover:bg-rose-50 transition"
                  aria-label="Previous week"
                >
                  <ChevronLeft size={16} style={{ color: BRAND.muted }} />
                </button>
                <span className="text-xs font-medium" style={{ color: BRAND.muted }}>
                  {weekOffset === 0 ? "This week" : weekRangeLabel}
                </span>
                <button
                  onClick={() => setWeekOffset((w) => w + 1)}
                  className="p-1.5 rounded-full hover:bg-rose-50 transition"
                  aria-label="Next week"
                >
                  <ChevronRight size={16} style={{ color: BRAND.muted }} />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((d, i) => {
                  const isToday = d.toDateString() === today.toDateString();
                  const isFuture = d > today;
                  const dNum = dayInCycle(d, CYCLE);
                  const phase = groupPhase(phaseForDay(dNum, CYCLE));
                  const color = PHASE_DISPLAY[phase]?.color || BRAND.pink;
                  return (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <span className="text-[10px] font-medium" style={{ color: BRAND.muted }}>
                        {d.toLocaleDateString("en-US", { weekday: "narrow" })}
                      </span>
                      {isToday ? (
                        <span className="text-[9px] font-bold tracking-wide" style={{ color: BRAND.pink }}>
                          TODAY
                        </span>
                      ) : (
                        <span className="text-[9px]">&nbsp;</span>
                      )}
                      <button
                        type="button"
                        disabled={isFuture}
                        onClick={() => {
                          if (isFuture) return;
                          setLogError(null);
                          setLogDate(d);
                          setShowLogModal(true);
                        }}
                        className="w-full aspect-square rounded-lg flex items-center justify-center text-sm font-semibold transition-all duration-150 active:scale-90 hover:scale-105 fr-display"
                        style={{
                          background: isToday ? color : `${color}1F`,
                          color: isToday ? "#fff" : BRAND.ink,
                          outline: isToday ? "none" : `1px solid ${color}55`,
                          outlineOffset: "-1px",
                          cursor: isFuture ? "default" : "pointer",
                          opacity: isFuture ? 0.5 : 1,
                        }}
                      >
                        {d.getDate()}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Phase ring + countdown */}
            <div
              className="rounded-2xl p-6 mb-8 bg-white flex flex-col items-center"
              style={{ border: `1px solid ${BRAND.border}` }}
            >
              <PhaseRing cycle={CYCLE} today={today} phase={rawPhase} />
              <h2 className="fr-display text-3xl mt-4 mb-1 text-center" style={{ color: BRAND.ink }}>{headline}</h2>
              <p className="text-sm" style={{ color: BRAND.muted }}>{subtitle}</p>
              <p className="text-xs mt-3 inline-block px-4 py-1.5 rounded-full" style={{ background: BRAND.pinkSoft, color: BRAND.pink }}>
                Next period in {untilNextPeriod} day{untilNextPeriod === 1 ? "" : "s"} · {nextPeriodDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            </div>

            {/* Quick actions */}
            <div className="flex justify-center gap-10 mb-8">
              <QuickAction
                icon={<Droplet size={20} color="#fff" />}
                bg={BRAND.pink}
                label="Log period"
                onClick={() => {
                  setLogError(null);
                  setLogDate(today);
                  setShowLogModal(true);
                }}
              />
              <QuickAction
                icon={<span className="text-xl">🩺</span>}
                bg={BRAND.pinkSoft}
                label="Symptoms"
                onClick={() => navigate("/symptoms")}
              />
              <QuickAction
                icon={<span className="text-xl">🤰</span>}
                bg={BRAND.pinkSoft}
                label="Pregnant"
                onClick={() => navigate("/pregnancy-setup")}
              />
            </div>

            <button
              onClick={handleNavigateToCycleStats}
              className="w-full bg-white rounded-2xl p-6 text-left hover:shadow-sm transition-all group"
              style={{ border: `1px solid ${BRAND.border}` }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold mb-1" style={{ color: BRAND.ink }}>
                    Cycle Stats & Phase History
                  </p>
                  <p className="text-xs" style={{ color: BRAND.muted }}>
                    Trends, averages, and most logged symptoms
                  </p>
                </div>
                <svg
                  className="w-4 h-4 transition-colors"
                  style={{ color: BRAND.muted }}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="mb-4" style={{ color: BRAND.muted }}>No cycle data yet.</p>
            <button
              onClick={() => setShowModal(true)}
              className="text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-colors"
              style={{ background: BRAND.pink }}
            >
              Set up your cycle
            </button>
          </div>
        )}
      </div>

      {showLogModal && logDate && (
        <LogPeriodModal
          date={logDate}
          saving={logSaving}
          error={logError}
          onClose={() => setShowLogModal(false)}
          onConfirm={confirmLogPeriod}
        />
      )}

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <div className="flex items-center gap-2 group">
          <span className="bg-white text-gray-700 text-[11px] font-medium px-3 py-1.5 rounded-xl shadow-md border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            Share your current status with your friends
          </span>
          <button
            onClick={() => setIsVibeOpen(true)}
            className="w-12 h-12 bg-amber-500 text-white rounded-full flex items-center justify-center text-xl shadow-lg hover:scale-110 transition-all duration-200 active:scale-95"
            title="Circle Vibe Check"
          >
            💭
          </button>
        </div>

        <div className="flex items-center gap-2 group">
          <span className="bg-white text-gray-700 text-[11px] font-medium px-3 py-1.5 rounded-xl shadow-md border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            Share with Luna Bot
          </span>
          <button
            onClick={() => setIsChatOpen(true)}
            className="w-12 h-12 text-white rounded-full flex items-center justify-center text-xl shadow-lg hover:scale-110 transition-all duration-200 active:scale-95"
            style={{ background: BRAND.pink }}
            title="Ask Luna Bot"
          >
            🤖
          </button>
        </div>

        {isChatOpen && (
          <div className="absolute bottom-16 right-0 z-50 w-80 sm:w-96 shadow-2xl rounded-3xl overflow-hidden bg-white border border-gray-100">
            <ChatBot onClose={() => setIsChatOpen(false)} />
          </div>
        )}
      </div>

      <StatusPopup
        isOpen={isVibeOpen}
        onClose={() => setIsVibeOpen(false)}
        currentUserName={user?.name || localStorage.getItem("userName") || "Meejala"}
      />
    </div>
  );
}

function QuickAction({ icon, bg, label, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 group">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-sm transition-transform duration-150 group-hover:scale-105 group-active:scale-90"
        style={{ background: bg }}
      >
        {icon}
      </div>
      <span className="text-xs font-medium" style={{ color: BRAND.muted }}>{label}</span>
    </button>
  );
}

// Same circular phase-progress ring as in cycledetails.jsx
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
  const markerColor = RING_COLORS[phase] || BRAND.pink;

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
            stroke={RING_COLORS[seg.key]}
            strokeWidth={stroke}
            strokeDasharray={`${Math.max(len - gap, 0)} ${circumference - len + gap}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            transform={`rotate(-90 ${c} ${c})`}
          />
        );
      })}
      <circle cx={markerX} cy={markerY} r={6} fill="#fff" stroke={markerColor} strokeWidth={3} />
      <text x={c} y={c - 4} textAnchor="middle" fontSize="22" fontWeight="700" fill={BRAND.ink} fontFamily="'Fraunces', serif">
        {todayDay}
      </text>
      <text x={c} y={c + 14} textAnchor="middle" fontSize="10" fill="#B7A8B1">
        of {cycle.cycleLength} days
      </text>
    </svg>
  );
}

function LogPeriodModal({ date, saving, error, onClose, onConfirm }) {
  const isToday = date.toDateString() === new Date().toDateString();
  const dateLabel = date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(36, 18, 32, 0.35)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 bg-white"
        style={{ fontFamily: "'Inter', sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="fr-display text-xl" style={{ color: BRAND.ink }}>Log period</p>
            <p className="text-xs mt-1" style={{ color: BRAND.muted }}>{dateLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-rose-50 transition"
            aria-label="Close"
          >
            <X size={16} style={{ color: BRAND.muted }} />
          </button>
        </div>

        <div className="rounded-xl p-4 mb-4 flex items-center gap-3" style={{ background: BRAND.pinkSoft }}>
          <Droplet size={18} style={{ color: BRAND.pink }} />
          <p className="text-sm" style={{ color: BRAND.ink }}>
            {isToday ? "Mark today as your period start" : `Mark ${dateLabel} as your period start`}
          </p>
        </div>

        {error && <p className="text-xs mb-3" style={{ color: BRAND.pink }}>{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-60 text-white"
            style={{ background: BRAND.pink }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
            {saving ? "Saving…" : "Confirm"}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            className="flex items-center justify-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-lg transition disabled:opacity-60"
            style={{ background: BRAND.pinkSoft, color: BRAND.muted }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;