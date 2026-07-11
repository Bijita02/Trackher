import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";
import { ChevronLeft } from "lucide-react";

const MS_PER_DAY = 86400000;

const BAR_COLORS = ["#E23670", "#EB5490", "#F281AB", "#F7A7C6", "#FBCADD"];

export default function CycleStatsPage() {
  const navigate = useNavigate();

  const [currentCycleLength, setCurrentCycleLength] = useState(28);
  const [currentPeriodLength, setCurrentPeriodLength] = useState(5);

  const [historyEntries, setHistoryEntries] = useState([]); // [{date, cycleLength, periodLength}]
  const [symptomCounts, setSymptomCounts] = useState({ counts: {}, displayName: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      if (!userId || !token) {
        setError("You need to be logged in to view stats.");
        setLoading(false);
        return;
      }

      // Cycle length / period length / period-start history come from the user record
      const userRes = await fetch(`http://localhost:5000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!userRes.ok) throw new Error("Failed to fetch user data");
      const userData = await userRes.json();

      if (userData.cycleInfo?.cycleLength) setCurrentCycleLength(Number(userData.cycleInfo.cycleLength));
      if (userData.cycleInfo?.periodLength) setCurrentPeriodLength(Number(userData.cycleInfo.periodLength));

      const rawHistory = userData.cycleInfo?.history || [];
      const seenDays = new Set();
      const cleaned = rawHistory
        .map((h) => ({
          date: new Date(h.date),
          cycleLength: h.cycleLength ? Number(h.cycleLength) : null,
          periodLength: h.periodLength ? Number(h.periodLength) : null,
        }))
        .filter((h) => !isNaN(h.date))
        .filter((h) => {
          const key = h.date.toDateString();
          if (seenDays.has(key)) return false;
          seenDays.add(key);
          return true;
        })
        .sort((a, b) => b.date - a.date);

      setHistoryEntries(cleaned);

      // Symptoms come from the real /api/symptoms endpoint (Symptom collection).
      // This is wrapped in its own try/catch so a symptoms-fetch failure
      // never sends the whole page to the error screen — it just shows
      // "No symptoms logged yet" instead.
      try {
        const symptomsRes = await fetch(`http://localhost:5000/api/symptoms`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!symptomsRes.ok) throw new Error("Failed to fetch symptom data");
        const symptomLogs = await symptomsRes.json(); // array of { tags, date, intensity, notes, ... }

        const counts = {};
        const displayName = {}; // normalized key -> first-seen original casing/spacing

        symptomLogs.forEach((entry) => {
          (entry.tags || []).forEach((tag) => {
            const key = tag.trim().toLowerCase();
            if (!key) return;
            counts[key] = (counts[key] || 0) + 1;
            if (!displayName[key]) displayName[key] = tag.trim();
          });
        });

        setSymptomCounts({ counts, displayName });
      } catch (symptomErr) {
        console.error("Error fetching symptoms:", symptomErr);
        setSymptomCounts({ counts: {}, displayName: {} }); // falls back to "No symptoms logged yet"
      }

    } catch (err) {
      console.error("Error fetching cycle stats:", err);
      setError("Could not load your cycle stats. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Real gaps between logged period-start dates, oldest → newest.
  // Each gap IS a real cycle length: the number of days between two
  // consecutive periods she actually logged.
  const realCycleGaps = useMemo(() => {
    const dates = [...historyEntries.map((h) => h.date)].sort((a, b) => a - b);
    const gaps = [];
    for (let i = 0; i < dates.length - 1; i++) {
      const diff = Math.round((dates[i + 1] - dates[i]) / MS_PER_DAY);
      if (diff >= 15 && diff <= 60) {
        gaps.push({
          label: dates[i + 1].toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          length: diff,
        });
      }
    }
    return gaps;
  }, [historyEntries]);

  const getAverageCycleLength = () => {
    if (realCycleGaps.length === 0) return currentCycleLength;
    const sum = realCycleGaps.reduce((a, g) => a + g.length, 0);
    return Math.round(sum / realCycleGaps.length);
  };

  const getAveragePeriodLength = () => {
    const lengths = historyEntries
      .map((h) => h.periodLength)
      .filter((v) => v !== null && v > 0);

    if (lengths.length === 0) return currentPeriodLength;
    return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
  };

  const cycleTrendData = realCycleGaps.slice(-6); // last 6 REAL logged cycles, nothing invented
  const hasRealTrendData = cycleTrendData.length > 0;

  const symptomChartData = useMemo(() => {
    const { counts = {}, displayName = {} } = symptomCounts || {};
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return entries.slice(0, 5).map(([key, count]) => ({
      name: displayName[key] || key,
      count,
    }));
  }, [symptomCounts]);

  const hasRealSymptomData = symptomChartData.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-gray-400 animate-pulse">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-sm text-gray-500">{error}</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="text-sm font-medium"
          style={{ color: "#E23670" }}
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-[#FAF7F5] p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
        .fr-display { font-family: 'Fraunces', serif; }
      `}</style>

      <button
        onClick={() => navigate("/dashboard")}
        className="flex items-center gap-1 mb-6 text-sm font-medium"
        style={{ color: "#E23670" }}
      >
        <ChevronLeft size={16} /> Back to Dashboard
      </button>

      <h1 className="fr-display text-3xl mb-6" style={{ color: "#241220" }}>
        Cycle Stats
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #FDE3EC" }}>
          <p className="text-xs mb-1" style={{ color: "#8F8290" }}>Average Cycle Length</p>
          <h2 className="fr-display text-3xl" style={{ color: "#E23670" }}>
            {getAverageCycleLength()} days
          </h2>
          {realCycleGaps.length === 0 && (
            <p className="text-xs mt-1" style={{ color: "#B7A8B1" }}>Based on your current setting — log a couple more periods for a real average</p>
          )}
        </div>

        <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #FDE3EC" }}>
          <p className="text-xs mb-1" style={{ color: "#8F8290" }}>Average Period Length</p>
          <h2 className="fr-display text-3xl" style={{ color: "#E23670" }}>
            {getAveragePeriodLength()} days
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #FDE3EC" }}>
          <h3 className="fr-display text-lg mb-1" style={{ color: "#241220" }}>Cycle length trend</h3>
          <p className="text-xs mb-4" style={{ color: "#8F8290" }}>
            {hasRealTrendData ? "Your last logged cycles" : "Log at least two periods to see your trend"}
          </p>

          {hasRealTrendData ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={cycleTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cycleFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E23670" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#E23670" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#FBE7EF" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#B7A8B1" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#B7A8B1" }} axisLine={false} tickLine={false} domain={[20, 36]} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #FDE3EC", fontSize: 13 }} />
                <Area type="monotone" dataKey="length" stroke="#E23670" strokeWidth={2.5} fill="url(#cycleFill)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center text-center" style={{ height: 220 }}>
              <p className="text-sm" style={{ color: "#B7A8B1" }}>
                No trend yet — this chart fills in as you log each new period.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #FDE3EC" }}>
          <h3 className="fr-display text-lg mb-1" style={{ color: "#241220" }}>Most logged symptoms</h3>
          <p className="text-xs mb-4" style={{ color: "#8F8290" }}>
            {hasRealSymptomData ? "All time" : "Log symptoms to see your top ones here"}
          </p>

          {hasRealSymptomData ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={symptomChartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FBE7EF" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: "#B7A8B1" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12, fill: "#241220" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #FDE3EC", fontSize: 13 }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {symptomChartData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center text-center" style={{ height: 220 }}>
              <p className="text-sm" style={{ color: "#B7A8B1" }}>
                No symptoms logged yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}