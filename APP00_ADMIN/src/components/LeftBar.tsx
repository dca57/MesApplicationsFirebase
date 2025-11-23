import React from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard,
  Database,
  CloudUpload,
  SquareStack,
  Settings,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const LeftBar = () => {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <nav className="bg-slate-200 dark:bg-slate-800 border-r border-slate-300 dark:border-slate-700 shadow-sm w-64 h-[calc(100vh-theme(spacing.16))] py-4 fixed top-16 left-0">
      <div className="max-w-7xl mx-auto px-0 h-full flex flex-col justify-between">
        <div className="flex flex-col space-y-6 px-2">
          <Link
            to="/"
            className="text-slate-900 dark:text-slate-500 hover:text-blue-500 flex items-center gap-2 text-lg font-bold hover:bg-blue-100 dark:hover:bg-slate-700 p-2 rounded-md"
          >
            <LayoutDashboard size={24} /> Dashboard
          </Link>
          <Link
            to="/mesappsfirebase"
            className="text-slate-900 dark:text-slate-500 hover:text-blue-500 flex items-center gap-2 text-lg font-bold hover:bg-blue-100 dark:hover:bg-slate-700 p-2 rounded-md"
          >
            <SquareStack size={24} /> Mes Applications
          </Link>
          <Link
            to="/firestore"
            className="text-slate-900 dark:text-slate-500 hover:text-blue-500 flex items-center gap-2 text-lg font-bold hover:bg-blue-100 dark:hover:bg-slate-700 p-2 rounded-md"
          >
            <Database size={24} /> Firestore
          </Link>
          <Link
            to="/storage"
            className="text-slate-900 dark:text-slate-500 hover:text-blue-500 flex items-center gap-2 text-lg font-bold hover:bg-blue-100 dark:hover:bg-slate-700 p-2 rounded-md"
          >
            <CloudUpload size={24} /> Storage
          </Link>
        </div>

        <div className="flex flex-col space-y-1 px-2">
          <hr className="border-t border-slate-300 dark:border-slate-600 my-1" />
          <Link
            to="/user-settings"
            className="text-slate-900 dark:text-slate-500 hover:text-blue-500 flex items-center gap-2 text-lg font-bold hover:bg-blue-100 dark:hover:bg-slate-700 p-2 rounded-md"
          >
            <Settings size={24} /> Mes Préférences
          </Link>
          {user.uid === "8U8fY8clg3OSWHO45j7YMbsT8lg1" && (
            <Link
              to="/admin-settings"
              className="text-red-800 dark:text-red-400 hover:text-blue-500 flex items-center gap-2 text-lg font-bold hover:bg-blue-100 dark:hover:bg-slate-700 p-2 rounded-md"
            >
              <Settings size={24} /> Paramètres Admin
            </Link>
          )}
          {user.uid === "8U8fY8clg3OSWHO45j7YMbsT8lg1" && (
            <Link
              to="/admin-lightdarkmode"
              className="text-red-800 dark:text-red-400 hover:text-blue-500 flex items-center gap-2 text-lg font-bold hover:bg-blue-100 dark:hover:bg-slate-700 p-2 rounded-md"
            >
              <Settings size={24} /> Light & Dark Modes
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default LeftBar;
