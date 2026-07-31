import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MS_PER_DAY, stripTime } from "../utils/cycleMath";
import {
  User as UserIcon,
  Mail,
  Cake,
  Droplet,
  Calendar,
  Pencil,
  Check,
  X,
  Loader2,
  LogOut,
  ClipboardList,
  CalendarClock,
  Trash2,
  AlertTriangle,
} from "lucide-react";

const BRAND = {
  ink: "#241220",
  muted: "#8F8290",
  pink: "#E23670",
  pinkSoft: "#FCE1EA",
  border: "#FDE3EC",
};

const OUTLIER_MAX_GAP = 90;

function getAverageCycleLength(user) {
  const rawHistory = user?.cycleInfo?.history || [];
  const lastPeriodEntry = user?.cycleInfo?.lastPeriod
    ? [{ date: user.cycleInfo.lastPeriod }]
    : [];

  const seenDays = new Set();
  const dates = [...rawHistory, ...lastPeriodEntry]
    .map((h) => new Date(h.date))
    .filter((d) => !isNaN(d))
    .filter((d) => {
      const key = stripTime(d);
      if (seenDays.has(key)) return false;
      seenDays.add(key);
      return true;
    })
    .sort((a, b) => a - b);

  if (dates.length < 2) return user?.cycleInfo?.cycleLength || null;

  const lengths = [];
  for (let i = 0; i < dates.length - 1; i++) {
    const diff = Math.round((stripTime(dates[i + 1]) - stripTime(dates[i])) / MS_PER_DAY);
    if (diff >= 0 && diff <= OUTLIER_MAX_GAP) lengths.push(diff);
  }

  if (lengths.length === 0) return user?.cycleInfo?.cycleLength || null;
  return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
}


function getAveragePeriodLength(user) {
  const lengths = (user?.cycleInfo?.history || [])
    .map((h) => h.periodLength)
    .filter((v) => v !== null && v !== undefined && v > 0);

  if (lengths.length === 0) return user?.cycleInfo?.periodLength || null;
  return Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length);
}

function calculateAge(birthdate) {
  if (!birthdate) return null;
  const dob = new Date(birthdate);
  if (Number.isNaN(dob.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [form, setForm] = useState({ name: "", email: "", birthdate: "" });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  const fetchUser = async () => {
    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      if (!userId || !token) {
        setLoading(false);
        navigate("/login", { replace: true });
        return;
      }

      const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        navigate("/login", { replace: true });
        return;
      }

      const data = await res.json();
      setUser(data);
      setForm({
        name: data?.name || "",
        email: data?.email || "",
        birthdate: data?.birthdate ? data.birthdate.slice(0, 10) : "",
      });
    } catch (err) {
      setError("Couldn't load your profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);

    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Couldn't save your changes. Please try again.");
      }

      setUser(data);
      setIsEditing(false);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setForm({
      name: user?.name || "",
      email: user?.email || "",
      birthdate: user?.birthdate ? user.birthdate.slice(0, 10) : "",
    });
    setSaveError(null);
    setIsEditing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    navigate("/login", { replace: true });
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);

    try {
      const userId = localStorage.getItem("userId");
      const token = localStorage.getItem("token");

      const res = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Couldn't delete your account. Please try again.");
      }

      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      navigate("/", { replace: true });
    } catch (err) {
      setDeleteError(err.message);
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FDF6F3]">
        <p className="text-sm animate-pulse" style={{ color: BRAND.muted }}>Loading...</p>
      </div>
    );
  }

  const initials = (user?.name || "?")
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const age = calculateAge(user?.birthdate);
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long" })
    : null;
  const periodsLogged = user?.cycleInfo?.history?.length || 0;
  const symptomsLogged = user?.cycleInfo?.symptoms?.length || 0;
  const avgPeriodLength = getAveragePeriodLength(user);
  const avgCycleLength = getAverageCycleLength(user);

  return (
    <div className="min-h-screen bg-[#FDF6F3]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
        .fr-display { font-family: 'Fraunces', serif; }
      `}</style>

      <div className="max-w-2xl mx-auto p-6">
        <h1 className="fr-display text-3xl mb-6" style={{ color: BRAND.ink }}>
          Profile
        </h1>

        {error && (
          <div className="rounded-xl p-4 mb-4 text-sm" style={{ background: BRAND.pinkSoft, color: BRAND.pink }}>
            {error}
          </div>
        )}

       
        <div className="rounded-2xl p-6 mb-6 bg-white" style={{ border: `1px solid ${BRAND.border}` }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-semibold text-white fr-display"
                style={{ background: BRAND.pink }}
              >
                {initials}
              </div>
              <div>
                <p className="fr-display text-xl" style={{ color: BRAND.ink }}>
                  {user?.name || "Add your name"}
                </p>
                <p className="text-xs" style={{ color: BRAND.muted }}>{user?.email}</p>
                {memberSince && (
                  <p className="text-[11px] mt-0.5" style={{ color: BRAND.muted }}>
                    Member since {memberSince}
                  </p>
                )}
              </div>
            </div>

            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full transition shrink-0"
                style={{ background: BRAND.pinkSoft, color: BRAND.pink }}
              >
                <Pencil size={13} /> Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <Field
                icon={<UserIcon size={15} />}
                label="Name"
                value={form.name}
                onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              />
              <Field
                icon={<Mail size={15} />}
                label="Email"
                type="email"
                value={form.email}
                onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              />
              <Field
                icon={<Cake size={15} />}
                label="Date of birth"
                type="date"
                value={form.birthdate}
                onChange={(v) => setForm((f) => ({ ...f, birthdate: v }))}
              />

              {saveError && (
                <p className="text-xs" style={{ color: BRAND.pink }}>{saveError}</p>
              )}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-60 text-white"
                  style={{ background: BRAND.pink }}
                >
                  {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {saving ? "Saving…" : "Save changes"}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={saving}
                  className="flex items-center justify-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-lg transition disabled:opacity-60"
                  style={{ background: BRAND.pinkSoft, color: BRAND.muted }}
                >
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <InfoRow
                icon={<Cake size={15} />}
                label="Date of birth"
                value={
                  user?.birthdate
                    ? `${new Date(user.birthdate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}${age !== null ? ` (${age})` : ""}`
                    : "—"
                }
              />
              <InfoRow icon={<Mail size={15} />} label="Email" value={user?.email || "—"} />
            </div>
          )}
        </div>


        <div className="grid grid-cols-1 gap-3 mb-6">
          <StatCard
            icon={<CalendarClock size={16} style={{ color: BRAND.pink }} />}
            value={periodsLogged}
            label={periodsLogged === 1 ? "Period logged" : "Periods logged"}
          />
         
        </div>

        {user?.cycleInfo?.lastPeriod && (
          <div className="rounded-2xl p-6 mb-6 bg-white" style={{ border: `1px solid ${BRAND.border}` }}>
            <div className="flex items-center gap-2 mb-4">
              <Droplet size={16} style={{ color: BRAND.pink }} />
              <p className="text-sm font-semibold" style={{ color: BRAND.ink }}>Cycle settings</p>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <StatBox
                label="Avg cycle length"
                value={avgCycleLength ? `${avgCycleLength} days` : "—"}
              />
              <StatBox
                label="Last period"
                value={new Date(user.cycleInfo.lastPeriod).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <StatBox label="Current period length" value={`${user.cycleInfo.periodLength} days`} />
              <StatBox
                label="Avg period length"
                value={avgPeriodLength ? `${avgPeriodLength} days` : "—"}
              />
            </div>
            <p className="text-xs mt-3" style={{ color: BRAND.muted }}>
              To change these, log a new period from the dashboard or update it on the calendar.
            </p>
          </div>
        )}

        {user?.pregnancyInfo?.dueDate && (
          <div className="rounded-2xl p-6 mb-6 bg-white" style={{ border: `1px solid ${BRAND.border}` }}>
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={16} style={{ color: BRAND.pink }} />
              <p className="text-sm font-semibold" style={{ color: BRAND.ink }}>Pregnancy</p>
            </div>
            <p className="text-sm" style={{ color: BRAND.muted }}>
              Due{" "}
              {new Date(user.pregnancyInfo.dueDate).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        )}

        
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 text-sm font-medium py-3 rounded-xl transition mb-3"
          style={{ background: "#fff", color: BRAND.pink, border: `1px solid ${BRAND.border}` }}
        >
          <LogOut size={15} /> Log out
        </button>

        <div className="rounded-2xl p-5 mb-8" style={{ background: "#FFF5F5", border: "1px solid #FBD5D5" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "#C0392B" }}>Danger zone</p>
          <p className="text-xs mb-3" style={{ color: "#A85B5B" }}>
            Deleting your account permanently removes your profile, cycle history, and symptom logs. This can't be undone.
          </p>
          <button
            onClick={() => {
              setDeleteError(null);
              setDeleteConfirmText("");
              setShowDeleteModal(true);
            }}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full transition text-white"
            style={{ background: "#C0392B" }}
          >
            <Trash2 size={13} /> Delete account
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <DeleteAccountModal
          deleting={deleting}
          error={deleteError}
          confirmText={deleteConfirmText}
          setConfirmText={setDeleteConfirmText}
          onClose={() => !deleting && setShowDeleteModal(false)}
          onConfirm={handleDeleteAccount}
        />
      )}
    </div>
  );
}

function Field({ icon, label, value, onChange, type = "text" }) {
  return (
    <label className="block">
      <span className="text-xs font-medium mb-1 flex items-center gap-1.5" style={{ color: BRAND.muted }}>
        {icon} {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm px-3 py-2.5 rounded-lg outline-none transition"
        style={{ border: `1px solid ${BRAND.border}`, color: BRAND.ink }}
        onFocus={(e) => (e.target.style.borderColor = BRAND.pink)}
        onBlur={(e) => (e.target.style.borderColor = BRAND.border)}
      />
    </label>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="rounded-xl p-3" style={{ background: "#FDF6F3" }}>
      <span className="text-[10px] font-medium flex items-center gap-1 mb-1" style={{ color: BRAND.muted }}>
        {icon} {label}
      </span>
      <p className="text-sm font-medium" style={{ color: BRAND.ink }}>{value}</p>
    </div>
  );
}

function StatBox({ label, value }) {
  return (
    <div className="rounded-xl p-3 text-center" style={{ background: "#FDF6F3" }}>
      <p className="fr-display text-lg" style={{ color: BRAND.ink }}>{value}</p>
      <p className="text-[10px] font-medium mt-0.5" style={{ color: BRAND.muted }}>{label}</p>
    </div>
  );
}

function StatCard({ icon, value, label }) {
  return (
    <div className="rounded-2xl p-4 bg-white flex items-center gap-3" style={{ border: `1px solid ${BRAND.border}` }}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: BRAND.pinkSoft }}>
        {icon}
      </div>
      <div>
        <p className="fr-display text-xl leading-none" style={{ color: BRAND.ink }}>{value}</p>
        <p className="text-[11px] mt-1" style={{ color: BRAND.muted }}>{label}</p>
      </div>
    </div>
  );
}

function DeleteAccountModal({ deleting, error, confirmText, setConfirmText, onClose, onConfirm }) {
  const canDelete = confirmText.trim().toUpperCase() === "DELETE";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(36, 18, 32, 0.35)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 bg-white"
        style={{ fontFamily: "'Inter', sans-serif" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#FFF5F5" }}>
            <AlertTriangle size={18} style={{ color: "#C0392B" }} />
          </div>
          <div>
            <p className="fr-display text-lg" style={{ color: BRAND.ink }}>Delete your account?</p>
            <p className="text-xs mt-1" style={{ color: BRAND.muted }}>
              This permanently deletes your profile, cycle history, and symptom logs. There's no undo.
            </p>
          </div>
        </div>

        <label className="block mb-4">
          <span className="text-xs font-medium mb-1 block" style={{ color: BRAND.muted }}>
            Type <span className="font-semibold" style={{ color: BRAND.ink }}>DELETE</span> to confirm
          </span>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            disabled={deleting}
            className="w-full text-sm px-3 py-2.5 rounded-lg outline-none transition"
            style={{ border: `1px solid ${BRAND.border}`, color: BRAND.ink }}
          />
        </label>

        {error && <p className="text-xs mb-3" style={{ color: "#C0392B" }}>{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            disabled={!canDelete || deleting}
            className="flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2.5 rounded-lg transition disabled:opacity-50 text-white"
            style={{ background: "#C0392B" }}
          >
            {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            {deleting ? "Deleting…" : "Delete forever"}
          </button>
          <button
            onClick={onClose}
            disabled={deleting}
            className="flex items-center justify-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-lg transition disabled:opacity-60"
            style={{ background: BRAND.pinkSoft, color: BRAND.muted }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default Profile;