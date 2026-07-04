import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/home";    
import Register from "./pages/register";
import Login from "./pages/login";
import Navbar from "./pages/navbar";
import Dashboard from "./pages/Dashboard";
import SymptomsPage from "./pages/SymptomsPage";
import ChatBot from "./components/chatbot";
import CycleDetailsPage from './pages/CycleDetailsPage';
import CycleHistory from './pages/CycleHistory';
import PregnancyDashboard from "./pages/PregnancyDashboard";
import PregnancySetup from "./pages/PregnancySetup";

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
          <Route path="/symptoms" element={<SymptomsPage token={localStorage.getItem("token")} />} />
          <Route path="/ai" element={<ChatBot />} />
          <Route path="/pregnancy-dashboard" element={<PregnancyDashboard />} />
          <Route path="/pregnancy-setup" element={<PregnancySetup />} />
          <Route path="/cycle-details" element={<CycleDetailsPage />} />
          <Route path="/cycle-history" element={<CycleHistory />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;