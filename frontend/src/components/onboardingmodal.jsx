import { useState } from "react";

const BRAND = {
  ink: "#241220",
  muted: "#8F8290",
  pink: "#E23670",
  pinkSoft: "#FCE1EA",
  border: "#FDE3EC",
};

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
    <div
      className="fixed inset-0 flex justify-center items-center p-4 z-50 backdrop-blur-xs"
      style={{ background: "rgba(36, 18, 32, 0.35)", fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
        .fr-display { font-family: 'Fraunces', serif; }
        @keyframes gentle-bounce {
          0%, 100% { transform: translateY(0) rotate(-4deg); }
          50% { transform: translateY(-4px) rotate(4deg); }
        }
        .bounce-badge { animation: gentle-bounce 2.4s ease-in-out infinite; }
        @keyframes pop-in {
          0% { transform: scale(0.9); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .pop-in { animation: pop-in 0.25s ease-out; }
      `}</style>

      <div
        className="pop-in relative bg-white rounded-[28px] w-full max-w-md p-8 shadow-xl overflow-hidden"
        style={{ border: `1px solid ${BRAND.border}` }}
      >
        
        <div
          className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: BRAND.pinkSoft, opacity: 0.6 }}
        />
        <div
          className="absolute -bottom-12 -left-8 w-28 h-28 rounded-full pointer-events-none"
          style={{ background: "#FDF0DC", opacity: 0.6 }}
        />

        <div className="relative">
          {!confirming ? (
            <>
              
              <div className="flex items-center justify-center gap-1.5 mb-5">
                <span className="w-5 h-1.5 rounded-full" style={{ background: BRAND.pink }} />
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: BRAND.border }} />
              </div>

              <div className="flex flex-col items-center text-center mb-6">
                <div
                  className="bounce-badge w-16 h-16 rounded-full flex items-center justify-center shrink-0 shadow-sm mb-3"
                  style={{ background: BRAND.pinkSoft }}
                >
                  <span className="text-3xl">🌸</span>
                </div>
                <h2 className="fr-display text-2xl leading-tight" style={{ color: BRAND.ink }}>
                  Let's get to know your cycle
                </h2>
                <p className="text-sm mt-1.5" style={{ color: BRAND.muted }}>
                  Just a couple of quick things, then you're all set ✨
                </p>
              </div>

              <div className="space-y-5 mb-6">
                <div>
                  <label className="text-sm mb-1.5 block font-medium" style={{ color: BRAND.muted }}>
                    When did your last period start?
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2"
                    style={{
                      border: `1.5px solid ${dateError ? BRAND.pink : BRAND.border}`,
                      background: "#FDF6F3",
                      color: BRAND.ink,
                    }}
                    value={formData.lastPeriod}
                    onChange={(e) => {
                      setDateError(false);
                      setFormData({ ...formData, lastPeriod: e.target.value });
                    }}
                  />
                  {dateError && (
                    <p className="text-xs mt-1 flex items-center gap-1" style={{ color: BRAND.pink }}>
                      🌷 Please pick a date so we can get started.
                    </p>
                  )}
                </div>

                <div
                  className="rounded-2xl p-4"
                  style={{ background: "#FDF6F3", border: `1px solid ${BRAND.border}` }}
                >
                  <label className="flex justify-between text-sm mb-1.5" style={{ color: BRAND.muted }}>
                    <span>🔁 Average cycle length</span>
                    <span className="font-semibold" style={{ color: BRAND.pink }}>
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
                    className="w-full"
                    style={{ accentColor: BRAND.pink }}
                  />
                  <div className="flex justify-between text-xs mt-1" style={{ color: "#C9BCC4" }}>
                    <span>21 days</span>
                    <span>45 days</span>
                  </div>
                </div>

                <div
                  className="rounded-2xl p-4"
                  style={{ background: "#FDF6F3", border: `1px solid ${BRAND.border}` }}
                >
                  <label className="flex justify-between text-sm mb-1.5" style={{ color: BRAND.muted }}>
                    <span>🩷 Period length</span>
                    <span className="font-semibold" style={{ color: BRAND.pink }}>
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
                    className="w-full"
                    style={{ accentColor: BRAND.pink }}
                  />
                  <div className="flex justify-between text-xs mt-1" style={{ color: "#C9BCC4" }}>
                    <span>2 days</span>
                    <span>10 days</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleContinue}
                className="w-full text-white font-semibold py-3 rounded-2xl transition-all text-sm shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                style={{ background: BRAND.pink }}
              >
                Continue →
              </button>
              <p className="text-center text-xs mt-3 flex items-center justify-center gap-1" style={{ color: "#C9BCC4" }}>
                🔒 Your data stays private, always
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-1.5 mb-5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: BRAND.border }} />
                <span className="w-5 h-1.5 rounded-full" style={{ background: BRAND.pink }} />
              </div>

              <div className="flex flex-col items-center text-center mb-5">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 shadow-sm mb-3"
                  style={{ background: BRAND.pinkSoft }}
                >
                  <span className="text-3xl">🎉</span>
                </div>
                <h2 className="fr-display text-2xl" style={{ color: BRAND.ink }}>
                  Almost there!
                </h2>
                <p className="text-sm mt-1" style={{ color: BRAND.muted }}>
                  Just double-check these details
                </p>
              </div>

              <div className="rounded-2xl p-4 mb-5 text-sm" style={{ background: "#FDF6F3", border: `1px solid ${BRAND.border}` }}>
                <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                  <span style={{ color: BRAND.muted }}>🌷 Last period</span>
                  <span className="font-medium" style={{ color: BRAND.ink }}>
                    {formData.lastPeriod ? new Date(formData.lastPeriod).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    }) : ""}
                  </span>
                </div>
                <div className="flex justify-between py-2" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
                  <span style={{ color: BRAND.muted }}>🔁 Cycle length</span>
                  <span className="font-medium" style={{ color: BRAND.ink }}>
                    {formData.cycleLength} days
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span style={{ color: BRAND.muted }}>🩷 Period length</span>
                  <span className="font-medium" style={{ color: BRAND.ink }}>
                    {formData.periodLength} days
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setConfirming(false)}
                  className="flex-1 py-3 rounded-2xl text-sm font-medium transition-all hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                  style={{ border: `1.5px solid ${BRAND.border}`, color: BRAND.muted, background: "#fff" }}
                >
                  ← Edit
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={saving}
                  className="flex-1 text-white font-semibold py-3 rounded-2xl text-sm transition-all disabled:opacity-60 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
                  style={{ background: BRAND.pink }}
                >
                  {saving ? "Saving..." : "Yes, save it! 🌸"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboardingmodal;