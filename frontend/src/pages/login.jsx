import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [message, setMessage] = useState("");
  
const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

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
        localStorage.setItem("userId", data.userId)
        setMessage("Success: " + data.message);

    
         setTimeout(() => navigate("/dashboard") , 1000);
      } else {
        setMessage(" Error: " + data.error);
      }
    } catch (error) {
      console.error("Login error:", error);
      setMessage(" Could not connect to the server.");
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-100 overflow-hidden">

      <div className="absolute w-72 h-72 bg-pink-300 rounded-full blur-3xl opacity-40 top-10 left-10"></div>
      <div className="absolute w-72 h-72 bg-purple-300 rounded-full blur-3xl opacity-40 bottom-10 right-10"></div>
      <div className="absolute w-72 h-72 bg-rose-300 rounded-full blur-3xl opacity-40 top-1/2 left-1/2"></div>

      <div className="relative bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">

        <div className="flex justify-center mb-6">
          <img src={logo} alt="TrackHer Logo" className="h-16" />
        </div>

        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Welcome Back
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            name="email"
            value={formData.email}
            placeholder="Email Address"
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
          />

          <div className="relative">
  <input
    type={showPassword ? "text" : "password"}
    name="password"
    value={formData.password}
    placeholder="Password"
    onChange={handleChange}
    required
    className="w-full px-4 py-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
  />

  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-pink-500"
  >
    {showPassword ? <FaEyeSlash /> : <FaEye />}
  </button>
</div>
          <div className="text-right">
            <a href="#" className="text-sm text-pink-500 hover:underline">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="w-full bg-pink-500 text-white py-3 rounded-lg font-semibold hover:bg-pink-600 transition duration-300"
          >
            Login
          </button>
        </form>

        {message && (
          <p className="text-sm text-center font-medium mt-4 text-gray-700">
            {message}
          </p>
        )}

        <p className="text-sm text-center text-gray-500 mt-4">
          Don't have an account?{" "}
          <Link to="/register" className="text-pink-500 font-medium">
            Register
          </Link>
        </p>

        <div className="flex flex-col items-center">
          <div className="mt-6 w-full">
            {/*<GoogleLogin />*/}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;