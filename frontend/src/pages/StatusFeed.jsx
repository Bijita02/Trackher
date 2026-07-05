import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function StatusFeed() {
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/status/feed", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStatuses(data);
        }
      } catch (err) {
        console.error("Error pulling friend vibes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatuses();
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF7F5] pb-12">
      <div className="h-2 bg-gradient-to-r from-pink-300 via-amber-200 to-rose-400" />

      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-xs font-bold text-gray-400 hover:text-[#C2597A] flex items-center gap-1.5 transition-colors mb-2 group"
          >
            <span className="inline-block transform group-hover:-translate-x-0.5 transition-transform">⇜</span> Back to Dashboard
          </button>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
            The Circle Vibe Check <span className="animate-bounce text-xl">✨</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">See how your inner circle is feeling today</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent border-[#C2597A]" />
            <p className="text-xs text-gray-400 font-medium">Gathering the vibes...</p>
          </div>
        ) : statuses.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
            <span className="text-4xl block mb-3">🌸</span>
            <h3 className="text-sm font-bold text-gray-700">All quiet on the status front</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              No one has shared their vibe update today yet. Be the first one to drop a status update!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {statuses.map((item) => (
              <div
                key={item._id}
                className="bg-white rounded-3xl p-6 border border-gray-50 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-pink-200 to-rose-300 group-hover:scale-y-110 transition-transform" />

                <div className="flex items-start justify-between gap-4 pl-2">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-gray-800 tracking-tight">
                        {/* Replaces any old fallback bugs dynamically with the local storage name context if empty */}
                        {!item.username || item.username === "user circle friend" 
                          ? (localStorage.getItem("userName") || "Meejala") 
                          : item.username
                        }
                      </h4>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className="text-[10px] text-gray-400 font-medium">
                        {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        }) : "Just now"}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm leading-relaxed font-normal bg-gray-50/60 px-4 py-2.5 rounded-2xl border border-gray-100/50 inline-block">
                      {item.statusText}
                    </p>
                  </div>

                  {/* Vibe Badge Flag matched perfectly to your vibeBadge.emoji and vibeBadge.text nested object keys */}
                  {item.vibeBadge && (
                    <div className="flex flex-col items-center bg-amber-50/60 border border-amber-100/70 rounded-2xl px-3 py-2 min-w-[64px] shadow-sm">
                      <span className="text-lg leading-none mb-0.5">
                        {item.vibeBadge.emoji}
                      </span>
                      <span className="text-[9px] font-bold text-amber-700 capitalize tracking-wide whitespace-nowrap">
                        {item.vibeBadge.text}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default StatusFeed;