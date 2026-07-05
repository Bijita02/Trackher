import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/logo.png";
import { Bell } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <nav className="bg-white shadow-md fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="TrackHer Logo" className="h-10" />
          <span className="text-xl font-bold text-pink-600">
            TrackHer
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-6">

          <Link
            to="/"
            className="text-gray-700 hover:text-pink-500 transition"
          >
            Home
          </Link>

          {isLoggedIn && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative text-gray-700 hover:text-pink-500 transition"
                title="Notifications"
              >
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-pink-500 rounded-full"></span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-lg border border-gray-100 p-4 text-sm text-gray-600 z-50">
                  <p className="font-semibold text-gray-800 mb-2">Notifications</p>
                  <p className="text-gray-400">No new notifications</p>
                </div>
              )}
            </div>
          )}

          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="bg-pink-500 text-white px-5 py-2 rounded-full hover:bg-pink-600 transition"
            >
              Logout
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="text-gray-700 hover:text-pink-500 transition"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="bg-pink-500 text-white px-5 py-2 rounded-full hover:bg-pink-600 transition"
              >
                Register
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden text-gray-700"
          onClick={() => setIsOpen(!isOpen)}
        >
          ☰
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden bg-white shadow-md px-6 py-4 space-y-4">

          <Link
            to="/"
            className="block text-gray-700 hover:text-pink-500"
            onClick={() => setIsOpen(false)}
          >
            Home
          </Link>

          {isLoggedIn && (
            <button
              onClick={() => {
                navigate("/cycle-details");
                setIsOpen(false);
              }}
              className="block text-gray-700 hover:text-pink-500"
            >
              🔔 Notifications
            </button>
          )}

          {isLoggedIn ? (
            <button
              onClick={() => {
                handleLogout();
                setIsOpen(false);
              }}
              className="block w-full text-left bg-pink-500 text-white text-center py-2 rounded-full"
            >
              Logout
            </button>
          ) : (
            <>
              <Link
                to="/login"
                className="block text-gray-700 hover:text-pink-500"
                onClick={() => setIsOpen(false)}
              >
                Login
              </Link>

              <Link
                to="/register"
                className="block bg-pink-500 text-white text-center py-2 rounded-full"
                onClick={() => setIsOpen(false)}
              >
                Register
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;