import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Onboardingmodal from "../components/onboardingmodal";
import ChatBot from "../components/chatbot";

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
      console.log("User data:", data);
      setUser(data);

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

  const getNextPeriod = () => {
    if (!user?.cycleInfo?.lastPeriod) return null;
    const next = new Date(user.cycleInfo.lastPeriod);
    next.setDate(next.getDate() + Number(user.cycleInfo.cycleLength));
    return next;
  };

  const getDaysUntil = () => {
    const next = getNextPeriod();
    if (!next) return null;
    return Math.max(
      0,
      Math.ceil((next.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );
  };

  // 🎯 INTEGRATION: Helper to navigate to your cycle sheet page with database state
  const handleNavigateToCycleDetails = () => {
    if (!user?.cycleInfo) return;
    navigate("/cycle-details", {
      state: {
        lastPeriodDate: user.cycleInfo.lastPeriod,
        cycleLength: Number(user.cycleInfo.cycleLength),
        periodLength: Number(user.cycleInfo.periodLength)
      }
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-gray-400 animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {showModal && <Onboardingmodal onClose={handleOnboardingClose} />}

      <div className="max-w-3xl mx-auto p-6">
        
        {/* HEADER WITH ACTION ICONS */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-xl font-semibold text-gray-800">
              Good morning{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 🌸
            </h1>
            <p className="text-sm text-gray-400">Here's your cycle overview</p>
          </div>

          <div className="flex items-center gap-3">
            {/* 🎯 INTEGRATION 1: History Icon Button Shortcut */}
            <button 
              onClick={handleNavigateToCycleDetails}
              className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-lg shadow-sm hover:border-pink-300 hover:text-pink-500 transition-colors"
              title="View Cycle Sheet History"
            >
              📜
            </button>

            {/* Chatbot trigger */}
            <button 
              onClick={() => setIsChatOpen(true)}
              className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center text-lg shadow-sm hover:border-pink-300 hover:text-pink-500 transition-colors"
              title="Ask Luna"
            >
              💬
            </button>
          </div>
        </div>

        {user?.cycleInfo?.lastPeriod ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Last period</p>
                <p className="text-lg font-semibold text-gray-800">
                  {new Date(user.cycleInfo.lastPeriod).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric" }
                  )}
                </p>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Cycle length</p>
                <p className="text-lg font-semibold text-gray-800">
                  {user.cycleInfo.cycleLength}{" "}
                  <span className="text-sm font-normal text-gray-400">days</span>
                </p>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Period length</p>
                <p className="text-lg font-semibold text-gray-800">
                  {user.cycleInfo.periodLength}{" "}
                  <span className="text-sm font-normal text-gray-400">days</span>
                </p>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">Days until next</p>
                <p className="text-lg font-semibold text-pink-500">
                  {getDaysUntil()}{" "}
                  <span className="text-sm font-normal text-gray-400">days</span>
                </p>
              </div>
            </div>

            {/* 🎯 INTEGRATION 2: Made the pink card clickable */}
            <div 
              onClick={handleNavigateToCycleDetails}
              className="bg-pink-50 rounded-xl p-5 border border-pink-100 flex items-center justify-between cursor-pointer hover:bg-pink-100/70 hover:border-pink-200 transition-all mb-4"
              title="Click for detailed trends and history sheet"
            >
              <div>
                <p className="text-xs text-pink-400 mb-1">Next period expected</p>
                <p className="text-xl font-semibold text-pink-700">
                  {getNextPeriod()?.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    fullName: "true"
                  })}
                </p>
                <p className="text-xs text-pink-400/80 mt-1 font-medium animate-pulse">
                  ➔ Click to view detailed calendar sheet & phase analysis
                </p>
              </div>
              <span className="text-4xl">📅</span>
            </div>

            {/* Symptoms card */}
            <button
              onClick={() => navigate("/symptoms")}
              className="w-full bg-white rounded-xl p-5 border border-gray-100 flex items-center justify-between hover:border-pink-200 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-full bg-pink-50 flex items-center justify-center text-xl group-hover:bg-pink-100 transition-colors">
                  芯
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
                className="w-4 h-4 text-gray-300 group-hover:text-pink-400 transition-colors"
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
              className="bg-pink-400 text-white px-6 py-2.5 rounded-lg text-sm hover:bg-pink-500 transition-colors"
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