import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Trash2, Loader2 } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import MiniCalendarPicker from "../components/minicalendarpicker";

function WeightTracker() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState(new Date());
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("kg");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const token = localStorage.getItem("token");

  const fetchLogs = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/weight", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load weight history");
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!value || Number(value) <= 0) {
      setError("Enter a valid weight.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");

      const res = await fetch("http://localhost:5000/api/weight", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ date: `${y}-${m}-${d}`, value, unit, notes }),
      });
      if (!res.ok) throw new Error("Failed to save entry");
      const data = await res.json();
      setLogs(data);
      setValue("");
      setNotes("");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      const res = await fetch(`http://localhost:5000/api/weight/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete entry");
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const chartData = useMemo(() => {
    return logs.map((log) => ({
      label: new Date(log.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      weight: unit === "lb" ? Math.round(log.weightKg / 0.45359237 * 10) / 10 : Math.round(log.weightKg * 10) / 10,
    }));
  }, [logs, unit]);

  const totalChange = useMemo(() => {
    if (logs.length < 2) return null;
    const first = logs[0].weightKg;
    const last = logs[logs.length - 1].weightKg;
    const diffKg = last - first;
    const diff = unit === "lb" ? diffKg / 0.45359237 : diffKg;
    return Math.round(diff * 10) / 10;
  }, [logs, unit]);

  return (
    <div className="min-h-screen bg-[#FDF6F3]">
      <div className="max-w-3xl mx-auto p-6">
        <button
          onClick={() => navigate("/pregnancy-dashboard")}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#C2597A] transition-colors mb-4"
        >
          <ChevronLeft size={16} /> Back to overview
        </button>

        <h1 className="font-serif text-3xl text-gray-900 mb-1">Weight tracking</h1>
        <p className="text-sm text-gray-500 mb-6">Log your weight and watch the trend over your pregnancy</p>

        {totalChange !== null && (
          <div className="bg-white rounded-2xl p-5 border border-gray-200 mb-4">
            <p className="text-xs text-gray-400 mb-1">Since your first log</p>
            <p className="text-2xl font-semibold" style={{ color: totalChange >= 0 ? "#C2597A" : "#7A9E7E" }}>
              {totalChange >= 0 ? "+" : ""}{totalChange} {unit}
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-4">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Trend</h2>
          {loading ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3E4E9" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#B7A8B1" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "#B7A8B1" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} unit={unit} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #FDE3EC", fontSize: 13 }} />
                <Line type="monotone" dataKey="weight" stroke="#C2597A" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400">Log your first entry below to see a trend.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-4">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Log a new entry</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <MiniCalendarPicker label="Date" value={date} onChange={setDate} maxDate={new Date()} />

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1.5">Weight</label>
                <input
                  type="number"
                  step="0.1"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="e.g. 62.5"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#C2597A]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Unit</label>
                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setUnit("kg")}
                    className={`px-3 py-2.5 text-sm ${unit === "kg" ? "bg-[#C2597A] text-white" : "bg-white text-gray-500"}`}
                  >
                    kg
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit("lb")}
                    className={`px-3 py-2.5 text-sm ${unit === "lb" ? "bg-[#C2597A] text-white" : "bg-white text-gray-500"}`}
                  >
                    lb
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. after breakfast"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#C2597A]"
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#C2597A] text-white py-2.5 rounded-lg text-sm hover:bg-[#7A3349] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? "Saving…" : "Log weight"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h2 className="text-base font-semibold text-gray-800 mb-4">History</h2>
          {logs.length === 0 && !loading ? (
            <p className="text-sm text-gray-400">No entries logged yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {[...logs].reverse().map((log) => (
                <div key={log._id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm text-gray-800">
                      {log.enteredValue} {log.enteredUnit}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(log.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      {log.notes ? ` · ${log.notes}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(log._id)}
                    disabled={deletingId === log._id}
                    className="p-2 rounded-full hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    {deletingId === log._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WeightTracker;