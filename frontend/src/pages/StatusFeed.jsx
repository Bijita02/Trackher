import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const VIBES = [
  { id: "energy", emoji: "🔋", text: "High Energy" },
  { id: "productive", emoji: "☕", text: "Productive" },
  { id: "exhausted", emoji: "💤", text: "Exhausted" },
  { id: "healthy", emoji: "🥑", text: "Healthy Vibe" },
  { id: "sweets", emoji: "🍫", text: "Craving Sweets" },
];

function StatusFeed() {
  const navigate = useNavigate();
  const location = useLocation();

  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentInputs, setCommentInputs] = useState({});

  const [selectedVibe, setSelectedVibe] = useState(VIBES[0]);
  const [statusText, setStatusText] = useState("");
  const [posting, setPosting] = useState(false);

  const targetStatusId =
    location.state?.highlightStatusId ||
    new URLSearchParams(location.search).get("statusId");

  const statusRefs = useRef({});

  const currentUserId = localStorage.getItem("userId");
  const token = localStorage.getItem("token") || localStorage.getItem("Token");
  
  const currentUserName = (() => {
    const savedName = localStorage.getItem("userName");
    if (savedName && savedName !== "User") return savedName;

    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      if (user.name) return user.name;
      if (user.userName) return user.userName;
      if (user.username) return user.username;
    } catch (e) {
  
    }

    const savedEmail = localStorage.getItem("userEmail") || "";
    if (savedEmail) {
      const prefix = savedEmail.split("@")[0];
      return prefix.charAt(0).toUpperCase() + prefix.slice(1);
    }

    return "My Profile";
  })();

  useEffect(() => {
    fetchStatuses();
  }, []);

  useEffect(() => {
    statusRefs.current = {};
  }, [statuses]);

  useEffect(() => {
    if (!loading && targetStatusId && statusRefs.current[targetStatusId]) {
      statusRefs.current[targetStatusId].scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [loading, targetStatusId]);

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

  const handlePostStatus = async (e) => {
    e.preventDefault();
    if (!statusText.trim()) return;

    setPosting(true);
    try {
      const res = await fetch("http://localhost:5000/api/status/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          statusText: statusText.trim(),
          vibeBadge: selectedVibe,
          userName: currentUserName,
        }),
      });

      if (res.ok) {
        setStatusText("");
        await fetchStatuses();
      } else {
        const errData = await res.json();
        alert(errData.error || "Could not post status");
      }
    } catch (err) {
      console.error("Error posting status:", err);
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (statusId) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/status/${statusId}/like`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (res.ok) {
        setStatuses((prev) =>
          prev.map((item) =>
            item._id === statusId ? { ...item, likes: data.likes } : item
          )
        );
      }
    } catch (err) {
      console.error("Error updating status like:", err);
    }
  };

  const handleCommentSubmit = async (e, statusId) => {
    e.preventDefault();
    const commentText = commentInputs[statusId]?.trim();
    if (!commentText) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/status/${statusId}/comment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ 
            text: commentText,
            userName: currentUserName 
          }),
        }
      );

      const data = await res.json();
      if (res.ok) {
        setStatuses((prev) =>
          prev.map((item) =>
            item._id === statusId
              ? { ...item, comments: data.comments }
              : item
          )
        );
        setCommentInputs((prev) => ({ ...prev, [statusId]: "" }));
      }
    } catch (err) {
      console.error("Error updating status comment:", err);
    }
  };

  const handleDeleteComment = async (statusId, commentId) => {
    if (!window.confirm("Are you sure you want to delete this reply?")) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/status/${statusId}/comments/${commentId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();
      if (res.ok) {
        setStatuses((prev) =>
          prev.map((item) => {
            if (item._id === statusId) {
              return {
                ...item,
                comments: (item.comments || []).filter(
                  (c) => (c._id ? c._id.toString() : "") !== commentId
                ),
              };
            }
            return item;
          })
        );
      } else {
        alert(data.error || "Failed to delete comment");
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  const handleDeleteStatus = async (statusId) => {
    if (!window.confirm("Are you sure you want to delete this status update?")) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/status/${statusId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setStatuses((prev) => prev.filter((item) => item._id !== statusId));
      } else {
        alert(data.error || "Failed to delete status");
      }
    } catch (err) {
      console.error("Error deleting status:", err);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#FAF7F5] pb-12"
      lang="en"
      translate="no"
    >
      <div className="h-2 bg-gradient-to-r from-pink-300 via-amber-200 to-rose-400" />

      <div className="max-w-3xl mx-auto p-6">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="text-xs font-bold text-gray-400 hover:text-[#C2597A] flex items-center gap-1.5 transition-colors mb-2 group"
          >
            <span className="inline-block transform group-hover:-translate-x-0.5 transition-transform">
              ⇜
            </span>{" "}
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-2">
            The Circle Vibe Check <span className="animate-bounce text-xl">✨</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">
            See how your inner circle is feeling today
          </p>
        </div>

        <form onSubmit={handlePostStatus} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm mb-8">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
            Share your vibe with the circle
          </label>

          <div className="flex flex-wrap gap-2 mb-4">
            {VIBES.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVibe(v)}
                className={`text-xs px-3 py-1.5 rounded-full font-bold transition-all flex items-center gap-1.5 ${
                  selectedVibe?.id === v.id
                    ? "bg-[#C2597A] text-white shadow-sm scale-105"
                    : "bg-gray-50 text-gray-600 border border-gray-100 hover:border-pink-200"
                }`}
              >
                <span>{v.emoji}</span>
                <span>{v.text}</span>
              </button>
            ))}
          </div>

          <div className="relative">
            <textarea
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              placeholder="Write a quick note to your circle..."
              rows={3}
              className="w-full text-xs p-3.5 rounded-2xl border border-gray-200/80 bg-gray-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#C2597A]/50 text-gray-700 resize-none pr-24"
            />
            <button
              type="submit"
              disabled={posting || !statusText.trim()}
              className="absolute bottom-3.5 right-3.5 bg-[#C2597A] hover:bg-[#7A3349] disabled:opacity-40 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all"
            >
              {posting ? "Sharing..." : "Share Vibe"}
            </button>
          </div>
        </form>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent border-[#C2597A]" />
            <p className="text-xs text-gray-400 font-medium">
              Gathering the vibes...
            </p>
          </div>
        ) : statuses.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
            <span className="text-4xl block mb-3">🌸</span>
            <h3 className="text-sm font-bold text-gray-700">
              All quiet on the status front
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">
              No one has shared their vibe update today yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {statuses.map((item) => {
              const itemUserId = (item.user?._id || item.user || "").toString();
              const activeUserId = (currentUserId || "").toString();

              const hasLiked = item.likes?.some(
                (id) => id.toString() === activeUserId
              );
              const isOwner = itemUserId === activeUserId;
              const isTargeted = item._id === targetStatusId;

              return (
                <div
                  key={item._id}
                  ref={(el) => {
                    if (el) statusRefs.current[item._id] = el;
                  }}
                  className={`bg-white rounded-3xl p-6 border transition-all duration-300 relative overflow-hidden group ${
                    isTargeted
                      ? "ring-2 ring-[#C2597A] border-transparent shadow-md bg-rose-50/20"
                      : "border-gray-50 shadow-sm hover:shadow-md"
                  }`}
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-pink-200 to-rose-300 group-hover:scale-y-110 transition-transform" />

                  <div className="flex items-start justify-between gap-4 pl-2">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-gray-800 tracking-tight">
                          {item.userName || item.username || "Friend"}
                        </h4>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className="text-[10px] text-gray-400 font-medium">
                          {item.createdAt
                            ? new Date(item.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "Just now"}
                        </span>
                      </div>

                      <p className="text-gray-600 text-sm leading-relaxed font-normal bg-gray-50/60 px-4 py-2.5 rounded-2xl border border-gray-100/50 inline-block">
                        {item.content ||
                          item.statusText ||
                          item.text ||
                          "Empty status"}
                      </p>

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

                        {item.comments && item.comments.length > 0 && (
                          <div className="space-y-1.5 bg-gray-50/80 p-3 rounded-xl border border-gray-100/60 max-h-32 overflow-y-auto">
                            {item.comments.map((comment, idx) => {
                              const commentId = comment._id
                                ? comment._id.toString()
                                : `comment-${item._id}-${idx}`;
                              const commentAuthorId = (
                                comment.user?._id || comment.user || ""
                              ).toString();

                              const canDeleteComment =
                                activeUserId &&
                                (commentAuthorId === activeUserId || isOwner);

                              return (
                                <div
                                  key={commentId}
                                  className="text-[11px] text-gray-600 flex items-center justify-between group/comment"
                                >
                                  <div>
                                    <span className="font-bold text-gray-700 mr-1.5">
                                      {comment.userName || "Friend"}:
                                    </span>
                                    <span>{comment.text}</span>
                                  </div>

                                  {canDeleteComment && comment._id && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteComment(
                                          item._id,
                                          comment._id.toString()
                                        )
                                      }
                                      className="text-gray-300 hover:text-red-500 transition-colors p-0.5 ml-2 opacity-60 hover:opacity-100"
                                      title="Delete reply"
                                    >
                                      🗑️
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        <form
                          onSubmit={(e) => handleCommentSubmit(e, item._id)}
                          className="flex gap-2"
                        >
                          <input
                            type="text"
                            placeholder="Write a reply..."
                            value={commentInputs[item._id] || ""}
                            onChange={(e) =>
                              setCommentInputs({
                                ...commentInputs,
                                [item._id]: e.target.value,
                              })
                            }
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