import { useState } from "react";
import { useNavigate } from "react-router-dom";

function PregnancySetup() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("dueDate"); 
  const [dateValue, setDateValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dateValue) {
      setError("Please pick a date.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const body = mode === "dueDate" ? { dueDate: dateValue } : { lastPeriod: dateValue };

      const res = await fetch("http://localhost:5000/api/pregnancy-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to save pregnancy info");

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
              onClick={() => setMode("dueDate")}
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
              onClick={() => setMode("lastPeriod")}
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
            <label className="block text-xs text-gray-400 mb-1.5">
              {mode === "dueDate" ? "Due date" : "First day of last period"}
            </label>
            <input
              type="date"
              value={dateValue}
              onChange={(e) => setDateValue(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 mb-1 focus:outline-none focus:border-[#C2597A]"
            />
            {mode === "lastPeriod" && (
              <p className="text-xs text-gray-400 mb-4">
                We'll estimate your due date as 40 weeks from this date.
              </p>
            )}
            {mode === "dueDate" && <div className="mb-4" />}

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