import { useEffect, useState } from "react";
import Onboardingmodal from "../components/onboardingmodal";

function Dashboard() {
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-gray-400 animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {showModal && <Onboardingmodal onClose={handleOnboardingClose} />}

      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-800">
            Good morning{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 🌸
          </h1>
          <p className="text-sm text-gray-400">Here's your cycle overview</p>
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

            <div className="bg-pink-50 rounded-xl p-5 border border-pink-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-pink-400 mb-1">Next period expected</p>
                <p className="text-xl font-semibold text-pink-700">
                  {getNextPeriod()?.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="text-xs text-pink-300 mt-1">
                  Based on your average cycle
                </p>
              </div>
              <span className="text-4xl">📅</span>
            </div>
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
    </div>
  );
}

export default Dashboard;