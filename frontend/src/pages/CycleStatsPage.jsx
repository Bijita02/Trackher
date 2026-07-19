import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";
import { ChevronLeft } from "lucide-react";
import { MS_PER_DAY, stripTime } from "../utils/cycleMath";

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

      // cycleInfo.lastPeriod may hold an initial period date that was never
      // pushed into cycleInfo.history (e.g. set during onboarding, before
      // this record went through the /user-cycle $push flow). Merge it in
      // as its own entry so it still shows up in the trend, same as the
      // calendar page already does when building periodStarts.
      const rawHistory = userData.cycleInfo?.history || [];
      const lastPeriodEntry = userData.cycleInfo?.lastPeriod
        ? [{ date: userData.cycleInfo.lastPeriod, cycleLength: null, periodLength: null }]
        : [];
      const seenDays = new Set();
      const cleaned = [...rawHistory, ...lastPeriodEntry]
        .map((h) => ({
          date: new Date(h.date),
          cycleLength: h.cycleLength ? Number(h.cycleLength) : null,
          periodLength: h.periodLength ? Number(h.periodLength) : null,
        }))
        .filter((h) => !isNaN(h.date))
        .filter((h) => {
          const key = stripTime(h.date);
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

  // The trend chart plots CYCLE LENGTHS — the gap between two consecutive
  // logged period-start dates. Each length is attributed to the date the
  // cycle STARTED, so "May 4" shows the length of the cycle that began on
  // May 4th and ran until the next logged period.
  //
  // The most recent logged date is different: that cycle is still running
  // today, so instead of no value at all, it gets "days elapsed so far"
  // (today − that date) — real, useful info, but explicitly not a finished
  // cycle length. It's kept in a separate series (currentLength) so it can
  // be drawn as a dashed, visually distinct segment rather than looking
  // like a completed cycle.
  //
  // Gaps beyond OUTLIER_MAX_GAP days are almost never a real cycle — far
  // more likely a mistyped date (e.g. wrong year). Those are flagged and
  // excluded from the plotted line/scale so one bad entry doesn't crush
  // the Y axis and hide every real point.
  const OUTLIER_MAX_GAP = 90;

  const sortedDates = useMemo(
    () => [...historyEntries.map((h) => h.date)].sort((a, b) => a - b),
    [historyEntries]
  );

  const firstLoggedDate = sortedDates[0] || null;

  const realCyclePoints = useMemo(() => {
    const today = new Date();

    return sortedDates.map((date, i) => {
      const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

      // last logged date = current cycle, still in progress
      if (i === sortedDates.length - 1) {
        // +1 so the start date itself is "day 1", matching dayInCycle()'s
        // convention elsewhere in the app (mod + 1) — a plain date diff
        // would call the start date "day 0", which is off by one.
        const daysSoFar = Math.round((stripTime(today) - stripTime(date)) / MS_PER_DAY) + 1;
        return { label, length: daysSoFar, isOutlier: false, isCurrent: true, rawDiff: null };
      }

      const diff = Math.round((stripTime(sortedDates[i + 1]) - stripTime(date)) / MS_PER_DAY);
      const isOutlier = diff < 0 || diff > OUTLIER_MAX_GAP;
      return { label, length: isOutlier ? null : diff, isOutlier, isCurrent: false, rawDiff: diff };
    });
  }, [sortedDates]);

  const outlierPoints = realCyclePoints.filter((p) => p.isOutlier);

  const getAverageCycleLength = () => {
    const lengths = realCyclePoints.map((p) => p.length).filter((v) => v !== null);
    if (lengths.length === 0) return currentCycleLength;
    return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
  };

  const getAveragePeriodLength = () => {
    const lengths = historyEntries
      .map((h) => h.periodLength)
      .filter((v) => v !== null && v > 0);

    if (lengths.length === 0) return currentPeriodLength;
    return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
  };

  const cycleTrendData = useMemo(() => {
    const points = realCyclePoints.slice(-6);
    return points.map((p, idx) => {
      const isLast = idx === points.length - 1;
      const isSecondToLast = idx === points.length - 2;
      const nextIsCurrent = isSecondToLast && points[points.length - 1].isCurrent;
      return {
        ...p,
        completedLength: !p.isCurrent && !p.isOutlier ? p.length : null,
        // bridge point: the point right before "current" also carries its
        // own value on the dashed series so the dashed line has somewhere
        // to start from, instead of jumping in from nowhere
        currentLength: p.isCurrent ? p.length : nextIsCurrent && !p.isOutlier ? p.length : null,
      };
    });
  }, [realCyclePoints]);
  const hasRealTrendData = cycleTrendData.some((p) => !p.isOutlier && !p.isCurrent);

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
          {!hasRealTrendData && (
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
            {hasRealTrendData ? "Your last logged periods" : "Log at least two periods to see your trend"}
          </p>

          {cycleTrendData.length > 0 ? (
            <>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={cycleTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cycleFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E23670" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#E23670" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cycleFillCurrent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F2A93B" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#F2A93B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#FBE7EF" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#B7A8B1" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#B7A8B1" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: "1px solid #FDE3EC", fontSize: 13 }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const point = payload[0].payload;
                    return (
                      <div style={{ background: "#fff", border: "1px solid #FDE3EC", borderRadius: 10, padding: "8px 12px", fontSize: 13 }}>
                        <p style={{ color: "#241220", fontWeight: 600 }}>{point.label}</p>
                        {point.isOutlier ? (
                          <p style={{ color: "#E23670" }}>This date looks off — check for a typo</p>
                        ) : point.isCurrent ? (
                          <p style={{ color: "#8F8290" }}>Day {point.length} of current cycle — still counting</p>
                        ) : (
                          <p style={{ color: "#8F8290" }}>{point.length} day cycle</p>
                        )}
                      </div>
                    );
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="completedLength"
                  stroke="#E23670"
                  strokeWidth={2.5}
                  fill="url(#cycleFill)"
                  connectNulls={false}
                />
                <Area
                  type="monotone"
                  dataKey="currentLength"
                  stroke="#F2A93B"
                  strokeWidth={2.5}
                  strokeDasharray="5 4"
                  fill="url(#cycleFillCurrent)"
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-xs" style={{ color: "#8F8290" }}>
                <span className="w-3 h-0.5 rounded" style={{ background: "#E23670" }} /> Completed
              </span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: "#8F8290" }}>
                <span className="w-3 h-0.5" style={{ borderTop: "2px dashed #F2A93B" }} /> In progress
              </span>
            </div>
            {outlierPoints.length > 0 && (
              <p className="text-xs mt-3" style={{ color: "#E23670" }}>
                ⚠ {outlierPoints.length === 1 ? "One logged date looks" : `${outlierPoints.length} logged dates look`} off ({outlierPoints.map((p) => p.label).join(", ")}) — probably a typo in the year or month. It's excluded from this chart so it doesn't throw off the scale.
              </p>
            )}
            </>
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