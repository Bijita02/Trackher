import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const CycleHistory = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      const sortedHistory = (data.cycleInfo?.history || [])
        .map((h) => new Date(h.date))
        .sort((a, b) => b - a);

      setHistory(sortedHistory);
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  };

  // 📊 Average cycle length calculation
  const getAverageCycle = () => {
    if (history.length < 2) return 0;

    let total = 0;
    for (let i = 0; i < history.length - 1; i++) {
      const diff =
        (history[i] - history[i + 1]) / (1000 * 60 * 60 * 24);
      total += diff;
    }

    return Math.round(total / (history.length - 1));
  };

  // 📈 Trend detection
  const getTrend = () => {
    if (history.length < 3) return "Not enough data";

    const latest =
      (history[0] - history[1]) / (1000 * 60 * 60 * 24);
    const previous =
      (history[1] - history[2]) / (1000 * 60 * 60 * 24);

    if (latest > previous + 2) return "Cycle is getting longer 📈";
    if (latest < previous - 2) return "Cycle is getting shorter 📉";
    return "Cycle is stable ⚖️";
  };

const getCycleLengths = () => {
  if (history.length < 2) return [];

  let cycles = [];

  for (let i = 0; i < history.length - 1; i++) {
    const diff =
      (history[i] - history[i + 1]) / (1000 * 60 * 60 * 24);

    cycles.push(Math.round(diff));
  }

  return cycles;
};

const getInsight = () => {
  if (history.length < 3) {
    return "Log more cycles for better predictions 📊";
  }

  const cycles = getCycleLengths();
  const avg =
    cycles.reduce((a, b) => a + b, 0) / cycles.length;

  const variance =
    cycles.reduce((sum, val) => sum + Math.abs(val - avg), 0) /
    cycles.length;

  if (variance < 2) {
    return "Your cycle is very stable ⚖️";
  } else if (variance < 5) {
    return "Your cycle is slightly irregular 🙂";
  } else {
    return "Your cycle is irregular — keep tracking ⚠️";
  }
};

  return (
    <div className="min-h-screen bg-pink-50 p-6">

      {/* HEADER */}
      <button
        onClick={() => navigate("/dashboard")}
        className="mb-6 text-pink-600 font-medium"
      >
        ← Back to Dashboard
      </button>

      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Cycle History 📊
      </h1>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-gray-500 text-sm">Average Cycle</p>
          <h2 className="text-2xl font-bold text-pink-500">
            {getAverageCycle()} days
          </h2>
        </div>
        
<div className="bg-white p-4 rounded-xl shadow border border-gray-100">
  <p className="text-gray-500 text-sm mb-1">Insight</p>

  <h2 className="text-md font-semibold text-gray-700">
    {getInsight()}
  </h2>
</div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-gray-500 text-sm">Total Cycles</p>
          <h2 className="text-2xl font-bold text-pink-500">
            {history.length}
          </h2>
        </div>

        <div className="bg-white p-4 rounded-xl shadow">
          <p className="text-gray-500 text-sm">Trend</p>
          <h2 className="text-md font-semibold text-gray-700">
            {getTrend()}
          </h2>
        </div>

      </div>

      {/* HISTORY LIST */}
      <div className="bg-white rounded-xl shadow p-5">
        <h2 className="text-lg font-semibold mb-4">
          Recent Cycles
        </h2>

        {history.length === 0 ? (
          <p className="text-gray-400">No data yet</p>
        ) : (
          <div className="space-y-3">
            {history.map((date, index) => (
              <div
                key={index}
                className="flex justify-between border-b pb-2"
              >
                <span className="text-gray-700">
                  Cycle {history.length - index}
                </span>
                <span className="text-pink-500 font-medium">
                  {date.toDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default CycleHistory;