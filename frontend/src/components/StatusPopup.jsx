import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const VIBE_OPTIONS = [
  { emoji: "🔋", text: "High Energy" },
  { emoji: "☕", text: "Productive" },
  { emoji: "💤", text: "Exhausted" },
  { emoji: "🥑", text: "Healthy Vibe" },
  { emoji: "🍫", text: "Craving Sweets" },
];

export default function StatusPopup({ isOpen, onClose, currentUserName }) {
  const navigate = useNavigate();
  const [selectedVibe, setSelectedVibe] = useState(VIBE_OPTIONS[0]);
  const [statusText, setStatusText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!statusText.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const userId = localStorage.getItem("userId");
      
      // Fallback safely to whatever username is in local storage, or default to Meejala
      const activeUser = currentUserName || localStorage.getItem("userName") || "Meejala";

      const response = await fetch("http://localhost:5000/api/status/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          username: activeUser, // Explicitly saved as 'username' for your schema
          vibeBadge: selectedVibe, // Passes the full { emoji, text } object matching your model
          statusText: statusText.trim()
        }),
      });

      if (response.ok) {
        onClose();
        navigate('/status-feed');
      } else {
        console.warn("Backend rejected save, redirecting to feed anyway.");
        onClose();
        navigate('/status-feed');
      }
    } catch (err) {
      console.error("Network error, redirecting to feed:", err);
      onClose();
      navigate('/status-feed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6 relative shadow-2xl border border-gray-100">
        <button 
          type="button"
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold p-1"
        >
          ✕
        </button>

        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Sharing as <span className="text-[#C2597A]">{currentUserName || localStorage.getItem("userName") || "Meejala"}</span> ✨
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {VIBE_OPTIONS.map((vibe) => (
              <button
                type="button"
                key={vibe.text}
                onClick={() => setSelectedVibe(vibe)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                  selectedVibe.text === vibe.text 
                    ? "border-[#C2597A] bg-[#F6DCE3] text-[#7A3349]" 
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                <span>{vibe.emoji}</span>{vibe.text}
              </button>
            ))}
          </div>

          <textarea
            value={statusText}
            onChange={(e) => setStatusText(e.target.value)}
            placeholder="How are you holding up today?..."
            maxLength={100}
            className="w-full border border-gray-200 rounded-2xl p-4 text-xs focus:outline-none focus:ring-1 focus:ring-[#C2597A] resize-none h-24 text-gray-700"
          />

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-[#C2597A] hover:bg-[#7A3349] text-white font-semibold py-3 rounded-xl text-xs transition-colors shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? "Posting..." : "Post to Circle Feed"}
          </button>
        </form>
      </div>
    </div>
  );
}