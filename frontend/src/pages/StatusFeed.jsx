import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function StatusFeed() {
  const navigate = useNavigate();
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Inline states for comment forms per status ID
  const [commentInputs, setCommentInputs] = useState({}); 

  // Retrieve current configurations safely from local storage
  const currentUserId = localStorage.getItem("userId");
  const token = localStorage.getItem("token") || localStorage.getItem("Token");

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
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

  // Like Toggle Handler
  const handleLike = async (statusId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/status/${statusId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data = await res.json();
      if (res.ok) {
        setStatuses((prev) =>
          prev.map((item) => (item._id === statusId ? { ...item, likes: data.likes } : item))
        );
      } else {
        console.error("Like failed:", data.error);
      }
    } catch (err) {
      console.error("Error updating status like:", err);
    }
  };

  // Comment Submission Handler
  const handleCommentSubmit = async (e, statusId) => {
    e.preventDefault();
    const commentText = commentInputs[statusId]?.trim();
    if (!commentText) return;

    try {
      const res = await fetch(`http://localhost:5000/api/status/${statusId}/comment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          text: commentText 
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatuses((prev) =>
          prev.map((item) => (item._id === statusId ? { ...item, comments: data.comments } : item))
        );
        setCommentInputs((prev) => ({ ...prev, [statusId]: "" }));
      } else {
        console.error("Comment failed:", data.error);
      }
    } catch (err) {
      console.error("Error updating status comment:", err);
    }
  };

  // Delete Status Handler
  const handleDeleteStatus = async (statusId) => {
    if (!window.confirm("Are you sure you want to delete this status update?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/status/${statusId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        // Remove deleted item from local state list
        setStatuses((prev) => prev.filter((item) => item._id !== statusId));
      } else {
        alert(data.error || "Failed to delete status");
      }
    } catch (err) {
      console.error("Error deleting status:", err);
    }
  };

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
            {statuses.map((item) => {
              const hasLiked = item.likes?.includes(currentUserId);
              // Check if post belongs to logged in user
              const isOwner = (item.user?._id || item.user) === currentUserId;

              return (
                <div
                  key={item._id}
                  className="bg-white rounded-3xl p-6 border border-gray-50 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-pink-200 to-rose-300 group-hover:scale-y-110 transition-transform" />

                  <div className="flex items-start justify-between gap-4 pl-2">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        {/* Corrected Username Display */}
                        <h4 className="font-bold text-sm text-gray-800 tracking-tight">
                          {item.userName || item.username || "Friend"}
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
                        {item.content || item.statusText || item.text || "Empty status"}
                      </p>

                      {/* Interaction Sub-section */}
                      <div className="pt-2 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => handleLike(item._id)}
                              className="flex items-center gap-1 font-bold text-gray-400 hover:text-rose-500 transition-colors"
                            >
                              <span>{hasLiked ? "❤️" : "🤍"}</span>
                              <span>{item.likes?.length || 0}</span>
                            </button>
                            <span className="text-gray-400 font-medium">
                              💬 {item.comments?.length || 0} Replies
                            </span>
                          </div>

                          {/* Delete Button (Only visible if the logged-in user owns this status) */}
                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => handleDeleteStatus(item._id)}
                              className="text-gray-300 hover:text-red-500 transition-colors font-semibold text-xs px-2 py-0.5"
                              title="Delete status"
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </div>

                        {/* Existing Comments Display */}
                        {item.comments && item.comments.length > 0 && (
                          <div className="space-y-1.5 bg-gray-50/80 p-3 rounded-xl border border-gray-100/60 max-h-32 overflow-y-auto">
                            {item.comments.map((comment, idx) => (
                              <div key={comment._id || idx} className="text-[11px] text-gray-600">
                                <span className="font-bold text-gray-700 mr-1.5">{comment.userName || "Friend"}:</span>
                                <span>{comment.text}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Inline Reply Form */}
                        <form onSubmit={(e) => handleCommentSubmit(e, item._id)} className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Write a reply..."
                            value={commentInputs[item._id] || ""}
                            onChange={(e) => setCommentInputs({ ...commentInputs, [item._id]: e.target.value })}
                            className="flex-1 text-xs border border-gray-200/80 bg-white rounded-xl px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#C2597A]/40 text-gray-700"
                          />
                          <button
                            type="submit"
                            className="bg-[#C2597A] hover:bg-[#7A3349] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl transition-colors"
                          >
                            Reply
                          </button>
                        </form>
                      </div>
                    </div>

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
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default StatusFeed;