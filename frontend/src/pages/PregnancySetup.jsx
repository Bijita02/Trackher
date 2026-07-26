import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MiniCalendarPicker from "../components/minicalendarpicker";

const TOTAL_PREGNANCY_DAYS = 280;
function formatLocalYMD(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function utcStringToLocalDate(isoString) {
  const d = new Date(isoString);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function addDaysLocal(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function PregnancySetup() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("dueDate"); 
  const [selectedDate, setSelectedDate] = useState(null);
  const [hasUserEdited, setHasUserEdited] = useState(false); 
  const [existingLastPeriod, setExistingLastPeriod] = useState(null); 
  const [prefillNote, setPrefillNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchExistingCycleInfo = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("token");
        if (!userId || !token) return;

        const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;

        const data = await res.json();
        const lastPeriodStr = data?.cycleInfo?.lastPeriod;
        if (lastPeriodStr) {
          setExistingLastPeriod(utcStringToLocalDate(lastPeriodStr));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchExistingCycleInfo();
  }, []);

  useEffect(() => {
    if (hasUserEdited) return;
    if (!existingLastPeriod) return;

    if (mode === "lastPeriod") {
      setSelectedDate(existingLastPeriod);
      setPrefillNote("Pulled in from your cycle tracking — change it if this isn't right.");
    } else if (mode === "dueDate") {
      const suggestedDueDate = addDaysLocal(existingLastPeriod, TOTAL_PREGNANCY_DAYS);
      setSelectedDate(suggestedDueDate);
      setPrefillNote("Estimated from your last period on file — adjust if your due date is different.");
    }
  }, [mode, existingLastPeriod, hasUserEdited]);

  const handleModeChange = (newMode) => {
    setMode(newMode);
    setError("");
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setHasUserEdited(true);
    setPrefillNote("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDate) {
      setError("Please pick a date.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const dateStr = formatLocalYMD(selectedDate);
      const body = mode === "dueDate" ? { dueDate: dateStr } : { lastPeriod: dateStr };

      const res = await fetch("http://localhost:5000/api/pregnancy-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save pregnancy info");
         window.dispatchEvent(new Event("pregnancy:updated"));   
      navigate("/pregnancy-dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F5] flex items-center justify-center px-6">
      <div className="max-w-sm w-full">
        <div className="text-center mb-8">
          <p className="text-4xl mb-3">🤰</p>
          <h1 className="text-xl font-semibold text-gray-800">Let's set up pregnancy tracking</h1>
          <p className="text-sm text-gray-400 mt-1">
            We'll use this to show your week-by-week progress and due date countdown.
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <div className="flex gap-2 mb-5">
            <button
              type="button"
              onClick={() => handleModeChange("dueDate")}
              className={`flex-1 text-sm py-2 rounded-lg transition-colors ${
                mode === "dueDate"
                  ? "bg-[#C2597A] text-white"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              I know my due date
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("lastPeriod")}
              className={`flex-1 text-sm py-2 rounded-lg transition-colors ${
                mode === "lastPeriod"
                  ? "bg-[#C2597A] text-white"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              I know my last period
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <MiniCalendarPicker
              label={mode === "dueDate" ? "Due date" : "First day of last period"}
              value={selectedDate}
              onChange={handleDateChange}
              maxDate={mode === "lastPeriod" ? new Date() : undefined}
            />

            {prefillNote && (
              <p className="text-xs mt-1.5 mb-1" style={{ color: "#C2597A" }}>{prefillNote}</p>
            )}

            {mode === "lastPeriod" && !prefillNote && (
              <p className="text-xs text-gray-400 mt-1.5 mb-1">
                We'll estimate your due date as 40 weeks from this date.
              </p>
            )}

            <div className="mb-4" />

            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#C2597A] text-white py-2.5 rounded-lg text-sm hover:bg-[#7A3349] transition-colors disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Start pregnancy tracking"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PregnancySetup;