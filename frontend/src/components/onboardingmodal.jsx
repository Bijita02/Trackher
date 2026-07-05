import { useState } from "react";

const Onboardingmodal = ({ onClose }) => {
  const [formData, setFormData] = useState({
    lastPeriod: "",
    cycleLength: 28,
    periodLength: 5,
  });
  const [dateError, setDateError] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleContinue = () => {
    if (!formData.lastPeriod) {
      setDateError(true);
      return;
    }
    setConfirming(true);
  };

  const handleConfirm = async () => {
    setSaving(true);
    try {
      let token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Authentication token missing from session storage.");
      }

      // Sanitize the token string if it accidentally already contains the Bearer prefix
      if (token.startsWith("Bearer ")) {
        token = token.slice(7).trim();
      }

      const res = await fetch("http://localhost:5000/api/user-cycle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          lastPeriod: formData.lastPeriod,
          cycleLength: Number(formData.cycleLength),
          periodLength: Number(formData.periodLength),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save cycle configuration");
      }

      const data = await res.json();
      console.log("Saved successfully:", data);

      onClose(); 
      window.location.reload();

    } catch (err) {
      console.error("Failed to save:", err.message || err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex justify-center items-center p-4 z-50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl w-full max-w-md p-8 border border-gray-100 shadow-xl">

        {!confirming ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-full bg-[#F6DCE3] flex items-center justify-center shrink-0">
                <span className="text-lg">🌸</span>
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-800 leading-tight">
                  Set up your cycle
                </h2>
                <p className="text-sm text-gray-400">
                  A few details to personalise your calendar.
                </p>
              </div>
            </div>

            <div className="space-y-5 mb-6">
              <div>
                <label className="text-sm text-gray-500 mb-1.5 block">
                  Last period start date
                </label>
                <input
                  type="date"
                  className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#F6DCE3] ${
                    dateError ? "border-[#C2597A]" : "border-gray-200"
                  }`}
                  value={formData.lastPeriod}
                  onChange={(e) => {
                    setDateError(false);
                    setFormData({ ...formData, lastPeriod: e.target.value });
                  }}
                />
                {dateError && (
                  <p className="text-xs text-[#C2597A] mt-1">
                    Please select a date to continue.
                  </p>
                )}
              </div>

              <div>
                <label className="flex justify-between text-sm text-gray-500 mb-1.5">
                  <span>Average cycle length</span>
                  <span className="font-medium text-[#C2597A]">
                    {formData.cycleLength} days
                  </span>
                </label>
                <input
                  type="range"
                  min="21"
                  max="45"
                  step="1"
                  value={formData.cycleLength}
                  onChange={(e) =>
                    setFormData({ ...formData, cycleLength: Number(e.target.value) })
                  }
                  className="w-full accent-[#C2597A]"
                />
                <div className="flex justify-between text-xs text-gray-300 mt-1">
                  <span>21 days</span>
                  <span>45 days</span>
                </div>
              </div>

              <div>
                <label className="flex justify-between text-sm text-gray-500 mb-1.5">
                  <span>Period length</span>
                  <span className="font-medium text-[#C2597A]">
                    {formData.periodLength} days
                  </span>
                </label>
                <input
                  type="range"
                  min="2"
                  max="10"
                  step="1"
                  value={formData.periodLength}
                  onChange={(e) =>
                    setFormData({ ...formData, periodLength: Number(e.target.value) })
                  }
                  className="w-full accent-[#C2597A]"
                />
                <div className="flex justify-between text-xs text-gray-300 mt-1">
                  <span>2 days</span>
                  <span>10 days</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleContinue}
              className="w-full bg-[#C2597A] hover:bg-[#7A3349] text-white font-medium py-2.5 rounded-lg transition-colors text-sm shadow-sm"
            >
              Continue →
            </button>
            <p className="text-center text-xs text-gray-300 mt-3">
              🔒 Your data stays private
            </p>
          </>
        ) : (
          <>
            <h2 className="text-base font-semibold text-gray-800 mb-1">
              Confirm your details
            </h2>
            <p className="text-sm text-gray-400 mb-5">
              Does everything look right?
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-5 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Last period</span>
                <span className="font-medium text-gray-700">
                  {formData.lastPeriod ? new Date(formData.lastPeriod).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  }) : ""}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Cycle length</span>
                <span className="font-medium text-gray-700">
                  {formData.cycleLength} days
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Period length</span>
                <span className="font-medium text-gray-700">
                  {formData.periodLength} days
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirming(false)}
                className="flex-1 border border-gray-200 text-gray-500 py-2.5 rounded-lg hover:bg-gray-50 text-sm transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving}
                className="flex-1 bg-[#C2597A] hover:bg-[#7A3349] text-white font-medium py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60 shadow-sm"
              >
                {saving ? "Saving..." : "Yes, save it"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Onboardingmodal;