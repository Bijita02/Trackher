import { useState, useEffect } from "react";

const SYMPTOM_GROUPS = [
  {
    label: "Head",
    emoji: "🤕",
    tags: [
      { name: "Headache", emoji: "🔨" },
      { name: "Migraines", emoji: "💢" },
      { name: "Dizziness", emoji: "🌀" },
      { name: "Acne", emoji: "🔴" },
      { name: "Hectic fever", emoji: "🌶️" },
    ],
  },
  {
    label: "Body",
    emoji: "💪",
    tags: [
      { name: "Neck aches", emoji: "🦴" },
      { name: "Shoulder aches", emoji: "💪" },
      { name: "Tender breasts", emoji: "🎗️" },
      { name: "Breast sensitivity", emoji: "➕" },
      { name: "Backaches", emoji: "🌸" },
      { name: "Lower back pain", emoji: "🦴" },
      { name: "Body aches", emoji: "🔴" },
      { name: "Muscle pain", emoji: "🥩" },
      { name: "Influenza", emoji: "🤒" },
      { name: "Illness", emoji: "➕" },
      { name: "Cramps", emoji: "⚡" },
      { name: "Chills", emoji: "❄️" },
    ],
  },
  {
    label: "Abdomen",
    emoji: "🍑",
    tags: [
      { name: "Bloating", emoji: "🎈" },
      { name: "Constipation", emoji: "💩" },
      { name: "Diarrhea", emoji: "🧻" },
      { name: "Nausea", emoji: "🤢" },
      { name: "Abdominal cramps", emoji: "⚡" },
      { name: "Dyspepsia", emoji: "🌶️" },
      { name: "Gas", emoji: "💨" },
      { name: "Hunger", emoji: "🍗" },
      { name: "Cravings", emoji: "🍫" },
      { name: "Ovulation pain", emoji: "☀️" },
      { name: "Pelvic pressure", emoji: "⬇️" },
    ],
  },
  {
    label: "Mental",
    emoji: "🧠",
    tags: [
      { name: "Anxious", emoji: "😰" },
      { name: "Insomnia", emoji: "🌙" },
      { name: "Stress", emoji: "🏋️" },
      { name: "Moodiness", emoji: "😐" },
      { name: "Tension", emoji: "⚠️" },
      { name: "Irritable", emoji: "😤" },
      { name: "Unable to concentrate", emoji: "🔄" },
      { name: "Fatigue", emoji: "🥱" },
      { name: "Low mood", emoji: "😔" },
      { name: "Mood swings", emoji: "🎢" },
      { name: "Crying spells", emoji: "😭" },
      { name: "Calm", emoji: "😌" },
      { name: "Oversleeping", emoji: "🛌" },
      { name: "Low energy", emoji: "🔋" },
      { name: "High energy", emoji: "⚡" },
    ],
  },
  {
    label: "Cervix",
    emoji: "🔬",
    tags: [
      { name: "Pelvic pain", emoji: "🤕" },
      { name: "Cervical firmness", emoji: "🪨" },
      { name: "Cervical opening", emoji: "↗️" },
      { name: "Cervical mucus", emoji: "🟢" },
      { name: "Flow", emoji: "🩸" },
      { name: "Heavy flow", emoji: "🩸" },
      { name: "Light flow", emoji: "💧" },
      { name: "Spotting", emoji: "🔴" },
      { name: "Irritation", emoji: "🌾" },
    ],
  },
  {
    label: "Fluid",
    emoji: "💧",
    tags: [
      { name: "Dry", emoji: "🏜️" },
      { name: "Sticky", emoji: "🦴" },
      { name: "Creamy", emoji: "🥛" },
      { name: "Watery", emoji: "🌊" },
      { name: "Egg-white", emoji: "🥚" },
      { name: "Cottage-cheese", emoji: "🧀" },
      { name: "Green", emoji: "🟢" },
      { name: "With blood", emoji: "🩸" },
      { name: "Foul-smelling", emoji: "👃" },
    ],
  },
];

const INTENSITY_EMOJI = ["🙂", "🙂", "😐", "😐", "😕", "😕", "😣", "😣", "😖", "😫"];

export default function SymptomsPage({ token }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [selected, setSelected] = useState([]);
  const [intensity, setIntensity] = useState(5);
  const [notes, setNotes] = useState("");
  const [logs, setLogs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Editing state: null = creating a new log, otherwise holds the id being edited
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!token) {
      setError("You're not signed in. Please log in again.");
      return;
    }

    fetch("/api/symptoms", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) {
          let msg = `Failed to load (status ${r.status})`;
          try {
            const body = await r.json();
            if (body?.error) msg = body.error;
          } catch {
            // response wasn't JSON, keep the status-based message
          }
          throw new Error(msg);
        }
        return r.json();
      })
      .then(setLogs)
      .catch((err) => {
        console.error("Failed to load symptom logs:", err);
        setError(err.message || "Could not load your logs. Please refresh.");
      });
  }, [token]);

  const toggleTag = (tag) =>
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

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
    // Scroll up to the form so the person sees what they're editing
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    resetForm();
    setError("");
  };

  const save = async () => {
    if (!selected.length && !notes.trim()) return;
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

      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg || (isEditing ? "Update failed" : "Save failed"));
      }

      const updatedLogs = await res.json();
      setLogs(updatedLogs);
      resetForm();
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const deleteLog = async (id) => {
    if (!window.confirm("Delete this log? This can't be undone.")) return;
    setDeletingId(id);
    setError("");

    try {
      const res = await fetch(`/api/symptoms/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg || "Delete failed");
      }

      const updatedLogs = await res.json();
      setLogs(updatedLogs);
      // If we were mid-edit on the log we just deleted, reset the form
      if (editingId === id) resetForm();
    } catch (err) {
      setError(err.message || "Could not delete. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const isEditing = editingId !== null;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <h1>How are you feeling? 💗</h1>

      {error && (
        <div style={{ background: "#FEE2E2", color: "#991B1B", padding: "10px 14px", borderRadius: 8, marginBottom: "1rem", fontSize: 13 }}>
          ⚠️ {error}
        </div>
      )}

      {isEditing && (
        <div style={{ background: "#FFF7ED", color: "#9A3412", padding: "10px 14px", borderRadius: 8, marginBottom: "1rem", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <span>✏️ Editing log from {new Date(date).toLocaleDateString()}</span>
          <button
            onClick={cancelEdit}
            style={{ background: "none", border: "none", color: "#9A3412", textDecoration: "underline", cursor: "pointer", fontSize: 13, padding: 0 }}
          >
            Cancel
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "center", margin: "1rem 0" }}>
        <label>📅 Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {SYMPTOM_GROUPS.map((group) => (
        <div key={group.label} style={{ marginBottom: "1.25rem" }}>
          <p style={{ fontWeight: 500, marginBottom: 8 }}>
            {group.emoji} {group.label}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {group.tags.map(({ name, emoji }) => (
              <button
                key={name}
                onClick={() => toggleTag(name)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 99,
                  border: selected.includes(name) ? "1.5px solid #D4537E" : "1px solid #ccc",
                  background: selected.includes(name) ? "#FBEAF0" : "transparent",
                  color: selected.includes(name) ? "#72243E" : "inherit",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                {emoji} {name}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div style={{ margin: "1rem 0" }}>
        <label>
          {INTENSITY_EMOJI[intensity - 1]} Intensity: {intensity}/10
        </label>
        <input
          type="range" min={1} max={10} step={1} value={intensity}
          onChange={(e) => setIntensity(Number(e.target.value))}
          style={{ width: "100%", marginTop: 6 }}
        />
      </div>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Any extra notes…"
        rows={3}
        style={{ width: "100%", marginBottom: "1rem", padding: 10, borderRadius: 8, border: "1px solid #ccc" }}
      />

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={save}
          disabled={saving || (!selected.length && !notes.trim())}
          style={{
            flex: 1,
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
          {saving ? "Saving…" : isEditing ? "💾 Update symptoms" : "💾 Save symptoms"}
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

      <div style={{ marginTop: "2rem" }}>
        <p style={{ fontWeight: 500, marginBottom: 12 }}>📖 Recent logs</p>
        {logs.length === 0 && <p style={{ color: "#888" }}>Nothing logged yet.</p>}
        {[...logs].slice(0, 7).map((log) => (
          <div
            key={log._id}
            style={{
              background: editingId === log._id ? "#FBEAF0" : "#f9f9f9",
              border: editingId === log._id ? "1.5px solid #D4537E" : "1px solid transparent",
              borderRadius: 10,
              padding: "10px 14px",
              marginBottom: 10,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
              <p style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>
                {new Date(log.date).toLocaleDateString()} · {INTENSITY_EMOJI[log.intensity - 1]} Intensity {log.intensity}/10
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
                  onClick={() => deleteLog(log._id)}
                  disabled={deletingId === log._id}
                  style={{ background: "none", border: "none", color: "#991B1B", cursor: deletingId === log._id ? "wait" : "pointer", fontSize: 12, padding: 0, textDecoration: "underline" }}
                >
                  {deletingId === log._id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {log.tags.map((t) => (
                <span key={t} style={{ fontSize: 11, padding: "3px 9px", borderRadius: 99, background: "#FBEAF0", color: "#72243E" }}>
                  {t}
                </span>
              ))}
            </div>
            {log.notes && (
              <p style={{ fontSize: 12, color: "#666", marginTop: 6, fontStyle: "italic" }}>{log.notes}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}