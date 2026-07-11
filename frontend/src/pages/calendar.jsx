import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CycleDetails from "../components/cycledetails";

function CalendarPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("token");

        if (!userId || !token) {
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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FDF6F3]">
        <p className="text-sm text-gray-400 animate-pulse">Loading...</p>
      </div>
    );
  }

  if (!user?.cycleInfo?.lastPeriod) {
    return (
      <div className="min-h-screen bg-[#FDF6F3] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">No cycle data yet.</p>
          <button
            onClick={() => navigate("/")}
            className="bg-pink-500 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-pink-600 transition-colors"
          >
            Go set up your cycle
          </button>
        </div>
      </div>
    );
  }

  const cycleLength = Number(user.cycleInfo.cycleLength);
  const periodLength = Number(user.cycleInfo.periodLength);
  const lastPeriodDate = new Date(user.cycleInfo.lastPeriod);

  return (
    <div className="min-h-screen bg-[#FDF6F3]">
      <div className="max-w-6xl mx-auto p-6">
        <CycleDetails
          lastPeriodStart={lastPeriodDate}
          cycleLength={cycleLength}
          periodLength={periodLength}
          history={user.cycleInfo?.history || []}
          apiBaseUrl="http://localhost:5000/api"
          authToken={localStorage.getItem("token")}
          onCycleUpdate={(updatedUser) => setUser(updatedUser)}
          showStats={false}
        />
      </div>
    </div>
  );
}

export default CalendarPage;