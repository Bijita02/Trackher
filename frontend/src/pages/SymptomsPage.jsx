import { useState, useEffect } from "react";

const SYMPTOM_GROUPS = [
  {
    label: "Pain & cramps",
    tags: ["Cramps", "Lower back pain", "Headache", "Breast tenderness", "Pelvic pressure"],
  },
  {
    label: "Mood",
    tags: ["Irritable", "Anxious", "Low mood", "Mood swings", "Crying spells", "Calm"],
  },
  {
    label: "Physical",
    tags: ["Bloating", "Fatigue", "Nausea", "Acne", "Spotting", "Heavy flow", "Light flow", "Cravings", "Diarrhea"],
  },
  {
    label: "Energy & sleep",
    tags: ["Insomnia", "Oversleeping", "Low energy", "High energy"],
  },
];

export default function SymptomsPage({ token }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [selected, setSelected] = useState([]);
  const [intensity, setIntensity] = useState(5);
  const [notes, setNotes] = useState("");
  const [logs, setLogs] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/symptoms", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load");
        return r.json();
      })
      .then(setLogs)
      .catch(() => setError("Could not load your logs. Please refresh."));
  }, [token]);

  const toggleTag = (tag) =>
    setSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const save = async () => {
    if (!selected.length && !notes.trim()) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/symptoms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ date, tags: selected, notes, intensity }),
      });

      if (!res.ok) {
        const { error: msg } = await res.json();
        throw new Error(msg || "Save failed");
      }

      const updatedLogs = await res.json();
      setLogs(updatedLogs);
      setSelected([]);
      setNotes("");
      setIntensity(5);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "1.5rem 1rem" }}>
      <h1>How are you feeling?</h1>

      {error && (
        <div style={{ background: "#FEE2E2", color: "#991B1B", padding: "10px 14px", borderRadius: 8, marginBottom: "1rem", fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "center", margin: "1rem 0" }}>
        <label>Date</label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      {SYMPTOM_GROUPS.map((group) => (
        <div key={group.label} style={{ marginBottom: "1.25rem" }}>
          <p style={{ fontWeight: 500, marginBottom: 8 }}>{group.label}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {group.tags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 99,
                  border: selected.includes(tag) ? "1.5px solid #D4537E" : "1px solid #ccc",
                  background: selected.includes(tag) ? "#FBEAF0" : "transparent",
                  color: selected.includes(tag) ? "#72243E" : "inherit",
                  cursor: "pointer",
                  fontSize: 13,
                }}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div style={{ margin: "1rem 0" }}>
        <label>Intensity: {intensity}/10</label>
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

      <button
        onClick={save}
        disabled={saving || (!selected.length && !notes.trim())}
        style={{
          width: "100%",
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
        {saving ? "Saving…" : "Save symptoms"}
      </button>

      <div style={{ marginTop: "2rem" }}>
        <p style={{ fontWeight: 500, marginBottom: 12 }}>Recent logs</p>
        {logs.length === 0 && <p style={{ color: "#888" }}>Nothing logged yet.</p>}
        {[...logs].slice(0, 7).map((log, i) => (
          <div key={i} style={{ background: "#f9f9f9", borderRadius: 10, padding: "10px 14px", marginBottom: 10 }}>
            <p style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>
              {new Date(log.date).toLocaleDateString()} · Intensity {log.intensity}/10
            </p>
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