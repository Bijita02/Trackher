import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";    
import Register from "./pages/register";
import Login from "./pages/login";
import Navbar from "./components/navbar";
import Dashboard from "./pages/Dashboard";
import SymptomsPage from "./pages/SymptomsPage";
import ChatBot from "./components/chatbot";
import CycleDetails from './components/cycledetails';
import PregnancyDashboard from "./pages/PregnancyDashboard";
import PregnancySetup from "./pages/PregnancySetup";
import CycleStatsPage from "./pages/CycleStatsPage";
import StatusFeed from "./pages/StatusFeed";


function App() {
  return (
    <Router>
      <Navbar />
      <div className="pt-20"> 
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/status-feed" element={<StatusFeed />} />
          <Route path="/symptoms" element={<SymptomsPage token={localStorage.getItem("token")} />} />
          <Route path="/ai" element={<ChatBot />} />
          <Route path="/pregnancy-dashboard" element={<PregnancyDashboard />} />
          <Route path="/pregnancy-setup" element={<PregnancySetup />} />
          <Route path="/cycle-details" element={<CycleDetails />} />
                    <Route path="/cycle-stats" element={<CycleStatsPage />} />
          
        </Routes>
      </div>
    </Router>
  );
}

export default App;