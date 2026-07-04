import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatBot from "../components/chatbot";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const TOTAL_PREGNANCY_DAYS = 280;

const POSTPARTUM_BUFFER_DAYS = 42;

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

const TRIMESTERS = [
  { key: "first", label: "First trimester", range: [1, 13], color: "#F0C48F" },
  { key: "second", label: "Second trimester", range: [14, 27], color: "#D97E3D" },
  { key: "third", label: "Third trimester", range: [28, 40], color: "#7A3349" },
];

function PregnancyDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [endingPregnancy, setEndingPregnancy] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("token");
        if (!userId || !token) {
          setLoading(false);
          return;
        }

        const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch user");

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
        setLoading(false);
      }
    };
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-gray-400 animate-pulse">Loading...</p>
      </div>
    );
  }

  const dueDate = user?.pregnancyInfo?.dueDate ? new Date(user.pregnancyInfo.dueDate) : null;

  // No pregnancy data yet
  if (!dueDate) {
    return (
      <div className="min-h-screen bg-[#FAF7F5] flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-4xl mb-4">🤰</p>
          <p className="text-gray-700 font-semibold mb-1">No due date set yet</p>
          <p className="text-sm text-gray-400 mb-6">
            Add your due date or last period to see your pregnancy overview.
          </p>
          <button
            onClick={() => navigate("/pregnancy-setup")}
            className="bg-[#C2597A] text-white px-6 py-2.5 rounded-lg text-sm hover:bg-[#7A3349] transition-colors"
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

  const daysUntilDue = Math.max(0, Math.ceil((dueDate.getTime() - today.getTime()) / MS_PER_DAY));
  const weeksUntilDue = Math.floor(daysUntilDue / 7);
  const remDaysUntilDue = daysUntilDue % 7;

  const currentTrimester =
    TRIMESTERS.find((t) => displayWeek >= t.range[0] && displayWeek <= t.range[1]) ||
    TRIMESTERS[TRIMESTERS.length - 1];

  const babySize = getBabySize(displayWeek);
  const progressPct = Math.min(100, (clampedDaysElapsed / TOTAL_PREGNANCY_DAYS) * 100);

  const formatDate = (d) =>
    d?.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="min-h-screen bg-[#FAF7F5] relative">
      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">
              Hello{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 🤰
            </h1>
            <p className="text-sm text-gray-400">Here's your pregnancy overview</p>
          </div>

          <button
            onClick={() => setIsChatOpen(true)}
            className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-lg shadow-sm hover:border-[#C2597A] hover:text-[#C2597A] transition-colors"
            title="Ask Luna"
          >
            💬
          </button>
        </div>

        {/* Week / trimester progress card */}
        <div className="bg-white rounded-2xl p-6 mb-4 border border-gray-100">
          <p className="text-base font-semibold text-gray-800">
            Week {displayWeek}, Day {dayIntoWeek}
          </p>
          <p className="text-xs text-gray-400 mt-0.5 mb-5">{currentTrimester.label}</p>

          <div className="relative pt-6 pb-1">
            <div className="h-2 rounded-full bg-gray-100 relative overflow-hidden">
              {TRIMESTERS.map((t) => {
                const start = ((t.range[0] - 1) / 40) * 100;
                const width = ((t.range[1] - t.range[0] + 1) / 40) * 100;
                return (
                  <div
                    key={t.key}
                    className="absolute top-0 h-full"
                    style={{ left: `${start}%`, width: `${width}%`, backgroundColor: t.color }}
                  />
                );
              })}
            </div>

            <div
              className="absolute -top-1 flex flex-col items-center"
              style={{ left: `${progressPct}%`, transform: "translateX(-50%)" }}
            >
              <div className="w-4 h-4 rounded-full bg-white border-2 border-[#7A3349] shadow-sm" />
              <span className="text-[10px] font-semibold text-black bg-white px-1.5 rounded mt-1 whitespace-nowrap shadow-sm">
                Today
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4">
            {TRIMESTERS.map((t) => (
              <div key={t.key} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                <span
                  className={`text-[11px] ${
                    currentTrimester.key === t.key ? "font-semibold text-gray-700" : "text-gray-400"
                  }`}
                >
                  {t.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Due date countdown */}
        <div className="bg-white rounded-2xl p-6 mb-4 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 mb-1">Due date</p>
              <p className="text-xl font-semibold text-[#7A3349]">{formatDate(dueDate)}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-[#C2597A]">
                {weeksUntilDue}w {remDaysUntilDue}d
              </p>
              <p className="text-xs text-gray-400">to go</p>
            </div>
          </div>
        </div>

        {/* Baby size this week */}
        <div className="bg-[#F6DCE3] rounded-2xl p-6 mb-4 border border-[#F0C7D1]">
          <p className="text-xs text-[#7A3349]/70 mb-1">This week, your baby is about the size of</p>
          <div className="flex items-center gap-4">
            <span className="text-5xl">{babySize.emoji}</span>
            <div>
              <p className="text-lg font-semibold text-[#7A3349] capitalize">{babySize.thing}</p>
              <p className="text-sm text-[#7A3349]/80 mt-1">{babySize.note}</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate("/cravings")}
          className="w-full bg-white rounded-xl p-5 border border-gray-100 flex items-center justify-between hover:border-[#C2597A]/40 hover:shadow-sm transition-all group mb-3"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-[#F6DCE3] flex items-center justify-center text-xl group-hover:bg-[#F0C7D1] transition-colors">
              🍫
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">Log a craving</p>
              <p className="text-xs text-gray-400 mt-0.5">Track what you're craving today</p>
            </div>
          </div>
          <svg className="w-4 h-4 text-gray-300 group-hover:text-[#C2597A] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={() => setIsChatOpen(true)}
          className="w-full bg-white rounded-xl p-5 border border-gray-100 flex items-center justify-between hover:border-[#C2597A]/40 hover:shadow-sm transition-all group mb-3"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-[#F6DCE3] flex items-center justify-center text-xl group-hover:bg-[#F0C7D1] transition-colors">
              💬
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-800">Ask Luna a question</p>
              <p className="text-xs text-gray-400 mt-0.5">Get answers to your doubts, any time</p>
            </div>
          </div>
          <svg className="w-4 h-4 text-gray-300 group-hover:text-[#C2597A] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={handleEndPregnancy}
          disabled={endingPregnancy}
          className="w-full bg-white rounded-xl p-4 border border-gray-200 text-center text-sm text-gray-500 hover:border-[#C2597A]/40 hover:text-[#7A3349] transition-colors disabled:opacity-50"
        >
          {endingPregnancy ? "Ending pregnancy tracking…" : "End pregnancy tracking & return to cycle tracking"}
        </button>
      </div>

      {isChatOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <ChatBot onClose={() => setIsChatOpen(false)} />
        </div>
      )}
    </div>
  );
}

export default PregnancyDashboard;