import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

function stripTime(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function buildMonthGrid(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push({ date: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(year, month, d) });
  return cells;
}

export default function MiniCalendarPicker({ value, onChange, label, maxDate, minDate }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(value || new Date());
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (value) setViewDate(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const monthLabel = viewDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const grid = buildMonthGrid(viewDate);

  const isDisabled = (date) => {
    if (maxDate && date.getTime() > stripTime(maxDate)) return true;
    if (minDate && date.getTime() < stripTime(minDate)) return true;
    return false;
  };

  return (
    <div className="relative" ref={wrapperRef} style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap');
        .fr-display { font-family: 'Fraunces', serif; }
      `}</style>

      {label && <label className="block text-xs text-gray-400 mb-1.5">{label}</label>}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-left focus:outline-none"
        style={{ color: value ? "#241220" : "#B7A8B1", borderColor: open ? "#E23670" : undefined }}
      >
        {value
          ? value.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
          : "Select a date"}
        <Calendar size={16} color="#B7A8B1" />
      </button>

      {open && (
        <div
          className="absolute z-20 mt-2 rounded-2xl p-4 shadow-lg"
          style={{ background: "#fff", border: "1px solid #FDE3EC", width: 280 }}
        >
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
              className="p-1.5 rounded-full hover:bg-rose-50 transition"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} color="#8F8290" />
            </button>
            <span className="fr-display text-sm" style={{ color: "#241220" }}>{monthLabel}</span>
            <button
              type="button"
              onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
              className="p-1.5 rounded-full hover:bg-rose-50 transition"
              aria-label="Next month"
            >
              <ChevronRight size={16} color="#8F8290" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="text-center text-[10px] font-medium py-1" style={{ color: "#B7A8B1" }}>{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {grid.map((cell, i) => {
              if (!cell.date) return <div key={i} />;
              const disabled = isDisabled(cell.date);
              const isSelected = value && stripTime(cell.date) === stripTime(value);
              const isToday = stripTime(cell.date) === stripTime(new Date());

              return (
                <button
                  type="button"
                  key={i}
                  disabled={disabled}
                  onClick={() => {
                    onChange(cell.date);
                    setOpen(false);
                  }}
                  className="aspect-square rounded-lg text-xs flex items-center justify-center transition-colors"
                  style={{
                    background: isSelected ? "#E23670" : "transparent",
                    color: disabled ? "#E5DEE1" : isSelected ? "#fff" : "#241220",
                    fontWeight: isSelected || isToday ? 700 : 400,
                    outline: isToday && !isSelected ? "1px solid #E23670" : "none",
                    outlineOffset: "-1px",
                    cursor: disabled ? "not-allowed" : "pointer",
                  }}
                >
                  {cell.date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}