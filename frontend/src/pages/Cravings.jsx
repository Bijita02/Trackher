import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Trash2, Loader2, Check } from "lucide-react";
import MiniCalendarPicker from "../components/minicalendarpicker";

const CATEGORIES = ["Sweet", "Salty", "Sour", "Spicy", "Savory"];

function Cravings() {
  const navigate = useNavigate();
  const [cravings, setCravings] = useState([]);
  const [loading, setLoading] = useState(true);

  const [date, setDate] = useState(new Date());
  const [food, setFood] = useState("");
  const [category, setCategory] = useState("");
  const [satisfied, setSatisfied] = useState(false);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const token = localStorage.getItem("token");

  const fetchCravings = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/cravings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load cravings");
      const data = await res.json();
      setCravings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCravings();
  
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!food.trim()) {
      setError("What are you craving?");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");

      const res = await fetch("http://localhost:5000/api/cravings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: `${y}-${m}-${d}`,
          food,
          category,
          satisfied,
          notes,
        }),
      });
      if (!res.ok) throw new Error("Failed to save craving");
      const data = await res.json();
      setCravings(data);
      setFood("");
      setCategory("");
      setSatisfied(false);
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
      const res = await fetch(`http://localhost:5000/api/cravings/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to delete craving");
      const data = await res.json();
      setCravings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF6F3]">
      <div className="max-w-3xl mx-auto p-6">
        <button
          onClick={() => navigate("/pregnancy-dashboard")}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#C2597A] transition-colors mb-4"
        >
          <ChevronLeft size={16} /> Back to overview
        </button>

        <h1 className="font-serif text-3xl text-gray-900 mb-1">Cravings</h1>
        <p className="text-sm text-gray-500 mb-6">Track what you're craving throughout your pregnancy</p>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-4">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Log a craving</h2>
          <form onSubmit={handleSubmit} className="space-y-3">
            <MiniCalendarPicker label="Date" value={date} onChange={setDate} maxDate={new Date()} />

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">What are you craving?</label>
              <input
                type="text"
                value={food}
                onChange={(e) => setFood(e.target.value)}
                placeholder="e.g. pickles, ice cream, mango"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:border-[#C2597A]"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Category (optional)</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(category === c ? "" : c)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                      category === c ? "bg-[#C2597A] text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSatisfied((s) => !s)}
              className="flex items-center gap-2 text-sm text-gray-600"
            >
              <span
                className="w-5 h-5 rounded-md border flex items-center justify-center transition-colors"
                style={{
                  background: satisfied ? "#C2597A" : "#fff",
                  borderColor: satisfied ? "#C2597A" : "#E5DEE1",
                }}
              >
                {satisfied && <Check size={13} color="#fff" />}
              </span>
              I gave in and had it
            </button>

            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="anything else worth remembering"
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
              {saving ? "Saving…" : "Log craving"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h2 className="text-base font-semibold text-gray-800 mb-4">History</h2>
          {cravings.length === 0 && !loading ? (
            <p className="text-sm text-gray-400">No cravings logged yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {cravings.map((c) => (
                <div key={c._id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm text-gray-800 flex items-center gap-2">
                      {c.food}
                      {c.category && (
                        <span className="text-[10px] font-medium text-[#C2597A] bg-[#F6DCE3] rounded-full px-2 py-0.5">
                          {c.category}
                        </span>
                      )}
                      {c.satisfied && (
                        <span className="text-[10px] font-medium text-green-700 bg-green-50 rounded-full px-2 py-0.5">
                          Had it
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(c.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      {c.notes ? ` · ${c.notes}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(c._id)}
                    disabled={deletingId === c._id}
                    className="p-2 rounded-full hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
                  >
                    {deletingId === c._id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
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

export default Cravings;