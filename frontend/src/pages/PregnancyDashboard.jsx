import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatBot from "../components/chatbot";
import StatusPopup from "../components/statuspopup";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const TOTAL_PREGNANCY_DAYS = 280;
const POSTPARTUM_BUFFER_DAYS = 42;

const BRAND = {
  ink: "#241220",
  muted: "#8F8290",
  pink: "#E23670",
  pinkSoft: "#FCE1EA",
  border: "#FDE3EC",
};

const TRIMESTER = {
  first: { label: "First trimester", color: "#8C7CD6", soft: "#EAE5FA" },
  second: { label: "Second trimester", color: "#F2A93B", soft: "#FDF0DC" },
  third: { label: "Third trimester", color: "#E23670", soft: "#FCE1EA" },
};

const BABY_SIZE_BY_WEEK = {
  4: { emoji: "🌱", thing: "a poppy seed", note: "Implantation is just happening — most people don't know yet." },
  5: { emoji: "🍎", thing: "an apple seed", note: "The neural tube, which becomes the brain and spine, starts forming." },
  6: { emoji: "🫘", thing: "a lentil", note: "A heartbeat may be detectable on an early ultrasound." },
  7: { emoji: "🫐", thing: "a blueberry", note: "Tiny limb buds are starting to form." },
  8: { emoji: "🍇", thing: "a raspberry", note: "Fingers and toes are beginning to form." },
  9: { emoji: "🍒", thing: "a cherry", note: "All essential organs have started developing." },
  10: { emoji: "🍓", thing: "a strawberry", note: "Vital organs are now functioning." },
  11: { emoji: "🍋", thing: "a fig", note: "The baby can now open and close their fists." },
  12: { emoji: "🍋", thing: "a lime", note: "Reflexes are developing — fingers can curl." },
  13: { emoji: "🍑", thing: "a peapod", note: "End of the first trimester — miscarriage risk drops notably." },
  14: { emoji: "🍑", thing: "a peach", note: "Facial expressions may start appearing." },
  15: { emoji: "🍎", thing: "an apple", note: "The baby can sense light, even through closed eyelids." },
  16: { emoji: "🥑", thing: "an avocado", note: "Muscles and hearing continue developing." },
  17: { emoji: "🍐", thing: "a pear", note: "Fat stores are beginning to develop." },
  18: { emoji: "🫑", thing: "a bell pepper", note: "You might start feeling first flutters of movement." },
  19: { emoji: "🍅", thing: "a large tomato", note: "A protective coating is forming on the skin." },
  20: { emoji: "🍌", thing: "a banana", note: "The halfway point! Anatomy scans usually happen now." },
  21: { emoji: "🥕", thing: "a carrot", note: "Movements are becoming more coordinated." },
  22: { emoji: "🍆", thing: "a small eggplant", note: "Eyebrows and eyelids are fully formed." },
  23: { emoji: "🌽", thing: "a large ear of corn", note: "Hearing is sharpening — loud sounds may cause a startle." },
  24: { emoji: "🌽", thing: "an ear of corn", note: "Lungs are developing surfactant, key for breathing later." },
  25: { emoji: "🥒", thing: "a cucumber", note: "Hands are fully developed, with a strong grip reflex." },
  26: { emoji: "🥬", thing: "a head of lettuce", note: "Eyes are starting to open." },
  27: { emoji: "🥦", thing: "a head of broccoli", note: "End of the second trimester." },
  28: { emoji: "🍆", thing: "an eggplant", note: "Third trimester begins — the baby can now blink." },
  29: { emoji: "🎃", thing: "a small squash", note: "Bones are hardening, though the skull stays flexible." },
  30: { emoji: "🥥", thing: "a coconut", note: "Rapid brain development is happening." },
  31: { emoji: "🍈", thing: "a small melon", note: "The baby can turn their head from side to side." },
  32: { emoji: "🍈", thing: "a squash", note: "Practice breathing movements are common now." },
  33: { emoji: "🍍", thing: "a pineapple", note: "The immune system is strengthening." },
  34: { emoji: "🍈", thing: "a cantaloupe", note: "Fingernails have reached the fingertips." },
  35: { emoji: "🍈", thing: "a honeydew melon", note: "Kidneys are fully developed." },
  36: { emoji: "🥬", thing: "a head of romaine lettuce", note: "The baby is likely settling into a head-down position." },
  37: { emoji: "🍈", thing: "a winter melon", note: "Considered early term as of this week." },
  38: { emoji: "🎃", thing: "a small pumpkin", note: "Organs are ready to work outside the womb." },
  39: { emoji: "🍉", thing: "a mini watermelon", note: "Considered full term." },
  40: { emoji: "🍉", thing: "a small watermelon", note: "Due date! Many babies arrive within two weeks of this either way." },
};

const getBabySize = (week) => {
  const clamped = Math.min(40, Math.max(4, week));
  return BABY_SIZE_BY_WEEK[clamped];
};

const trimesterForWeek = (week) => {
  if (week <= 13) return "first";
  if (week <= 27) return "second";
  return "third";
};

function PregnancyDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVibeOpen, setIsVibeOpen] = useState(false);
  const [endingPregnancy, setEndingPregnancy] = useState(false);

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
        if (daysPastDue >= POSTPARTUM_BUFFER_DAYS) {
          navigate("/dashboard", { replace: true });
          return;
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (loading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleEndPregnancy = async () => {
    const confirmed = window.confirm(
      "End pregnancy tracking and return to cycle tracking?"
    );
    if (!confirmed) return;

    setEndingPregnancy(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/pregnancy-info", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to end pregnancy tracking");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      setEndingPregnancy(false);
      alert("Couldn't end pregnancy tracking. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FDF6F3]">
        <p className="text-sm animate-pulse" style={{ color: BRAND.muted }}>Loading...</p>
      </div>
    );
  }

  const dueDate = user?.pregnancyInfo?.dueDate ? new Date(user.pregnancyInfo.dueDate) : null;

  if (!dueDate) {
    return (
      <div className="min-h-screen bg-[#FDF6F3] flex items-center justify-center px-6" style={{ fontFamily: "'Inter', sans-serif" }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
          .fr-display { font-family: 'Fraunces', serif; }
        `}</style>
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4">🤰</p>
          <p className="font-semibold mb-1" style={{ color: BRAND.ink }}>No due date set yet</p>
          <p className="text-sm mb-6" style={{ color: BRAND.muted }}>
            Add your due date or last period to see your pregnancy overview.
          </p>
          <button
            onClick={() => navigate("/pregnancy-setup")}
            className="text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-colors"
            style={{ background: BRAND.pink }}
          >
            Set up pregnancy tracking
          </button>
        </div>
      </div>
    );
  }

  const today = new Date();
  const daysElapsed = TOTAL_PREGNANCY_DAYS - Math.ceil((dueDate.getTime() - today.getTime()) / MS_PER_DAY);
  const clampedDaysElapsed = Math.min(TOTAL_PREGNANCY_DAYS, Math.max(0, daysElapsed));
  const weeksPregnant = Math.floor(clampedDaysElapsed / 7);
  const dayIntoWeek = clampedDaysElapsed % 7;
  const displayWeek = Math.min(40, weeksPregnant + 1);
  const trimester = trimesterForWeek(displayWeek);
  const babySize = getBabySize(displayWeek);

  const daysUntilDue = Math.max(0, Math.ceil((dueDate.getTime() - today.getTime()) / MS_PER_DAY));

  return (
    <div className="min-h-screen bg-[#FDF6F3] relative" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
        .fr-display { font-family: 'Fraunces', serif; }
      `}</style>

      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-8">
          <span
            className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3"
            style={{ background: TRIMESTER[trimester].soft, color: TRIMESTER[trimester].color }}
          >
            Week {displayWeek} of your pregnancy
          </span>
          <h1 className="fr-display text-3xl leading-tight" style={{ color: BRAND.ink }}>
            Hello{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
          </h1>
          <p className="text-sm mt-1" style={{ color: BRAND.muted }}>Here's your pregnancy overview</p>
        </div>

        <div
          className="rounded-2xl p-6 mb-4 bg-white flex flex-col items-center"
          style={{ border: `1px solid ${BRAND.border}` }}
        >
          <PregnancyRing daysElapsed={clampedDaysElapsed} trimester={trimester} />
          <h2 className="fr-display text-3xl mt-4 mb-1 text-center" style={{ color: BRAND.ink }}>
            Week {displayWeek}, day {dayIntoWeek}
          </h2>
          <p className="text-sm" style={{ color: BRAND.muted }}>{TRIMESTER[trimester].label}</p>
          <p
            className="text-xs mt-3 inline-block px-4 py-1.5 rounded-full"
            style={{ background: TRIMESTER[trimester].soft, color: TRIMESTER[trimester].color }}
          >
            Due in {daysUntilDue} day{daysUntilDue === 1 ? "" : "s"} ·{" "}
            {dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })}
          </p>
        </div>

        <div className="rounded-2xl p-6 mb-4" style={{ background: BRAND.pinkSoft, border: `1px solid ${BRAND.border}` }}>
          <p className="text-xs mb-1" style={{ color: BRAND.pink, opacity: 0.85 }}>This week, your baby is about the size of</p>
          <div className="flex items-center gap-4">
            <span className="text-5xl">{babySize.emoji}</span>
            <div>
              <p className="fr-display text-lg capitalize" style={{ color: BRAND.ink }}>{babySize.thing}</p>
              <p className="text-sm mt-1" style={{ color: BRAND.muted }}>{babySize.note}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate("/pregnancy-calendar")}
          className="w-full bg-white rounded-2xl p-5 flex items-center justify-between hover:shadow-sm transition-all group mb-3"
          style={{ border: `1px solid ${BRAND.border}` }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-xl transition-colors"
              style={{ background: BRAND.pinkSoft }}
            >
              📅
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold" style={{ color: BRAND.ink }}>Pregnancy calendar</p>
              <p className="text-xs mt-0.5" style={{ color: BRAND.muted }}>See your trimester timeline and milestones</p>
            </div>
          </div>
          <ChevronIcon />
        </button>

        <button
          onClick={() => navigate("/weight-tracker")}
          className="w-full bg-white rounded-2xl p-5 flex items-center justify-between hover:shadow-sm transition-all group mb-3"
          style={{ border: `1px solid ${BRAND.border}` }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-xl transition-colors"
              style={{ background: BRAND.pinkSoft }}
            >
              ⚖️
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold" style={{ color: BRAND.ink }}>Track your weight</p>
              <p className="text-xs mt-0.5" style={{ color: BRAND.muted }}>Log entries and see your trend over time</p>
            </div>
          </div>
          <ChevronIcon />
        </button>

        <button
          onClick={() => navigate("/cravings")}
          className="w-full bg-white rounded-2xl p-5 flex items-center justify-between hover:shadow-sm transition-all group mb-3"
          style={{ border: `1px solid ${BRAND.border}` }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-xl transition-colors"
              style={{ background: BRAND.pinkSoft }}
            >
              🍫
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold" style={{ color: BRAND.ink }}>Log a craving</p>
              <p className="text-xs mt-0.5" style={{ color: BRAND.muted }}>Track what you're craving today</p>
            </div>
          </div>
          <ChevronIcon />
        </button>

        <button
          onClick={handleEndPregnancy}
          disabled={endingPregnancy}
          className="w-full bg-white rounded-2xl p-4 text-center text-sm transition-colors disabled:opacity-50"
          style={{ border: `1px solid ${BRAND.border}`, color: BRAND.muted }}
        >
          {endingPregnancy ? "Ending pregnancy tracking…" : "End pregnancy tracking & return to cycle tracking"}
        </button>
      </div>

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

function PregnancyRing({ daysElapsed, trimester }) {
  const size = 160;
  const stroke = 14;
  const r = (size - stroke) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;

  const segments = [
    { key: "first", start: 0, end: 91, color: TRIMESTER.first.color },
    { key: "second", start: 91, end: 189, color: TRIMESTER.second.color },
    { key: "third", start: 189, end: 280, color: TRIMESTER.third.color },
  ];

  const todayAngle = (daysElapsed / TOTAL_PREGNANCY_DAYS) * 360 - 90;
  const markerX = c + r * Math.cos((todayAngle * Math.PI) / 180);
  const markerY = c + r * Math.sin((todayAngle * Math.PI) / 180);
  const markerColor = TRIMESTER[trimester].color;

  const displayWeek = Math.min(40, Math.ceil(daysElapsed / 7) || 1);

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
            stroke={seg.color}
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
        {displayWeek}
      </text>
      <text x={c} y={c + 14} textAnchor="middle" fontSize="10" fill="#B7A8B1">
        of 40 weeks
      </text>
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0 transition-colors" style={{ color: "#E5DEE1" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

export default PregnancyDashboard;