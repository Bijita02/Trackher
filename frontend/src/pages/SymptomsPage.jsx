import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Zap,
  CloudLightning,
  RotateCw,
  RotateCcw,
  CircleDot,
  Thermometer,
  Bone,
  Dumbbell,
  Heart,
  Plus,
  Snowflake,
  Circle,
  CircleSlash,
  Droplet,
  Droplets,
  Frown,
  Flame,
  Wind,
  Utensils,
  Cookie,
  Sun,
  ArrowDown,
  ArrowUpRight,
  AlertCircle,
  AlertTriangle,
  Moon,
  Meh,
  Angry,
  BatteryLow,
  BatteryFull,
  Waves,
  CloudRain,
  Smile,
  Bed,
  Egg,
  Leaf,
  Milk,
  CloudDrizzle,
  Microscope,
  Brain,
  Bandage,
  Activity,
  Calendar,
  Star,
  BookOpen,
  Save,
  Pencil,
  Tag as TagIcon,
} from "lucide-react";

// Symptom groups — icons live in TAG_ICON / GROUP_ICON below, so this stays
// plain data instead of mixing emoji into the content.
const SYMPTOM_GROUPS = [
  {
    label: "Head",
    tags: ["Headache", "Migraines", "Dizziness", "Acne", "Hectic fever"],
  },
  {
    label: "Body",
    tags: [
      "Neck aches",
      "Shoulder aches",
      "Tender breasts",
      "Breast sensitivity",
      "Backaches",
      "Lower back pain",
      "Body aches",
      "Muscle pain",
      "Influenza",
      "Illness",
      "Cramps",
      "Chills",
    ],
  },
  {
    label: "Abdomen",
    tags: [
      "Bloating",
      "Constipation",
      "Diarrhea",
      "Nausea",
      "Abdominal cramps",
      "Dyspepsia",
      "Gas",
      "Hunger",
      "Cravings",
      "Ovulation pain",
      "Pelvic pressure",
    ],
  },
  {
    label: "Mental",
    tags: [
      "Anxious",
      "Insomnia",
      "Stress",
      "Moodiness",
      "Tension",
      "Irritable",
      "Unable to concentrate",
      "Fatigue",
      "Low mood",
      "Mood swings",
      "Crying spells",
      "Calm",
      "Oversleeping",
      "Low energy",
      "High energy",
    ],
  },
  {
    label: "Cervix",
    tags: [
      "Pelvic pain",
      "Cervical firmness",
      "Cervical opening",
      "Cervical mucus",
      "Flow",
      "Heavy flow",
      "Light flow",
      "Spotting",
      "Irritation",
    ],
  },
  {
    label: "Fluid",
    tags: [
      "Dry",
      "Sticky",
      "Creamy",
      "Watery",
      "Egg-white",
      "Cottage-cheese",
      "Green",
      "With blood",
      "Foul-smelling",
    ],
  },
];

// One line-icon per group heading — replaces the old group emoji.
const GROUP_ICON = {
  Head: Bandage,
  Body: Activity,
  Abdomen: Utensils,
  Mental: Brain,
  Cervix: Microscope,
  Fluid: Droplet,
};

// One line-icon per tag — replaces the old TAG_EMOJI map. Any tag not
// listed here (e.g. a user's custom symptom) falls back to a plain tag icon.
const TAG_ICON = {
  Headache: Zap,
  Migraines: CloudLightning,
  Dizziness: RotateCw,
  Acne: CircleDot,
  "Hectic fever": Thermometer,

  "Neck aches": Bone,
  "Shoulder aches": Dumbbell,
  "Tender breasts": Heart,
  "Breast sensitivity": Plus,
  Backaches: Bone,
  "Lower back pain": Bone,
  "Body aches": Activity,
  "Muscle pain": Dumbbell,
  Influenza: Thermometer,
  Illness: Plus,
  Cramps: Zap,
  Chills: Snowflake,

  Bloating: Circle,
  Constipation: CircleSlash,
  Diarrhea: Droplets,
  Nausea: Frown,
  "Abdominal cramps": Zap,
  Dyspepsia: Flame,
  Gas: Wind,
  Hunger: Utensils,
  Cravings: Cookie,
  "Ovulation pain": Sun,
  "Pelvic pressure": ArrowDown,

  Anxious: AlertCircle,
  Insomnia: Moon,
  Stress: Activity,
  Moodiness: Meh,
  Tension: AlertTriangle,
  Irritable: Angry,
  "Unable to concentrate": RotateCcw,
  Fatigue: BatteryLow,
  "Low mood": Frown,
  "Mood swings": Waves,
  "Crying spells": CloudRain,
  Calm: Smile,
  Oversleeping: Bed,
  "Low energy": BatteryLow,
  "High energy": BatteryFull,

  "Pelvic pain": AlertCircle,
  "Cervical firmness": Circle,
  "Cervical opening": ArrowUpRight,
  "Cervical mucus": Droplet,
  Flow: Droplet,
  "Heavy flow": Droplets,
  "Light flow": CloudDrizzle,
  Spotting: CircleDot,
  Irritation: Flame,

  Dry: Sun,
  Sticky: Droplet,
  Creamy: Milk,
  Watery: Waves,
  "Egg-white": Egg,
  "Cottage-cheese": Milk,
  Green: Leaf,
  "With blood": Droplet,
  "Foul-smelling": Wind,
};

const UNDO_WINDOW_MS = 5000;

// Simple 3-tier icon + color for intensity, replacing the old 10-emoji face
// strip — a calmer, single-glyph read instead of a wall of tiny faces.
function IntensityIcon({ value, size = 16 }) {
  const Icon = value <= 3 ? Smile : value <= 6 ? Meh : Frown;
  const color = value <= 3 ? "#4C9A72" : value <= 6 ? "#C08A2E" : "#D4537E";
  return <Icon size={size} color={color} strokeWidth={1.75} />;
}

function TagChipIcon({ name, size = 13 }) {
  const Icon = TAG_ICON[name] || TagIcon;
  return <Icon size={size} strokeWidth={1.75} style={{ flexShrink: 0 }} />;
}

// Always read the freshest token directly from localStorage instead of
// trusting a prop that a parent route might have captured once and never updated.
function getAuthToken() {
  return localStorage.getItem("token");
}

export default function SymptomsPage() {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [selected, setSelected] = useState([]);
  const [intensity, setIntensity] = useState(5);
  const [notes, setNotes] = useState("");
  const [logs, setLogs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [pendingDelete, setPendingDelete] = useState(null);
  const pendingDeleteRef = useRef(null);

  const [customTagsByGroup, setCustomTagsByGroup] = useState({});
  const [openCustomGroup, setOpenCustomGroup] = useState(null);
  const [customInput, setCustomInput] = useState("");
  const customInputRef = useRef(null);

  // Centralized handler: if the server ever says the token is bad/expired,
  // clear storage and send the user back to login instead of leaving them
  // stuck staring at a banner.
  const handleAuthFailure = (msg) => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setError(msg || "Your session has expired. Please log in again.");
    setTimeout(() => navigate("/login", { replace: true }), 1200);
  };

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setError("You're not signed in. Please log in again.");
      setTimeout(() => navigate("/login", { replace: true }), 1000);
      return;
    }

    fetch("/api/symptoms", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (r.status === 401) {
          const body = await r.json().catch(() => ({}));
          handleAuthFailure(body?.error);
          throw new Error(body?.error || "Session expired");
        }
        if (!r.ok) {
          let msg = `Failed to load (status ${r.status})`;
          try {
            const body = await r.json();
            if (body?.error) msg = body.error;
          } catch {
            // ignore parse errors
          }
          throw new Error(msg);
        }
        return r.json();
      })
      .then(setLogs)
      .catch((err) => {
        console.error("Failed to load symptom logs:", err);
        if (!err.message?.toLowerCase().includes("session expired")) {
          setError(err.message || "Could not load your logs. Please refresh.");
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (pendingDeleteRef.current?.timeoutId) {
        clearTimeout(pendingDeleteRef.current.timeoutId);
      }
    };
  }, []);

  const frequentTags = useMemo(() => {
    const counts = new Map();
    for (const log of logs) {
      for (const t of log.tags || []) {
        counts.set(t, (counts.get(t) || 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name]) => name);
  }, [logs]);

  const mostRecentPriorLog = useMemo(() => {
    const sorted = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
    return sorted.find((l) => l.date?.slice(0, 10) < date) || sorted[0] || null;
  }, [logs, date]);

  const trendPoints = useMemo(() => {
    const byDate = new Map(logs.map((l) => [l.date?.slice(0, 10), l.intensity]));
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, intensity: byDate.get(key) ?? null });
    }
    return days;
  }, [logs]);

  const toggleTag = (tag) =>
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const openCustomInput = (groupLabel) => {
    setOpenCustomGroup(groupLabel);
    setCustomInput("");
    setTimeout(() => customInputRef.current?.focus(), 0);
  };

  const submitCustomTag = (groupLabel) => {
    const name = customInput.trim();
    if (!name) {
      setOpenCustomGroup(null);
      return;
    }
    setCustomTagsByGroup((prev) => {
      const existing = prev[groupLabel] || [];
      if (existing.some((t) => t.toLowerCase() === name.toLowerCase())) return prev;
      return { ...prev, [groupLabel]: [...existing, name] };
    });
    setSelected((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setCustomInput("");
    setOpenCustomGroup(null);
  };

  const cancelCustomInput = () => {
    setCustomInput("");
    setOpenCustomGroup(null);
  };

  const resetForm = () => {
    setSelected([]);
    setNotes("");
    setIntensity(5);
    setDate(new Date().toISOString().slice(0, 10));
    setEditingId(null);
  };

  const startEdit = (log) => {
    setEditingId(log._id);
    setDate(log.date?.slice(0, 10) || new Date().toISOString().slice(0, 10));
    setSelected(log.tags || []);
    setIntensity(log.intensity || 5);
    setNotes(log.notes || "");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    resetForm();
    setError("");
  };

  const applySameAsYesterday = () => {
    if (!mostRecentPriorLog) return;
    setSelected(mostRecentPriorLog.tags || []);
    setIntensity(mostRecentPriorLog.intensity || 5);
    setNotes(mostRecentPriorLog.notes || "");
  };

 const save = async () => {
    if (!selected.length && !notes.trim()) return;

    const token = getAuthToken();
    if (!token) {
      handleAuthFailure("You're not signed in. Please log in again.");
      return;
    }

    setSaving(true);
    setError("");

    const isEditing = editingId !== null;
    const url = isEditing ? `/api/symptoms/${editingId}` : "/api/symptoms";
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ date, tags: selected, notes, intensity }),
      });

      if (res.status === 401) {
        const body = await res.json().catch(() => ({}));
        handleAuthFailure(body?.error);
        return;
      }

      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg || (isEditing ? "Update failed" : "Save failed"));
      }

      const updatedLogs = await res.json();
      setLogs(updatedLogs);
      window.dispatchEvent(new Event("symptoms:updated")); // real-time notification refresh
      resetForm();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const deleteLog = (log) => {
    if (pendingDeleteRef.current?.timeoutId) {
      clearTimeout(pendingDeleteRef.current.timeoutId);
    }

    setLogs((prev) => prev.filter((l) => l._id !== log._id));
    if (editingId === log._id) resetForm();
    setError("");

    const timeoutId = setTimeout(() => commitDelete(log._id), UNDO_WINDOW_MS);
    const pending = { log, timeoutId };
    pendingDeleteRef.current = pending;
    setPendingDelete(pending);
  };

  const commitDelete = async (id) => {
    const token = getAuthToken();
    if (!token) {
      handleAuthFailure("You're not signed in. Please log in again.");
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/symptoms/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        const body = await res.json().catch(() => ({}));
        handleAuthFailure(body?.error);
        return;
      }

      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg || "Delete failed");
      }

      const updatedLogs = await res.json();
      setLogs(updatedLogs);
      window.dispatchEvent(new Event("symptoms:updated")); // real-time notification refresh
    } catch (err) {
      setError(err.message || "Could not delete. Please try again.");
    } finally {
      setDeletingId(null);
      pendingDeleteRef.current = null;
      setPendingDelete(null);
    }
  };

  const undoDelete = () => {
    if (!pendingDelete) return;
    clearTimeout(pendingDelete.timeoutId);
    setLogs((prev) => [pendingDelete.log, ...prev]);
    pendingDeleteRef.current = null;
    setPendingDelete(null);
    window.dispatchEvent(new Event("symptoms:updated"));
  };

  const isEditing = editingId !== null;

  const chartW = 320;
  const chartH = 70;
  const known = trendPoints.filter((p) => p.intensity != null);
  const linePoints = known
    .map((p) => {
      const i = trendPoints.indexOf(p);
      const x = (i / (trendPoints.length - 1)) * chartW;
      const y = chartH - (p.intensity / 10) * chartH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const card = { background: "#fff", borderRadius: 12, padding: "14px 16px", marginBottom: "1rem" };

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "#FFF6F9" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2.5rem 2rem" }}>
        <h1 style={{ margin: "0 0 6px", lineHeight: "1.2", fontSize: "1.5rem", display: "flex", alignItems: "center", gap: 8 }}>
          <Heart size={22} color="#D4537E" strokeWidth={1.75} />
          How are you feeling?
        </h1>
        <p style={{ fontSize: 13, color: "#9A7383", margin: "0 0 1.5rem" }}>Track today's symptoms and mood</p>

        {error && (
          <div style={{ background: "#FEE2E2", color: "#991B1B", padding: "10px 14px", borderRadius: 8, marginBottom: "1rem", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            <AlertTriangle size={15} strokeWidth={1.75} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {isEditing && (
          <div style={{ background: "#FFF7ED", color: "#9A3412", padding: "10px 14px", borderRadius: 8, marginBottom: "1rem", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Pencil size={14} strokeWidth={1.75} />
              Editing log from {new Date(date).toLocaleDateString()}
            </span>
            <button
              onClick={cancelEdit}
              style={{ background: "none", border: "none", color: "#9A3412", textDecoration: "underline", cursor: "pointer", fontSize: 13, padding: 0 }}
            >
              Cancel
            </button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 340px", gap: 24, alignItems: "start" }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", gap: 10, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
                <Calendar size={15} color="#9A7383" strokeWidth={1.75} />
                <input
                  type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  style={{ border: "1px solid #F0C2D2", borderRadius: 6, padding: "4px 8px", background: "#fff" }}
                />
              </div>
              {mostRecentPriorLog && !isEditing && (
                <button
                  onClick={applySameAsYesterday}
                  style={{ padding: "6px 12px", fontSize: 12, borderRadius: 8, border: "1px solid #D4537E", background: "#FBEAF0", color: "#72243E", cursor: "pointer" }}
                >
                  Same as last log
                </button>
              )}
            </div>

            <div style={card}>
              <div className="groups-grid">
                {SYMPTOM_GROUPS.map((group) => {
                  const GroupIconComp = GROUP_ICON[group.label] || TagIcon;
                  return (
                    <div key={group.label}>
                      <p style={{ fontWeight: 500, margin: "0 0 10px", fontSize: 14, color: "#72243E", display: "flex", alignItems: "center", gap: 6 }}>
                        <GroupIconComp size={15} strokeWidth={1.75} />
                        {group.label}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
                        {group.tags.map((name) => (
                          <button
                            key={name}
                            onClick={() => toggleTag(name)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "6px 14px",
                              borderRadius: 99,
                              border: selected.includes(name) ? "1.5px solid #da215f" : "1px solid #F0C2D2",
                              background: selected.includes(name) ? "#da86a3" : "transparent",
                              color: "#72243E",
                              cursor: "pointer",
                              fontSize: 13,
                            }}
                          >
                            <TagChipIcon name={name} />
                            {name}
                          </button>
                        ))}

                        {(customTagsByGroup[group.label] || []).map((name) => (
                          <button
                            key={`custom-${group.label}-${name}`}
                            onClick={() => toggleTag(name)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "6px 14px",
                              borderRadius: 99,
                              border: selected.includes(name) ? "1.5px solid #D4537E" : "1px solid #F0C2D2",
                              background: selected.includes(name) ? "#FBEAF0" : "transparent",
                              color: "#72243E",
                              cursor: "pointer",
                              fontSize: 13,
                            }}
                          >
                            <TagIcon size={13} strokeWidth={1.75} />
                            {name}
                          </button>
                        ))}

                        {openCustomGroup === group.label ? (
                          <input
                            ref={customInputRef}
                            type="text"
                            value={customInput}
                            onChange={(e) => setCustomInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") submitCustomTag(group.label);
                              if (e.key === "Escape") cancelCustomInput();
                            }}
                            onBlur={() => submitCustomTag(group.label)}
                            placeholder="Symptom name…"
                            style={{
                              padding: "5px 10px",
                              borderRadius: 99,
                              border: "1.5px solid #D4537E",
                              fontSize: 13,
                              width: 130,
                            }}
                          />
                        ) : (
                          <button
                            onClick={() => openCustomInput(group.label)}
                            title={`Add a symptom to ${group.label}`}
                            aria-label={`Add a symptom to ${group.label}`}
                            style={{
                              width: 26,
                              height: 26,
                              borderRadius: "50%",
                              border: "1.5px dashed #D4537E",
                              background: "transparent",
                              color: "#D4537E",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <Plus size={14} strokeWidth={2} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={card}>
              <label style={{ fontSize: 14, color: "#72243E", display: "flex", alignItems: "center", gap: 8 }}>
                <IntensityIcon value={intensity} />
                Intensity: {intensity}/10
              </label>
              <input
                type="range" min={1} max={10} step={1} value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                style={{ width: "100%", marginTop: 8, accentColor: "#D4537E" }}
              />
            </div>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any extra notes…"
              rows={3}
              style={{ width: "100%", marginBottom: "1rem", padding: 10, borderRadius: 10, border: "1px solid #F0C2D2", background: "#fff" }}
            />

            <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
              <button
                onClick={save}
                disabled={saving || (!selected.length && !notes.trim())}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: 12,
                  background: saving || (!selected.length && !notes.trim()) ? "#E8A0B8" : "#D4537E",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  fontSize: 15,
                  cursor: saving ? "wait" : "pointer",
                  transition: "background 0.2s",
                }}
              >
                {saving ? (
                  "Saving…"
                ) : (
                  <>
                    <Save size={16} strokeWidth={1.75} />
                    {isEditing ? "Update symptoms" : "Save symptoms"}
                  </>
                )}
              </button>

              {isEditing && (
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  style={{
                    padding: "12px 18px",
                    background: "transparent",
                    color: "#72243E",
                    border: "1px solid #D4537E",
                    borderRadius: 10,
                    fontSize: 15,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
              )}
            </div>

            {pendingDelete && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#4A3038", color: "#fff", borderRadius: 10, padding: "10px 14px", fontSize: 13 }}>
                <span>Log deleted</span>
                <button
                  onClick={undoDelete}
                  style={{ background: "none", border: "none", color: "#F4C0D1", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: 0 }}
                >
                  Undo
                </button>
              </div>
            )}
          </div>

          <div>
            {frequentTags.length > 0 && (
              <div style={card}>
                <p style={{ fontWeight: 500, margin: "0 0 8px", fontSize: 13, color: "#72243E", display: "flex", alignItems: "center", gap: 6 }}>
                  <Star size={14} strokeWidth={1.75} />
                  Your frequent symptoms
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {frequentTags.map((name) => (
                    <button
                      key={`freq-${name}`}
                      onClick={() => toggleTag(name)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "6px 14px",
                        borderRadius: 99,
                        border: selected.includes(name) ? "1.5px solid #D4537E" : "1px solid #F0C2D2",
                        background: selected.includes(name) ? "#FBEAF0" : "transparent",
                        color: "#72243E",
                        cursor: "pointer",
                        fontSize: 13,
                      }}
                    >
                      <TagChipIcon name={name} />
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p style={{ fontWeight: 500, margin: "0 0 10px", color: "#72243E", display: "flex", alignItems: "center", gap: 6 }}>
                <BookOpen size={14} strokeWidth={1.75} />
                Recent logs
              </p>
              {logs.length === 0 && <p style={{ color: "#B491A0" }}>Nothing logged yet.</p>}
              {[...logs].slice(0, 7).map((log) => (
                <div
                  key={log._id}
                  style={{
                    background: "#fff",
                    border: editingId === log._id ? "1.5px solid #D4537E" : "1px solid transparent",
                    borderRadius: 12,
                    padding: "12px 14px",
                    marginBottom: 10,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <p style={{ fontSize: 12, color: "#B491A0", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                      {new Date(log.date).toLocaleDateString()} ·
                      <IntensityIcon value={log.intensity} size={13} />
                      Intensity {log.intensity}/10
                    </p>
                    <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                      <button
                        onClick={() => startEdit(log)}
                        disabled={deletingId === log._id}
                        style={{ background: "none", border: "none", color: "#72243E", cursor: "pointer", fontSize: 12, padding: 0, textDecoration: "underline" }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteLog(log)}
                        disabled={deletingId === log._id}
                        style={{ background: "none", border: "none", color: "#991B1B", cursor: deletingId === log._id ? "wait" : "pointer", fontSize: 12, padding: 0, textDecoration: "underline" }}
                      >
                        {deletingId === log._id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {log.tags.map((t) => (
                      <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, padding: "3px 9px", borderRadius: 99, background: "#FBEAF0", color: "#72243E" }}>
                        <TagChipIcon name={t} size={11} />
                        {t}
                      </span>
                    ))}
                  </div>
                  {log.notes && (
                    <p style={{ fontSize: 12, color: "#9A7383", marginTop: 6, fontStyle: "italic" }}>{log.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}