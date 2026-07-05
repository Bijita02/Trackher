import React from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    const isLoggedIn = !!localStorage.getItem("token");
    if (isLoggedIn) {
      navigate("/dashboard");
    } else {
      navigate("/register");
    }
  };

  return (
    <div className="bg-white text-gray-800">

      <section className="min-h-screen flex flex-col justify-center items-center text-center px-6 bg-gradient-to-r from-pink-300 to-rose-100 text-white">
        <h1 className="text-4xl md:text-6xl font-bold mb-6">
          Smarter Period Tracking with AI
        </h1>

        <p className="max-w-2xl text-lg md:text-xl mb-8">
          TrackHer uses artificial intelligence to predict your cycle,
          analyze mood patterns, and provide personalized health insights.
        </p>

        <button
          onClick={handleGetStarted}
          className="bg-white text-pink-600 font-semibold px-8 py-3 rounded-full shadow-lg hover:scale-105 transition duration-300"
        >
          Get Started Now !!
        </button>
      </section>

      <section className="py-20 px-6 bg-gray-50">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          Why Choose TrackHer?
        </h2>

        <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto">

          <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition">
            <h3 className="text-xl font-semibold mb-4">Smart Cycle Prediction</h3>
            <p className="text-gray-600">
              AI calculates your average cycle and predicts your next period
              with high accuracy.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition">
            <h3 className="text-xl font-semibold mb-4">Mood Analysis</h3>
            <p className="text-gray-600">
              Understand emotional patterns and hormonal changes with
              intelligent insights.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-md hover:shadow-xl transition">
            <h3 className="text-xl font-semibold mb-4"> Personalized Reports</h3>
            <p className="text-gray-600">
              Get monthly health summaries tailored to your body.
            </p>
          </div>

        </div>
      </section>

      <section className="py-20 px-6">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
          How It Works
        </h2>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto text-center">
          <div>
            <div className="text-3xl mb-4">1️⃣</div>
            <p className="font-semibold">Log Your Cycle</p>
            <p className="text-gray-500 mt-2">
              Add period dates and symptoms.
            </p>
          </div>

          <div>
            <div className="text-3xl mb-4">2️⃣</div>
            <p className="font-semibold">AI Analyzes Data</p>
            <p className="text-gray-500 mt-2">
               Calculates patterns.
            </p>
          </div>

          <div>
            <div className="text-3xl mb-4">3️⃣</div>
            <p className="font-semibold">Get Smart Predictions</p>
            <p className="text-gray-500 mt-2">
              Receive insights and reminders.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20 bg-pink-300 text-white text-center px-6">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Start Tracking Smarter Today
        </h2>

        <button
          onClick={handleGetStarted}
          className="bg-white text-pink-600 font-semibold px-8 py-3 rounded-full shadow-lg hover:scale-105 transition duration-300"
        >
          Register Now !!
        </button>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-8 text-center">
        <p>© 2026 TrackHer. All rights reserved.</p>
      </footer>

    </div>
  );
};

export default Home;