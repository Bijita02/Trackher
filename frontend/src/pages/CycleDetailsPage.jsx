import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './CycleDetailsPage.css';

const CycleDetailsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Core state synced with MongoDB inputs
  const [lastPeriodDate, setLastPeriodDate] = useState(location.state?.lastPeriodDate || "2026-05-27");
  const [cycleLength, setCycleLength] = useState(location.state?.cycleLength || 30);
  const [periodLength, setPeriodLength] = useState(location.state?.periodLength || 5);
  
  // Interactive calendar active view state
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  
  // Toggle layout states
  const [isLogging, setIsLogging] = useState(false);
  const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);

  // Simulated cycle history tracker
  const [pastCycles, setPastCycles] = useState([
    "2026-04-27", 
    "2026-03-28", 
  ]);

  // Keep past cycles updated if the immediate last period changes
  useEffect(() => {
    if (lastPeriodDate && !pastCycles.includes(lastPeriodDate)) {
      setPastCycles(prev => [lastPeriodDate, ...prev.filter(d => d !== lastPeriodDate)]);
    }
  }, [lastPeriodDate]);

  const calculateCycleMetrics = () => {
    const today = new Date(); 
    const lastPeriod = new Date(lastPeriodDate);
    
    const msPerDay = 24 * 60 * 60 * 1000;
    const daysSinceLastPeriod = Math.floor((today - lastPeriod) / msPerDay);
    
    const currentCycleDay = daysSinceLastPeriod >= 0 ? (daysSinceLastPeriod % cycleLength) + 1 : 1;
    const daysUntilNextPeriod = cycleLength - currentCycleDay;
    
    const nextPeriodDate = new Date(lastPeriod.getTime() + (cycleLength * msPerDay));
    const nextPeriodString = nextPeriodDate.toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric'
    });

    let phaseName = "";
    let phaseColor = "";
    let isLightBg = false;

    if (currentCycleDay <= periodLength) {
      phaseName = "Menstrual Phase 🩸";
      phaseColor = "#c92a2a"; 
    } else if (currentCycleDay <= 13) {
      phaseName = "Follicular Phase 🌱";
      phaseColor = "#ffdeeb"; 
      isLightBg = true;       
    } else if (currentCycleDay <= 15) {
      phaseName = "Ovulatory Phase ✨";
      phaseColor = "#d6336c"; 
    } else {
      phaseName = "Luteal Phase 🌙";
      phaseColor = "#a61e4d"; 
    }

    return { currentCycleDay, daysUntilNextPeriod, nextPeriodString, phaseName, phaseColor, isLightBg };
  };

  const metrics = calculateCycleMetrics();

 const updatePeriodInDatabase = async (selectedDate) => {
  try {
    const userId = localStorage.getItem("userId");

    const res = await fetch("http://localhost:5000/api/user-cycle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        lastPeriod: selectedDate,
        cycleLength,
        periodLength,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Update failed");
    }

    console.log("MongoDB UPDATED:", data.user);

    // optional: sync UI instantly
    setLastPeriodDate(selectedDate);

  } catch (err) {
    console.error("Update failed:", err);
    alert("Failed to update cycle");
  }
};

  const handleLogPeriodToday = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    updatePeriodInDatabase(todayStr);
    setIsLogging(false);
  };

  const handleSaveCustomDate = (e) => {
    e.preventDefault();
    if (customDate) {
      updatePeriodInDatabase(customDate);
      setIsLogging(false);
    }
  };

  // Navigation handlers for history browsing sheets
  const handlePrevMonth = () => {
    setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1));
  };

  // Dynamic Multi-Month Calendar Generator Matrix
  const generateCalendarGrid = () => {
    const today = new Date();
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth(); 

    const totalDays = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const monthName = currentViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const gridCells = [];
    for (let i = 0; i < firstDayIndex; i++) {
      gridCells.push({ dayNum: "", type: "empty" });
    }

    const nextPeriodExpectedDate = new Date(new Date(lastPeriodDate).getTime() + (cycleLength * 24 * 60 * 60 * 1000));

    for (let d = 1; d <= totalDays; d++) {
      let type = "normal";
      const checkDate = new Date(year, month, d);

      // Highlight logic
      if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
        type = "today";
      } else if (
        checkDate.getDate() === nextPeriodExpectedDate.getDate() &&
        checkDate.getMonth() === nextPeriodExpectedDate.getMonth() &&
        checkDate.getFullYear() === nextPeriodExpectedDate.getFullYear()
      ) {
        type = "predicted-period";
      } else {
        // Check if this calendar box date falls into any past cycle ranges
        pastCycles.forEach(startStr => {
          const start = new Date(startStr);
          const end = new Date(start);
          end.setDate(end.getDate() + (periodLength - 1));

          if (checkDate >= start && checkDate <= end) {
            type = "past-period";
          }
        });
      }
      gridCells.push({ dayNum: d, type });
    }

    return { gridCells, monthName };
  };

  const { gridCells, monthName } = generateCalendarGrid();
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="details-page-container">
      <button className="back-dash-btn" onClick={() => navigate('/dashboard')}>
        ⬅ Return to Dashboard
      </button>

      <div className="countdown-hero-card">
        <div className="days-left-badge">
          <span className="big-days-number">{metrics.daysUntilNextPeriod}</span>
          <span className="days-text-label">Days Left Until Period</span>
        </div>
        <p className="sub-date-text">Next expected cycle starts: <strong>{metrics.nextPeriodString}</strong></p>
        
        {!isLogging ? (
          <button className="log-period-trigger-btn" onClick={() => setIsLogging(true)}>
            🩸 Log Period
          </button>
        ) : (
          <div className="log-options-wrapper-box">
            <button type="button" className="quick-today-log-btn" onClick={handleLogPeriodToday}>
              ✨ My Period Started Today
            </button>
            <div className="divider-line-text"><span>or pick another date</span></div>
            <form onSubmit={handleSaveCustomDate} className="log-period-form">
              <input 
                type="date" 
                value={customDate} 
                onChange={(e) => setCustomDate(e.target.value)}
                className="clean-calendar-input"
              />
              <div className="form-btn-group">
                <button type="submit" className="save-log-btn">Confirm Date</button>
                <button type="button" className="cancel-log-btn" onClick={() => setIsLogging(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div 
        className="phase-status-box" 
        style={{ 
          background: metrics.phaseColor,
          color: metrics.isLightBg ? '#495057' : '#ffffff' 
        }}
      >
        <span className="phase-indicator-title" style={{ opacity: metrics.isLightBg ? 0.7 : 0.85 }}>
          Current Active Phase
        </span>
        <h2>{metrics.phaseName}</h2>
        <p className="phase-mini-explanation">
          You are currently on <strong>Day {metrics.currentCycleDay}</strong> of your cycle length loop.
        </p>
      </div>

      <div className="history-sheet-card">
        <div className="history-sheet-header">
          <span className="history-icon">📜</span>
          <h3>Cycle Sheet History & Trends</h3>
        </div>

        <div className="mini-calendar-wrapper">
          <div className="calendar-nav-row">
            <button className="nav-month-arrow-btn" onClick={handlePrevMonth}>◀</button>
            <div className="calendar-month-title">{monthName}</div>
            <button className="nav-month-arrow-btn" onClick={handleNextMonth}>▶</button>
          </div>
          
          <div className="mini-weekdays-grid">
            {weekdays.map(w => <div key={w} className="mini-weekday">{w}</div>)}
          </div>

          <div className="mini-days-grid">
            {gridCells.map((cell, idx) => (
              <div key={idx} className={`mini-day-cell ${cell.type}`}>
                {cell.dayNum}
              </div>
            ))}
          </div>
        </div>

        <div className="calendar-legend-labels">
          <div><span className="dot red-dot"></span> Past Cycles</div>
          <div><span className="dot pink-dot"></span> Next Target</div>
          <div><span className="dot dark-dot"></span> Today</div>
        </div>
      </div>
    </div>
  );
};

export default CycleDetailsPage;