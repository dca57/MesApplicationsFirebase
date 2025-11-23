import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, LayoutDashboard, Database, CloudUpload } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import Logo from "../assets/Logo.png";

const HeaderBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <nav className="bg-slate-200 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700 shadow-sm sticky top-0 z-50">
      <div className="px-4 sm:px-4 lg:px-4">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link
              to="/"
              className="text-4xl font-bold text-slate-900 dark:text-slate-500 flex items-center gap-2"
            >
              <img src={Logo} alt="Logo" className="w-12 h-12 mr-2" />
              Admin+ - Apps Firebase
            </Link>
          </div>

          {user && (
            <div className="hidden md:flex items-center space-x-8">
              {/* Navigation links moved to SubHeaderBar */}
            </div>
          )}

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {user && (
              <div className="flex items-center gap-4">
                <span className="hidden sm:inline text-sm text-blue-800 dark:text-blue-300">
                  {user.email}
                </span>
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
