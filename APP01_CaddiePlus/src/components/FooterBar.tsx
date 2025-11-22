import React from "react";
import { Link } from "react-router-dom";
import { Database, SquareStack, Settings } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "react-router-dom";

const FooterBar = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 w-fit bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-3xl shadow-lg z-50 backdrop-blur-sm">
      <div className="mx-2 px-2 sm:px-4 lg:px-6">
        <div className="flex justify-around items-center h-14 sm:h-16">
          <Link
            to="/listes"
            className={`relative flex flex-col items-center gap-1 text-xs sm:text-sm transition-colors duration-200 py-2 px-4 ${
              location.pathname === "/listes"
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-700 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
            }`}
          >
            {location.pathname === "/listes" && (
              <span className="absolute inset-0 m-auto w-10 h-10 bg-red-500 rounded-full opacity-20"></span>
            )}
            <SquareStack size={24} sm:size={24} className="relative z-10" />
            <span className="hidden sm:inline relative z-10">Listes</span>
          </Link>
          <Link
            to="/produits"
            className={`relative flex flex-col items-center gap-1 text-xs sm:text-sm transition-colors duration-200 py-2 px-4 ${
              location.pathname === "/produits"
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-700 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
            }`}
          >
            {location.pathname === "/produits" && (
              <span className="absolute inset-0 m-auto w-10 h-10 bg-red-500 rounded-full opacity-20"></span>
            )}
            <Database size={24} sm:size={24} className="relative z-10" />
            <span className="hidden sm:inline relative z-10">Produits</span>
          </Link>

          <Link
            to="/user-settings"
            className={`relative flex flex-col items-center gap-1 text-xs sm:text-sm transition-colors duration-200 py-2 px-4 ${
              location.pathname === "/user-settings"
                ? "text-blue-600 dark:text-blue-400"
                : "text-slate-700 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
            }`}
          >
            {location.pathname === "/user-settings" && (
              <span className="absolute inset-0 m-auto w-10 h-10 bg-red-500 rounded-full opacity-20"></span>
            )}
            <Settings size={24} sm:size={24} className="relative z-10" />
            <span className="hidden sm:inline relative z-10">User</span>
          </Link>

          {user.uid === "8U8fY8clg3OSWHO45j7YMbsT8lg1" && (
            <Link
              to="/admin-settings"
              className={`relative flex flex-col items-center gap-1 text-xs sm:text-sm transition-colors duration-200 py-2 px-4 ${
                location.pathname === "/admin-settings"
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-700 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
              }`}
            >
              {location.pathname === "/admin-settings" && (
                <span className="absolute inset-0 m-auto w-10 h-10 bg-red-500 rounded-full opacity-20"></span>
              )}
              <Settings
                size={24}
                sm:size={24}
                className="relative z-10 text-red-800"
              />
              <span className="hidden sm:inline relative z-10">Admin</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default FooterBar;
