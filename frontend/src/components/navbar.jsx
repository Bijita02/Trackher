import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import { Bell, Menu, X, Home as HomeIcon } from "lucide-react";
import { getCycleNotifications, getSymptomBasedNotifications } from "../utils/cycleMath";

const BRAND = {
  ink: "#241220",
  text: "#4A3E47",
  muted: "#8F8290",
  pink: "#E23670",
  pinkDark: "#C82D60",
  pinkSoft: "#FCE1EA",
  border: "#EFE2E8",
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [dismissedIds, setDismissedIds] = useState(() => new Set());
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
    setIsOpen(false);
    setShowNotifications(false);
  }, [location]);

  useEffect(() => {
    if (!isLoggedIn) {
      setNotifications([]);
      return;
    }

    let cancelled = false;

    const loadNotifications = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const token = localStorage.getItem("token");
        if (!userId || !token) return;

        const [userRes, symptomsRes] = await Promise.all([
          fetch(`http://localhost:5000/api/users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/symptoms", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        let cycleNotifications = [];
        if (userRes.ok) {
          const data = await userRes.json();
          const info = data?.cycleInfo;
          if (info?.lastPeriod) {
            const cycle = {
              lastPeriodStart: new Date(info.lastPeriod),
              periodStarts: (info.history || []).map((h) => new Date(h.date)),
              cycleLength: Number(info.cycleLength),
              periodLength: Number(info.periodLength),
            };
            cycleNotifications = getCycleNotifications(cycle, new Date());
          }
        }

        let symptomNotifications = [];
        if (symptomsRes.ok) {
          const allLogs = await symptomsRes.json();
          symptomNotifications = getSymptomBasedNotifications(allLogs);
        }

        if (!cancelled) {
          setNotifications([...symptomNotifications, ...cycleNotifications]);
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    };

    loadNotifications();

    const handleSymptomsUpdated = () => loadNotifications();
    window.addEventListener("symptoms:updated", handleSymptomsUpdated);

    return () => {
      cancelled = true;
      window.removeEventListener("symptoms:updated", handleSymptomsUpdated);
    };
  }, [isLoggedIn]);

  const visibleNotifications = notifications.filter((n) => !dismissedIds.has(n.id));

  const dismissNotification = (id) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  };

  const handleNotificationAction = (n) => {
    if (n.actionPath) {
      setShowNotifications(false);
      setIsOpen(false);
      navigate(n.actionPath);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setIsLoggedIn(false);
    setNotifications([]);
    navigate("/");
  };

  const isHomeActive = () => location.pathname === "/" || location.pathname === "/dashboard";

  const NavItem = ({ to, onClick, icon, label, active }) => {
    const className = `group flex items-center h-10 rounded-full pl-2.5 transition-all duration-300 ease-out ${
      active
        ? "bg-gradient-to-r from-[#E23670] to-[#C82D60] text-white shadow-[0_2px_10px_rgba(226,54,112,0.35)] pr-4"
        : "pr-2.5 hover:pr-4 text-[#4A3E47] hover:bg-[#F6EEF1]"
    }`;
    const content = (
      <>
        <span className="flex items-center justify-center shrink-0 h-5 w-5">{icon}</span>
        <span
          className={`overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-300 ease-out ${
            active
              ? "max-w-[100px] opacity-100 ml-2"
              : "max-w-0 opacity-0 ml-0 group-hover:max-w-[100px] group-hover:opacity-100 group-hover:ml-2"
          }`}
        >
          {label}
        </span>
      </>
    );
    if (to) {
      return (
        <Link to={to} className={className} aria-label={label}>
          {content}
        </Link>
      );
    }
    return (
      <button onClick={onClick} className={className} aria-label={label}>
        {content}
      </button>
    );
  };

  const NotificationsPanel = () => (
    <>
      <p className="font-semibold mb-2" style={{ color: BRAND.ink }}>
        Notifications
      </p>
      {visibleNotifications.length === 0 ? (
        <p className="text-xs" style={{ color: BRAND.muted }}>
          No new notifications
        </p>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {visibleNotifications.map((n) => (
            <div
              key={n.id}
              className="flex items-start gap-2 rounded-xl p-2.5"
              style={{ background: BRAND.pinkSoft }}
            >
              <span className="text-base leading-none mt-0.5">{n.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold" style={{ color: BRAND.ink }}>
                  {n.title}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: BRAND.muted }}>
                  {n.message}
                </p>
                {n.actionLabel && n.actionPath && (
                  <button
                    onClick={() => handleNotificationAction(n)}
                    className="text-[11px] font-semibold mt-1.5 underline"
                    style={{ color: BRAND.pink }}
                  >
                    {n.actionLabel} →
                  </button>
                )}
              </div>
              <button
                onClick={() => dismissNotification(n.id)}
                aria-label="Dismiss notification"
                className="shrink-0 text-[11px] font-medium px-1.5 py-0.5 rounded-full hover:bg-white/60 transition-colors"
                style={{ color: BRAND.muted }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <nav className="fixed w-full z-50 bg-white shadow-[0_1px_0_rgba(36,18,32,0.06)]">
      <div className="max-w-7xl mx-auto pl-2 pr-6 h-20 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 shrink-0">
          <img
            src={logo}
            alt="TrackHer"
            className="h-16 w-16 object-contain"
            style={{ imageRendering: "-webkit-optimize-contrast" }}
          />
          <div className="leading-tight">
            <p className="text-[17px] font-bold tracking-tight" style={{ color: BRAND.pink }}>
              TrackHer
            </p>
            <p className="text-[10px] font-medium tracking-wide uppercase" style={{ color: BRAND.muted }}>
              Cycle Companion
            </p>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-2">
          <NavItem to="/" icon={<HomeIcon size={18} strokeWidth={2} />} label="Home" active={isHomeActive()} />

          {isLoggedIn && (
            <div className="relative group">
              <button
                onClick={() => setShowNotifications((v) => !v)}
                aria-label="Notifications"
                className={`group flex items-center h-10 rounded-full pl-2.5 transition-all duration-300 ease-out ${
                  showNotifications
                    ? "bg-gradient-to-r from-[#E23670] to-[#C82D60] text-white shadow-[0_2px_10px_rgba(226,54,112,0.35)] pr-4"
                    : "pr-2.5 hover:pr-4 text-[#4A3E47] hover:bg-[#F6EEF1]"
                }`}
              >
                <span className="relative flex items-center justify-center shrink-0 h-5 w-5">
                  <Bell size={18} strokeWidth={2} />
                  {visibleNotifications.length > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full ring-2 ring-white"
                      style={{ background: BRAND.pink }}
                    />
                  )}
                </span>
                <span
                  className={`overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-300 ease-out ${
                    showNotifications
                      ? "max-w-[100px] opacity-100 ml-2"
                      : "max-w-0 opacity-0 ml-0 group-hover:max-w-[100px] group-hover:opacity-100 group-hover:ml-2"
                  }`}
                >
                  Alerts
                </span>
              </button>

              {showNotifications && (
                <div
                  className="absolute right-0 mt-2.5 w-80 bg-white rounded-2xl shadow-[0_8px_24px_rgba(36,18,32,0.12)] border p-4 text-sm z-50"
                  style={{ borderColor: BRAND.border }}
                >
                  <NotificationsPanel />
                </div>
              )}
            </div>
          )}

          <div className="w-px h-6 mx-3" style={{ background: BRAND.border }} />

          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="h-10 px-5 rounded-full text-sm font-semibold transition-colors border-2"
              style={{ color: BRAND.pink, borderColor: BRAND.pink, background: "transparent" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = BRAND.pink;
                e.currentTarget.style.color = "#fff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = BRAND.pink;
              }}
            >
              Log out
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="h-10 flex items-center px-4 rounded-full text-sm font-medium transition-colors hover:bg-[#F6EEF1]"
                style={{ color: BRAND.text }}
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="h-10 flex items-center px-5 rounded-full text-sm font-semibold text-white transition-colors"
                style={{ background: BRAND.pink }}
                onMouseEnter={(e) => (e.currentTarget.style.background = BRAND.pinkDark)}
                onMouseLeave={(e) => (e.currentTarget.style.background = BRAND.pink)}
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          className={`md:hidden flex items-center justify-center h-10 w-10 rounded-full transition-colors ${
            isOpen ? "bg-gradient-to-r from-[#E23670] to-[#C82D60] text-white shadow-[0_2px_10px_rgba(226,54,112,0.35)]" : "text-[#4A3E47] hover:bg-[#F6EEF1]"
          }`}
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Close menu" : "Open menu"}
        >
          {isOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white border-t px-4 py-4 space-y-1" style={{ borderColor: BRAND.border }}>
          <Link
            to="/"
            className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl ${
              isHomeActive() ? "bg-gradient-to-r from-[#E23670] to-[#C82D60] text-white shadow-[0_2px_10px_rgba(226,54,112,0.35)]" : "text-[#4A3E47] hover:bg-[#F6EEF1]"
            }`}
            onClick={() => setIsOpen(false)}
          >
            Home
          </Link>

          {isLoggedIn && (
            <>
              <button
                onClick={() => setShowNotifications((v) => !v)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl relative ${
                  showNotifications ? "bg-gradient-to-r from-[#E23670] to-[#C82D60] text-white shadow-[0_2px_10px_rgba(226,54,112,0.35)]" : "text-[#4A3E47] hover:bg-[#F6EEF1]"
                }`}
              >
                <span className="relative flex items-center justify-center">
                  <Bell size={18} strokeWidth={2} />
                  {visibleNotifications.length > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full ring-2 ring-white"
                      style={{ background: showNotifications ? "#fff" : BRAND.pink }}
                    />
                  )}
                </span>
                Notifications
              </button>

              {showNotifications && (
                <div className="mx-4 mt-1 rounded-xl border p-4 text-sm" style={{ borderColor: BRAND.border }}>
                  <NotificationsPanel />
                </div>
              )}
            </>
          )}

          <div className="mt-2 pt-3 border-t" style={{ borderColor: BRAND.border }}>
            {isLoggedIn ? (
              <button
                onClick={() => {
                  handleLogout();
                  setIsOpen(false);
                }}
                className="block w-full text-center text-white text-sm font-semibold py-3 rounded-xl"
                style={{ background: BRAND.pink }}
              >
                Log out
              </button>
            ) : (
              <div className="space-y-2">
                <Link
                  to="/login"
                  className="block px-4 py-3 text-sm font-medium rounded-xl text-center"
                  style={{ color: BRAND.text, background: "#F6EEF1" }}
                  onClick={() => setIsOpen(false)}
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="block text-center text-white text-sm font-semibold py-3 rounded-xl"
                  style={{ background: BRAND.pink }}
                  onClick={() => setIsOpen(false)}
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;