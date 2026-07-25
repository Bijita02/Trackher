import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import { FaEye, FaEyeSlash, FaEnvelope, FaLock, FaArrowRight } from "react-icons/fa";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", data.userId || data.user?._id);
        
        // Dynamically save the actual user's display name from backend response
        const activeName = data.userName || data.username || data.name || data.user?.name || data.user?.userName;
        if (activeName) {
          localStorage.setItem("userName", activeName);
        }

        setMessage("Success: " + data.message);

        setTimeout(() => navigate("/dashboard"), 1000);
      } else {
        setMessage(" Error: " + data.error);
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage(" Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF6F3] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-5">
          <span className="bg-pink-100 text-pink-600 text-xs font-semibold px-4 py-1.5 rounded-full">
            Welcome back to TrackHer
          </span>
        </div>

        <h1 className="font-serif text-4xl text-center text-gray-900 mb-2 leading-tight">
          Sign in to continue
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Pick up right where you left off.
        </p>

        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="email"
                name="email"
                value={formData.email}
                placeholder="Email Address"
                onChange={handleChange}
                required
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition-all"
              />
            </div>

            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                placeholder="Password"
                onChange={handleChange}
                required
                className="w-full pl-11 pr-10 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-pink-500 transition-colors"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <div className="text-right">
              <Link to="/forgot-password" className="text-sm text-pink-500 hover:underline">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pink-500 text-white py-3 rounded-full font-semibold hover:bg-pink-600 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? "Logging in..." : (
                <>
                  Login <FaArrowRight className="text-sm" />
                </>
              )}
            </button>
          </form>

          {message && (
            <p className={`text-sm text-center font-medium mt-4 ${
              message.startsWith("Success") ? "text-green-600" : "text-red-500"
            }`}>
              {message}
            </p>
          )}

          <p className="text-sm text-center text-gray-500 mt-5">
            Don't have an account?{" "}
            <Link to="/register" className="text-pink-500 font-semibold hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;