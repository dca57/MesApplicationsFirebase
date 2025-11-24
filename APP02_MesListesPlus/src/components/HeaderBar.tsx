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
    <nav className="bg-slate-300 dark:bg-slate-700 border-b border-slate-400 dark:border-slate-600 shadow-sm sticky top-0 z-50">
      <div className="px-4 sm:px-4 lg:px-4">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link
              to="/"
              className="text-4xl font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2"
            >
              <img src={Logo} alt="Logo" className="w-12 h-12 mr-2" />
              MesListes+
            </Link>
          </div>

          {user && (
            <div className="hidden md:flex items-center space-x-8">
              {/* Navigation links moved to SubHeaderBar */}
            </div>
          )}

          <div className="flex items-center gap-4">
            {user && (
              <div
                className="relative flex items-center gap-4"
                ref={dropdownRef}
              >
                {" "}
                {/* Add ref here */}
                <button
                  onClick={toggleDropdown}
                  className="hidden sm:inline text-sm text-blue-800 dark:text-blue-300 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none"
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
                      <>
                        <Link
                          to="/admin-settings"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-600"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <Settings size={18} /> Paramètres Admin
                        </Link>
                        <Link
                          to="/admin-lightdarkmode"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-600"
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          <Settings size={18} /> Light & Dark Modes
                        </Link>
                      </>
                    )}
                  </div>
                )}
                <ThemeToggle />
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-3 py-2 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm font-medium"
                >
                  <LogOut size={20} />
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
