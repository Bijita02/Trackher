import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/logo.png";
import { useNavigate } from "react-router-dom";
import { BarChart2 } from "lucide-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="bg-white shadow-md fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

     
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="TrackHer Logo" className="h-10" />
          <span className="text-xl font-bold text-pink-600">
            TrackHer
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8">

          <Link
            to="/"
            className="text-gray-700 hover:text-pink-500 transition"
          >
            Home
          </Link>

           <button
            onClick={() => navigate("/cycle-history")}
            className="text-gray-700 hover:text-pink-500 transition"
            title="Cycle History"
          >
            <BarChart2 size={20} />
          </button>


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
          
          <button
            onClick={() => {
              navigate("/cycle-details");
              setIsOpen(false);
            }}
            className="block text-gray-700 hover:text-pink-500"
          ></button>

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
        </div>
      )}
    </nav>
  );
};

export default Navbar;