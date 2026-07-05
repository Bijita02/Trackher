import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Onboardingmodal from "../components/onboardingmodal";
import ChatBot from "../components/chatbot";
import CycleDetails from "../components/cycledetails";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const POSTPARTUM_BUFFER_DAYS = 42;

function Dashboard() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const fetchUser = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      if (!userId || !token) {
        setShowModal(true);
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
      loading && setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleOnboardingClose = async () => {
    setShowModal(false);
    await fetchUser();
  };

  const getCycleDay = () => {
    if (!user?.cycleInfo?.lastPeriod) return null;
    const cycleLength = Number(user.cycleInfo.cycleLength);
    const lastPeriod = new Date(user.cycleInfo.lastPeriod);
    const daysSince = Math.floor((Date.now() - lastPeriod.getTime()) / MS_PER_DAY);
    if (daysSince < 0) return 1;
    return (daysSince % cycleLength) + 1;
  };

  const PHASES = [
    { key: "menstrual", label: "Period", color: "#C2597A" },
    { key: "follicular", label: "Follicular", color: "#F0C48F" },
    { key: "ovulatory", label: "Ovulation", color: "#D97E3D" },
    { key: "luteal", label: "Luteal", color: "#7A3349" },
  ];

  const getPhase = (cycleDay, periodLength) => {
    if (cycleDay == null) return null;
    if (cycleDay <= periodLength) return "menstrual";
    if (cycleDay <= 13) return "follicular";
    if (cycleDay <= 15) return "ovulatory";
    return "luteal";
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-gray-400 animate-pulse">Loading...</p>
      </div>
    );
  }

  const cycleLength = user?.cycleInfo ? Number(user.cycleInfo.cycleLength) : null;
  const periodLength = user?.cycleInfo ? Number(user.cycleInfo.periodLength) : null;
  const cycleDay = getCycleDay();
  const currentPhase = getPhase(cycleDay, periodLength);
  const lastPeriodDate = user?.cycleInfo?.lastPeriod ? new Date(user.cycleInfo.lastPeriod) : null;

  const dayBounds = cycleLength
    ? {
        menstrualEnd: Math.min(periodLength, cycleLength),
        follicularEnd: Math.min(Math.max(13, periodLength), cycleLength),
        ovulatoryEnd: Math.min(Math.max(15, periodLength), cycleLength),
      }
    : { menstrualEnd: 0, follicularEnd: 0, ovulatoryEnd: 0 };

  const toPct = (days) => (cycleLength ? (days / cycleLength) * 100 : 0);

  const segments = cycleLength
    ? [
        { ...PHASES[0], start: 0, width: toPct(dayBounds.menstrualEnd) },
        { ...PHASES[1], start: toPct(dayBounds.menstrualEnd), width: toPct(dayBounds.follicularEnd - dayBounds.menstrualEnd) },
        { ...PHASES[2], start: toPct(dayBounds.follicularEnd), width: toPct(dayBounds.ovulatoryEnd - dayBounds.follicularEnd) },
        { ...PHASES[3], start: toPct(dayBounds.ovulatoryEnd), width: 100 - toPct(dayBounds.ovulatoryEnd) },
      ]
    : [];

  const todayPct = cycleLength && cycleDay ? Math.min(100, ((cycleDay - 1) / cycleLength) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#FAF7F5] relative">
      {showModal && <Onboardingmodal onClose={handleOnboardingClose} />}

      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">
              Good morning{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 
            </h1>
            <p className="text-sm text-gray-400">Here's your cycle overview</p>
          </div>

          <div className="flex items-center gap-3">
          
            <button
              onClick={() => setIsChatOpen(true)}
              className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-lg shadow-sm hover:border-[#C2597A] hover:text-[#C2597A] transition-colors"
              title="Ask Luna"
            >
              💬
            </button>
          </div>
        </div>

        {user?.cycleInfo?.lastPeriod ? (
          <>

            <CycleDetails
              lastPeriodStart={lastPeriodDate}
              cycleLength={cycleLength}
              periodLength={periodLength}
            />

            <button
              onClick={handleNavigateToCycleStats}
              className="w-full bg-white rounded-2xl p-6 mb-4 border border-gray-100 text-left hover:border-[#C2597A]/40 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold text-gray-800 mb-1">
                    Cycle Stats & Phase History
                  </p>
                  <p className="text-xs text-gray-400">
                    Trends, averages, and most logged symptoms
                  </p>
                </div>
                <svg
                  className="w-4 h-4 text-gray-300 group-hover:text-[#C2597A] transition-colors"
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

            <button
              onClick={() => navigate("/symptoms")}
              className="w-full bg-white rounded-xl p-5 border border-gray-100 flex items-center justify-between hover:border-[#C2597A]/40 hover:shadow-sm transition-all group mb-3"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-[#F6DCE3] flex items-center justify-center text-xl group-hover:bg-[#F0C7D1] transition-colors">
                  🩺
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800">
                    Log symptoms
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Track how you're feeling today
                  </p>
                </div>
              </div>
              <svg
                className="w-4 h-4 text-gray-300 group-hover:text-[#C2597A] transition-colors"
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
            </button>

            <button
              onClick={() => navigate("/pregnancy-setup")}
              className="w-full bg-white rounded-xl p-5 border border-gray-100 flex items-center justify-between hover:border-[#C2597A]/40 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-[#F6DCE3] flex items-center justify-center text-xl group-hover:bg-[#F0C7D1] transition-colors">
                  🤰
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800">
                    I'm pregnant
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Switch to pregnancy tracking
                  </p>
                </div>
              </div>
              <svg
                className="w-4 h-4 text-gray-300 group-hover:text-[#C2597A] transition-colors"
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
            </button>
          </>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">No cycle data yet.</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-[#C2597A] text-white px-6 py-2.5 rounded-lg text-sm hover:bg-[#7A3349] transition-colors"
            >
              Set up your cycle
            </button>
          </div>
        )}
      </div>

      {isChatOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <ChatBot onClose={() => setIsChatOpen(false)} />
        </div>
      )}
    </div>
  );
}

export default Dashboard;