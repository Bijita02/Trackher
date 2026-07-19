import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowRight } from "react-icons/fa";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords don't match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data;
      try {
        data = await response.json();
      } catch {
        setMessage("Server returned an unexpected response. Please try again later.");
        setLoading(false);
        return;
      }

      if (response.ok) {
        setMessage("Success: Password updated. Redirecting to login…");
        setTimeout(() => navigate("/login"), 1500);
      } else {
        setMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch (error) {
      console.error("Reset password error:", error);
      setMessage("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FDF6F3] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-5">
          <span className="bg-pink-100 text-pink-600 text-xs font-semibold px-4 py-1.5 rounded-full">
            Reset your password
          </span>
        </div>

        <h1 className="font-serif text-4xl text-center text-gray-900 mb-2 leading-tight">
          Forgot password?
        </h1>
        <p className="text-center text-gray-500 mb-8">
          Enter your email and choose a new password.
        </p>

        <div className="bg-white border border-gray-200 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="email"
                value={email}
                placeholder="Email Address"
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition-all"
              />
            </div>

            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                placeholder="New password"
                onChange={(e) => setPassword(e.target.value)}
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

            <div className="relative">
              <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                placeholder="Confirm new password"
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pink-500 text-white py-3 rounded-full font-semibold hover:bg-pink-600 active:scale-[0.98] transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? "Updating..." : (
                <>
                  Update password <FaArrowRight className="text-sm" />
                </>
              )}
            </button>

            {message && (
              <p className={`text-sm text-center font-medium ${
                message.startsWith("Success") ? "text-green-600" : "text-red-500"
              }`}>
                {message}
              </p>
            )}

            <p className="text-sm text-center text-gray-500 mt-5">
              Remembered it?{" "}
              <Link to="/login" className="text-pink-500 font-semibold hover:underline">
                Back to login
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;