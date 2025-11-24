import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Settings } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import Logo from "../assets/Logo.png";

const HeaderBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null); // Add this line

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Add this useEffect hook
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <nav className="bg-slate-100 dark:bg-slate-800 border-b border-slate-700 dark:border-slate-400 shadow-sm sticky top-0 z-50">
      <div className="max-w-full mx-2 px-2 sm:max-w-2xl sm:mx-auto sm:px-4 lg:max-w-4xl lg:px-6">
        <div className="flex justify-between h-14 sm:h-16 items-center">
          <div className="flex items-center">
            <Link
              to="/"
              className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2"
            >
              <img
                src={Logo}
                alt="Logo"
                className="w-7 h-7 sm:w-8 sm:h-8 mr-2"
              />
              Caddie+
            </Link>
          </div>

          {user && (
            <div className="hidden md:flex items-center space-x-8">
              {/* Navigation links moved to SubHeaderBar */}
            </div>
          )}

          <div className="flex items-center gap-2 sm:gap-4">
            {user && (
              <div className="flex items-center gap-2 sm:gap-4">
                <button
                  onClick={toggleDropdown}
                  className="text-sm text-blue-800 dark:text-blue-300 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none"
                >
                  {user.email}
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-700 rounded-md shadow-lg py-1 z-50 top-full">
                    <Link
                      to="/user-settings"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <Settings size={18} /> Mes Préférences
                    </Link>
                    {user.uid === "8U8fY8clg3OSWHO45j7YMbsT8lg1" && (
                      <Link
                        to="/admin-settings"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-600"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <Settings size={18} /> Paramètres Admin
                      </Link>
                    )}
                  </div>
                )}
                <ThemeToggle />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 sm:gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-xs sm:text-sm font-medium"
                >
                  <LogOut size={18} sm:size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default HeaderBar;
