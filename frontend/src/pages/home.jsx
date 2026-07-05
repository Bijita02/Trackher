import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Droplet, Leaf, Sparkles, Moon, ArrowRight } from "lucide-react";

const PHASE_COLORS = {
  menstrual: "#E23670",
  follicular: "#8C7CD6",
  ovulatory: "#F2A93B",
  luteal: "#B96C87",
};

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const isLoggedIn = !!localStorage.getItem("token");
    if (isLoggedIn) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleGetStarted = () => {
    const isLoggedIn = !!localStorage.getItem("token");
    if (isLoggedIn) {
      navigate("/dashboard");
    } else {
      navigate("/register");
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: "#FFF9F7" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
        .fr-display { font-family: 'Fraunces', serif; }

        @keyframes orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .ring-marker { animation: orbit 14s linear infinite; transform-origin: 190px 190px; }
        .fade-up { animation: fadeUp 0.7s ease both; }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.15s; }
        .fade-up-3 { animation-delay: 0.25s; }

        @media (prefers-reduced-motion: reduce) {
          .ring-marker { animation: none; }
          .fade-up { animation: none; opacity: 1; transform: none; }
        }
      `}</style>

      {/* HERO */}
      <section className="min-h-screen flex items-center px-6 md:px-16 py-24">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center w-full">

          <div>
            <div
              className="fade-up inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{ background: "#FCE1EA", color: "#E23670" }}
            >
              Built around your actual cycle
            </div>

            <h1
              className="fr-display fade-up fade-up-1 text-5xl md:text-6xl leading-[1.05] mb-6"
              style={{ color: "#241220" }}
            >
              Every phase,<br />understood.
            </h1>

            <p
              className="fade-up fade-up-2 text-lg max-w-md mb-9"
              style={{ color: "#8F8290" }}
            >
              TrackHer reads the patterns in your cycle, your mood, and your
              symptoms — so predictions get sharper the longer you use it,
              not more generic.
            </p>

            <div className="fade-up fade-up-3 flex items-center gap-4">
              <button
                onClick={handleGetStarted}
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-white transition-transform hover:scale-105"
                style={{ background: "#E23670" }}
              >
                Get started
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
              </button>
              <span className="text-sm" style={{ color: "#B7A8B1" }}>
                Free to start · no card needed
              </span>
            </div>
          </div>

          {/* Signature element: the cycle ring */}
          <div className="hidden md:flex items-center justify-center">
            <svg width="380" height="380" viewBox="0 0 380 380">
              {[
                { color: PHASE_COLORS.menstrual, start: 0, end: 90 },
                { color: PHASE_COLORS.follicular, start: 90, end: 180 },
                { color: PHASE_COLORS.ovulatory, start: 180, end: 220 },
                { color: PHASE_COLORS.luteal, start: 220, end: 360 },
              ].map((seg, i) => {
                const r = 150;
                const c = 190;
                const circumference = 2 * Math.PI * r;
                const len = ((seg.end - seg.start) / 360) * circumference;
                const offset = (seg.start / 360) * circumference;
                return (
                  <circle
                    key={i}
                    cx={c}
                    cy={c}
                    r={r}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth={18}
                    strokeDasharray={`${len - 4} ${circumference - len + 4}`}
                    strokeDashoffset={-offset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${c} ${c})`}
                    opacity={0.9}
                  />
                );
              })}

              <g className="ring-marker">
                <circle cx="190" cy="40" r="9" fill="#fff" stroke="#E23670" strokeWidth="3" />
              </g>

              <text x="190" y="182" textAnchor="middle" fontSize="15" fill="#B7A8B1" fontFamily="Inter, sans-serif">
                Day
              </text>
              <text x="190" y="215" textAnchor="middle" fontSize="42" fontWeight="700" fill="#241220" fontFamily="'Fraunces', serif">
                14
              </text>
            </svg>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="py-24 px-6" style={{ background: "#fff" }}>
        <div className="max-w-6xl mx-auto">
          <h2
            className="fr-display text-3xl md:text-4xl text-center mb-4"
            style={{ color: "#241220" }}
          >
            Three ways TrackHer pays attention
          </h2>
          <p className="text-center mb-16 max-w-xl mx-auto" style={{ color: "#8F8290" }}>
            The more you log, the more precisely it learns what's normal for you.
          </p>

          <div className="grid md:grid-cols-3 gap-8">

            <div
              className="p-8 rounded-2xl transition-shadow hover:shadow-lg"
              style={{ background: "#FFF9F7", border: "1px solid #FDE3EC" }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
                style={{ background: "#F6E4EA" }}
              >
                <Moon size={22} color={PHASE_COLORS.luteal} />
              </div>
              <h3 className="fr-display text-xl mb-2" style={{ color: "#241220" }}>
                Cycle prediction
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#8F8290" }}>
                Your next period, ovulation window, and current phase — recalculated
                from your real history, not a fixed 28-day guess.
              </p>
            </div>

            <div
              className="p-8 rounded-2xl transition-shadow hover:shadow-lg"
              style={{ background: "#FFF9F7", border: "1px solid #FDE3EC" }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
                style={{ background: "#FDF0DC" }}
              >
                <Sparkles size={22} color={PHASE_COLORS.ovulatory} />
              </div>
              <h3 className="fr-display text-xl mb-2" style={{ color: "#241220" }}>
                Mood & symptom patterns
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#8F8290" }}>
                See which symptoms show up most, and where they cluster in
                your cycle, instead of guessing month to month.
              </p>
            </div>

            <div
              className="p-8 rounded-2xl transition-shadow hover:shadow-lg"
              style={{ background: "#FFF9F7", border: "1px solid #FDE3EC" }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
                style={{ background: "#EAE5FA" }}
              >
                <Leaf size={22} color={PHASE_COLORS.follicular} />
              </div>
              <h3 className="fr-display text-xl mb-2" style={{ color: "#241220" }}>
                Monthly reports
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#8F8290" }}>
                A plain-language summary of your month — average cycle length,
                trend direction, and what changed since the last one.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 px-6" style={{ background: "#FFF9F7" }}>
        <div className="max-w-5xl mx-auto">
          <h2
            className="fr-display text-3xl md:text-4xl text-center mb-16"
            style={{ color: "#241220" }}
          >
            How it works
          </h2>

          <div className="grid md:grid-cols-3 gap-10 relative">
            {[
              {
                step: "01",
                title: "Log your cycle",
                desc: "Mark when your period starts. Add symptoms as they come up.",
                icon: Droplet,
                color: PHASE_COLORS.menstrual,
              },
              {
                step: "02",
                title: "Patterns take shape",
                desc: "After a couple of cycles, TrackHer starts spotting your rhythm.",
                icon: Sparkles,
                color: PHASE_COLORS.ovulatory,
              },
              {
                step: "03",
                title: "Get ahead of it",
                desc: "See your next period and phase coming, with real numbers behind it.",
                icon: Moon,
                color: PHASE_COLORS.luteal,
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                  style={{ background: "#fff", border: `2px solid ${item.color}` }}
                >
                  <item.icon size={22} color={item.color} />
                </div>
                <p className="text-xs font-semibold tracking-wide mb-2" style={{ color: "#B7A8B1" }}>
                  {item.step}
                </p>
                <p className="font-semibold mb-2" style={{ color: "#241220" }}>
                  {item.title}
                </p>
                <p className="text-sm max-w-xs mx-auto" style={{ color: "#8F8290" }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section
        className="py-20 px-6 text-center"
        style={{ background: "#241220" }}
      >
        <h2 className="fr-display text-3xl md:text-4xl mb-4 text-white">
          Start logging today's cycle
        </h2>
        <p className="mb-8 max-w-md mx-auto" style={{ color: "#C9B9C3" }}>
          It takes under a minute, and every entry sharpens your predictions.
        </p>
        <button
          onClick={handleGetStarted}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold transition-transform hover:scale-105"
          style={{ background: "#fff", color: "#241220" }}
        >
          Get started
          <ArrowRight size={18} />
        </button>
      </section>

      <footer className="py-8 text-center text-sm" style={{ background: "#1A0E17", color: "#7A6C76" }}>
        <p>© 2026 TrackHer. All rights reserved.</p>
      </footer>

    </div>
  );
};

export default Home;